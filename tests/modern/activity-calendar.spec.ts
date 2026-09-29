import { afterEach,expect,it,vi } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController } from '../../src/modern/features/game/controller'
afterEach(()=>vi.useRealTimers())
const scheduler={now:()=>Date.now(),setTimeout:(cb:()=>void,ms:number)=>setTimeout(cb,ms),clearTimeout:(handle:unknown)=>clearTimeout(handle as ReturnType<typeof setTimeout>)}
function atLastPlayer(day:number,position:{column:number;row:number}) {
 const game=createGame([1,2,3,4],1,day===30?3:4,{year:2026,month:day===30?9:10,day})
 game.activePlayerIndex=3;game.players[3]!.position=position;game.world.markers={};game.phase='landed';game.continuation='handle-landing'
 return game
}
it('彩票最后一人跨月：开奖不推进日期，确认才过日/改股价，重复确认不重复执行',()=>{
 vi.useFakeTimers();const game=atLastPlayer(30,{column:6,row:24}),c=createGameController(game,{scheduler});c.placeWager(7);c.confirmWagers();vi.advanceTimersByTime(8000)
 expect(c.state.interaction).toMatchObject({kind:'notice',notice:{receipt:{kind:'ludo'}}});expect(c.state.world).toMatchObject({year:2026,month:9,day:30,elapsedDays:0})
 const saved=structuredClone(c.state),tickets=c.state.tickets[4];c.dispose();const restored=createGameController(saved,{scheduler})
 expect(restored.acknowledgeInteraction()).toBe(true);expect(restored.acknowledgeInteraction()).toBe(false)
 expect(restored.state.world).toMatchObject({year:2026,month:10,day:1,elapsedDays:1})
 expect(restored.state.finance.entries.filter(entry=>entry.kind==='stock-price')).toHaveLength(12)
 expect(restored.state.tickets[4]).toBe(tickets);restored.dispose()
})
it('接物与神灵/信用月结：计分期间神灵天数及日期保持，结束后月结一次再推进',()=>{
 vi.useFakeTimers();const game=atLastPlayer(1,{column:38,row:16})
 game.world.statuses[4]={state:0,days:0,godId:2,godDays:3};game.players[0]!.deposit=10000;game.credit[1]={score:100,used:2000,available:98000}
 const inventory=structuredClone(game.inventories[1]);const c=createGameController(game,{scheduler});c.setSpeed(2);vi.advanceTimersByTime(35000)
 expect(c.state.interaction).toMatchObject({kind:'notice',notice:{receipt:{kind:'carnival'}}});expect(c.state.world.day).toBe(1);expect(c.state.world.statuses[4]).toMatchObject({godId:2,godDays:3})
 expect(c.acknowledgeInteraction()).toBe(true);expect(c.acknowledgeInteraction()).toBe(false)
 expect(c.state.interaction).toMatchObject({kind:'monthly-settlement'});expect(c.state.players[0]!.deposit).toBe(8800)
 const saved=structuredClone(c.state),tickets=saved.tickets[4];c.dispose();const restored=createGameController(saved,{scheduler})
 expect(restored.state.players[0]!.deposit).toBe(8800);restored.setPaused(true);expect(restored.acknowledgeMonthly()).toBe(false);restored.setPaused(false)
 expect(restored.acknowledgeMonthly()).toBe(true);expect(restored.acknowledgeMonthly()).toBe(false);vi.advanceTimersByTime(550);expect(restored.state.world).toMatchObject({month:10,day:2,elapsedDays:1})
 expect(restored.state.finance.entries.filter(e=>e.kind==='credit-monthly-payment')).toHaveLength(1);expect(restored.state.finance.entries.filter(e=>e.kind==='stock-price')).toHaveLength(12)
 expect(restored.state.inventories[1]).toEqual(inventory);expect(restored.state.tickets[4]).toBe(tickets);restored.dispose()
})
