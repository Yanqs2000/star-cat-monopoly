import {chromium} from 'playwright'
import {mkdir,writeFile} from 'node:fs/promises'
const role=Number(process.argv[2]);if(![11,6].includes(role))throw Error('role must be11 or6')
const out=`/tmp/starcat-guaika-weiwei/role-${role}/material-renders`;await mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage()
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)})
try{
 await page.goto(`http://127.0.0.1:64867/hd-review/characters-25/next/?role=${role}&export=1`)
 await page.waitForFunction(()=>window.characterNextReview?.ready)
 await page.evaluate(async()=>{window.characterMaterialRenderer=await window.characterNextReview.createMaterialRenderer()})
 const save=(name,data)=>writeFile(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'))
 for(const name of ['thumbnail','champion'])await save(name,await page.evaluate(n=>window.characterMaterialRenderer[n](),name))
 for(const pose of [1,2,3])await save('carnival-idle-'+pose,await page.evaluate(p=>window.characterMaterialRenderer.carnival(p),pose))
 const samples=role===6?48:16
 for(const pose of [2,3])for(let frame=0;frame<samples;frame++)await save(`carnival-${pose}-${frame}`,await page.evaluate(([p,f])=>window.characterMaterialRenderer.carnival(p,f),[pose,frame]))
 await page.evaluate(()=>window.characterMaterialRenderer.destroy())
 if(errors.length)throw Error(errors.join('\n'))
 console.log(`role${role}:${5+samples*2} articulated material rasters; browser errors0`)
}finally{await browser.close()}
