import {chromium} from '@playwright/test'
import {mkdir,writeFile} from 'node:fs/promises'
const out=process.argv[2],url=process.env.CONTINUOUS_REVIEW_URL
if(!out||!url)throw new Error('output and CONTINUOUS_REVIEW_URL required')
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true})
try{
 const page=await browser.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.evaluate(()=>window.continuousReady)
 const clips=await page.evaluate(()=>Object.values(ContinuousRenderer.config.clips))
 for(const c of clips){
  await mkdir(out+'/'+c.id,{recursive:true})
  for(let i=0;i<c.count;i++){
   const png=await page.evaluate(({id,ms})=>{const canvas=document.createElement('canvas');ContinuousRenderer.draw(id,ms,canvas);return canvas.toDataURL('image/png')},{id:c.id,ms:i*1000/c.fps})
   await writeFile(out+'/'+c.id+'/'+(i+1)+'.png',Buffer.from(png.split(',')[1],'base64'))
  }
  console.log(c.id,c.count)
 }
 if(errors.length)throw new Error(errors.join('\n'))
}finally{await browser.close()}
