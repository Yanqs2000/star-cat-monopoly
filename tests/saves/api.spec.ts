import { afterEach, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { createSaveServer } from '../../server/app'
import { createGame } from '../../src/modern/features/game/setup'
import { createSnapshot } from '../../src/modern/features/saves/snapshot'
const apps:FastifyInstance[]=[]
const host='127.0.0.1:4186',origin=`http://${host}`
async function app(){const a=await createSaveServer({dbPath:':memory:'});apps.push(a);return a}
async function session(a:FastifyInstance){const r=await a.inject({url:'/api/session',headers:{host}});expect(r.statusCode).toBe(200);return {host,origin,cookie:r.headers['set-cookie']!.toString().split(';')[0]!,'x-csrf-token':r.json().csrfToken as string}}
const now='2026-10-04T08:40:00.000Z'
function payload(){return {expectedRevision:0,requestId:'req-00000001',snapshot:createSnapshot(createGame([1],102),[1],{speed:1,paused:false},now,now)}}
afterEach(async()=>{for(const a of apps.splice(0))await a.close()})
it('会话保护后的三个槽及真实保存读取，空槽404',async()=>{
 const a=await app(),headers=await session(a)
 expect((await a.inject({url:'/api/saves',headers})).json().slots.map((s:any)=>s.revision)).toEqual([0,0,0])
 expect((await a.inject({url:'/api/saves/1',headers})).statusCode).toBe(404)
 const saved=await a.inject({method:'PUT',url:'/api/saves/1',headers,payload:payload()})
 expect(saved.statusCode).toBe(200);expect(saved.json()).toMatchObject({slot:1,revision:1})
 expect((await a.inject({url:'/api/saves/1',headers})).json().snapshot.state.players[0].cash).toBe(100000)
 expect(saved.headers['cache-control']).toBe('no-store')
})
it('另一个浏览器会话读取同一服务器槽，旧修订号409且不覆盖',async()=>{
 const a=await app(),one=await session(a),two=await session(a)
 await a.inject({method:'PUT',url:'/api/saves/1',headers:one,payload:payload()})
 expect((await a.inject({url:'/api/saves/1',headers:two})).json().revision).toBe(1)
 const stale=payload();stale.requestId='req-00000002';stale.snapshot.state.players[0]!.cash=50
 expect((await a.inject({method:'PUT',url:'/api/saves/1',headers:two,payload:stale})).statusCode).toBe(409)
 expect((await a.inject({url:'/api/saves/1',headers:one})).json().snapshot.state.players[0].cash).toBe(100000)
})
it('恶意来源/Host、无会话及错误CSRF不能读写槽位',async()=>{
 const a=await app(),headers=await session(a)
 expect((await a.inject({url:'/api/session',headers:{host:'evil.test:4186'}})).statusCode).toBe(403)
 expect((await a.inject({url:'/api/session',headers:{host,origin:'https://evil.test'}})).statusCode).toBe(403)
 expect((await a.inject({url:'/api/saves',headers:{host}})).statusCode).toBe(403)
 expect((await a.inject({method:'PUT',url:'/api/saves/1',headers:{...headers,'x-csrf-token':'bad'},payload:payload()})).statusCode).toBe(403)
 expect((await a.inject({method:'PUT',url:'/api/saves/1',headers:{...headers,origin:'https://evil.test'},payload:payload()})).statusCode).toBe(403)
})
it('损坏结构/未知版本/非法槽号返回400且槽位不变',async()=>{
 const a=await app(),headers=await session(a)
 const bad=payload();(bad.snapshot as any).formatVersion=99
 expect((await a.inject({method:'PUT',url:'/api/saves/1',headers,payload:bad})).statusCode).toBe(400)
 expect((await a.inject({method:'PUT',url:'/api/saves/4',headers,payload:payload()})).statusCode).toBe(400)
 expect((await a.inject({method:'PUT',url:'/api/saves/1',headers,payload:{}})).statusCode).toBe(400)
 expect((await a.inject({url:'/api/saves/1',headers})).statusCode).toBe(404)
})
