// Shared server transport; this file is outside functions/ so it creates no public route.
export const MAILBOX = 'bartek@przyjacielodyseusza.pl';
const encoder = new TextEncoder();

function base64(value) {
  let bytes = '';
  for (const byte of encoder.encode(value)) bytes += String.fromCharCode(byte);
  return btoa(bytes);
}

function encodedHeader(value) {
  // RFC 2047: at most 75 characters per encoded word, with complete UTF-8 characters.
  const words = [];
  let part = '';
  for (const character of value) {
    if (part && encoder.encode(part + character).length > 42) {
      words.push(`=?UTF-8?B?${base64(part)}?=`);
      part = '';
    }
    part += character;
  }
  if (part) words.push(`=?UTF-8?B?${base64(part)}?=`);
  return words.join('\r\n ');
}

export function formatMessage({ replyTo, subject, text, messageId, now = new Date() }) {
  if (!/^[\x21-\x7e]+$/.test(replyTo) || /[<>(),;:"\\]/.test(replyTo)) throw new Error('invalid_reply_to');
  if (!/^[a-f0-9-]+$/i.test(messageId)) throw new Error('invalid_message_id');
  const body = base64(text.replace(/\r\n|\r|\n/g, '\r\n')).match(/.{1,76}/g)?.join('\r\n') || '';
  return [
    `From: ${encodedHeader('Formularz – Przyjaciel Odyseusza')} <${MAILBOX}>`,
    `To: <${MAILBOX}>`, `Reply-To: <${replyTo}>`, `Subject: ${encodedHeader(subject)}`,
    `Date: ${now.toUTCString()}`, `Message-ID: <${messageId}@przyjacielodyseusza.pl>`,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64',
    '', body, '',
  ].join('\r\n');
}

export async function sendSmtpMessage(mail, credentials, socketFactory) {
  if (credentials.username !== MAILBOX || typeof credentials.password !== 'string' || !credentials.password) throw new Error('not_configured');
  const mime = formatMessage(mail);
  const connect = socketFactory || (await import('cloudflare:sockets')).connect;
  const socket = connect({ hostname: 'smtp.mail.ovh.net', port: 465 }, { secureTransport: 'on', allowHalfOpen: false });
  let reader;
  let writer;
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('mail_timeout')), 12_000); });
  try {
    return await Promise.race([timeout, (async () => {
      await socket.opened;
      reader = socket.readable.getReader();
      writer = socket.writable.getWriter();
      const decoder = new TextDecoder();
      let buffered = '';
      let totalBytes = 0;
      async function reply(expected) {
        let code;
        let lineCount = 0;
        const lines = [];
        while (true) {
          let end;
          while ((end = buffered.indexOf('\r\n')) < 0) {
            const { value, done } = await reader.read();
            if (done) throw new Error('mail_failed');
            totalBytes += value.byteLength;
            if (totalBytes > 32768) throw new Error('mail_failed');
            buffered += decoder.decode(value, { stream: true });
          }
          const line = buffered.slice(0, end);
          buffered = buffered.slice(end + 2);
          const match = /^(\d{3})([ -])/.exec(line);
          if (!match || ++lineCount > 100 || (code && code !== Number(match[1]))) throw new Error('mail_failed');
          code = Number(match[1]);
          lines.push(line);
          if (match[2] === ' ') {
            if (!expected.includes(code)) throw new Error('mail_failed');
            return lines.join('\n');
          }
        }
      }
      async function command(value, expected) {
        await writer.write(encoder.encode(value + '\r\n'));
        return reply(expected);
      }
      await reply([220]);
      const capabilities = await command('EHLO przyjacielodyseusza.pl', [250]);
      if (!/^250[ -]AUTH\b[^\n]*\bPLAIN\b/im.test(capabilities)) throw new Error('mail_failed');
      await command('AUTH PLAIN ' + base64('\0' + credentials.username + '\0' + credentials.password), [235]);
      await command(`MAIL FROM:<${MAILBOX}>`, [250]);
      await command(`RCPT TO:<${MAILBOX}>`, [250, 251]);
      await command('DATA', [354]);
      // The base64 body cannot inject SMTP commands or an early end-of-data marker.
      await writer.write(encoder.encode(mime + '.\r\n'));
      await reply([250]);
      // An accepted DATA is success even if the connection then closes abruptly.
      return { accepted: true, messageId: mail.messageId };
    })()]);
  } finally {
    clearTimeout(timer);
    await socket.close().catch(() => {});
    try { reader?.releaseLock(); } catch { /* aborted read is settling */ }
    try { writer?.releaseLock(); } catch { /* aborted write is settling */ }
  }
}
