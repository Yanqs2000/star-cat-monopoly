import{chromium}from'@playwright/test';import assert from'node:assert/strict';import{writeFile}from'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const page=await browser.newPage();await page.goto(process.env.CONTINUOUS_REVIEW_URL||'http://127.0.0.1:64867/hd-review/non-character-18-21/render.html');await page.evaluate(()=>continuousReady);const result=await page.evaluate(()=>{
 function pixels(id,frame){const c=ContinuousRenderer.config.clips[id],canvas=document.createElement('canvas');ContinuousRenderer.draw(id,(frame-1)*1000/30,canvas,2);return{c,canvas,rgba:canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,q:c.track[frame-1]}}
 const p=pixels('car1',17);let minX=Infinity,maxX=-Infinity;for(let y=0;y<p.canvas.height;y++)for(let x=0;x<p.canvas.width;x++){const i=(y*p.canvas.width+x)*4,[r,g,b,a]=p.rgba.slice(i,i+4);if(a>150&&b>r*1.15&&b>g*.65){minX=Math.min(minX,x);maxX=Math.max(maxX,x)}}
 const a=pixels('car2',45);let hatch=0;const right=a.q.x+a.q.w/2+8;for(let y=0;y<a.canvas.height;y++)for(let x=0;x<a.canvas.width;x++){if(x/2+a.c.offsetX<right)continue;const i=(y*a.canvas.width+x)*4,[r,g,b,alpha]=a.rgba.slice(i,i+4);if(alpha>150&&r>160&&g>160&&b>160)hatch++}
 return{policeBlueWidthRatio:(maxX-minX)/2/p.q.w,ambulanceHatchRightPixels:hatch}
});
const clipping=await page.evaluate(()=>{
 const reports=[];
 for(const id of ['car1','car2']){
  const c=ContinuousRenderer.config.clips[id],d=2,pad=48,canvas=document.createElement('canvas');let frames=0,maxAlpha=0;
  for(let i=0;i<c.count;i++){
   const w=c.width*d,h=c.height*d;canvas.width=w+pad*2;canvas.height=h+pad*2;const real=canvas.getContext('2d');
   const ctx=new Proxy(real,{get(target,key){if(key==='setTransform')return(a,b,c,d,e,f)=>target.setTransform(a,b,c,d,e+pad,f+pad);const value=target[key];return typeof value==='function'?value.bind(target):value},set(target,key,value){target[key]=value;return true}});
   ContinuousRenderer.draw(id,i*1000/60,{width:w,height:h,getContext:()=>ctx},d);
   const rgba=real.getImageData(0,0,canvas.width,canvas.height).data;let clipped=false;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    if(x>=pad&&x<pad+w&&y>=pad&&y<pad+h)continue;
    const wx=(x-pad)/d+c.offsetX,wy=(y-pad)/d+c.offsetY;if(wx<0||wx>800||wy<0||wy>600)continue;
    const alpha=rgba[(y*canvas.width+x)*4+3];maxAlpha=Math.max(maxAlpha,alpha);if(alpha>8)clipped=true;
   }if(clipped)frames++;
  }canvas.width=1;canvas.height=1;reports.push({id,visibleClippedFrames:frames,maxOutsideViewportAlpha:maxAlpha});
 }return reports;
});
result.clipping=clipping;console.log(result);assert(clipping.every(c=>c.visibleClippedFrames===0),'no vehicle pixels may be clipped inside the actual800x600 viewport');assert(result.policeBlueWidthRatio>.85,'turning police body must keep original footprint');assert(result.ambulanceHatchRightPixels>20,'ambulance hatch must open to original right side');if(process.env.RENDERER_QA_OUTPUT)await writeFile(process.env.RENDERER_QA_OUTPUT,JSON.stringify(result,null,2))
}finally{await browser.close()}
