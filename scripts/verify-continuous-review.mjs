import{chromium}from'@playwright/test';import assert from'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const original=requestAnimationFrame;let first=true;window.requestAnimationFrame=callback=>original(timestamp=>{const now=first?performance.now()-1000:timestamp;first=false;callback(now)})});
 await page.goto(process.env.CONTINUOUS_REVIEW_URL||'http://127.0.0.1:64867/hd-review/non-character-18-21/');await page.evaluate(()=>continuousReady);await page.waitForTimeout(100);assert.deepEqual(errors,[],'an early initial RAF timestamp must not produce a negative source frame');
 const crop=await page.evaluate(()=>{
  const canvases=[...document.querySelectorAll('#item-ludo-dice canvas')],probes=canvases.map(canvas=>{
   const large=document.createElement('canvas'),pad=384,original=canvas.getContext;
   const probe={canvas,large,pad,original,ctx:null};
   canvas.getContext=()=>new Proxy(probe.ctx,{get(target,key){if(key==='setTransform')return(a,b,c,d,e,f)=>target.setTransform(a,b,c,d,e+pad,f+pad);const v=target[key];return typeof v==='function'?v.bind(target):v},set(target,key,value){target[key]=value;return true}});return probe;
  });let clippedViews=0,maxOutsideAlpha=0;
  try{for(let i=0;i<80;i++){
   for(const p of probes){p.large.width=p.canvas.width+p.pad*2;p.large.height=p.canvas.height+p.pad*2;p.ctx=p.large.getContext('2d')}
   reviewControl.seek(i*1000/60);
   for(const p of probes){const {large,canvas,pad,ctx}=p,rgba=ctx.getImageData(0,0,large.width,large.height).data;let clipped=false;
    for(let y=0;y<large.height;y++)for(let x=0;x<large.width;x++){if(x>=pad&&x<pad+canvas.width&&y>=pad&&y<pad+canvas.height)continue;const a=rgba[(y*large.width+x)*4+3];maxOutsideAlpha=Math.max(maxOutsideAlpha,a);if(a>8)clipped=true}
    if(clipped)clippedViews++;
   }
  }}finally{for(const p of probes){p.canvas.getContext=p.original;p.large.width=1;p.large.height=1}reviewControl.seek(650)}
  return{displaySamples:80,comparedViews:160,clippedViews,maxOutsideAlpha};
 });console.log(crop);assert.equal(crop.clippedViews,0,'all three dice must remain fully inside both review canvases across the entire roll');await page.evaluate(()=>reviewControl.play());
 await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByLabel('统一播放进度').fill('200');await page.waitForTimeout(50);assert.deepEqual(errors,[]);console.log('Review startup timestamp boundary and scrub passed')
}finally{await browser.close()}
