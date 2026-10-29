import{chromium}from'@playwright/test';import assert from'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const original=requestAnimationFrame;let first=true;window.requestAnimationFrame=callback=>original(timestamp=>{const now=first?performance.now()-1000:timestamp;first=false;callback(now)})});
 await page.goto(process.env.CONTINUOUS_REVIEW_URL||'http://127.0.0.1:64867/hd-review/non-character-18-21/');await page.evaluate(()=>continuousReady);await page.waitForTimeout(100);assert.deepEqual(errors,[],'an early initial RAF timestamp must not produce a negative source frame');
 await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByLabel('统一播放进度').fill('200');await page.waitForTimeout(50);assert.deepEqual(errors,[]);console.log('Review startup timestamp boundary and scrub passed')
}finally{await browser.close()}
