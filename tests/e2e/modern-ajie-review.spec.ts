import {test,expect}from'@playwright/test'
import {spawn,type ChildProcessWithoutNullStreams}from'node:child_process'
import {once}from'node:events'
import {fileURLToPath}from'node:url'
test.use({viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:[]}})
let server:ChildProcessWithoutNullStreams,origin:string
test.beforeAll(async()=>{
 server=spawn(process.env.PYTHON??'/opt/homebrew/bin/python3',['scripts/serve-continuous-review.py','--port','0'],{cwd:fileURLToPath(new URL('../../',import.meta.url))})
 origin=await new Promise<string>((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('review server not ready')),5000)
  server.stdout.on('data',chunk=>{output+=chunk.toString();const found=output.match(/Review (http:\/\/127\.0\.0\.1:\d+)\//);if(found){clearTimeout(timer);resolve(found[1]!)}})
  server.once('error',error=>{clearTimeout(timer);reject(error)});server.once('exit',code=>{clearTimeout(timer);reject(Error('review server exited'+code))})
 })
})
test.afterAll(async()=>{if(server&&server.exitCode===null){server.kill();await once(server,'exit')}})

for(const [cid,name]of[[10,'阿杰'],[12,'妮妮']]as const)test(name+' review renders four actual tail rigs, native swimming, controls and no invented feet',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
 const response=await page.goto(`${origin}/hd-review/characters-25/ajie-nini/?role=${cid}&export=1`);expect(response!.status()).toBe(200)
 await expect.poll(()=>page.evaluate(()=>Boolean((window as any).characterNextReview?.ready))).toBe(true)
 await expect(page.locator('h1')).toContainText(name)
 const sample=async(time:number)=>page.evaluate(t=>{const a=(window as any).characterNextReview;a.sampleNatural(t);return{rig:a.rig,parts:a.parts()}},time)
 const a=await sample(0),b=await sample(200)
 expect(a.rig.id).toBe(cid);expect(a.rig.anatomy).toBe('floating');expect(a.parts).toHaveLength(4)
 for(let i=0;i<4;i++){
  const source=a.rig.facings[a.parts[i].facing].actors[0];expect(source.legs).toEqual([])
  const tail=(state:any)=>state.parts[i].parts.find((p:any)=>p.name==='main/tail')
  expect(Math.abs(tail(a).rotation-tail(b).rotation)).toBeGreaterThan(.01)
  const head=b.parts[i].parts.find((p:any)=>p.name==='main/head');expect(head.rotation).toBe(0)
 }
 await page.getByRole('button',{name:'自然移动',exact:true}).click();await page.locator('#speed').selectOption('.5');await page.getByRole('button',{name:'暂停',exact:true}).click()
 const pixels=await page.locator('canvas').screenshot();await page.waitForTimeout(150);expect((await page.locator('canvas').screenshot()).equals(pixels)).toBe(true)
 expect(errors).toEqual([])
})
