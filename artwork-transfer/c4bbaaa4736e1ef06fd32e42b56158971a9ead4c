import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import staticFiles from '@fastify/static'
import { randomBytes } from 'node:crypto'
import { SaveStore, SaveError } from './store'
import { parseSnapshot } from '../src/modern/features/saves/snapshot'
import type { SaveSnapshot } from '../src/modern/features/saves/snapshot-types'

export async function createSaveServer(options:{dbPath:string;staticRoot?:string|string[];allowedOrigins?:string[]}){
 const app=Fastify({bodyLimit:16*1024*1024,logger:false})
 const store=new SaveStore(options.dbPath)
 const sessions=new Map<string,{csrf:string;expires:number}>()
 const allowed=new Set(options.allowedOrigins??['http://127.0.0.1:4184','http://127.0.0.1:5184','http://localhost:4184','http://localhost:5184'])
 await app.register(cookie)
 app.addHook('onClose',async()=>store.close())
 app.addHook('onRequest',async(req,reply)=>{
  const host=req.headers.host??''
  if(!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.ip))return reply.code(403).send({message:'仅允许本机访问'})
  if(!req.url.startsWith('/api/'))return
  reply.header('Cache-Control','no-store')
  const origin=req.headers.origin
  if(req.headers['sec-fetch-site']==='cross-site'||origin&&origin!==`http://${host}`&&!allowed.has(origin))return reply.code(403).send({message:'存档请求来源不允许'})
  if(req.method==='PUT'&&!origin)return reply.code(403).send({message:'保存请求缺少来源'})
  if(req.url.split('?')[0]==='/api/session')return
  const session=sessions.get(req.cookies.scm_session??'')
  if(!session||session.expires<Date.now()||req.headers['x-csrf-token']!==session.csrf)return reply.code(403).send({message:'存档会话失效，请重新查看槽位'})
 })
 app.get('/api/session',async(req,reply)=>{
  let id=req.cookies.scm_session;let session=id?sessions.get(id):undefined
  if(!session||session.expires<Date.now()){
   id=randomBytes(32).toString('hex');session={csrf:randomBytes(32).toString('hex'),expires:Date.now()+86400000}
   if(sessions.size>=64)sessions.delete(sessions.keys().next().value!)
   sessions.set(id,session)
   reply.setCookie('scm_session',id,{httpOnly:true,sameSite:'strict',path:'/api',maxAge:86400})
  }
  return {csrfToken:session.csrf}
 })
 app.get('/api/saves',async()=>({slots:store.list()}))
 app.get<{Params:{slot:string}}>('/api/saves/:slot',async(req,reply)=>{
  try{const record=store.read(Number(req.params.slot));return record??reply.code(404).send({message:'这个槽位尚无存档'})}
  catch(error){if(error instanceof SaveError)throw error;return reply.code(422).send({message:'存档损坏或版本不兼容，当前对局保留'})}
 })
 app.put<{Params:{slot:string};Body:{expectedRevision:number;requestId:string;snapshot:SaveSnapshot}}>('/api/saves/:slot',async(req,reply)=>{
  const body=req.body
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join(',')!=='expectedRevision,requestId,snapshot')return reply.code(400).send({message:'保存请求格式错误'})
  try{parseSnapshot(body.snapshot)}catch{return reply.code(400).send({message:'快照格式、版本或状态无效'})}
  return store.save(Number(req.params.slot),body.expectedRevision,body.requestId,body.snapshot)
 })
 app.setErrorHandler((error,_req,reply)=>{
  if(error instanceof SaveError)return reply.code(error.statusCode).send({message:error.message})
  const code=error&&typeof error==='object'&&'statusCode' in error?error.statusCode:undefined
  if(typeof code==='number'&&code>=400&&code<500)return reply.code(code).send({message:'请求格式错误或内容过大'})
  return reply.code(500).send({message:'保存服务未能完成请求，当前对局与旧槽保留；若无法确认写入，可手动重试同一请求'})
 })
 if(options.staticRoot)await app.register(staticFiles,{root:options.staticRoot,index:false})
 return app
}
