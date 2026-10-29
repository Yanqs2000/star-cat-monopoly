import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require=createRequire(import.meta.url),{chromium}=require('@playwright/test')
const url=process.env.EFFECTS_REVIEW_URL??'http://127.0.0.1:64866/hd-review/non-character-13-17/'
const out=path.resolve('.analysis-cache/rocket-heading-fix')
fs.mkdirSync(out,{recursive:true})
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try{
 const page=await browser.newPage()
 await page.goto(url);await page.evaluate(()=>effectsReady)
 const runtime=JSON.parse(fs.readFileSync('src/modern/data/non-character-effects.json','utf8')).worldClips.find(c=>c.id==='rocket')
 const checks=await page.evaluate(async({runtime})=>{
  const results=[],c=EffectsRenderer.config.clips.rocket
  // Sample the orange nose inside the body, excluding the separate yellow flame.
  for(const stage of ['renderer','runtime'])for(const [phase,frame,top,height]of [['ascent',40,-52+Math.sin(40/60*4)*.7,70],['descent',144,-108.4,70],['descent',150,-52,70]]){
   const canvas=document.createElement('canvas');canvas.width=c.width*4;canvas.height=c.height*4
   const ctx=canvas.getContext('2d')
   if(stage==='renderer')EffectsRenderer.draw('rocket',frame*1000/60,canvas)
   else{const f=runtime.frames[frame],image=new Image();image.src='../../modern/'+f.url;await image.decode();ctx.drawImage(image,(f.offsetX-c.offsetX)*4,(f.offsetY-c.offsetY)*4)}
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data
   const cx=phase==='ascent'?30:frame===144?33.8:31
   let orange=0,weightedY=0,flameAbove=0,flameBelow=0
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3],wx=x/4+c.offsetX,wy=y/4+c.offsetY
    if(a<128||Math.abs(wx-cx)>9)continue
    if(wy>=top&&wy<=top+height&&r>170&&g>65&&g<175&&b<90){orange++;weightedY+=(wy-top)/height}
    if(r>225&&g>175&&b<120){if(wy<top)flameAbove++;if(wy>top+height)flameBelow++}
   }
   results.push({stage,phase,frame:frame+1,orange,noseY:weightedY/orange,flameAbove,flameBelow,png:canvas.toDataURL()})
  }
  return results
 },{runtime})
 for(const result of checks){
  fs.writeFileSync(path.join(out,`${result.stage}-${result.phase}-${result.frame}.png`),Buffer.from(result.png.split(',')[1],'base64'))
  delete result.png
 }
 console.log(JSON.stringify(checks,null,2))
 for(const result of checks){
  assert(result.orange>10,`${result.phase}: orange nose must be visible`)
  if(result.phase==='ascent'){
   assert(result.noseY<.25,'ascent nose must stay at the top')
   assert(result.flameBelow>result.flameAbove,'ascent exhaust must point down')
  }else{
   assert(result.noseY>.75,'descending rocket nose must point down')
   assert(result.flameAbove>result.flameBelow,'descending exhaust must point up')
  }
 }
 fs.writeFileSync(path.join(out,'heading-verification.json'),JSON.stringify(checks,null,2)+'\n')
}finally{await browser.close()}
