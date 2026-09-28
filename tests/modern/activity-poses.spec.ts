import { expect,it } from 'vitest'
import { buildPlayerPoses } from '../../src/modern/features/game/game-visuals'
import { createGame } from '../../src/modern/features/game/setup'
import { createPortalFlight } from '../../src/modern/features/game/portal'
import { prepareWorldTurn } from '../../src/modern/features/game/world-cards'
import * as visuals from '../../src/modern/features/game/game-visuals'
it('法院的权威拘留已结算时，原演员在车辆56帧前保留起点，113帧才隐藏', () => {
  const game=createGame([1,2,3,4],1)
  game.players[1]!.position={column:21,row:41}
  game.world.statuses[2]!.state=2;game.world.statuses[2]!.days=2
  game.interaction={kind:'court',playerId:1,stage:'judgement',jailedPlayerId:2,transferOrigin:{column:20,row:16}}
  expect(buildPlayerPoses(game)[1]).toMatchObject({visible:true,position:{column:20,row:16}})
  game.interaction={...game.interaction,stage:'transfer',presentation:{clipId:'car1',frame:56,totalFrames:113}}
  expect(buildPlayerPoses(game)[1]).toMatchObject({visible:true,position:{column:21,row:41}})
  game.interaction={...game.interaction,presentation:{clipId:'car1',frame:113,totalFrames:113}}
  expect(buildPlayerPoses(game)[1]?.visible).toBe(false)
})
it('恶犬车辆前48帧保留原演员，其后隐藏；医院镜头只在111帧结束后切换', () => {
  const game=createGame([1,2,3,4],1)
  game.players[0]!.position={column:19,row:1};game.world.statuses[1]!.state=3;game.world.statuses[1]!.days=3
  game.interaction={kind:'notice',playerId:1,resume:'end-turn',notice:{kind:'world',message:'npc-encountered',eventKind:'npc-encountered',npcId:9,affectedCellIds:[1]},presentation:{clipId:'car2',frame:47,totalFrames:111}}
  expect(buildPlayerPoses(game)[0]).toMatchObject({visible:true,position:{column:6,row:32}})
  game.interaction={...game.interaction,presentation:{clipId:'car2',frame:48,totalFrames:111}}
  expect(buildPlayerPoses(game)[0]?.visible).toBe(false)
  const helper=(visuals as unknown as Record<string,unknown>).activityCameraTarget
  expect(typeof helper).toBe('function')
  const target=helper as (value:typeof game)=>unknown
  expect(target(game)).toEqual({column:6,row:32})
  game.interaction={...game.interaction,presentation:undefined}
  expect(target(game)).toEqual({column:19,row:1})
})
it('魔法门飞行时隐藏普通角色，保留唯一权威终点', () => {
  const game=createGame([1,2,3,4],1)
  game.players[0]!.position={column:32,row:28}
  game.interaction={kind:'portal',playerId:1,stage:'flight',flight:createPortalFlight({column:31,row:7},{column:32,row:28})}
  expect(buildPlayerPoses(game)[0]).toMatchObject({visible:false,position:{column:32,row:28}})
})
it('NPC权威重新放置已提交时，画面只在源遭遇完成后显示新标记；帐篷15帧移除旧图', () => {
  const game=createGame([1,2,3,4],1)
  game.world.markers={10:12,20:13}
  game.interaction={kind:'notice',playerId:1,resume:'after-god',notice:{kind:'world',message:'npc-encountered',eventKind:'npc-encountered',npcId:12},presentation:{clipId:'trait-12',frame:30,totalFrames:60}}
  const helper=(visuals as unknown as Record<string,unknown>).buildWorldVisual
  expect(typeof helper).toBe('function')
  const project=helper as (value:typeof game)=>typeof game.world
  expect(project(game).markers).toEqual({20:13})
  expect(game.world.markers).toEqual({10:12,20:13})
  game.interaction={...game.interaction,presentation:undefined}
  expect(project(game)).toBe(game.world)
  game.world.markers={1:1,20:13}
  game.interaction={kind:'ticket-exchange',playerId:1,mode:'sell',npcCellId:1,presentation:{clipId:'fog',frame:14,totalFrames:19}}
  expect(project(game).markers[1]).toBe(1)
  game.interaction={...game.interaction,presentation:{clipId:'fog',frame:15,totalFrames:19}}
  expect(project(game).markers).toEqual({20:13})
})
it.each([2,3] as const)('拘束状态%s到期按原setfree.brow7重入场', state=>{
  const game=createGame([1,2,3,4],1)
  game.world.statuses[1]!.state=state;game.world.statuses[1]!.days=0
  const release=prepareWorldTurn(game,1)
  const plan=visuals.interactionVisualPlan({kind:'restriction',playerId:1,worldEvent:release.event!})
  expect(plan.reactions).toEqual([{playerId:1,name:'ready'}])
})
