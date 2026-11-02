import {test,expect} from '@playwright/test'
import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process'
import {once} from 'node:events'
import {fileURLToPath} from 'node:url'
test.use({launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:[]}})
let reviewServer:ChildProcessWithoutNullStreams,origin:string
test.beforeAll(async()=>{
 reviewServer=spawn(process.env.PYTHON??'/opt/homebrew/bin/python3',['scripts/serve-continuous-review.py','--port','0'],{cwd:fileURLToPath(new URL('../../',import.meta.url))})
 origin=await new Promise<string>((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('review server did not become ready')),5000)
  let output=''
  reviewServer.stdout.on('data',chunk=>{output+=chunk.toString();const found=output.match(/Review (http:\/\/127\.0\.0\.1:\d+)\//);if(found){clearTimeout(timer);resolve(found[1]!)}})
  reviewServer.once('error',error=>{clearTimeout(timer);reject(error)})
  reviewServer.once('exit',code=>{clearTimeout(timer);reject(Error('review server exited with'+code))})
 })
 expect(new URL(origin).port).not.toBe('0')
})
test.afterAll(async()=>{if(reviewServer&&reviewServer.exitCode===null){reviewServer.kill();await once(reviewServer,'exit')}})

for(const role of[5,8,9])test(`role${role} keeps animating when first RAF timestamp precedes its clock setup`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{const native=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>native(time=>callback(time-50))})
 await page.goto(`${origin}/hd-review/characters-25/last-three/?role=${role}`)
 await page.waitForFunction(()=>Boolean((window as any).characterNextReview?.ready))
 const before=await page.evaluate(()=>JSON.stringify((window as any).characterNextReview.parts()))
 await page.waitForTimeout(250)
 expect(errors).toEqual([]);expect(await page.evaluate(()=>JSON.stringify((window as any).characterNextReview.parts()))).not.toBe(before)
})
test('Dawei soot tail remains entirely inside all four review panels',async({page})=>{
 await page.goto(`${origin}/hd-review/characters-25/last-three/?role=8&export=1`)
 await page.waitForFunction(()=>Boolean((window as any).characterNextReview?.ready))
 const clipped=await page.evaluate(async()=>{
  const url=await(window as any).characterNextReview.raster('hurt',1400),image=new Image();image.src=url;await image.decode()
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=560;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,1280,560).data;let count=0
  for(const edge of[0,320,640,960,1280])for(let x=Math.max(0,edge-2);x<Math.min(1280,edge+2);x++)for(let y=180;y<515;y++){const at=(y*1280+x)*4;if(pixels[at+3]!>180&&pixels[at]!<120&&pixels[at+1]!<120&&pixels[at+2]!<120)count++}
  return count
 });expect(clipped).toBe(0)
})
