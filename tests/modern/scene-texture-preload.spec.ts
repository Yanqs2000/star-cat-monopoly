import{expect,it}from'vitest'
import{loadSceneTextures}from'../../src/modern/features/map/texture-preload'
it('2400个实际纹理任务最多6个并行，避免Chrome资源上限且不丢帧',async()=>{
 let active=0,maximum=0;const loaded:string[]=[];const urls=Array.from({length:2400},(_,i)=>String(i))
 await loadSceneTextures(urls,async url=>{active++;maximum=Math.max(maximum,active);await new Promise<void>(r=>queueMicrotask(r));loaded.push(url);active--},new AbortController().signal)
 expect(maximum).toBe(6);expect(active).toBe(0);expect(new Set(loaded)).toEqual(new Set(urls))
})
it('失败后停止排新任务，等在途加载落定再抛错；预先取消不发请求',async()=>{
 let active=0,started=0;const error=new Error('HTTP404')
 await expect(loadSceneTextures(Array.from({length:100},(_,i)=>String(i)),async url=>{started++;active++;await Promise.resolve();active--;if(url==='1')throw error},new AbortController().signal)).rejects.toBe(error)
 expect(active).toBe(0);expect(started).toBeLessThan(15)
 const abort=new AbortController();abort.abort();await expect(loadSceneTextures(['x'],async()=>{throw Error('should not run')},abort.signal)).rejects.toHaveProperty('name','AbortError')
})
