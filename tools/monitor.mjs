// Public, read-only checks. Never POST form data, send mail, or load analytics.
import tls from 'node:tls';
import fs from 'node:fs';

const SITE = 'https://przyjacielodyseusza.pl';
const USER_AGENT = 'Przyjaciel-Odyseusza-Monitor/1.0 (+https://przyjacielodyseusza.pl/)';
const checks = [];
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const requireResult = (value, message) => { if (!value) throw new Error(message); };
async function get(url, extra = {}) {
  return fetch(url, { redirect:'manual', signal:AbortSignal.timeout(8_000), headers:{'User-Agent':USER_AGENT,...extra} });
}
async function check(label, operation) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try { await operation(); checks.push({label,ok:true}); return; }
    catch (error) {
      if (attempt === 0) { await pause(3_000); continue; }
      const reason = error instanceof Error ? error.message : 'Check failed';
      checks.push({label,ok:false,reason:reason.slice(0,200)});
    }
  }
}

await check('Canonical page and contact', async () => {
  const response=await get(SITE+'/');
  requireResult(response.status===200,'Expected HTTP 200.');
  const html=await response.text();
  requireResult(html.includes('Mentoring i coaching dla menedżerów') && html.includes('action="/api/contact"') && html.includes('bartek@przyjacielodyseusza.pl'),'Missing expected public content.');
  requireResult(!/noindex/i.test(response.headers.get('x-robots-tag')||''),'Canonical page unexpectedly has noindex.');
});
for(const host of ['przyjacielodyseusza.pl','www.przyjacielodyseusza.pl','przyjacielodyseusza.com','www.przyjacielodyseusza.com']) {
  await check('HTTPS redirect '+host, async () => {
    const scheme=host==='przyjacielodyseusza.pl'?'http':'https';
    const response=await get(scheme+'://'+host+'/polityka-prywatnosci?source=monitor');
    requireResult([301,308].includes(response.status) && response.headers.get('location')===SITE+'/polityka-prywatnosci?source=monitor','Unexpected redirect or lost path/query.');
  });
  await check('TLS certificate '+host, () => new Promise((resolve,reject) => {
    const socket=tls.connect({host,port:443,servername:host,rejectUnauthorized:true,minVersion:'TLSv1.2'},()=>{
      const cert=socket.getPeerCertificate();
      const days=(new Date(cert.valid_to).valueOf()-Date.now())/86_400_000;
      socket.end();
      if (!socket.authorized || !Number.isFinite(days) || days<14) reject(new Error('Certificate invalid or expires within 14 days.'));
      else resolve();
    });
    socket.setTimeout(8_000,()=>socket.destroy(new Error('TLS timeout.')));
    socket.on('error',reject);
  }));
}
await check('Form route responds without caching',async()=>{
  const response=await get(SITE+'/api/contact');
  requireResult(response.status===405 && /no-store/.test(response.headers.get('cache-control')||''),'Expected a no-store 405 from the form function.');
});
await check('Legacy WordPress homepage redirect',async()=>{
  const response=await get(SITE+'/?page_id=2&source=monitor');
  requireResult(response.status===301 && response.headers.get('location')===SITE+'/','Old homepage redirect changed.');
});
for(const query of ['page_id=2223&lang=en','portfolio=suspendisse-fermentum-erat']) await check('Retired WordPress URL '+query,async()=>{
  const response=await get(SITE+'/?'+query);
  const html=await response.text();
  requireResult(response.status===404 && /<meta name="robots" content="noindex">/.test(html),'Retired content must return a real noindex 404.');
});
for(const file of ['robots.txt','sitemap.xml','llms.txt']) await check('Public '+file,async()=>{
  const response=await get(SITE+'/'+file);
  requireResult(response.status===200,'Public discovery file unavailable.');
  if(file==='robots.txt') requireResult(!(await response.text()).match(/^Disallow:\s*\/\s*$/m),'Public site disallowed by robots.');
});
for(const domain of ['przyjacielodyseusza.pl','przyjacielodyseusza.com']) {
  for(const resolver of ['https://dns.google/resolve','https://cloudflare-dns.com/dns-query']) {
    await check('Validated DNSSEC '+domain+' via '+new URL(resolver).hostname,async()=>{
      const response=await get(resolver+'?name='+domain+'&type=A&do=true',{Accept:'application/dns-json'});
      const data=await response.json();
      requireResult(response.ok && data.Status===0 && data.AD===true && data.Answer?.some(answer=>answer.type===1),'DNSSEC validation or address resolution failed.');
    });
  }
}
await check('OVH MX delivery routing',async()=>{
  const response=await get('https://dns.google/resolve?name=przyjacielodyseusza.pl&type=MX&do=true');
  const data=await response.json();
  const actual=(data.Answer||[]).filter(a=>a.type===15).map(a=>a.data.toLowerCase().replace(/\.$/,'')).sort();
  const expected=['1 mx0.mail.ovh.net','5 mx1.mail.ovh.net','50 mx2.mail.ovh.net','100 mx3.mail.ovh.net'].sort();
  requireResult(data.Status===0 && data.AD===true && JSON.stringify(actual)===JSON.stringify(expected),'Unexpected MX or invalid DNSSEC.');
});
await check('Explicit DMARC policy',async()=>{
  const response=await get('https://dns.google/resolve?name=_dmarc.przyjacielodyseusza.pl&type=TXT&do=true');
  const data=await response.json();
  const records=(data.Answer||[]).filter(a=>a.type===16).map(a=>a.data.replaceAll('"',''));
  requireResult(data.Status===0 && data.AD===true && records.length===1 && /^v=DMARC1;/.test(records[0]) && /(?:^|;)\s*p=(?:none|quarantine|reject)(?:;|$)/.test(records[0]),'Explicit authenticated DMARC record missing.');
});

const failed=checks.filter(c=>!c.ok);
console.log(JSON.stringify({checkedAt:new Date().toISOString(),readOnly:true,emailsSent:0,checks},null,2));
if(process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `## Website and public DNS checks\n\n${checks.length-failed.length}/${checks.length} passed. No messages sent. This is not an IMAP/SMTP delivery test.\n\n`+
    checks.map(c=>`- [${c.ok?'x':' '}] ${c.label}${c.ok?'':': '+c.reason}`).join('\n')+'\n');
}
if(failed.length) process.exitCode=1;
