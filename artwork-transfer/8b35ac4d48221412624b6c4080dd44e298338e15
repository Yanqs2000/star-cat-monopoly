import { describe, expect, it } from 'vitest'
import { buildPlayerPoses, interactionVisualPlan, reactionManifestUrl } from '../../src/modern/features/game/game-visuals'
import { createGame } from '../../src/modern/features/game/setup'

describe('3A 对局视觉投影', () => {
  it('角色1的兼容行走清单路径不会污染反馈素材路径', () => {
    expect(reactionManifestUrl(1)).toBe('assets/characters/1/reactions/manifest.json')
    expect(reactionManifestUrl(12)).toBe('assets/characters/12/reactions/manifest.json')
  })

  it('住院或拘留角色隐藏，受伤角色保留可见，神灵覆盖层来自真实状态', () => {
    const game = createGame([1, 2, 3, 4], 0, 1)
    game.world.statuses[1] = { state: 3, days: 2, godId: 10, godDays: 6 }
    game.world.statuses[2] = { state: 2, days: 1, godId: null, godDays: 0 }
    game.world.statuses[3] = { state: 9, days: 2, godId: 4, godDays: 3 }

    expect(buildPlayerPoses(game)).toMatchObject([
      { playerId: 1, visible: false, godId: 10 },
      { playerId: 2, visible: false, godId: null },
      { playerId: 3, visible: true, godId: 4 },
      { playerId: 4, visible: true, godId: null },
    ])
  })

  it('飞弹和地雷反馈只描述视觉，不重复结算规则', () => {
    expect(interactionVisualPlan({
      kind: 'world', playerId: 1,
      worldEvent: { kind: 'missile-fired', playerId: 1, affectedCellIds: [77], affectedPlayerIds: [2], cardIds: [] },
    })).toEqual({
      reactions: [{ playerId: 1, name: 'happy' }, { playerId: 2, name: 'hurt' }],
      effects: [{ clipId: 'rocket', cellId: 77 }, { clipId: 'explosion', cellId: 77 }],
    })
    expect(interactionVisualPlan({
      kind: 'world', playerId: 2,
      worldEvent: { kind: 'mine-triggered', playerId: 2, affectedCellIds: [41], affectedPlayerIds: [2], cardIds: [] },
    })).toEqual({
      reactions: [{ playerId: 2, name: 'hurt' }],
      effects: [{ clipId: 'explosion', cellId: 41 }],
    })
  })

  it('奖励、损失和失败各选择对应原角色反馈及获得特效', () => {
    expect(interactionVisualPlan({
      kind: 'luck', playerId: 1, amount: -1000,
      luckEvent: { id: 28, kind: 'cash', description: '捐款', sourceAmount: 1000, amount: -1000, correction: 'B-01' },
    })).toEqual({ reactions: [{ playerId: 1, name: 'sad' }], effects: [] })
    expect(interactionVisualPlan({ kind: 'card-draw', playerId: 1, cardId: 5 })).toEqual({
      reactions: [{ playerId: 1, name: 'happy' }],
      effects: [{ clipId: 'card-gain', playerId: 1 }],
    })
    expect(interactionVisualPlan({ kind: 'tickets', playerId: 1, amount: 30 })).toEqual({
      reactions: [{ playerId: 1, name: 'happy' }],
      effects: [{ clipId: 'ticket-gain', playerId: 1 }],
    })
    expect(interactionVisualPlan({ kind: 'card', playerId: 1, status: 'invalid-target' })).toEqual({
      reactions: [{ playerId: 1, name: 'sad' }], effects: [],
    })
  })
})
