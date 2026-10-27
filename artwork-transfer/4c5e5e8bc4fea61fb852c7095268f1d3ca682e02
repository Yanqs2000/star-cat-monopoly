import { expect,it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as portal from '../../src/modern/features/game/portal'
import { createGame } from '../../src/modern/features/game/setup'
import { randomInt } from '../../src/modern/features/game/random'
it('魔法门地图按原初始化50抽签并按受控原版逆创建顺序推进头像随机', () => {
  const rule=portal as unknown as Record<string,(...args:any[])=>any>
  expect(typeof rule.createPortalHeads).toBe('function')
  const game=createGame([1,2,3,4],1);game.rngState=1
  const initial=rule.createPortalHeads!(game)
  let rng=1
  const expected=game.players.map(player=>{const draw=randomInt(rng,50);rng=draw.nextState;return {playerId:player.id,t:draw.value,phase:0,alpha:100}})
  expect(initial.heads).toEqual(expected)
  expect(initial.rngState).toBe(rng)
  const evidence=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../docs/modernization/evidence/portal-heads-runtime.json'),'utf8'))
  expect(evidence.samples.slice(0,4)).toEqual([4,3,2,1])
  const before=initial.heads.map((head:{playerId:number})=>({...head,t:0}))
  const result=rule.advancePortalHeads!(before,rng)
  for(let i=0;i<4;i++)rng=randomInt(rng,40).nextState
  expect(result.rngState).toBe(rng)
  expect(result.heads.map((head:{playerId:number;t:number})=>[head.playerId,head.t])).toEqual([[1,1],[2,1],[3,1],[4,1]])
  game.world.statuses[3]!.state=9
  expect(rule.createPortalHeads!(game).heads.map((head:{playerId:number})=>head.playerId)).toEqual([1,2,4])
})

it('原头像淡出21帧、隐藏阶段random10、淡入21帧，低计数仍消费装饰抽签', () => {
  const rule=portal as unknown as Record<string,(...args:any[])=>any>
  expect(typeof rule.advancePortalHeads).toBe('function')
  let state=rule.advancePortalHeads!([{playerId:1,phase:0,t:89,alpha:100}],1)
  expect(state.heads[0]).toMatchObject({phase:1,t:0,alpha:100})
  for(let i=0;i<21;i++)state=rule.advancePortalHeads!(state.heads,state.rngState)
  expect(state.heads[0]).toMatchObject({phase:2,t:0,alpha:0})
  const draw=randomInt(state.rngState,10)
  state=rule.advancePortalHeads!(state.heads,state.rngState)
  expect(state.rngState).toBe(draw.nextState)
  expect(state.heads[0]).toMatchObject({phase:2,t:1,alpha:0})
  while(state.heads[0].phase===2)state=rule.advancePortalHeads!(state.heads,state.rngState)
  for(let i=0;i<21;i++)state=rule.advancePortalHeads!(state.heads,state.rngState)
  expect(state.heads[0]).toMatchObject({phase:0,t:0,alpha:100})
})
