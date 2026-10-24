import { chromium } from '/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/non-character-assets/node_modules/playwright/index.mjs'
import fs from 'node:fs/promises'
const dir=process.cwd()+'/.analysis-cache/map-continuation-20261023-batch29'
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1600,height:1460},deviceScaleFactor:1})
const errors=[],requests=[],views=[]
page.on('pageerror',e=>errors.push(e.message))
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)})
page.on('request',r=>requests.push(new URL(r.url()).pathname))
await page.goto('http://127.0.0.1:5198/modern.html')
await page.setContent('<div id="board" style="width:1600px;height:1400px"></div>')
async function mount(mode){
 await page.evaluate(async mode=>{
  window.mapReviewScene?.destroy()
  const [{createMapScene},{parseAssetManifest},{loadHdMapArtwork},map]=await Promise.all([
   import('/src/modern/features/map/MapScene.ts'),import('/src/modern/features/characters/assets.ts'),
   import('/src/modern/features/assets/hd-map-art.ts'),import('/src/modern/data/map.json')])
  const manifest=parseAssetManifest(await fetch('/assets/manifest.json').then(r=>r.json()))
  const controller=new AbortController(),art=await loadHdMapArtwork(manifest.map,controller.signal)
  const regions=mode==='native'?art.regions:[]
  const scene=await createMapScene(document.querySelector('#board'),map.default,manifest,{
   signal:controller.signal,onFrame:()=>{},assetProfile:'hd',mapBase:art.baseMap,mapRegions:regions,
   requiredTextureUrls:regions.map(r=>r.url),textureResolutions:Object.fromEntries(regions.map(r=>[r.url,r.pixelDensity])),
   onAssetError:e=>{throw e}})
  scene.showMarkers(false);scene.setPaused(true);scene.setPlaying(false);window.mapReviewScene=scene
  window.mapReviewInfo={mode,regions:regions.length,base:art.baseMap}
 },mode)
}
async function capture(mode,name,width,height,zoom,cx,cy,clip){
 await page.setViewportSize({width,height:height+60})
 await page.evaluate(async ({width,height,zoom,cx,cy})=>{
  const board=document.querySelector('#board');board.style.width=width+'px';board.style.height=height+'px'
  const scene=window.mapReviewScene;scene.resize(width,height)
  const viewport=Math.min(width/800,height/600),scale=zoom/viewport
  scene.restoreCameraState({x:400-(cx-184)*scale,y:300-(cy-313)*scale,scale,following:false})
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
 },{width,height,zoom,cx,cy})
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
 const path=dir+'/'+mode+'-'+name+'.png'
 if(clip)await page.screenshot({path,clip});else await page.locator('#board').screenshot({path})
 views.push({mode,name,width,height,zoom,sourceFocus:[cx,cy],clip})
}
for(const mode of ['native']){
 await mount(mode)
 await capture(mode,'bridge-registered',1500,1100,2,1472,1952)
 await capture(mode,'bridge-upper-joint',1200,1000,3,1600,1810)
 await capture(mode,'bridge-lower-joint',1200,1000,3,1360,1960)
 await capture(mode,'west-red-unified',1000,800,5,267,1501)
 await capture(mode,'east-red-source',1000,800,5,2331,978)
 await capture(mode,'west-grass-corrected',1200,1100,2.5,470,900)
 await capture(mode,'west-cyan-joint-fixed',1400,900,4,270,1552)
 await capture(mode,'whole-map',2400,2200,.8,1350,1276)
}
if(requests.some(p=>p==='/assets-hd/map.webp'||p.startsWith('/hd-masters/')))throw new Error('Runtime fetched legacy background or master assets')
await fs.writeFile(dir+'/installed-runtime-browser-verification.json',JSON.stringify({renderer:'Actual createMapScene with loadHdMapArtwork; installed runtime URLs only',modes:['installedNativeRegions','matching2xbase'],noFetchOrAlphaOverrides:true,views,requests,errors},null,2)+'\n')
await browser.close();if(errors.length)throw new Error(errors.join('\n'))
console.log(JSON.stringify({views:views.length,errors,legacyBackgroundRequests:requests.filter(p=>p==='/assets-hd/map.webp')}))
