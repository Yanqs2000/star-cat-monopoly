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

for(const role of [11,6,10,12,3,4,7])test(`role${role} material exporter starts without previous complete pack or derived portraits`,async({page})=>{
 const denied:string[]=[]
 const id=String(role).padStart(2,'0')
 await page.route(`**/role-${id}-complete.json`,r=>{denied.push(r.request().url());return r.fulfill({status:404,body:'not built yet'})})
 await page.route(new RegExp(`/role-${id}/(face|head|thumbnail|champion|fly-|carnival-)`),r=>{denied.push(r.request().url());return r.fulfill({status:404,body:'not built yet'})})
 await page.goto(`${origin}/hd-review/characters-25/next/?role=${role}&export=1`)
 await expect.poll(()=>page.evaluate(()=>Boolean((window as any).characterNextReview?.ready)),{timeout:5000}).toBe(true)
 const result=await page.evaluate(async role=>{const r=await(window as any).characterNextReview.createMaterialRenderer();const png=await r.carnival(2,47);let closed=true;if(role===3||role===4||role===7)for(const pose of[2,3])closed=closed&&(await r.carnival(pose,0))===(await r.carnival(pose,role===4?72:64));r.destroy();return{size:png.length,closed}},role)
 expect(result.size).toBeGreaterThan(10_000);expect(result.closed).toBe(true);expect(denied).toEqual([])
})
