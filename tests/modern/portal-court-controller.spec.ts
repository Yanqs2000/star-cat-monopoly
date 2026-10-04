import { afterEach, expect, it, vi } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController, type GameController } from '../../src/modern/features/game/controller'
import { randomInt } from '../../src/modern/features/game/random'
const dormantClock = { scheduler: { now: () => 0, setTimeout: () => 0, clearTimeout: () => {} } }
afterEach(()=>vi.useRealTimers())
const clock={now:()=>Date.now(),setTimeout:(cb:()=>void,ms:number)=>setTimeout(cb,ms),clearTimeout:(handle:unknown)=>clearTimeout(handle as ReturnType<typeof setTimeout>)}
type ActivityController = GameController & {
  choosePortal(destination: number): boolean
  chooseCourtTarget(playerId: number): boolean
  chooseCourtCase(caseId: number): boolean
}
function landing(position: { column: number; row: number }) {
  const game = createGame([1,2,3,4],1)
  game.players[0]!.position=position
  game.world.markers={}
  game.phase='landed';game.continuation='handle-landing'
  return game
}

it('魔法门自然地点提供四站/放弃，重复选择和恢复不重复转移/抽签', () => {
  const game=landing({column:31,row:7})
  const c=createGameController(game,dormantClock) as ActivityController
  expect(c.state.interaction).toMatchObject({kind:'portal',stage:'choice'})
  expect(c.choosePortal(2)).toBe(true)
  const rng=c.state.rngState
  expect(c.state.players[0]!.position).toEqual({column:32,row:28})
  expect(c.choosePortal(3)).toBe(false)
  const saved=structuredClone(c.state);c.dispose()
  const restored=createGameController(saved,dormantClock) as ActivityController
  expect(restored.choosePortal(4)).toBe(false)
  expect(restored.state.rngState).toBe(rng)
  expect(restored.state.players[0]!.position).toEqual({column:32,row:28})
  restored.dispose()
})

it('AI法院两个60逻辑帧阶段分别抽目标/案件，恢复后不再次抽签', () => {
  vi.useFakeTimers()
  const game=landing({column:36,row:10})
  game.players[0]!.controller='ai'
  game.rngState=1
  const targetDraw=randomInt(1,3),caseDraw=randomInt(targetDraw.nextState,3),judgement=randomInt(caseDraw.nextState,101)
  const c=createGameController(game,{scheduler:clock})
  expect(c.state.interaction).toMatchObject({kind:'court',stage:'target',targetId:[2,3,4][targetDraw.value]})
  expect(c.state.rngState).toBe(targetDraw.nextState)
  c.setSpeed(2)
  vi.advanceTimersByTime(2050)
  expect(c.state.interaction).toMatchObject({kind:'court',stage:'case',caseId:caseDraw.value})
  expect(c.state.rngState).toBe(caseDraw.nextState)
  const saved=structuredClone(c.state);c.dispose()
  const restored=createGameController(saved,{scheduler:clock})
  vi.advanceTimersByTime(2050)
  expect(restored.state.interaction).toMatchObject({kind:'court',stage:'judgement',roll:judgement.value})
  expect(restored.state.rngState).toBe(judgement.nextState)
  restored.dispose()
})

it('法院判决等待40帧独立于原说明框快进，送拘留恢复不重抽判决', () => {
  vi.useFakeTimers()
  const game=landing({column:36,row:10});game.rngState=1
  const c=createGameController(game,{scheduler:clock,awaitActivityAssets:true})
  c.readyActivity('court-target');vi.advanceTimersByTime(40)
  expect(c.chooseCourtTarget(2)).toBe(true)
  c.readyActivity('court-case');vi.advanceTimersByTime(40)
  expect(c.chooseCourtCase(0)).toBe(true)
  c.setSpeed(2)
  expect(c.readyActivity('court-verdict')).toBe(true)
  vi.advanceTimersByTime(500)
  expect(c.state.interaction).toMatchObject({stage:'judgement',verdictFrame:36,presentation:{frame:16}})
  vi.advanceTimersByTime(900)
  expect(c.state.interaction).toMatchObject({stage:'transfer',verdictFrame:45,presentation:{clipId:'car1',frame:1}})
  c.readyActivity('car1');vi.advanceTimersByTime(500);c.setPaused(true)
  const saved=structuredClone(c.state);const rng=c.state.rngState;c.dispose()
  const restored=createGameController(saved,{scheduler:clock,awaitActivityAssets:true})
  expect(restored.state).toEqual(saved)
  restored.readyActivity('car1');vi.advanceTimersByTime(4200)
  expect(restored.state.interaction).toMatchObject({stage:'holding'})
  expect(restored.state.rngState).toBe(randomInt(randomInt(rng,1000).nextState,10).nextState) // courtz inner mood once
  expect(restored.state.world.statuses[2]).toMatchObject({state:2,days:2})
  restored.dispose()
})

it('魔法门头像视觉随机在素材等待/暂停/重建时冻结且不推进规则随机流', () => {
  vi.useFakeTimers()
  const game=landing({column:31,row:7});game.rngState=1
  const c=createGameController(game,{scheduler:clock,awaitActivityAssets:true})
  let initialRng=1
  for(let i=0;i<4;i++)initialRng=randomInt(initialRng,50).nextState
  expect(c.state.rngState).toBe(initialRng)
  vi.advanceTimersByTime(500)
  expect(c.state.rngState).toBe(initialRng)
  expect(c.choosePortal(5)).toBe(false)
  c.readyActivity('station');vi.advanceTimersByTime(130)
  expect(c.state.rngState).toBe(initialRng)
  expect(c.state.interaction).toMatchObject({kind:'portal',visualRngState:expect.any(Number)})
  expect((c.state.interaction as Extract<typeof c.state.interaction,{kind:'portal'}>).visualRngState).not.toBe(initialRng)
  c.setPaused(true)
  const saved=structuredClone(c.state);c.dispose()
  const restored=createGameController(saved,{scheduler:clock,awaitActivityAssets:true})
  vi.advanceTimersByTime(1000)
  expect(restored.state).toEqual(saved)
  expect(restored.choosePortal(5)).toBe(false)
  expect(restored.readyActivity('station')).toBe(true)
  let rng=restored.state.rngState
  expect(restored.choosePortal(5)).toBe(true)
  rng=randomInt(randomInt(rng,1000).nextState,10).nextState // source mood_pg(8)
  vi.advanceTimersByTime(2000)
  expect(restored.state.rngState).toBe(rng)
  restored.dispose()
})

it('魔法门头像动画等待时长不改变转运方向或权威规则随机流', () => {
  vi.useFakeTimers()
  const transferAfter = (waitMs: number) => {
    const game=landing({column:31,row:7});game.rngState=1
    const c=createGameController(game,{scheduler:clock,awaitActivityAssets:true}) as ActivityController
    expect(c.readyActivity('station')).toBe(true)
    vi.advanceTimersByTime(waitMs)
    expect(c.choosePortal(2)).toBe(true)
    const result={
      direction:c.state.players[0]!.direction,
      position:c.state.players[0]!.position,
      rngState:c.state.rngState,
    }
    c.dispose()
    return result
  }
  expect(transferAfter(100)).toEqual(transferAfter(1_000))
})

it('魔法门关窗时保留原头像转场，但不把装饰随机写入规则流', () => {
  const game=landing({column:31,row:7});game.rngState=1
  const c=createGameController(game,dormantClock)
  let expected=c.state.rngState
  expected=randomInt(randomInt(expected,1000).nextState,10).nextState // source mood_pg(8)
  expect(c.choosePortal(5)).toBe(true)
  expect(c.state.rngState).toBe(expected)
  c.dispose()
})

it('AI帐篷沿用原烟雾和空业务，等待/恢复后唯一重新放置再处理同一地块', () => {
  vi.useFakeTimers()
  const game=landing({column:6,row:32});game.players[0]!.controller='ai';game.world.markers={1:1}
  const rng=game.rngState
  const c=createGameController(game,{scheduler:clock,awaitActivityAssets:true})
  expect(c.state.interaction).toMatchObject({kind:'npc-opening',npcId:1,presentation:{clipId:'fog'}})
  expect(c.state.world.markers[1]).toBe(1)
  c.readyActivity('fog');vi.advanceTimersByTime(200);c.setPaused(true)
  const saved=structuredClone(c.state);c.dispose()
  const restored=createGameController(saved,{scheduler:clock,awaitActivityAssets:true})
  vi.advanceTimersByTime(1000);expect(restored.state).toEqual(saved)
  restored.readyActivity('fog');vi.advanceTimersByTime(600)
  expect(restored.state.world.markers[1]).toBeUndefined()
  expect(Object.values(restored.state.world.markers).filter(value=>value===1)).toHaveLength(1)
  expect(restored.state.rngState).toBe(randomInt(rng,1).nextState)
  expect(restored.state.players[0]!.cash).toBe(game.players[0]!.cash)
  expect(restored.state.tickets[1]).toBe(game.tickets[1])
  expect(restored.state.phase).toBe('property-decision')
  restored.dispose()
})
it('无合法被告的法院仍播放原show2，快进不产生判决或费用',()=>{
  vi.useFakeTimers()
  const game=landing({column:36,row:10})
  for(const id of [2,3,4])game.world.statuses[id]!.state=3
  const c=createGameController(game,{scheduler:clock,awaitActivityAssets:true})
  expect(c.state.interaction).toMatchObject({kind:'notice',notice:{message:'court-no-targets'},presentation:{clipId:'show2'}})
  expect(c.acknowledgeInteraction()).toBe(false)
  c.setSpeed(2);c.readyActivity('show2');vi.advanceTimersByTime(1100)
  expect(c.state.interaction).not.toHaveProperty('presentation')
  expect(c.state.players.map(player=>[player.cash,player.deposit])).toEqual(game.players.map(player=>[player.cash,player.deposit]))
  expect(c.state.rngState).toBe(game.rngState)
  c.dispose()
})

it('法院无合法目标仅提示；有目标先选被告再选案件，暂停/重复/恢复不再次判决', () => {
  const game=landing({column:36,row:10})
  const c=createGameController(game,dormantClock) as ActivityController
  expect(c.state.interaction).toMatchObject({kind:'court',stage:'target'})
  expect(c.chooseCourtTarget(1)).toBe(false)
  expect(c.chooseCourtTarget(2)).toBe(true)
  expect(c.state.interaction).toMatchObject({kind:'court',stage:'case',targetId:2})
  c.setPaused(true)
  expect(c.chooseCourtCase(0)).toBe(false)
  c.setPaused(false)
  const draw=randomInt(c.state.rngState,101)
  expect(c.chooseCourtCase(0)).toBe(true)
  expect(c.state.interaction).toMatchObject({kind:'court',stage:'judgement',roll:draw.value})
  expect(c.chooseCourtCase(1)).toBe(false)
  const saved=structuredClone(c.state);c.dispose()
  const restored=createGameController(saved,dormantClock) as ActivityController
  expect(restored.chooseCourtCase(2)).toBe(false)
  expect(restored.state.rngState).toBe(draw.nextState)
  restored.dispose()
  for(const id of [2,3,4])game.world.statuses[id]!.state=3
  const empty=createGameController(game,dormantClock)
  expect(empty.state.interaction).toMatchObject({kind:'notice',notice:{message:'court-no-targets'}})
  empty.dispose()
})
