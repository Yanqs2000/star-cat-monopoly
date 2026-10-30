import{chromium}from'playwright'
import assert from'node:assert/strict'
import{writeFile}from'node:fs/promises'
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage()
await page.goto('http://127.0.0.1:64867/hd-review/character-24/index.html')
await page.waitForFunction(()=>window.juanmao24Review?.ready)
const result=await page.evaluate(()=>{
 let samples=0;const failures=[]
 for(const [action,duration]of [['walk',800],['neutral',33],['ready',33],['happy',1900],['sad',2467],['hurt',2000],['cheer',2267]]){
  for(let t=0;t<=duration;t+=1000/60){
   window.juanmao24Review.sample(action,t)
   for(const [i,b]of window.juanmao24Review.bounds().entries()){
    samples++;if(b.x<i*300||b.right>(i+1)*300||b.y<0||b.bottom>560)failures.push({action,t,i,b})
   }
  }
 }
 return{samples,failures}
})
console.log(JSON.stringify({...result,failures:result.failures.slice(0,3),clipped:result.failures.length}))
await writeFile('/tmp/starcat-24-bounds.json',JSON.stringify(result,null,2)+'\n');await browser.close()
assert.equal(result.failures.length,0,'Every direction must fit its review panel throughout every action')
