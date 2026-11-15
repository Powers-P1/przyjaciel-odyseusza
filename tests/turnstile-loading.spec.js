import {test,expect,STAGING} from './_fixtures.js';

test.describe('Turnstile loads where contact is used',()=>{
  test.skip(STAGING,'The historical demonstrator cannot send messages.');

  test('the initial hero does not fetch the widget; form focus starts it once',async({page})=>{
    let scripts=0;
    page.on('request',request=>{if(request.url().includes('/turnstile/v0/api.js'))scripts++;});
    await page.goto('/',{waitUntil:'networkidle'});
    expect(scripts).toBe(0);
    await page.locator('#f-name').focus();
    await expect.poll(()=>scripts).toBe(1);
    await expect.poll(()=>page.evaluate(()=>Boolean(window.turnstile))).toBe(true);
    await page.locator('#f-email').focus();
    await page.locator('#f-message').focus();
    expect(scripts).toBe(1);
  });

  test('a direct contact anchor prepares the widget before typing',async({page})=>{
    await page.goto('/#kontakt');
    await expect.poll(()=>page.evaluate(()=>Boolean(window.turnstile))).toBe(true);
  });

  test('without IntersectionObserver the contact protection still initializes',async({page})=>{
    await page.addInitScript(()=>{delete window.IntersectionObserver;});
    await page.goto('/');
    await expect.poll(()=>page.evaluate(()=>Boolean(window.turnstile))).toBe(true);
  });

  test('a blocked widget keeps the message and never attempts SMTP through the API',async({page})=>{
    let posts=0;
    await page.route('**/turnstile/v0/api.js*',route=>route.abort());
    await page.route('**/api/contact',route=>{posts++;return route.fulfill({status:500});});
    await page.goto('/');
    await page.fill('#f-name','Jan Testowy');
    await page.fill('#f-email','test@example.com');
    await page.fill('#f-message','Wiadomość do zachowania po niedostępności widgetu.');
    await page.locator('#formularz .form__submit').click();
    await expect(page.locator('#form-status')).toContainText('weryfikacji antyspamowej');
    await expect(page.locator('#f-message')).toHaveValue('Wiadomość do zachowania po niedostępności widgetu.');
    expect(posts).toBe(0);
  });
});
