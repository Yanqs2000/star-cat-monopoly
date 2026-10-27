import { afterEach, expect, it, vi } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController } from '../../src/modern/features/game/controller'
import { courtTargets } from '../../src/modern/features/game/court'
const scheduler={now:()=>Date.now(),setTimeout:(f:()=>void,ms:number)=>setTimeout(f,ms),clearTimeout:(h:unknown)=>clearTimeout(h as ReturnType<typeof setTimeout>)}
const options={scheduler,landingDurationMs:10,aiThinkDurationMs:10}
afterEach(()=>vi.useRealTimers())

it('人类破产结果恢复只清算一次，确认后跳过淘汰者并继续',()=>{
 vi.useFakeTimers();const game=createGame([1,2,3,4],1)
 game.phase='landed';game.continuation='finish-turn';game.players[0]!.cash=0;game.players[0]!.deposit=0
 const c=createGameController(game,options);vi.advanceTimersByTime(10)
 expect(c.state.interaction?.kind).toBe('bankruptcy');expect(c.state.eliminatedPlayerIds).toEqual([1])
 const saved=structuredClone(c.state);c.dispose()
 const r=createGameController(saved,options);r.setSpeed(2);r.setPaused(true)
 expect(r.acknowledgeBankruptcy()).toBe(false);r.setPaused(false)
 expect(r.acknowledgeBankruptcy()).toBe(true);expect(r.acknowledgeBankruptcy()).toBe(false)
 expect(r.state.activePlayerIndex).toBe(1);expect(r.state.bankruptcyReceipts).toHaveLength(1)
 expect(r.roll(1)).toBe(true);r.dispose()
})
it('最后一位真人淘汰判负，终局恢复后所有业务命令失效',()=>{
 vi.useFakeTimers();const game=createGame([1],1)
 game.phase='landed';game.continuation='finish-turn';game.players[0]!.cash=0;game.players[0]!.deposit=0
 const c=createGameController(game,options);vi.advanceTimersByTime(10);c.acknowledgeBankruptcy()
 expect(c.state).toMatchObject({phase:'ended',outcome:{kind:'defeat',winnerId:null}})
 const saved=structuredClone(c.state);c.dispose();const r=createGameController(saved,options)
 vi.advanceTimersByTime(100000)
 expect(r.state).toEqual(saved);expect(r.roll()).toBe(false);expect(r.requestControl(2,'human')).toBe(false);r.dispose()
})
it('单一托管幸存者判赢，月初仍先月结再判赢',()=>{
 vi.useFakeTimers();const game=createGame([1,2,3,4],1,1,{year:2026,month:10,day:1})
 game.eliminatedPlayerIds=[1,2,3];game.activePlayerIndex=3;game.players[3]!.controller='autoplay'
 game.phase='landed';game.continuation='finish-turn'
 const c=createGameController(game,options);vi.advanceTimersByTime(10)
 expect(c.state.interaction?.kind).toBe('monthly-settlement')
 vi.advanceTimersByTime(20)
 expect(c.state).toMatchObject({phase:'ended',outcome:{kind:'victory',winnerId:4}})
 expect(c.state.world.day).toBe(1);c.dispose()
})
it('末尾两位淘汰后仍在最后存活者收尾月结一次并换日',()=>{
 vi.useFakeTimers();const game=createGame([1,2,3,4],1,1,{year:2026,month:10,day:1})
 game.eliminatedPlayerIds=[3,4];game.activePlayerIndex=1;game.phase='landed';game.continuation='finish-turn'
 const c=createGameController(game,options);vi.advanceTimersByTime(10)
 expect(c.state.interaction?.kind).toBe('monthly-settlement');c.acknowledgeMonthly();vi.advanceTimersByTime(10)
 expect(c.state.activePlayerIndex).toBe(0);expect(c.state.world.day).toBe(2);expect(c.state.round).toBe(2);c.dispose()
})
it('切换请求序列化保存，回合收尾生效，淘汰者不能接管',()=>{
 vi.useFakeTimers();const game=createGame([1],1)
 game.phase='landed';game.continuation='finish-turn';game.eliminatedPlayerIds=[4]
 const c=createGameController(game,options)
 expect(c.requestControl(1,'autoplay')).toBe(true);expect(c.requestControl(2,'human')).toBe(true)
 expect(c.requestControl(4,'human')).toBe(false);expect(c.state.players[0]!.controller).toBe('human')
 const saved=structuredClone(c.state);c.dispose();const r=createGameController(saved,options);vi.advanceTimersByTime(10)
 expect(r.state.players[0]!.controller).toBe('autoplay');expect(r.state.players[1]!.controller).toBe('human')
 expect(r.state.pendingControl).toEqual({});r.dispose()
})
it('医院/受伤与淘汰不混用，法院排除已淘汰目标',()=>{
 const game=createGame([1,2,3,4],1);game.eliminatedPlayerIds=[2]
 game.world.statuses[3]!.state=9
 expect(courtTargets(game,1)).toEqual([3,4])
})
it('原版月结后不重入本回合破产检查：月结产生负余额留待该玩家下次收尾',()=>{
 vi.useFakeTimers();const game=createGame([1,2,3,4],1,1,{year:2026,month:10,day:1})
 game.activePlayerIndex=3;game.phase='landed';game.continuation='finish-turn'
 game.players[3]!.cash=1;game.players[3]!.deposit=0;game.finance.loans[4]=2
 const c=createGameController(game,options);vi.advanceTimersByTime(10)
 expect(c.state.players[3]!.cash).toBe(-1);expect(c.state.interaction?.kind).toBe('monthly-settlement')
 c.acknowledgeMonthly();vi.advanceTimersByTime(10)
 expect(c.state.eliminatedPlayerIds).toEqual([]);expect(c.state.activePlayerIndex).toBe(0);c.dispose()
})
