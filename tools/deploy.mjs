// Publikacja wyłącznie na właściwe konto klienta; nigdy przez domyślny profil OAuth.
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const accountId = 'd0fb95ca8a9f9289c4a92685b8c6af28';
const token = process.env.CLOUDFLARE_API_TOKEN;
if (process.env.CLOUDFLARE_ACCOUNT_ID !== accountId || !token) {
  console.error('Wczytaj lokalne poświadczenia API Cloudflare dla Przyjaciela Odyseusza w tym samym procesie przed wdrożeniem.');
  process.exit(1);
}
let verified = false;
try {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, {
    headers: {Authorization:`Bearer ${token}`},
    signal:AbortSignal.timeout(20000),
  });
  const result = await response.json();
  verified = response.ok && result.success && result.result?.id === accountId;
} catch {
  // Odpowiedzi uwierzytelniające i nagłówki nie trafiają do logów.
}
if (!verified) {
  console.error('Nie potwierdzono dostępu do właściwego konta klienta. Publikacja zatrzymana.');
  process.exit(1);
}
function run(args) {
  const result = spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
run(['tools/build.mjs']);
run(['tools/production.mjs']);
run([path.resolve('node_modules/wrangler/bin/wrangler.js'),'pages','deploy','dist-cf',
  '--project-name','przyjaciel-odyseusza','--branch','main']);
// A failed discovery notification does not undo or misreport a successful deployment.
// The helper verifies the live artifact and deduplicates unchanged pages locally.
const discoveryEnvironment = { ...process.env };
delete discoveryEnvironment.CLOUDFLARE_API_TOKEN;
delete discoveryEnvironment.CLOUDFLARE_ACCOUNT_ID;
const notification = spawnSync(process.execPath, ['tools/indexnow.mjs', '--submit'], {
  stdio: 'inherit', env: discoveryEnvironment,
});
if (notification.error || notification.status !== 0) {
  console.warn('Strona opublikowana. IndexNow wymaga ponownej kontroli; nie ponawiaj automatycznie publikacji ani wysylki formularza.');
}
