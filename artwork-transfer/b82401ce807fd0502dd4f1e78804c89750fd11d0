import { expect,it } from 'vitest'
import { SaveClient,SaveClientError } from '../../src/modern/features/saves/client'
import { createGame } from '../../src/modern/features/game/setup'
import { createSnapshot } from '../../src/modern/features/saves/snapshot'
const now='2026-10-04T08:40:00.000Z'
function snapshot(){return createSnapshot(createGame([1],102),[1],{speed:1,paused:false},now,now)}
it('响应丢失与409不自动重试；保存成功仅接受服务器版本化记录',async()=>{
 let calls=0;let mode='lost'
 const client=new SaveClient(async(url)=>{
  if(url.endsWith('/session'))return Response.json({csrfToken:'token'})
  calls++;if(mode==='lost')throw new Error('network lost')
  if(mode==='conflict')return Response.json({message:'槽位更新冲突'},{status:409})
  return Response.json({slot:1,revision:1,snapshot:snapshot()})
 })
 await expect(client.save(1,0,'request-00001',snapshot())).rejects.toBeInstanceOf(SaveClientError);expect(calls).toBe(1)
 mode='conflict';await expect(client.save(1,0,'request-00001',snapshot())).rejects.toMatchObject({status:409});expect(calls).toBe(2)
 mode='ok';expect(await client.save(1,0,'request-00001',snapshot())).toMatchObject({revision:1})
})
it('读到版本损坏或不完整数据不会作为已加载局返回',async()=>{
 const value=snapshot();(value as any).formatVersion=99
 const client=new SaveClient(async(url)=>Response.json(url.endsWith('/session')?{csrfToken:'token'}:{slot:1,revision:1,snapshot:value}))
 await expect(client.read(1)).rejects.toThrow()
})
it('同一客户端正在请求时再次操作被拒，释放后可手动重试',async()=>{
 let release!:(value:Response)=>void
 const client=new SaveClient(async(url)=>url.endsWith('/session')?Response.json({csrfToken:'token'}):new Promise(r=>{release=r}))
 const pending=client.read(1);for(let i=0;i<20&&!release;i++)await Promise.resolve()
 await expect(client.read(1)).rejects.toThrow(/正在/)
 release(Response.json({slot:1,revision:1,snapshot:snapshot()}));await pending
})
it('传入原生fetch式函数时不绑定客户端对象作为this',async()=>{
 const client=new SaveClient(async function(this:unknown,url:string){
  if(this!==undefined)throw new TypeError('Illegal invocation')
  return Response.json(url.endsWith('/session')?{csrfToken:'token'}:{slots:[1,2,3].map(slot=>({slot,revision:0,savedAt:null,summary:null}))})
 })
 expect((await client.list()).map(s=>s.slot)).toEqual([1,2,3])
})
