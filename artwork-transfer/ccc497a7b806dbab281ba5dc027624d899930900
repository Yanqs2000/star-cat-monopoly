import { afterEach,expect,it,vi } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController } from '../../src/modern/features/game/controller'
afterEach(()=>vi.useRealTimers())
const scheduler={now:()=>Date.now(),setTimeout:(cb:()=>void,ms:number)=>setTimeout(cb,ms),clearTimeout:(h:unknown)=>clearTimeout(h as ReturnType<typeof setTimeout>)}
function entry(){const g=createGame([1,2,3,4],1);g.world.markers={};g.players[0]!.position={column:3,row:25};g.tickets[1]=9;g.phase='landed';g.continuation='handle-landing';return g}
it('真实投注地点只扣现有9券，素材等待/暂停禁操作，确认/恢复不重复扣券或开奖',()=>{
 vi.useFakeTimers();const c=createGameController(entry(),{scheduler,awaitActivityAssets:true})
 expect(c.state.interaction).toMatchObject({kind:'ludo',game:{stage:'betting',remaining:1,debit:9}});expect(c.state.tickets[1]).toBe(0)
 expect(c.placeWager(7)).toBe(false);c.readyActivity('ludo-betting');expect(c.placeWager(7)).toBe(true);expect(c.placeWager(7)).toBe(false)
 c.setPaused(true);expect(c.confirmWagers()).toBe(false);c.setPaused(false);expect(c.confirmWagers()).toBe(true);expect(c.confirmWagers()).toBe(false)
 c.readyActivity('ludo-game');c.setSpeed(2);vi.advanceTimersByTime(450);c.setPaused(true)
 const saved=structuredClone(c.state);c.dispose();const restored=createGameController(saved,{scheduler,awaitActivityAssets:true})
 vi.advanceTimersByTime(1000);expect(restored.state).toEqual(saved)
 restored.readyActivity('ludo-game');vi.advanceTimersByTime(6500)
 expect(restored.state.interaction).toMatchObject({kind:'notice',notice:{receipt:{kind:'ludo',sourceAmount:10}}})
 const tickets=restored.state.tickets[1],rng=restored.state.rngState
 expect(restored.confirmWagers()).toBe(false);vi.advanceTimersByTime(1000);expect(restored.state.tickets[1]).toBe(tickets);expect(restored.state.rngState).toBe(rng)
 restored.dispose()
})
it('已开奖入账后重建同阶段，不再次加券，2倍速不加速骰子或结果窗口',()=>{
 vi.useFakeTimers();const c=createGameController(entry(),{scheduler});c.placeWager(7);c.confirmWagers();c.setSpeed(2)
 vi.advanceTimersByTime(800);expect(c.state.interaction).toMatchObject({game:{stage:'rolling'}})
 vi.advanceTimersByTime(600);expect(c.state.interaction).toMatchObject({game:{stage:'payout',paid:true}})
 const saved=structuredClone(c.state),tickets=saved.tickets[1];c.dispose()
 const r=createGameController(saved,{scheduler});vi.advanceTimersByTime(5000)
 expect(r.state.tickets[1]).toBe(tickets);expect(r.state.interaction?.kind).toBe('notice');r.dispose()
})
