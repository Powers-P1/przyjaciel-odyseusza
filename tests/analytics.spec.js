import { test, expect, STAGING, ORIGIN } from './_fixtures.js';
import { configureAnalytics } from '../tools/analytics-config.mjs';
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://przyjacielodyseusza.pl';
const ID = 'G-TEST123456';
const KEY = 'po:analytics-consent:v1';
const publicDir=path.resolve('public');
const artifacts=new Map(fs.readdirSync(publicDir,{recursive:true}).filter(name=>fs.statSync(path.join(publicDir,name)).isFile())
  .map(name=>['/'+name.split(path.sep).join('/'),fs.readFileSync(path.join(publicDir,name))]));
const baseCsp=fs.readFileSync(path.join(publicDir,'_headers'),'utf8').match(/Content-Security-Policy: (.+)/)[1];
function fulfillArtifact(route) {
  const url=new URL(route.request().url());
  if(url.pathname.startsWith('/api/')) return route.fulfill({status:502,json:{ok:false,error:'mail_failed'}});
  let file=url.pathname==='/'?'/index.html':url.pathname;
  if(!path.extname(file)) file+='.html';
  const body=artifacts.get(file);
  if(!body) return route.fulfill({status:404,body:'Not Found'});
  if(file.endsWith('.html')) {
    const configured=configureAnalytics(body.toString(),baseCsp,ID);
    return route.fulfill({contentType:'text/html; charset=utf-8',body:configured.html,headers:{'Content-Security-Policy':configured.csp}});
  }
  const types={'.js':'application/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
  return route.fulfill({body,contentType:types[path.extname(file)]||'text/plain'});
}

test.describe('GA4: Basic Consent Mode bez rzeczywistej wysyłki do Google', () => {
  test.skip(STAGING, 'Demonstrator nie ma pomiaru.');
  let googleRequests;
  async function installRoutes(page) {
    await page.route('https://przyjacielodyseusza.pl/**', fulfillArtifact);
    await page.route('https://www.googletagmanager.com/**', async (route) => {
      googleRequests.push(route.request().url());
      await route.fulfill({contentType:'application/javascript',body:`
        window.__tagLoaded = (window.__tagLoaded || 0) + 1;
        window.__gaCalls = (window.dataLayer || []).map(item => Array.from(item));
        const push = window.dataLayer.push.bind(window.dataLayer);
        window.dataLayer.push = function(...items) { window.__gaCalls.push(...items.map(item => Array.from(item))); return push(...items); };
      `});
    });
    await page.route(/https:\/\/[^/]*(?:google-analytics\.com|analytics\.google\.com)\//, (route) => route.abort());
  }
  test.beforeEach(async ({ page }) => {
    googleRequests = [];
    await installRoutes(page);
  });
  test.afterEach(async ({page}) => { await page.unrouteAll({behavior:'wait'}); });

  test('brak zgody i odmowa nie ładują Google; decyzja zostaje zapamiętana', async ({page}) => {
    await page.goto(SITE);
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(googleRequests).toHaveLength(0);
    await expect(page.getByRole('button',{name:'Odrzucam',exact:true})).toBeFocused();
    await page.getByRole('button',{name:'Odrzucam',exact:true}).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.reload();
    expect(googleRequests).toHaveLength(0);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#f-name-error')).toBeVisible();
    expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined');
  });

  test('zgoda ładuje jeden tag; URL i parametry zdarzeń pomijają dane formularza', async ({page}) => {
    const violations=[];
    page.on('console',m=>{if(/Content Security Policy/i.test(m.text())) violations.push(m.text());});
    await page.goto(SITE+'/?email=secret@example.com&message=private-text#phone=123456789');
    await page.getByRole('button',{name:'Zgadzam się',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>window.__tagLoaded)).toBe(1);
    expect(googleRequests).toHaveLength(1);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('po:event',{detail:{event:'form_submit_success',subject_for:'firma',email:'secret@example.com',message:'private-text',phone:'123456789',location:'kontakt'}})));
    const calls=await page.evaluate(()=>window.__gaCalls);
    const config=calls.find(c=>c[0]==='config')[2];
    expect(config.allow_google_signals).toBe(false);
    expect(config.allow_ad_personalization_signals).toBe(false);
    expect(config.send_page_view).toBe(false);
    expect(config.cookie_expires).toBe(60*24*60*60);
    expect(config.cookie_update).toBe(false);
    expect(calls.filter(c=>c[0]==='event'&&c[1]==='form_submit_success')).toHaveLength(1);
    expect(calls.filter(c=>c[0]==='event'&&c[1]==='cta_click')).toHaveLength(0);
    expect(JSON.stringify(calls)).not.toMatch(/secret@example|private-text|123456789/);
    expect(violations).toEqual([]);
  });

  test('wycofanie zgody wyłącza tag, usuwa tylko cookies GA i zachowuje formularz', async ({page,context}) => {
    await page.goto(SITE);
    await page.getByRole('button',{name:'Zgadzam się',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>window.__tagLoaded)).toBe(1);
    await context.addCookies([{name:'_ga',value:'test',domain:'przyjacielodyseusza.pl',path:'/',secure:true},{name:'_ga_TEST123456',value:'test',domain:'.przyjacielodyseusza.pl',path:'/',secure:true},{name:'unrelated',value:'preserve',domain:'przyjacielodyseusza.pl',path:'/',secure:true}]);
    await page.fill('#f-message','Niezakończona wiadomość, której nie wolno usunąć.');
    await page.getByRole('button',{name:'Ustawienia prywatności',exact:true}).click();
    await page.getByRole('button',{name:'Odrzucam',exact:true}).click();
    expect(await page.evaluate(id=>window['ga-disable-'+id],ID)).toBe(true);
    expect((await context.cookies(SITE)).map(c=>c.name)).toEqual(['unrelated']);
    await expect(page.locator('#f-message')).toHaveValue('Niezakończona wiadomość, której nie wolno usunąć.');
    const count=await page.evaluate(()=>window.__gaCalls.length);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('po:event',{detail:{event:'tel_click',location:'kontakt'}})));
    expect(await page.evaluate(()=>window.__gaCalls.length)).toBe(count);
    await page.reload();
    expect(googleRequests).toHaveLength(1);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('wygaśnięta zgoda wymaga nowego wyboru; Escape nie włącza pomiaru', async ({page}) => {
    await page.addInitScript(({key})=>localStorage.setItem(key,JSON.stringify({version:1,choice:'granted',expires:1})),{key:KEY});
    await page.goto(SITE);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect(googleRequests).toHaveLength(0);
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).choice,KEY)).toBe('denied');
  });

  test('wycofanie i usunięcie preferencji zatrzymuje pomiar także w drugiej otwartej karcie', async ({page,context}) => {
    await page.goto(SITE);
    await page.getByRole('button',{name:'Zgadzam się',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>window.__tagLoaded)).toBe(1);
    const other=await context.newPage();
    try {
      await installRoutes(other);
      await other.route('**/turnstile/v0/api.js*',route=>route.abort());
      await other.goto(SITE);
      await expect.poll(()=>other.evaluate(()=>window.__tagLoaded)).toBe(1);
      await other.fill('#f-message','Wiadomość zachowana po zmianie w innej karcie.');
      const count=await other.evaluate(()=>window.__gaCalls.length);
      await page.getByRole('button',{name:'Ustawienia prywatności',exact:true}).click();
      await page.getByRole('button',{name:'Odrzucam',exact:true}).click();
      await expect.poll(()=>other.evaluate(id=>window['ga-disable-'+id],ID)).toBe(true);
      await other.evaluate(()=>window.dispatchEvent(new CustomEvent('po:event',{detail:{event:'tel_click',location:'kontakt'}})));
      expect(await other.evaluate(()=>window.__gaCalls.length)).toBe(count);
      await expect(other.locator('#f-message')).toHaveValue('Wiadomość zachowana po zmianie w innej karcie.');
      await page.getByRole('button',{name:'Ustawienia prywatności',exact:true}).click();
      await page.getByRole('button',{name:'Zgadzam się',exact:true}).click();
      await expect.poll(()=>other.evaluate(id=>window['ga-disable-'+id],ID)).toBe(false);
      await page.evaluate(()=>localStorage.clear());
      await expect.poll(()=>other.evaluate(id=>window['ga-disable-'+id],ID)).toBe(true);
      expect(googleRequests).toHaveLength(2);
    } finally {
      await other.unrouteAll({behavior:'wait'});
      await other.close();
    }
  });

  test('bez decyzji można przeczytać politykę; pomiar podglądów jest wyłączony', async ({page}) => {
    await page.goto(SITE+'/polityka-prywatnosci');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('main')).toContainText('Google Analytics 4');
    expect(googleRequests).toHaveLength(0);
    await page.route(ORIGIN+'/',fulfillArtifact);
    await page.goto(ORIGIN+'/');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(googleRequests).toHaveLength(0);
  });
});
