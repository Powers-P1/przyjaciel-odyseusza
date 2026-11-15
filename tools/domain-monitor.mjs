// Daily public registry and DNS checks. No credentials, renewals, or payment calls.
import fs from 'node:fs';
const registries = [
  ['przyjacielodyseusza.pl','https://rdap.dns.pl/domain/przyjacielodyseusza.pl'],
  ['przyjacielodyseusza.com','https://rdap.verisign.com/com/v1/domain/przyjacielodyseusza.com'],
];
const checks=[];
for(const [domain,url]of registries){
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetch(url,{headers:{Accept:'application/rdap+json','User-Agent':'Odyseusz-Domain-Monitor/1.0'},signal:AbortSignal.timeout(12_000)});
      if(!response.ok)throw new Error(`Registry HTTP ${response.status}`);
      const data=await response.json();
      if(data.ldhName?.toLowerCase()!==domain)throw new Error('Unexpected registry domain.');
      const expiry=(data.events||[]).filter(e=>e.eventAction==='expiration').map(e=>Date.parse(e.eventDate));
      if(!expiry.length||expiry.some(d=>!Number.isFinite(d)))throw new Error('Missing valid registry expiration.');
      const timestamp=Math.min(...expiry);
      const days=Math.floor((timestamp-Date.now())/86_400_000);
      if(days<45)throw new Error(`Domain expires in ${days} days; confirm renewal with the owner.`);
      if((data.status||[]).some(s=>/^(?:pending delete|redemption period|inactive|client hold|server hold)$/i.test(s)))throw new Error('Registry reports a domain hold or deletion status.');
      checks.push({domain,ok:true,expires:new Date(timestamp).toISOString(),daysRemaining:days});
      break;
    }catch(error){
      if(attempt===0){await new Promise(resolve=>setTimeout(resolve,3_000));continue;}
      checks.push({domain,ok:false,reason:error instanceof Error?error.message:'Registry check failed.'});
    }
  }
}
const expectedRecords=JSON.parse(fs.readFileSync(new URL('../config/dns-monitor.json',import.meta.url),'utf8'));
const recordTypes={NS:2,CNAME:5,TXT:16};
for(const record of expectedRecords){
 for(const resolver of ['https://dns.google/resolve','https://cloudflare-dns.com/dns-query']){
  const label=`${record.type} ${record.name} via ${new URL(resolver).hostname}`;
  for(let attempt=0;attempt<2;attempt++){
   try{
    const response=await fetch(resolver+'?name='+encodeURIComponent(record.name)+'&type='+record.type+'&do=true',{headers:{Accept:'application/dns-json'},signal:AbortSignal.timeout(8_000)});
    const data=await response.json();
    if(!response.ok||data.Status!==0||data.AD!==true)throw new Error('DNS response or DNSSEC validation failed.');
    const actual=(data.Answer||[]).filter(a=>a.type===recordTypes[record.type]).map(a=>a.data.replaceAll('"','').replace(/\.$/,'')).filter(value=>!record.prefix||value.startsWith(record.prefix)).sort();
    if(JSON.stringify(actual)!==JSON.stringify([...record.values].sort()))throw new Error('Public DNS differs from the reviewed configuration.');
    checks.push({domain:label,ok:true,result:'Reviewed DNS values and DNSSEC match'});break;
   }catch(error){
    if(attempt===0){await new Promise(resolve=>setTimeout(resolve,3_000));continue;}
    checks.push({domain:label,ok:false,reason:error instanceof Error?error.message:'DNS check failed.'});
   }
  }
 }
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),readOnly:true,checks},null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '## Registry expiration and DNS checks\n\nRead-only RDAP and DNS. No renewals or payments. Escalate before the 45-day threshold. Update reviewed DNS expectations in a PR after a deliberate change.\n\n'+checks.map(c=>`- [${c.ok?'x':' '}] ${c.domain}: ${c.ok?(c.expires?`${c.expires} (${c.daysRemaining} days)`:c.result):c.reason}`).join('\n')+'\n');
if(checks.some(c=>!c.ok))process.exitCode=1;
