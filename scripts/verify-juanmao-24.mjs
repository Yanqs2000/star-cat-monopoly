/** Real Chrome/WebGL review of the bundled candidate, with deterministic continuous sample captures. */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
const base = process.env.JUANMAO_24_BASE_URL ?? 'http://127.0.0.1:64869'
const out = path.resolve('public/hd-review/character-24')
const fps=60
await mkdir(out,{recursive:true})
const browser = await chromium.launch({channel:'chrome',headless:true})
const page = await browser.newPage({viewport:{width:1320,height:1030},deviceScaleFactor:1})
const errors = [], failed = []
page.on('pageerror',error=>errors.push(error.message))
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
page.on('response',response=>{if(response.status()>=400)failed.push([response.status(),response.url()])})
await page.goto(`${base}/hd-review/character-24/index.html`)
await page.waitForFunction(()=>window.juanmao24Review?.ready)
const title = await page.title()
if (!title.includes('卷毛连续2D动画候选')) throw new Error(`Wrong review page: ${title}`)
await page.getByRole('button',{name:'悲伤',exact:true}).click()
if(!(await page.locator('#status').innerText()).includes('sad'))throw new Error('Action control did not change renderer')
for (const [name,time] of [['neutral',0],['ready',0],['walk',100],['happy',900],['sad',1100],['hurt',900],['cheer',900]]) {
  await page.evaluate(([action,ms])=>window.juanmao24Review.sample(action,ms),[name,time])
  await page.screenshot({path:path.join(out,`${name}-desktop.png`)})
}
await page.setViewportSize({width:430,height:932})
await page.getByRole('button',{name:'行走',exact:true}).click()
await page.screenshot({path:path.join(out,'walk-mobile.png')})
await page.setViewportSize({width:1320,height:1030})
let frameCount = 0
if(process.env.JUANMAO_24_VIDEO==='1') {
  const encoder = spawn('/opt/homebrew/bin/ffmpeg',['-y','-loglevel','error','-f','image2pipe','-vcodec','png','-framerate',String(fps),'-i','-','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','18',path.join(out,'juanmao-24-seven-actions.mp4')],{stdio:['pipe','ignore','pipe']})
  let encoderErrors='';encoder.stderr.on('data',chunk=>{encoderErrors+=chunk});encoder.stdin.on('error',error=>{console.error(error.message,encoderErrors)})
  const timeline=[['walk',1600],['neutral',500],['ready',700],['happy',1900],['sad',2467],['hurt',2000],['cheer',2267]]
  for(const [action,duration] of timeline) for(let time=0;time<duration;time+=1000/fps){
    await page.evaluate(([action,ms])=>window.juanmao24Review.sample(action,ms),[action,time])
    const png=await page.locator('canvas').screenshot()
    if(!encoder.stdin.write(png))await new Promise(resolve=>encoder.stdin.once('drain',resolve))
    frameCount++
  }
  encoder.stdin.end();const code=await new Promise(resolve=>encoder.once('close',resolve));if(code!==0)throw new Error(`ffmpeg ${code}: ${encoderErrors}`)
}
const verification={checkedAt:new Date().toISOString(),status:'candidate-awaiting-user-review',url:await page.url(),title,browser:'local Chrome / Playwright; Browser plugin and browser skill unavailable',viewports:['1320x1030 DPR1','430x932 DPR1'],pageIdentity:true,controls:true,sevenActionsFourDirections:true,errors,failedRequests:failed,videoFrames:frameCount,videoFps:fps,limitations:['newly authored 2D puppet motion, not recovered original limb rig','world-displacement stance and native tile registration; turns and start-stop need visual acceptance','source durations retained; continuous poses and soot-wool silhouette are newly authored','no user visual acceptance recorded for candidate']}
await writeFile(path.join(out,'browser-verification.json'),JSON.stringify(verification,null,2)+'\n')
console.log(JSON.stringify(verification))
await browser.close()
if(errors.length||failed.length)process.exitCode=1
