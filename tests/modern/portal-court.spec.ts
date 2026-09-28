import { expect, it } from 'vitest'
import { createGame } from '../../src/modern/features/game/setup'
import { randomInt } from '../../src/modern/features/game/random'

import * as portalRules from '../../src/modern/features/game/portal'
import * as courtRules from '../../src/modern/features/game/court'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
function seedFor(size: number, wanted: number) {
  for (let seed = 0; seed < 100_000; seed++) if (randomInt(seed, size).value === wanted) return seed
  throw new Error('没有匹配种子')
}

it('原版东到南飞行保留1/20px坐标、承继缩放计数与42帧短程跳到目的地', () => {
  const rule = portalRules
  const evidence = JSON.parse(readFileSync(resolve(import.meta.dirname,'../../docs/modernization/evidence/portal-flight-runtime.json'),'utf8'))
  let flight = rule.createPortalFlight({column:31,row:7},{column:32,row:28})
  for (const row of evidence.samples.slice(0,41)) {
    flight = rule.advancePortalFlight(flight)
    expect([flight.x,flight.y,flight.scale,flight.stage,flight.stageFrames]).toEqual(row.slice(0,5))
  }
  flight = rule.advancePortalFlight(flight)
  expect(flight).toMatchObject({x:1792,y:1120,done:true,scale:55})
})

it('AI魔法门先random5选站，取消分支仅消费该次抽签', () => {
  for(const destination of [1,2,3,4,5]) {
    const game=createGame([1,2,3,4],1)
    game.players[0]!.position={column:31,row:7}
    game.rngState=seedFor(5,destination-1)
    const choice=randomInt(game.rngState,5)
    const result=portalRules.chooseAiPortal(game,1)
    expect(result.transferred).toBe(destination!==1&&destination!==5)
    expect(result.snapshot.rngState).toBe(destination===1||destination===5?choice.nextState:randomInt(choice.nextState,2).nextState)
  }
})

it('魔法门放弃、当前站与非法输入都不转移或消费出站抽签', async () => {
  const rule = portalRules
  const game = createGame([1,2,3,4],1)
  game.players[0]!.position = {column:31,row:7}
  for(const destination of [1,5,0,6,1.5]) {
    const result = rule.choosePortal(game,1,destination)
    expect(result.snapshot).toBe(game)
    expect(result.snapshot.rngState).toBe(game.rngState)
    expect(result.transferred).toBe(false)
  }
})

it.each([[1,31,7,[2,4]],[2,32,28,[1,3]],[3,9,35,[2,4]],[4,8,14,[1,3]]] as const)('魔法门%s保持原坐标与random2出站方向', async (destination,column,row,directions) => {
  const rule = portalRules
  for(const draw of [0,1]) {
    const game = createGame([1,2,3,4],1)
    game.players[0]!.position = destination === 1 ? {column:32,row:28} : {column:31,row:7}
    game.rngState = seedFor(2,draw)
    const source = structuredClone(game)
    const expected = randomInt(game.rngState,2)
    const result = rule.choosePortal(game,1,destination)
    expect(result.snapshot.players[0]).toMatchObject({position:{column,row},direction:directions[draw]})
    expect(result.snapshot.rngState).toBe(expected.nextState)
    expect(result.transferred).toBe(true)
    expect(game).toEqual(source)
  }
})

it('法院候选排除自己/住院/拘留/受伤，非法目标与案件不抽签', async () => {
  const rule = courtRules
  const game = createGame([1,2,3,4],1)
  game.world.statuses[2]!.state=2
  game.world.statuses[3]!.state=3
  expect(rule.courtTargets(game,1)).toEqual([4])
  game.world.statuses[4]!.state=9
  expect(rule.courtTargets(game,1)).toEqual([])
  for(const [target,caseId] of [[1,0],[2,0],[4,0],[3,5]]) {
    const result = rule.judgeCourt(game,1,target,caseId)
    expect(result.snapshot).toBe(game)
    expect(result.verdict).toBeNull()
    expect(result.error).toBeTruthy()
  }
})

it.each([[0,60,80,2],[1,50,75,3],[2,40,70,5]])('法院案件%s胜/和/败包含原阈值及实际刑期', async (caseId,low,high,days) => {
  const rule = courtRules
  for(const [roll,verdict,jailed] of [[low-1,'win',2],[low,'settle',null],[high,'settle',null],[high+1,'lose',1]] as const) {
    const game = createGame([1,2,3,4],1)
    game.rngState=seedFor(101,roll)
    const before=structuredClone(game)
    const result=rule.judgeCourt(game,1,2,caseId)
    expect(result).toMatchObject({verdict,roll,jailedPlayerId:jailed})
    expect(result.snapshot.rngState).toBe(randomInt(game.rngState,101).nextState)
    if(jailed !== null) {
      expect(result.snapshot.players[jailed-1]).toMatchObject({position:{column:21,row:41},direction:4})
      expect(result.snapshot.world.statuses[jailed]).toMatchObject({state:2,days:days+(jailed<=1?1:0)})
    }
    expect(result.snapshot.players.map((p: {cash:number;deposit:number}) => [p.cash,p.deposit])).toEqual(before.players.map(p=>[p.cash,p.deposit]))
    expect(game).toEqual(before)
  }
})

it('法院被告在原告座次之前加1天，之后不加，并保留神灵状态', async () => {
  const rule = courtRules
  const game = createGame([1,2,3,4],1)
  game.rngState=seedFor(101,0)
  game.world.statuses[1]!.godId=10
  game.world.statuses[1]!.godDays=6
  const before=rule.judgeCourt(game,3,1,2)
  expect(before.snapshot.world.statuses[1]).toEqual({state:2,days:6,godId:10,godDays:6})
  const after=rule.judgeCourt(game,3,4,2)
  expect(after.snapshot.world.statuses[4]).toMatchObject({state:2,days:5})
})
