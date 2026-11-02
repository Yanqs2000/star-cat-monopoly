import {chromium} from 'playwright'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
const role=Number(process.argv[2]);if(![3,4,5,7,8,9,11,6,10,12].includes(role))throw Error('unsupported character role')
const batch=[5,8,9].includes(role)?'dapai-dawei-afei':[3,4,7].includes(role)?'jjmm-jiajia-shuaige':[10,12].includes(role)?'ajie-nini':'guaika-weiwei'
const review=[5,8,9].includes(role)?'last-three':[3,4,7].includes(role)?'trio':batch==='ajie-nini'?'ajie-nini':'next'
const out=`/tmp/starcat-${batch}/role-${role}/material-renders`;await mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage()
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)})
try{
 await page.goto(`http://127.0.0.1:64867/hd-review/characters-25/${review}/?role=${role}&export=1`)
 await page.waitForFunction(()=>window.characterNextReview?.ready)
 await page.evaluate(async()=>{window.characterMaterialRenderer=await window.characterNextReview.createMaterialRenderer()})
 const save=(name,data)=>writeFile(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'))
 for(const name of ['thumbnail','champion'])await save(name,await page.evaluate(n=>window.characterMaterialRenderer[n](),name))
 for(const pose of [1,2,3])await save('carnival-idle-'+pose,await page.evaluate(p=>window.characterMaterialRenderer.carnival(p),pose))
 const native=JSON.parse(await readFile('public/modern/assets/activities/manifest.json','utf8')).clips.find(c=>c.id===`carnival-walk-${role}-left`)
 const samples=role===11?16:Math.round(native.frames.length/(native.fps??30)*120)
 for(const pose of [2,3])for(let frame=0;frame<samples;frame++)await save(`carnival-${pose}-${frame}`,await page.evaluate(([p,f])=>window.characterMaterialRenderer.carnival(p,f),[pose,frame]))
 await page.evaluate(()=>window.characterMaterialRenderer.destroy())
 if(errors.length)throw Error(errors.join('\n'))
 console.log(`role${role}:${5+samples*2} articulated material rasters; browser errors0`)
}finally{await browser.close()}
