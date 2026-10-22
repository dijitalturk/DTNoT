// Run with Playwright installed: node tests/content-browser.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || undefined});
  try {
    const page = await browser.newPage({viewport:{width:900,height:650}});
    await page.route('https://example.com/**', route => route.fulfill({body:'<html><body>Test page</body></html>',contentType:'text/html'}));
    await page.goto('https://example.com/');
    await page.evaluate(() => {
      window.mem = {};
      window.storageListeners = [];
      window.chrome = {storage:{local:{get:async k=>({[k]:mem[k]}),set:async o=>Object.assign(mem,o)},onChanged:{addListener:fn=>storageListeners.push(fn)}},runtime:{onMessage:{addListener:fn=>window.refreshListener=fn},sendMessage:async m=>{
        const S=window.DTNOT_STORE;
        if(m.tip==='SAYFA_NOTLARI') {
          if(window.failRead) return null;
          const data=S.sayfaNotlari(await S.hepsiniAl(),location.href);
          if(window.holdRead) {window.holdRead=false; await new Promise(r=>window.releaseRead=r);}
          return data;
        }
        if(m.tip==='NOT_GUNCELLE') {
          if(window.failSave) return {__hata:'test'};
          const not=await S.guncelle(m.id,m.patch);
          storageListeners.forEach(fn=>fn({'web-not-store':{}},'local'));
          return {not};
        }
        if(m.tip==='NOT_SIL') return {id:await S.sil(m.id)};
      }}};
    });
    for(const file of ['assets/store.js','assets/i18n.js']) await page.addScriptTag({path:path.join(__dirname,'..',file)});
    await page.evaluate(async()=>{window.note=await DTNOT_STORE.ekle(location.href,'İlk not',{konum:{x:0,y:1}})});
    await page.addScriptTag({path:path.join(__dirname,'..','content.js')});
    const card=page.locator('.kutu');
    await card.waitFor();
    async function inside() { await page.waitForFunction(() => { const b=document.querySelector('#dtnot-kok').shadowRoot.querySelector('.kutu').getBoundingClientRect(); return b.y>=0 && b.bottom<=innerHeight+1 && b.right<=innerWidth+1; }); }
    await page.locator('[data-eylem=menu]').click();
    await inside();
    await page.locator('.menu [data-eylem=vazgec]').click();
    assert(await page.locator('.menu').isHidden());
    await page.locator('[data-eylem=menu]').click();
    await page.locator('[data-eylem=duzenle]').click();
    await inside();
    await page.locator('textarea').fill('Yeni metin');
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    assert.equal(await page.locator('textarea').inputValue(),'Yeni metin');
    await page.setViewportSize({width:300,height:300});
    await inside();
    await page.evaluate(()=>window.failSave=true);
    await page.locator('[data-eylem=kaydet]').click();
    await page.locator('[role=alert]').filter({hasText:'Kaydedilemedi'}).waitFor();
    assert.equal(await page.locator('textarea').inputValue(),'Yeni metin');
    await page.evaluate(()=>window.failSave=false);
    await page.locator('[data-eylem=kaydet]').click();
    await page.locator('.metin').filter({hasText:'Yeni metin'}).waitFor();
    await page.evaluate(()=>{window.failRead=true; window.dispatchEvent(new Event('focus'));});
    await page.waitForTimeout(100);
    assert(await card.isVisible());
    await page.evaluate(()=>window.failRead=false);
    // An older in-flight read must not swallow the hide refresh.
    await page.evaluate(()=>{window.holdRead=true;window.dispatchEvent(new Event('focus'));});
    await page.waitForFunction(()=>!!window.releaseRead);
    await page.locator('[data-eylem=kapat]').click();
    await page.evaluate(()=>window.releaseRead());
    await card.waitFor({state:'detached'});
    assert.equal(await page.evaluate(async()=>(await DTNOT_STORE.hepsiniAl()).notlar.length),1);
    await page.setViewportSize({width:900,height:650});
    for (const gorunum of ['postit','banner','footer','etiket']) {
      await page.evaluate(async gorunum => {
        await DTNOT_STORE.guncelle(note.id,{gorunum,gizleUntil:0});
        refreshListener({tip:'dtnot-yenile'},null,()=>{});
      },gorunum);
      await page.locator('[data-eylem=menu]').waitFor();
      await page.locator('[data-eylem=menu]').click();
      await page.locator('.menu [data-eylem=vazgec]').click();
      assert(await page.locator('.menu').isHidden());
      if(gorunum==='etiket') assert(await page.locator('.kose__menu').isHidden());
      await page.locator('[data-eylem=menu]').click();
      await page.locator('[data-eylem=duzenle]').click();
      await page.locator('textarea').fill('Kaydet '+gorunum);
      await page.locator('[data-eylem=kaydet]').click();
      await page.waitForFunction(g=>!document.querySelector('#dtnot-kok').shadowRoot.querySelector('textarea') && document.querySelector('#dtnot-kok').shadowRoot.textContent.includes('Kaydet '+g),gorunum);
    }
    // Re-injection must not create competing content listeners.
    await page.addScriptTag({path:path.join(__dirname,'..','content.js')});
    assert.equal(await page.evaluate(()=>storageListeners.length),1);
    console.log('PASS: menu cancel, viewport bounds, draft preservation, failed/successful save, failed read, queued hide, duplicate injection');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
