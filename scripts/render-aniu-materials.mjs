import{chromium}from'playwright'
import{mkdir,writeFile,readFile}from'node:fs/promises'
const base=process.env.ANIU_REVIEW_URL??'http://127.0.0.1:64867/hd-review/characters-25/'
const out='/tmp/starcat-characters-25/material-renders';await mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage()
try{
 await page.goto(base);await page.waitForFunction(()=>window.character25Review?.ready)
 await page.evaluate(async()=>{window.aniuMaterialRenderer=await window.character25Review.createMaterialRenderer()})
 const save=async(name,data)=>writeFile(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'))
 for(const name of['thumbnail','champion'])await save(name,await page.evaluate(name=>window.aniuMaterialRenderer[name](),name))
 for(const pose of[1,2,3])await save('carnival-idle-'+pose,await page.evaluate(p=>window.aniuMaterialRenderer.carnival(p),pose))
 // Native movement advances8px at30Hz. Sixteen equally spaced samples of
 // a32px stride provide120Hz artwork, repeated4times over the native cycle.
 for(const pose of[2,3])for(let frame=0;frame<16;frame++)await save('carnival-'+pose+'-'+frame,await page.evaluate(([p,f])=>window.aniuMaterialRenderer.carnival(p,f),[pose,frame]))
 for(const id of[2,3,4,5,10,11]){
  const path='public/modern/hd-characters/characters-25/role-02/god-'+id+'.svg',svg=await readFile(path,'utf8')
  const w=Number(svg.match(/width="(\d+)"/)[1]),h=Number(svg.match(/height="(\d+)"/)[1])
  await save('god-'+id,await page.evaluate(([s,w,h])=>window.aniuMaterialRenderer.svg(s,w,h),[svg,w,h]))
 }
 await page.evaluate(()=>window.aniuMaterialRenderer.destroy());console.log('43 same-rig material rasters exported; no image-generation API used')
}finally{await browser.close()}
