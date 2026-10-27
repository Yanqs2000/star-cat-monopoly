import { afterEach,expect,it,vi } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController } from '../../src/modern/features/game/controller'
afterEach(()=>vi.useRealTimers())
const scheduler={now:()=>Date.now(),setTimeout:(cb:()=>void,ms:number)=>setTimeout(cb,ms),clearTimeout:(h:unknown)=>clearTimeout(h as ReturnType<typeof setTimeout>)}
function entry(){const g=createGame([1,2,3,4],1);g.world.markers={};g.players[0]!.position={column:38,row:16};g.phase='landed';g.continuation='handle-landing';return g}
it('游乐场实际入口素材等待、3秒倒数、20秒窗口不被2倍速缩短，暂停/半场重建不重抽',()=>{
 vi.useFakeTimers();const c=createGameController(entry(),{scheduler,awaitActivityAssets:true});c.setSpeed(2)
 expect(c.state.interaction).toMatchObject({kind:'carnival',game:{stage:'intro',frame:0}})
 vi.advanceTimersByTime(1000);expect(c.state.interaction).toMatchObject({game:{frame:0}})
 c.readyActivity('carnival-play');vi.advanceTimersByTime(3100);expect(c.state.interaction).toMatchObject({game:{stage:'play'}})
 c.setCarnivalInput({kind:'key',direction:-1});vi.advanceTimersByTime(800);c.setPaused(true)
 const saved=structuredClone(c.state);c.dispose();const r=createGameController(saved,{scheduler,awaitActivityAssets:true})
 vi.advanceTimersByTime(3000);expect(r.state).toEqual(saved);r.readyActivity('carnival-play');vi.advanceTimersByTime(1000)
 expect(r.state.interaction).toMatchObject({game:{stage:'play'}});r.dispose()
})
it('原计分场景只入账一次，恢复后结果确认结束地点且保持日期续办',()=>{
 vi.useFakeTimers();const c=createGameController(entry(),{scheduler});vi.advanceTimersByTime(35000)
 expect(c.state.interaction).toMatchObject({kind:'notice',notice:{receipt:{kind:'carnival'}}})
 const saved=structuredClone(c.state),tickets=saved.tickets[1];c.dispose();const r=createGameController(saved,{scheduler})
 vi.advanceTimersByTime(1000);expect(r.state.tickets[1]).toBe(tickets);expect(r.setCarnivalInput({kind:'key',direction:1})).toBe(false);r.dispose()
})

it('显示或主线程延迟不会拉长计时：固定逻辑补足实际经过的步数，暂停时间不算',()=>{
 let now=0;let next:(()=>void)|undefined
 const scheduler={now:()=>now,setTimeout:(cb:()=>void)=>{next=cb;return cb},clearTimeout:()=>{next=undefined}}
 const c=createGameController(entry(),{scheduler});now=1000;next!()
 expect(c.state.interaction).toMatchObject({game:{stage:'intro',frame:30}})
 c.setPaused(true);now+=10000;c.setPaused(false);now+=1000;next!()
 expect(c.state.interaction).toMatchObject({game:{frame:60}});c.dispose()
})

it('接物结果事件记录实际奖励，与唯一权威奖券差额及界面收据一致',()=>{
 vi.useFakeTimers();const game=entry(),events:unknown[]=[];const c=createGameController(game,{scheduler,onInteractionEvent:e=>events.push(e)})
 vi.advanceTimersByTime(35000);const i=c.state.interaction;if(i?.kind!=='notice')throw Error('未得到结果')
 expect(i.notice.receipt!.ticketDelta).toBe(c.state.tickets[1]! -game.tickets[1]!)
 expect(events).toEqual([expect.objectContaining({receipt:i.notice.receipt})]);c.dispose()
})
