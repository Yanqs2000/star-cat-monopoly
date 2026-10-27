import type { SaveSnapshot,SaveSlot,SaveRecord } from './snapshot-types'
import { parseSnapshot } from './snapshot'
export class SaveClientError extends Error {constructor(public readonly status:number,message:string){super(message)}}
function record(value:unknown,slot:number):SaveRecord {
 const r=value as SaveRecord
 if(!r||r.slot!==slot||!Number.isSafeInteger(r.revision)||r.revision<1)throw new SaveClientError(422,'服务器返回的存档记录无效，当前对局保留')
 return {slot:r.slot,revision:r.revision,snapshot:parseSnapshot(r.snapshot)}
}
export class SaveClient {
 private busy=false
 private abort:AbortController|undefined
 constructor(private fetcher:(url:string,options?:RequestInit)=>Promise<Response>=fetch){}
 cancel(){this.abort?.abort()}
 private async request(path:string,options:RequestInit={}):Promise<unknown>{
  if(this.busy)throw new SaveClientError(0,'正在处理另一项存档操作')
  this.busy=true;const controller=new AbortController();this.abort=controller
  const fetcher=this.fetcher
  const timeout=setTimeout(()=>controller.abort(),15000)
  try{
   const session=await fetcher(`${import.meta.env.BASE_URL}api/session`,{credentials:'same-origin',signal:controller.signal})
   if(!session.ok)throw new SaveClientError(session.status,'存档服务不可用，当前对局保留')
   const {csrfToken}=await session.json() as {csrfToken:unknown}
   if(typeof csrfToken!=='string'||!csrfToken)throw new SaveClientError(422,'存档会话格式无效')
   const response=await fetcher(`${import.meta.env.BASE_URL}api/saves${path}`,{...options,credentials:'same-origin',signal:controller.signal,headers:{'Content-Type':'application/json','x-csrf-token':csrfToken}})
   const value=await response.json() as {message?:unknown}
   if(!response.ok)throw new SaveClientError(response.status,typeof value?.message==='string'?value.message:'存档请求失败，当前对局保留')
   return value
  }catch(error){
   if(error instanceof SaveClientError)throw error
   throw new SaveClientError(0,'未能确认服务器结果，当前对局保留。请手动重试或重新查看槽位')
  }finally{clearTimeout(timeout);this.busy=false;this.abort=undefined}
 }
 async list():Promise<SaveSlot[]>{
  const value=await this.request('') as {slots:SaveSlot[]}
  const slots=value?.slots
  if(!Array.isArray(slots)||slots.length!==3||!slots.every((s,i)=>s?.slot===i+1&&Number.isSafeInteger(s.revision)&&s.revision>=0&&
   (s.savedAt===null||typeof s.savedAt==='string'&&Number.isFinite(Date.parse(s.savedAt)))&&
   (s.summary===null||Number.isSafeInteger(s.summary?.round)&&s.summary.round>=1&&typeof s.summary.date==='string'&&Array.isArray(s.summary.players)&&s.summary.players.every(n=>typeof n==='string'))))throw new SaveClientError(422,'服务器槽位列表不完整')
  return slots
 }
 async read(slot:number):Promise<SaveRecord>{return record(await this.request(`/${slot}`),slot)}
 async save(slot:number,revision:number,requestId:string,snapshot:SaveSnapshot):Promise<SaveRecord>{
  return record(await this.request(`/${slot}`,{method:'PUT',body:JSON.stringify({expectedRevision:revision,requestId,snapshot:parseSnapshot(snapshot)})}),slot)
 }
}
