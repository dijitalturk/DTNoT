const { chromium } = require('playwright');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dtnot-e2e-'));
 const ext=path.join(tmp,'extension');fs.cpSync(path.join(__dirname,'../dist/chrome-unpacked'),ext,{recursive:true});
 // Grant the optional website access in the isolated test installation only.
 const manifest=JSON.parse(fs.readFileSync(path.join(ext,'manifest.json')));manifest.host_permissions=manifest.optional_host_permissions;fs.writeFileSync(path.join(ext,'manifest.json'),JSON.stringify(manifest));
 const context=await chromium.launchPersistentContext(path.join(tmp,'profile'),{headless:true,executablePath:process.env.CHROMIUM_PATH,args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
 try {
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const id=worker.url().split('/')[2];
 context.setDefaultTimeout(5000);
 const page=await context.newPage();await page.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<html><body>Extension test</body></html>'}));await page.goto('https://example.com/');
 await worker.evaluate(async()=>{await icerikEsle();});await page.reload();
 // Position regression: both dragged and automatically placed survivors stay put.
 const cardFor=id=>page.locator(`[data-not-id="${id}"]`);
 async function dragCard(id,x,y) {
   const handle=await cardFor(id).locator('.tutamak').boundingBox();
   await page.mouse.move(handle.x+5,handle.y+5);await page.mouse.down();
   await page.mouse.move(x,y,{steps:8});await page.mouse.up();
   const saved=await worker.evaluate(async id=>{for(let i=0;i<100;i++){const n=await S.notuAl(id);if(n.konum)return n.konum;await new Promise(r=>setTimeout(r,20));}return null;},id);
   assert(saved,'Dragged position must be persisted');
 }
 async function samePosition(id,before) {
   const after=await cardFor(id).boundingBox();
   assert(after && Math.abs(after.x-before.x)<=1 && Math.abs(after.y-before.y)<=1,
     `Survivor moved: ${JSON.stringify({before,after})}`);
 }
 page.on('dialog',dialog=>dialog.accept());
 for(const mode of ['automatic survivor','dragged first survivor','dragged last survivor']) {
   const first=await worker.evaluate(()=>S.ekle('https://example.com/','Position first'));
   await cardFor(first.id).waitFor();await dragCard(first.id,620,150);
   const firstPosition=await cardFor(first.id).boundingBox();
   const second=await worker.evaluate(()=>S.ekle('https://example.com/','Position second'));
   await cardFor(second.id).waitFor();await samePosition(first.id,firstPosition);
   const third=await worker.evaluate(()=>S.ekle('https://example.com/','Position third'));
   await cardFor(third.id).waitFor();await samePosition(first.id,firstPosition);
   if(mode==='dragged last survivor') await dragCard(third.id,300,400);
   const survivor=mode==='dragged first survivor'?first:third;
   const before=await cardFor(survivor.id).boundingBox();
   for(const removed of [first,second,third].filter(n=>n.id!==survivor.id)) {
     await cardFor(removed.id).locator('[data-eylem=menu]').click();
     await cardFor(removed.id).locator('[data-eylem=sil]').click();
     await cardFor(removed.id).waitFor({state:'detached'});
     await samePosition(survivor.id,before);
   }
   if(mode!=='automatic survivor') {
     await page.reload();await cardFor(survivor.id).waitFor();await samePosition(survivor.id,before);
   }
   await worker.evaluate(async()=>{const notes=(await S.hepsiniAl()).notlar;for(const n of notes) await S.sil(n.id);});
   await page.locator('#dtnot-kok').waitFor({state:'detached'});
   console.log('PASS stable position:',mode);
 }
 await worker.evaluate(async()=>{await S.ekle('https://example.com/','Regression note',{konum:{x:0,y:1}})});
 await page.locator('.kutu').waitFor();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('[data-eylem=kucult]').click();await page.locator('.mini').waitFor({timeout:5000});
 await page.locator('.mini').click();await page.locator('.kutu').waitFor({timeout:5000});
 await page.locator('[data-eylem=menu]').click();await page.locator('[data-eylem=duzenle]').click();await page.locator('textarea').fill('Edited in real extension');await page.locator('[data-eylem=kaydet]').click();await page.locator('.metin').filter({hasText:'Edited in real extension'}).waitFor();
 await page.locator('[data-eylem=kapat]').click(); await page.locator('.kutu').waitFor({state:'detached',timeout:5000});
 assert.equal(await worker.evaluate(async()=> (await S.hepsiniAl()).notlar.length),1);
 for(let i=0;i<5;i++) {
   await worker.evaluate(async()=>{const n=(await S.hepsiniAl()).notlar[0];await S.guncelle(n.id,{gizleUntil:0});});
   await page.locator('.kutu').waitFor();
   await page.locator('[data-eylem=kucult]').click();await page.locator('.mini').waitFor();
   await page.locator('.mini').click();await page.locator('.kutu').waitFor();
   await page.locator('[data-eylem=kapat]').click();await page.locator('.kutu').waitFor({state:'detached'});
 }
 for(const gorunum of ['banner','footer','etiket']) {
   await worker.evaluate(async gorunum=>{const n=(await S.hepsiniAl()).notlar[0];await S.guncelle(n.id,{gorunum,gizleUntil:0});},gorunum);
   await page.locator('[data-eylem=menu]').waitFor();await page.locator('[data-eylem=menu]').click();await page.locator('[data-eylem=duzenle]').click();await page.locator('textarea').fill('Saved '+gorunum);await page.locator('[data-eylem=kaydet]').click();
   await page.waitForFunction(g=>!document.querySelector('#dtnot-kok').shadowRoot.querySelector('textarea') && document.querySelector('#dtnot-kok').shadowRoot.textContent.includes('Saved '+g),gorunum);
   await page.locator('[data-eylem=kapat]').click();await page.locator('#dtnot-kok').waitFor({state:'detached'});
 }
 // An empty page must not query notes on every SPA poll.
 await worker.evaluate(()=>{globalThis.readCount=0;const original=ISLER.SAYFA_NOTLARI;ISLER.SAYFA_NOTLARI=async m=>{readCount++;return original(m);};});
 await page.waitForTimeout(2800);
 assert.equal(await worker.evaluate(()=>readCount),0);
 // Expiring a hidden note must work without polling empty pages.
 await worker.evaluate(async()=>{const n=(await S.hepsiniAl()).notlar[0];await S.guncelle(n.id,{gorunum:'postit',gizleUntil:Date.now()+300});});
 await page.locator('.kutu').waitFor();
 const popup=await context.newPage();await popup.goto(`chrome-extension://${id}/popup.html`);await popup.locator('#ayarAc').click();await popup.locator('#ayarKutu').waitFor();assert.equal(await popup.locator('#ayarKutu').isVisible(),true);
 // Concurrent messages use the real background handler and Chrome storage.
 const parallel=await popup.evaluate(async()=>await Promise.all(Array.from({length:20},(_,i)=>chrome.runtime.sendMessage({tip:'NOT_EKLE',url:'https://example.com/',metin:'Parallel '+i}))));
 assert(parallel.every(r=>r.not));assert.equal(await worker.evaluate(async()=>(await S.hepsiniAl()).notlar.length),21);
 await page.locator('.kutu').first().waitFor();
 // A rejected write must not poison the background write queue.
 assert((await popup.evaluate(()=>chrome.runtime.sendMessage({tip:'NOT_GUNCELLE',id:'missing',patch:{metin:'x'}}))).__hata);
 assert((await popup.evaluate(()=>chrome.runtime.sendMessage({tip:'NOT_EKLE',url:'https://example.com/',metin:'After failure'}))).not);
 // Even a delayed background response must not disable popup controls.
 await worker.evaluate(()=>{globalThis.originalDurum=ISLER.DURUM;ISLER.DURUM=async()=>{await new Promise(r=>globalThis.resumeDurum=r);return originalDurum();};});
 await popup.reload();await popup.locator('#ayarAc').click({timeout:2000});assert(await popup.locator('#ayarKutu').isVisible());
 await worker.evaluate(()=>{resumeDurum();ISLER.DURUM=originalDurum;});
 const timings=[];
 for(let i=0;i<5;i++) {const start=Date.now();await popup.reload();await popup.locator('#ayarAc').click();assert(await popup.locator('#ayarKutu').isVisible());timings.push(Date.now()-start);}
 console.log('Popup reload + settings click ms:',timings);
 assert.deepEqual(errors,[]);
 console.log('PASS real extension: minimize/reopen/edit/save/hide/storage/popup',errors);
 }finally{await context.close();fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
