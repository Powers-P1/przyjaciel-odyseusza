import test from 'node:test';
import assert from 'node:assert/strict';
import { MAILBOX, sendSmtpMessage, formatMessage } from '../../src/server/smtp.js';

const MAIL = { replyTo: 'test@example.com', subject: 'Zapytanie od Łukasza Żółkiewskiego',
  text: 'Zażółć gęślą jaźń.\n.\nRCPT TO:<other@example.com>', messageId: '01010101-1111-4111-8111-010101010101' };
const CREDS = { username: MAILBOX, password: 'unit-test-only' };
function relay({ authCode = 235, finalCode = 250, closeFails = false } = {}) {
  const record = { writes: [], closed: false };
  let controller;
  let data = false;
  const respond = (text) => {
    const bytes = new TextEncoder().encode(text);
    for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
  };
  const socket = {
    opened: Promise.resolve(),
    readable: new ReadableStream({ start(c) { controller = c; respond('220 mail.test ESMTP\r\n'); } }),
    writable: new WritableStream({ write(bytes) {
      const command = new TextDecoder().decode(bytes);
      record.writes.push(command);
      if (data) { record.mime = command; respond(`${finalCode} queued\r\n`); }
      else if (command.startsWith('EHLO')) respond('250-mail.test\r\n250-AUTH PLAIN LOGIN\r\n250 SIZE 10485760\r\n');
      else if (command.startsWith('AUTH')) respond(`${authCode} authentication\r\n`);
      else if (command.startsWith('MAIL FROM:') || command.startsWith('RCPT TO:')) respond('250 accepted\r\n');
      else if (command === 'DATA\r\n') { data = true; respond('354 send body\r\n'); }
      else throw new Error('Unexpected SMTP command');
    } }),
    async close() { record.closed = true; controller.close(); if (closeFails) throw new Error('connection already closed'); },
  };
  return { record, connect(address, options) { record.address = address; record.options = options; return socket; } };
}

test('fragmented multiline replies produce one TLS-authenticated mail to the fixed mailbox', async () => {
  const fake = relay();
  assert.equal((await sendSmtpMessage(MAIL, CREDS, fake.connect)).accepted, true);
  assert.deepEqual(fake.record.address, { hostname: 'smtp.mail.ovh.net', port: 465 });
  assert.deepEqual(fake.record.options, { secureTransport: 'on', allowHalfOpen: false });
  assert.equal(fake.record.writes.filter(s => s.startsWith('RCPT TO:')).length, 1);
  assert.ok(fake.record.writes.includes(`RCPT TO:<${MAILBOX}>\r\n`));
  assert.equal(fake.record.closed, true);
  assert.ok(fake.record.mime.endsWith('\r\n.\r\n'));
  assert.equal(fake.record.mime.includes('\r\nRCPT TO:<other@example.com>'), false);
});

test('authentication rejection stops before MAIL, RCPT and DATA', async () => {
  const fake = relay({ authCode: 535 });
  await assert.rejects(sendSmtpMessage(MAIL, CREDS, fake.connect), /mail_failed/);
  assert.equal(fake.record.writes.some(s => /^(MAIL|RCPT|DATA)/.test(s)), false);
  assert.equal(fake.record.closed, true);
});

test('server rejection after DATA is an error; closing after an accepted mail is success', async () => {
  await assert.rejects(sendSmtpMessage(MAIL, CREDS, relay({ finalCode: 554 }).connect), /mail_failed/);
  assert.equal((await sendSmtpMessage(MAIL, CREDS, relay({ closeFails: true }).connect)).accepted, true);
});

test('UTF-8 body round trips and encoded header words stay within RFC limits', () => {
  const mime = formatMessage({ ...MAIL, subject: 'Żółć '.repeat(30) });
  const [headers, body] = mime.split('\r\n\r\n');
  for (const word of headers.match(/=\?UTF-8\?B\?[^?]+\?=/g)) {
    assert.ok(word.length <= 75);
    assert.equal(Buffer.from(word.slice(10, -2), 'base64').toString('utf8').includes('\ufffd'), false);
  }
  assert.equal(Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8'), MAIL.text.replace(/\n/g, '\r\n'));
  assert.throws(() => formatMessage({ ...MAIL, replyTo: 'x@example.com\r\nBcc: other@example.com' }), /invalid_reply_to/);
});

test('the total SMTP deadline closes a socket that never opens', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let closed = false;
  const pending = sendSmtpMessage(MAIL, CREDS, () => ({ opened: new Promise(() => {}), close: async () => { closed = true; } }));
  t.mock.timers.tick(12000);
  await assert.rejects(pending, /mail_timeout/);
  assert.equal(closed, true);
});
