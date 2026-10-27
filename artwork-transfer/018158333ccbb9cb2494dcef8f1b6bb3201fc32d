import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { SaveStore } from '../../server/store'
import { createGame } from '../../src/modern/features/game/setup'
import { createSnapshot } from '../../src/modern/features/saves/snapshot'
const dirs:string[]=[];const stores:SaveStore[]=[]
function store(path?:string){if(!path){const dir=mkdtempSync(join(tmpdir(),'star-cat-save-'));dirs.push(dir);path=join(dir,'saves.sqlite')}const s=new SaveStore(path);stores.push(s);return s}
const now='2026-10-04T08:40:00.000Z'
function snap(){return createSnapshot(createGame([1],102),[1],{speed:2,paused:false},now,now)}
afterEach(()=>{for(const s of stores.splice(0))s.close();for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true})})
describe('真实SQLite手动槽',()=>{
 it('三个槽位独立，关闭重开SQLite恢复完整状态及修订号',()=>{
  const s=store();expect(s.list().map(r=>[r.slot,r.revision])).toEqual([[1,0],[2,0],[3,0]])
  const value=snap();expect(s.save(2,0,'req-00000001',value)).toMatchObject({slot:2,revision:1,snapshot:value})
  expect(s.read(1)).toBeNull();const path=s.path;s.close();stores.splice(stores.indexOf(s),1)
  const reopened=store(path);expect(reopened.read(2)).toMatchObject({revision:1,snapshot:value})
 })
 it('同一数据库两实例使用过期修订号只能一方成功',()=>{
  const a=store();const b=store(a.path);a.save(1,0,'req-00000001',snap())
  expect(()=>b.save(1,0,'req-00000002',snap())).toThrow(/冲突/);expect(b.read(1)?.revision).toBe(1)
 })
 it('丢失响应后手动重试同一请求不再写入，不同内容与延迟旧请求不能覆盖',()=>{
  const s=store();const value=snap();s.save(1,0,'req-00000001',value)
  expect(s.save(1,0,'req-00000001',value).revision).toBe(1)
  const other=snap();other.state.players[0]!.cash=20
  expect(()=>s.save(1,0,'req-00000001',other)).toThrow()
  s.save(1,1,'req-00000002',other)
  expect(()=>s.save(1,0,'req-00000001',value)).toThrow(/冲突/)
  expect(s.read(1)?.snapshot.state.players[0]!.cash).toBe(20)
 })
 it('真实SQLite写入被中断时旧槽内容/修订号保留，之后可重试',()=>{
  const s=store();const value=snap();s.save(3,0,'req-00000001',value)
  const db=new DatabaseSync(s.path);db.exec("CREATE TRIGGER fail_write BEFORE UPDATE ON save_slots BEGIN SELECT RAISE(ABORT,'disk failure'); END;")
  const other=snap();other.state.players[0]!.cash=50
  expect(()=>s.save(3,1,'req-00000002',other)).toThrow();expect(s.read(3)).toMatchObject({revision:1,snapshot:value})
  db.exec('DROP TRIGGER fail_write');db.close();expect(s.save(3,1,'req-00000002',other).revision).toBe(2)
 })
 it('非法/损坏快照不入账，非法槽号不能越界创建',()=>{
  const s=store();const value=snap();value.state.rngState=-1
  expect(()=>s.save(1,0,'req-00000001',value)).toThrow();expect(s.read(1)).toBeNull()
  expect(()=>s.save(4,0,'req-00000002',snap())).toThrow();expect(s.list()).toHaveLength(3)
 })
})
