import { describe, expect, it } from 'vitest'
import { buildPlayerPoses, interactionVisualPlan, reactionManifestUrl, ReactionVisibility, VisualRecoveryTracker, visualForHandAssetFailure } from '../../src/modern/features/game/game-visuals'
import { createGame } from '../../src/modern/features/game/setup'
import { ReactionPlayer, type ReactionClip } from '../../src/modern/features/characters/reactions'

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

  it('卡片格只有真实获得卡片时播放获得反馈，满背包不播放', () => {
    expect(interactionVisualPlan({ kind: 'card-draw', playerId: 1, cardId: 5, cardIds: [5] })).toEqual({
      reactions: [{ playerId: 1, name: 'happy' }],
      effects: [{ clipId: 'card-gain', playerId: 1 }],
    })
    expect(interactionVisualPlan({ kind: 'card-draw', playerId: 1, cardIds: [] })).toEqual({ reactions: [], effects: [] })
  })

  it('飞弹自伤优先hurt，其他玩家受伤时施放者happy，并覆盖ready和neutral状态', () => {
    expect(interactionVisualPlan({
      kind: 'card', playerId: 1, cardId: 9,
      worldEvent: { kind: 'missile-fired', playerId: 1, affectedCellIds: [1], affectedPlayerIds: [1], cardIds: [] },
    }).reactions).toEqual([{ playerId: 1, name: 'hurt' }])
    expect(interactionVisualPlan({
      kind: 'card', playerId: 1, cardId: 9,
      worldEvent: { kind: 'missile-fired', playerId: 1, affectedCellIds: [1], affectedPlayerIds: [2], cardIds: [] },
    }).reactions).toEqual([{ playerId: 1, name: 'happy' }, { playerId: 2, name: 'hurt' }])
    expect(interactionVisualPlan({
      kind: 'card', playerId: 1, cardId: 6,
      worldEvent: { kind: 'barrier-placed', playerId: 1, affectedCellIds: [1], affectedPlayerIds: [], cardIds: [] },
    }).reactions).toEqual([{ playerId: 1, name: 'ready' }])
    expect(interactionVisualPlan({
      kind: 'restriction', playerId: 1,
      worldEvent: { kind: 'restriction-released', playerId: 1, affectedCellIds: [], affectedPlayerIds: [1], cardIds: [] },
    }).reactions).toEqual([{ playerId: 1, name: 'neutral' }])
  })

  it('住院hurt在加载和播放时暂时可见，播放结束隐藏，释放后不复现旧帧', () => {
    const visibility = new ReactionVisibility(true)
    visibility.begin('hurt')
    visibility.setDesired(false)
    expect(visibility.visible).toBe(true)
    visibility.loaded()
    expect(visibility.visible).toBe(true)
    expect(visibility.advanceHiddenHurtFinished(1000 / 30, 1000 / 30)).toBe(false)
    expect(visibility.visible).toBe(true)
    expect(visibility.advanceHiddenHurtFinished(1000 / 30, 1000 / 30)).toBe(true)
    expect(visibility.visible).toBe(false)
    expect(visibility.reaction).toBeNull()
    visibility.setDesired(true)
    expect(visibility.visible).toBe(true)
    expect(visibility.showReaction).toBe(false)
  })

  it('重叠视觉失败按各自token取回原计划而不被新事件覆盖', () => {
    const tracker = new VisualRecoveryTracker()
    const first = interactionVisualPlan({ kind: 'card', playerId: 1, cardId: 5, status: 'applied' })
    const second = interactionVisualPlan({ kind: 'luck', playerId: 2, amount: -1000 })
    const firstToken = tracker.begin(first)
    const secondToken = tracker.begin(second)
    expect(tracker.fail(firstToken)).toEqual(first)
    expect(tracker.fail(secondToken)).toEqual(second)
  })

  it('同一角色新反馈使旧加载token过期，旧失败不得清除新反馈', () => {
    const visibility = new ReactionVisibility(true)
    const oldToken = visibility.begin('happy')
    const currentToken = visibility.begin('sad')
    expect(visibility.isCurrent(oldToken)).toBe(false)
    expect(visibility.isCurrent(currentToken)).toBe(true)
    expect(visibility.reaction).toBe('sad')
  })

  it('真实30fps游标的hurt末帧完整显示一帧时长后才隐藏', () => {
    const frames = [1, 2, 3].map(index => ({ url: `assets/characters/1/reactions/hurt/down-right/${index}.png`, width: 1, height: 1, offsetX: 0, offsetY: 0 }))
    const clip = { name: 'hurt', facing: 'down-right', fps: 30, loop: false, sourceRootFrame: 10, sourceSymbol: 1, frames } as ReactionClip
    const player = new ReactionPlayer(clip)
    const visibility = new ReactionVisibility(false)
    visibility.begin('hurt'); visibility.loaded()
    const frameDuration = 1000 / 30
    const observed = [player.frameIndex]
    observed.push((player.advance(frameDuration), player.frameIndex))
    observed.push((player.advance(frameDuration), player.frameIndex))
    expect(player.finished).toBe(true)
    expect(visibility.advanceHiddenHurtFinished(frameDuration, frameDuration)).toBe(false)
    expect(visibility.visible).toBe(true)
    observed.push((player.advance(frameDuration), player.frameIndex))
    expect(visibility.advanceHiddenHurtFinished(frameDuration, frameDuration)).toBe(true)
    expect(observed).toEqual([0, 1, 2, 2])
    expect(visibility.visible).toBe(false)
  })

  it('只有当前抽卡或购买notice中新加入的同ID手牌图才关联其获得视觉', () => {
    const visual = interactionVisualPlan({ kind: 'card-draw', playerId: 1, cardId: 26, cardIds: [26] })
    const game = createGame([1, 2, 3, 4], 0, 1)
    game.phase = 'interaction'
    game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: {
      kind: 'card', message: 'received', cardId: 26, cardIds: [26],
    } }
    expect(visualForHandAssetFailure(game, 26, visual)).toBe(visual)
    expect(visualForHandAssetFailure(game, 25, visual)).toBeUndefined()

    game.interaction = { kind: 'notice', playerId: 1, resume: 'await-roll', notice: {
      kind: 'card', message: 'applied', cardId: 26,
    } }
    expect(visualForHandAssetFailure(game, 26, visual)).toBeUndefined()
    game.phase = 'awaiting-roll'; game.interaction = null
    expect(visualForHandAssetFailure(game, 26, visual)).toBeUndefined()
  })
})
