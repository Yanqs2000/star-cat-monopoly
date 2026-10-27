import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { parseSnapshot } from '../src/modern/features/saves/snapshot'
import type { SaveSnapshot, SaveSlot, SaveRecord } from '../src/modern/features/saves/snapshot-types'
export class SaveError extends Error {constructor(public readonly statusCode:number,message:string){super(message)}}
interface Row {slot:1|2|3;revision:number;payload:string;request_id:string;request_hash:string}
function slotId(slot:number):asserts slot is 1|2|3 {if(!Number.isInteger(slot)||slot<1||slot>3)throw new SaveError(400,'槽位必须是1至3')}
export class SaveStore {
 private db:DatabaseSync
 constructor(public readonly path:string){
  this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;')
  this.db.exec('CREATE TABLE IF NOT EXISTS save_slots (slot INTEGER PRIMARY KEY CHECK(slot BETWEEN 1 AND 3), revision INTEGER NOT NULL, payload TEXT NOT NULL, request_id TEXT NOT NULL, request_hash TEXT NOT NULL)')
 }
 private row(slot:number){return this.db.prepare('SELECT * FROM save_slots WHERE slot=?').get(slot) as Row|undefined}
 list():SaveSlot[]{
  return ([1,2,3] as const).map(slot=>{
   const row=this.row(slot);if(!row)return {slot,revision:0,savedAt:null,summary:null}
   try{const snapshot=parseSnapshot(JSON.parse(row.payload));const g=snapshot.state
    return {slot,revision:row.revision,savedAt:snapshot.savedAt,summary:{round:g.round,date:`${g.world.year}-${g.world.month}-${g.world.day}`,players:g.players.map(p=>p.name)}}
   }catch{return {slot,revision:row.revision,savedAt:null,summary:null}}
  })
 }
 read(slot:number):SaveRecord|null {
  slotId(slot);const row=this.row(slot);if(!row)return null
  return {slot,revision:row.revision,snapshot:parseSnapshot(JSON.parse(row.payload))}
 }
 save(slot:number,revision:number,requestId:string,value:SaveSnapshot):SaveRecord {
  slotId(slot)
  if(!Number.isSafeInteger(revision)||revision<0||typeof requestId!=='string'||!/^[-\w]{8,100}$/.test(requestId))throw new SaveError(400,'修订号或请求标识无效')
  const snapshot=parseSnapshot(value);const payload=JSON.stringify(snapshot)
  const hash=createHash('sha256').update(payload).digest('hex')
  this.db.exec('BEGIN IMMEDIATE')
  try{
   const old=this.row(slot)
   if(old?.request_id===requestId){
    if(old.request_hash!==hash||revision!==old.revision-1)throw new SaveError(409,'保存请求冲突：同一标识内容不同')
    this.db.exec('COMMIT');return {slot,revision:old.revision,snapshot:parseSnapshot(JSON.parse(old.payload))}
   }
   if((old?.revision??0)!==revision)throw new SaveError(409,'槽位已更新，保存冲突。请重新查看后再决定是否覆盖')
   const next=revision+1
   this.db.prepare('INSERT INTO save_slots(slot,revision,payload,request_id,request_hash) VALUES(?,?,?,?,?) ON CONFLICT(slot) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,request_id=excluded.request_id,request_hash=excluded.request_hash').run(slot,next,payload,requestId,hash)
   this.db.exec('COMMIT');return {slot,revision:next,snapshot}
  }catch(error){this.db.exec('ROLLBACK');throw error}
 }
 close(){this.db.close()}
}
