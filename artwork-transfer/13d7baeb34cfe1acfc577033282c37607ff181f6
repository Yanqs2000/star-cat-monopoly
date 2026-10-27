import { describe, expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { settleBankruptcy } from '../../src/modern/features/game/lifecycle'
import { createSnapshot, parseSnapshot, canSaveGame } from '../../src/modern/features/saves/snapshot'
const now='2026-10-04T08:40:00.000Z'
function sample(){
 const game=createGame([12,2],102,0,{year:2026,month:10,day:4});game.rngState=0x12345678
 game.players[0]!.cash=4321;game.players[0]!.deposit=-100;game.pendingControl[2]='autoplay'
 game.properties[1]={ownerId:1,level:3};game.world.statuses[1]={state:0,days:0,godId:3,godDays:4}
 game.finance.loans[1]=10000;game.credit[1]={used:200,available:99800,score:80};game.lostAndFoundFunds=[900,900]
 return createSnapshot(game,[12,2],{speed:2,paused:true},now,now)
}
describe('新版手动快照',()=>{
 it('所有权威字段无丢失，快照与原局不共享可变对象',()=>{
  const snap=sample();const restored=parseSnapshot(JSON.parse(JSON.stringify(snap)))
  expect(restored.state).toEqual(snap.state);expect(restored.selection).toEqual([12,2])
  expect(restored.settings).toEqual({speed:2,paused:true});expect(restored.state.rngState).toBe(0x12345678)
  expect(restored.state.players[0]).toMatchObject({characterId:12,cash:4321,deposit:-100})
  const game=createGame([1],1);const detached=createSnapshot(game,[1],{speed:1,paused:false},now,now)
  game.players[0]!.cash=0;expect(detached.state.players[0]!.cash).toBe(100000)
 })
 const corruptions:Array<[string,(s:any)=>void]> = [
  ['unknown version',(s:any)=>s.formatVersion=2],['unknown rules',(s:any)=>s.rulesVersion='old'],
  ['missing field',(s:any)=>delete s.state.rngState],['unknown field',(s:any)=>s.state.shadowWallet={}],
  ['bad date',(s:any)=>s.state.world.day=32],['bad player ref',(s:any)=>s.state.properties[1].ownerId=99],
  ['duplicate seat',(s:any)=>s.state.players[1].id=1],['bad character',(s:any)=>s.state.players[0].characterId=13],
  ['bad RNG',(s:any)=>s.state.rngState=-1],['fractional stock',(s:any)=>s.state.finance.stocks[1].holdings[1].shares=.5],
  ['missing stock holding',(s:any)=>delete s.state.finance.stocks[1].holdings[4]],
  ['missing status',(s:any)=>delete s.state.world.statuses[4]],['bad CEO',(s:any)=>s.state.finance.stocks[1].ceoId=99],
  ['non finite',(s:any)=>s.state.players[0].cash=Infinity],['bad inventory',(s:any)=>s.state.inventories[1]=[999]],
  ['bad marker',(s:any)=>s.state.world.markers[99999]=2],['fractional turn',(s:any)=>s.state.round=.5],
  ['invalid active',(s:any)=>s.state.activePlayerIndex=5],['unsafe continuation',(s:any)=>s.state.continuation='finish-turn'],
  ['duplicate dead',(s:any)=>s.state.eliminatedPlayerIds=[3,3]],['bad timestamp',(s:any)=>s.savedAt='tomorrow'],
 ]
 it.each(corruptions)('拒绝%s快照',(_,corrupt)=>{const snap=sample();corrupt(snap);expect(()=>parseSnapshot(snap)).toThrow()})
 it('保存必须在稳定等待操作，移动/交互/AI/淘汰者不能保存',()=>{
  const game=createGame([1],1);expect(canSaveGame(game)).toBe(true)
  game.phase='moving';expect(canSaveGame(game)).toBe(false)
  expect(()=>createSnapshot(game,[1],{speed:1,paused:false},now,now)).toThrow()
  game.phase='awaiting-roll';game.players[0]!.controller='autoplay';expect(canSaveGame(game)).toBe(false)
  game.players[0]!.controller='human';game.eliminatedPlayerIds=[1];expect(canSaveGame(game)).toBe(false)
 })
 it('终局可保存，结束结果和清算只保留一次',()=>{
  let game=createGame([1],1);game.players[0]!.cash=0;game.players[0]!.deposit=0;game=settleBankruptcy(game,1)
  game.phase='ended';game.outcome={kind:'defeat',winnerId:null}
  const snap=createSnapshot(game,[1],{speed:1,paused:false},now,now)
  expect(parseSnapshot(snap).state.bankruptcyReceipts).toHaveLength(1)
  expect(parseSnapshot(snap).state.outcome).toEqual({kind:'defeat',winnerId:null})
 })
})
