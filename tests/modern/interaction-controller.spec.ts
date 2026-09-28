import { describe, expect, it } from 'vitest'
import { createGameController, type GameScheduler, type InteractionEvent } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'
import type { Direction, GameState } from '../../src/modern/features/game/types'

class FakeScheduler implements GameScheduler {
  private time = 0
  private nextId = 1
  private jobs = new Map<number, { at: number; callback: () => void }>()

  now = () => this.time
  setTimeout = (callback: () => void, delayMs: number) => {
    const id = this.nextId++
    this.jobs.set(id, { at: this.time + delayMs, callback })
    return id
  }
  clearTimeout = (id: unknown) => { this.jobs.delete(id as number) }
  advance(ms: number): void {
    const target = this.time + ms
    while (true) {
      const next = [...this.jobs.entries()]
        .filter(([, job]) => job.at <= target)
        .sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0]
      if (!next) break
      this.time = next[1].at
      this.jobs.delete(next[0])
      next[1].callback()
    }
    this.time = target
  }
  pendingCount(): number { return this.jobs.size }
}

const timings = (scheduler: FakeScheduler, events?: InteractionEvent[]) => ({
  scheduler,
  stepDurationMs: 10,
  landingDurationMs: 10,
  aiThinkDurationMs: 10,
  onInteractionEvent: events === undefined ? undefined : (event: InteractionEvent) => events.push(event),
})

function gameWithCards(cards: number[], humans: number[] = [1, 2, 3, 4]): GameState {
  const game = createGame(humans, 0, 1)
  game.inventories[1] = [...cards]
  return game
}

function before(position: { column: number; row: number }, direction: Direction, die = 1): GameState {
  const game = createGame([1, 2, 3, 4], 0, 1)
  game.world.markers = {}
  game.players[0] = { ...game.players[0]!, position, direction }
  game.forcedDice = { 1: die, 2: null, 3: null, 4: null }
  return game
}

describe('完整3A开局状态', () => {
  it('一次创建完整可序列化世界快照并允许注入星期', () => {
    const game = createGame([1], 0, 6)
    expect(game).toMatchObject({
      phase: 'awaiting-roll', interaction: null, skipLandingMarker: false, continuation: null,
      prices: expect.any(Object), unownedOwnerDeposit: 100_000,
      tickets: { 1: 200, 2: 200, 3: 200, 4: 200 },
      forcedDice: { 1: null, 2: null, 3: null, 4: null },
      stayPlayerIds: [], lostAndFoundFunds: [0, 0],
      world: { weekday: 6, elapsedDays: 0 },
    })
    expect(Object.values(game.inventories).every(cards => cards.length === 5)).toBe(true)
    expect(Object.keys(game.world.markers)).toHaveLength(12)
    expect(() => JSON.stringify(game)).not.toThrow()
  })
})

describe('对局快照重建', () => {
  it('保留已结算的卡片提示，确认后才回到待掷骰', () => {
    const sourceScheduler = new FakeScheduler()
    const snapshots: GameState[] = []
    const source = createGameController(gameWithCards([5]), {
      ...timings(sourceScheduler),
      onState: state => snapshots.push(structuredClone(state)),
    })
    source.beginCard(0)
    source.confirmCard()
    source.chooseCard({ kind: 'dice', value: 4 })
    const settled = snapshots.at(-1)!
    source.dispose()

    expect(settled).toMatchObject({
      phase: 'interaction',
      interaction: { kind: 'notice', notice: { kind: 'card', cardId: 5 }, resume: 'await-roll' },
      inventories: { 1: [] },
      forcedDice: { 1: 4, 2: null, 3: null, 4: null },
    })

    const restored = createGameController(structuredClone(settled), timings(new FakeScheduler()))
    expect(restored.state).toEqual(settled)
    expect(restored.acknowledgeInteraction()).toBe(true)
    expect(restored.state).toMatchObject({
      phase: 'awaiting-roll', interaction: null,
      inventories: { 1: [] }, forcedDice: { 1: 4, 2: null, 3: null, 4: null },
    })
  })

  it('重启到已结算提示时不重新准备回合', () => {
    const settledGame = gameWithCards([])
    settledGame.forcedDice = { 1: 3, 2: null, 3: null, 4: null }
    settledGame.phase = 'interaction'
    settledGame.interaction = {
      kind: 'notice', playerId: 1, resume: 'await-roll',
      notice: { kind: 'card', message: 'applied', cardId: 5 },
    }
    const controller = createGameController(createGame([1, 2, 3, 4], 1), timings(new FakeScheduler()))

    controller.restart(structuredClone(settledGame))

    expect(controller.state).toEqual(settledGame)
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.forcedDice).toEqual({ 1: 3, 2: null, 3: null, 4: null })
  })

  it('从已到银行的moving快照重建时先处理当前格再继续余步', () => {
    const sourceScheduler = new FakeScheduler()
    const snapshots: GameState[] = []
    const source = createGameController(before({ column: 18, row: 14 }, 1, 2), {
      ...timings(sourceScheduler),
      onState: state => snapshots.push(structuredClone(state)),
    })
    source.roll()
    sourceScheduler.advance(10)
    const arrived = snapshots.find(state => state.phase === 'moving' && state.turnPath.length === 2)!
    source.dispose()

    expect(arrived).toMatchObject({
      phase: 'moving', remainingSteps: 1,
    })
    expect(arrived.players[0]!.position).toEqual({ column: 19, row: 15 })

    const scheduler = new FakeScheduler()
    const restored = createGameController(structuredClone(arrived), timings(scheduler))
    expect(restored.state).toMatchObject({
      phase: 'interaction', remainingSteps: 1,
      interaction: { kind: 'bank', resume: 'after-bank' },
    })
    expect(restored.state.players[0]!.position).toEqual({ column: 19, row: 15 })
    expect(restored.leaveBank()).toBe(true)
    scheduler.advance(10)
    expect(restored.state.players[0]!.position).toEqual({ column: 20, row: 16 })
    expect(restored.state.remainingSteps).toBe(0)
  })

  it('从已离开银行的moving快照重建时不重复进入银行', () => {
    const sourceScheduler = new FakeScheduler()
    const snapshots: GameState[] = []
    const source = createGameController(before({ column: 18, row: 14 }, 1, 2), {
      ...timings(sourceScheduler),
      onState: state => snapshots.push(structuredClone(state)),
    })
    source.roll()
    sourceScheduler.advance(10)
    expect(source.state.interaction?.kind).toBe('bank')
    expect(source.leaveBank()).toBe(true)
    const leftBank = snapshots.at(-1)!
    source.dispose()

    expect(leftBank).toMatchObject({
      phase: 'moving', interaction: null, remainingSteps: 1, continuation: 'after-bank',
    })
    expect(leftBank.players[0]!.position).toEqual({ column: 19, row: 15 })

    const scheduler = new FakeScheduler()
    const restored = createGameController(structuredClone(leftBank), timings(scheduler))
    expect(restored.state).toMatchObject({
      phase: 'moving', interaction: null, remainingSteps: 1, continuation: 'start-step',
    })
    expect(restored.requestCredit()).toBe(false)
    scheduler.advance(10)
    expect(restored.state.players[0]!.position).toEqual({ column: 20, row: 16 })
    expect(restored.state.remainingSteps).toBe(0)
  })

  it('从最终到达的landed快照重建时只结算一次落点', () => {
    const sourceScheduler = new FakeScheduler()
    const snapshots: GameState[] = []
    const game = before({ column: 19, row: 1 }, 2)
    const inventoryLength = game.inventories[1]!.length
    const source = createGameController(game, {
      ...timings(sourceScheduler),
      onState: state => snapshots.push(structuredClone(state)),
    })
    source.roll()
    sourceScheduler.advance(10)
    const arrived = snapshots.find(state => state.phase === 'landed' && state.interaction === null)!
    source.dispose()

    const restored = createGameController(structuredClone(arrived), timings(new FakeScheduler()))
    expect(restored.state.interaction).toMatchObject({ kind: 'notice', notice: { kind: 'card' }, resume: 'end-turn' })
    expect(restored.state.inventories[1]).toHaveLength(inventoryLength + 1)
    expect(restored.acknowledgeInteraction()).toBe(true)
    expect(restored.acknowledgeInteraction()).toBe(false)
  })

  it('从已离开商店的landed快照重建时只结束回合且不重抽库存', () => {
    const sourceScheduler = new FakeScheduler()
    const snapshots: GameState[] = []
    const source = createGameController(before({ column: 7, row: 11 }, 1), {
      ...timings(sourceScheduler),
      onState: state => snapshots.push(structuredClone(state)),
    })
    source.roll()
    sourceScheduler.advance(10)
    expect(source.state.interaction?.kind).toBe('shop')
    expect(source.leaveShop()).toBe(true)
    const leftShop = snapshots.at(-1)!
    source.dispose()

    expect(leftShop).toMatchObject({
      phase: 'landed', interaction: null, rngState: 1_140_036_074, continuation: 'finish-turn',
    })

    const scheduler = new FakeScheduler()
    const restored = createGameController(structuredClone(leftShop), timings(scheduler))
    expect(restored.state).toMatchObject({
      phase: 'landed', interaction: null, rngState: 1_140_036_074, continuation: 'finish-turn',
    })
    scheduler.advance(10)
    expect(restored.state.activePlayerIndex).toBe(1)
    expect(restored.state.rngState).toBe(1_140_036_074)
  })

  it('保留人类地产决策，且恢复AI地产决策的自动结算', () => {
    const humanScheduler = new FakeScheduler()
    const humanStates: GameState[] = []
    const humanSource = createGameController(before({ column: 7, row: 31 }, 2), {
      ...timings(humanScheduler),
      onState: state => humanStates.push(structuredClone(state)),
    })
    humanSource.roll()
    humanScheduler.advance(10)
    const humanDecision = humanStates.find(state => state.phase === 'property-decision')!
    humanSource.dispose()
    const human = createGameController(structuredClone(humanDecision), timings(new FakeScheduler()))
    expect(human.state).toEqual(humanDecision)
    expect(human.decideProperty('accept')).toBe(true)
    expect(human.state.phase).toBe('property-result')

    const aiScheduler = new FakeScheduler()
    const aiStates: GameState[] = []
    const aiGame = before({ column: 7, row: 31 }, 2)
    aiGame.players[0] = { ...aiGame.players[0]!, controller: 'ai' }
    const aiSource = createGameController(aiGame, {
      ...timings(aiScheduler),
      onState: state => aiStates.push(structuredClone(state)),
    })
    aiScheduler.advance(20)
    const aiDecision = aiStates.find(state => state.phase === 'property-decision')!
    aiSource.dispose()
    const resumeScheduler = new FakeScheduler()
    const ai = createGameController(structuredClone(aiDecision), timings(resumeScheduler))
    expect(ai.state).toEqual(aiDecision)
    resumeScheduler.advance(10)
    expect(ai.state.phase).toBe('property-result')
  })

  it('保留AI结果提示并恢复原自动确认', () => {
    const sourceScheduler = new FakeScheduler()
    const snapshots: GameState[] = []
    const game = before({ column: 19, row: 1 }, 2)
    game.players[0] = { ...game.players[0]!, controller: 'ai' }
    const source = createGameController(game, {
      ...timings(sourceScheduler),
      onState: state => snapshots.push(structuredClone(state)),
    })
    sourceScheduler.advance(20)
    const notice = snapshots.find(state => state.interaction?.kind === 'notice')!
    source.dispose()

    const scheduler = new FakeScheduler()
    const restored = createGameController(structuredClone(notice), timings(scheduler))
    expect(restored.state).toEqual(notice)
    scheduler.advance(10)
    expect(restored.state.activePlayerIndex).toBe(1)
    expect(restored.state.interaction).toBeNull()
  })
})

describe('卡牌有限交互', () => {
  it('普通待掷骰阶段可打开确认并取消，手牌和随机状态不变', () => {
    const game = gameWithCards([5])
    const beforeState = structuredClone(game)
    const controller = createGameController(game, timings(new FakeScheduler()))
    expect(controller.beginCard(0)).toBe(true)
    expect(controller.state).toMatchObject({ phase: 'interaction', interaction: { kind: 'card-confirm', cardId: 5, cardIndex: 0 } })
    expect(controller.cancelInteraction()).toBe(true)
    expect(controller.state).toMatchObject({ phase: 'awaiting-roll', interaction: null })
    expect(controller.state.inventories).toEqual(beforeState.inventories)
    expect(controller.state.rngState).toBe(beforeState.rngState)
  })

  it.each([
    [1, 'credit-choice'], [5, 'dice-choice'],
    [6, 'target-choice'], [7, 'target-choice'], [9, 'target-choice'],
    [15, 'target-choice'], [20, 'target-choice'], [25, 'target-choice'], [26, 'target-choice'], [33, 'target-choice'],
  ] as const)('卡%d确认后进入%s且未提前消耗', (cardId, kind) => {
    const controller = createGameController(gameWithCards([cardId]), timings(new FakeScheduler()))
    expect(controller.beginCard(0)).toBe(true)
    expect(controller.confirmCard()).toBe(true)
    expect(controller.state.interaction).toMatchObject({ kind, cardId, cardIndex: 0 })
    expect(controller.state.inventories[1]).toEqual([cardId])
  })

  it.each([11, 14, 18, 19, 21, 22, 27])('确认型卡%d只应用并记录一次', cardId => {
    const events: InteractionEvent[] = []
    const game = gameWithCards([cardId])
    if ([11, 14, 18, 19].includes(cardId)) game.players[0] = { ...game.players[0]!, position: { column: 6, row: 32 } }
    const controller = createGameController(game, timings(new FakeScheduler(), events))
    expect(controller.beginCard(0)).toBe(true)
    expect(controller.confirmCard()).toBe(true)
    expect(controller.confirmCard()).toBe(false)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { kind: 'card', cardId } })
    expect(events).toHaveLength(1)
    expect(controller.state.inventories[1]).toHaveLength(0)
  })

  it('控骰和信用金额选择分别结算，非法值保留旧待生效值和原卡', () => {
    const diceGame = gameWithCards([5])
    diceGame.forcedDice = { 1: null, 2: 3, 3: null, 4: null }
    const dice = createGameController(diceGame, timings(new FakeScheduler()))
    dice.beginCard(0); dice.confirmCard()
    expect(dice.chooseCard({ kind: 'dice', value: 7 })).toBe(true)
    expect(dice.state.interaction).toMatchObject({ kind: 'dice-choice', choiceError: expect.any(String) })
    expect(dice.state.forcedDice).toEqual({ 1: null, 2: 3, 3: null, 4: null })
    expect(dice.state.inventories[1]).toEqual([5])
    expect(dice.chooseCard({ kind: 'dice', value: 6 })).toBe(true)
    expect(dice.state.forcedDice).toEqual({ 1: 6, 2: null, 3: null, 4: null })

    const creditGame = gameWithCards([1])
    creditGame.credit[1] = { used: 0, available: 1000, score: 100 }
    const credit = createGameController(creditGame, timings(new FakeScheduler()))
    credit.beginCard(0); credit.confirmCard()
    expect(credit.chooseCard({ kind: 'credit', amount: 1001 })).toBe(true)
    expect(credit.state.inventories[1]).toEqual([1])
    expect(credit.chooseCard({ kind: 'credit', amount: 400 })).toBe(true)
    expect(credit.state.players[0]!.cash).toBe(100_400)
    expect(credit.state.inventories[1]).toEqual([1])
  })

  it('目标失败保留卡并可重选，成功后旧索引和重复提交都失效', () => {
    const controller = createGameController(gameWithCards([6]), timings(new FakeScheduler()))
    controller.beginCard(0); controller.confirmCard()
    expect(controller.chooseCard({ kind: 'cell', position: { column: 0, row: 0 } })).toBe(true)
    expect(controller.state.interaction).toMatchObject({ kind: 'target-choice', choiceError: expect.any(String) })
    expect(controller.state.inventories[1]).toEqual([6])
    expect(controller.chooseCard({ kind: 'cell', position: { column: 18, row: 2 } })).toBe(true)
    expect(controller.state.inventories[1]).toEqual([])
    expect(controller.chooseCard({ kind: 'cell', position: { column: 19, row: 3 } })).toBe(false)
  })

  it('停留标记只由下一次人类正常掷骰消费，AI回合不会清除', () => {
    const scheduler = new FakeScheduler()
    const game = gameWithCards([27], [1])
    const controller = createGameController(game, timings(scheduler))
    controller.beginCard(0); controller.confirmCard(); controller.acknowledgeInteraction()
    expect(controller.state.stayPlayerIds).toEqual([1])
    expect(controller.roll(2)).toBe(true)
    expect(controller.state).toMatchObject({ phase: 'landed', remainingSteps: 0, skipLandingMarker: true })
    expect(controller.state.stayPlayerIds).toEqual([])
    scheduler.advance(30)
    expect(controller.state.activePlayerIndex).toBe(1)
  })

  it('全局控骰由下一位实际掷骰者消费且不抽随机', () => {
    const scheduler = new FakeScheduler()
    const game = gameWithCards([5], [1])
    const controller = createGameController(game, timings(scheduler))
    controller.beginCard(0); controller.confirmCard(); controller.chooseCard({ kind: 'dice', value: 1 }); controller.acknowledgeInteraction()
    const beforeHuman = controller.state.rngState
    expect(controller.roll(1)).toBe(true)
    expect(controller.state.rngState).toBe(beforeHuman)
    scheduler.advance(30)
    expect(controller.state.activePlayerIndex).toBe(1)
    expect(controller.state.lastRoll).toBe(1)
    expect(controller.state.rngState).not.toBe(beforeHuman)
    expect(Object.values(controller.state.forcedDice).every(value => value === null)).toBe(true)
  })

  it('待消费控骰优先于显式回放骰并只消费一次', () => {
    const game = gameWithCards([])
    game.forcedDice = { 1: null, 2: 6, 3: null, 4: null }
    const rngState = game.rngState
    const controller = createGameController(game, timings(new FakeScheduler()))
    expect(controller.roll(2)).toBe(true)
    expect(controller.state).toMatchObject({ lastRoll: 6, remainingSteps: 6, rngState })
    expect(Object.values(controller.state.forcedDice).every(value => value === null)).toBe(true)
  })

  it.each([
    [11, [1]],
    [14, [1, 3, 5, 7]],
    [15, [1]],
    [18, [1, 3, 5, 7]],
    [19, [1, 3, 5, 7]],
  ] as const)('地产卡%d在notice和callback中暴露相同受影响地块', (cardId, affectedCellIds) => {
    const events: InteractionEvent[] = []
    const game = gameWithCards([cardId])
    game.players[0] = { ...game.players[0]!, position: { column: 6, row: 32 } }
    if (cardId === 15 || cardId === 19) {
      for (const parcelId of affectedCellIds) game.properties[parcelId] = { ...game.properties[parcelId]!, level: 1 }
    }
    const controller = createGameController(game, timings(new FakeScheduler(), events))
    controller.beginCard(0); controller.confirmCard()
    if (cardId === 15) controller.chooseCard({ kind: 'cell', position: { column: 5, row: 31 } })
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { affectedCellIds } })
    expect(events).toHaveLength(1)
    expect(events[0]!.affectedCellIds).toEqual(affectedCellIds)
  })

  it('控骰后飞弹自伤提前结束，下一名AI消费控骰且不抽骰子随机', () => {
    const scheduler = new FakeScheduler()
    const game = gameWithCards([5, 9], [1])
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 24, row: 32 } }
    const controller = createGameController(game, timings(scheduler))
    controller.beginCard(0); controller.confirmCard(); controller.chooseCard({ kind: 'dice', value: 6 }); controller.acknowledgeInteraction()
    controller.beginCard(0); controller.confirmCard(); controller.chooseCard({ kind: 'cell', position: { column: 24, row: 32 } })
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', resume: 'end-turn' })
    const rngState = controller.state.rngState
    controller.acknowledgeInteraction()
    expect(controller.state.activePlayerIndex).toBe(1)
    scheduler.advance(10)
    expect(controller.state.lastRoll).toBe(6)
    expect(controller.state.rngState).toBe(rngState)
    expect(Object.values(controller.state.forcedDice).every(value => value === null)).toBe(true)
  })

  it('停留后飞弹自伤提前结束，AI不消费，下一名人类正常移动消费', () => {
    const scheduler = new FakeScheduler()
    const game = gameWithCards([27, 9], [1])
    game.world.markers = {}
    game.players[0] = { ...game.players[0]!, position: { column: 24, row: 32 } }
    const controller = createGameController(game, timings(scheduler))
    controller.beginCard(0); controller.confirmCard(); controller.acknowledgeInteraction()
    controller.beginCard(0); controller.confirmCard(); controller.chooseCard({ kind: 'cell', position: { column: 24, row: 32 } })
    controller.acknowledgeInteraction()
    expect(controller.state.activePlayerIndex).toBe(1)
    expect(controller.state.stayPlayerIds).toEqual([1])
    scheduler.advance(10)
    expect(controller.state.stayPlayerIds).toEqual([1])
    for (let guard = 0; guard < 100 && !(controller.state.activePlayerIndex === 0 && controller.state.phase === 'awaiting-roll'); guard += 1) {
      if (controller.state.activePlayerIndex === 0 && controller.state.interaction?.kind === 'notice') controller.acknowledgeInteraction()
      scheduler.advance(1_000)
    }
    expect(controller.state).toMatchObject({ activePlayerIndex: 0, phase: 'awaiting-roll', stayPlayerIds: [1] })
    expect(controller.roll(1)).toBe(true)
    expect(controller.state).toMatchObject({ phase: 'landed', remainingSteps: 0, skipLandingMarker: true, stayPlayerIds: [] })
  })

  it('卡牌透支不会立即破产，可在真实回合结束前用信用卡恢复', () => {
    const game = gameWithCards([11, 1])
    game.players[0] = { ...game.players[0]!, position: { column: 6, row: 32 }, cash: 0, deposit: 0 }
    game.credit[1] = { used: 0, available: 5000, score: 100 }
    const controller = createGameController(game, timings(new FakeScheduler()))
    controller.beginCard(0); controller.confirmCard()
    expect(controller.state.players[0]).toMatchObject({ cash: 0, deposit: -1600 })
    expect(controller.state.phase).toBe('interaction')
    controller.acknowledgeInteraction()
    controller.beginCard(0); controller.confirmCard(); controller.chooseCard({ kind: 'credit', amount: 2000 })
    expect(controller.state.players[0]).toMatchObject({ cash: 2000, deposit: -1600 })
    expect(controller.state.phase).not.toBe('insolvent')
  })
})

describe('移动、世界结果和特殊落点串行化', () => {
  it('NPC提示后仍按顺序应用天使一次，再以新等级进入地产报价', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 7, row: 31 }, 2)
    game.world.markers = { 1: 1 }
    game.world.statuses[1] = { state: 0, days: 0, godId: 10, godDays: 7 }
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'ticket-exchange', mode: 'sell' })
    expect(controller.leaveExchange()).toBe(true)
    expect(controller.state.properties[1]!.level).toBe(1)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { eventKind: 'god-property-adjusted' } })
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state).toMatchObject({ phase: 'property-decision', propertyOffer: { parcelId: 1, kind: 'purchase', amount: 1500 } })
  })

  it('银行同格先于路障，路障确认后再处理普通落地且不重复银行', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 18, row: 14 }, 1)
    game.world.markers = { 142: 6 }
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.state.interaction?.kind).toBe('bank')
    expect(controller.leaveBank()).toBe(true)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { eventKind: 'barrier-triggered' } })
    expect(controller.state.remainingSteps).toBe(0)
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.interaction).toBeNull()
  })

  it('最终地雷送医并直接结束回合，经过地雷不会提前触发', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 34, row: 8 }, 1)
    game.world.markers = { 221: 7 }
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', resume: 'end-turn', notice: { eventKind: 'mine-triggered' } })
    expect(controller.state.players[0]).toMatchObject({ position: { column: 19, row: 1 } })
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.activePlayerIndex).toBe(1)
  })

  it('中途银行离开后从银行之后继续精确余步，不重复打开同一银行', () => {
    const scheduler = new FakeScheduler()
    const events: InteractionEvent[] = []
    const controller = createGameController(before({ column: 18, row: 14 }, 1, 2), timings(scheduler, events))
    expect(controller.roll()).toBe(true)
    scheduler.advance(10)
    expect(controller.state).toMatchObject({ phase: 'interaction', remainingSteps: 1, interaction: { kind: 'bank', resume: 'after-bank' } })
    expect(controller.state.players[0]!.position).toEqual({ column: 19, row: 15 })
    expect(controller.leaveBank()).toBe(true)
    scheduler.advance(10)
    expect(controller.state.players[0]!.position).toEqual({ column: 20, row: 16 })
    expect(events.filter(event => event.kind === 'bank')).toHaveLength(0)
  })

  it('银行信用结果仅结算一次，周日关闭提示仍继续原路径', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 18, row: 14 }, 1)
    game.world.weekday = 0
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { kind: 'bank', eventKind: 'bank-closed' } })
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.acknowledgeInteraction()).toBe(false)
  })

  it('银行信用申请只增加信用卡和额度，不凭空借入现金', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 18, row: 14 }, 1)
    game.inventories[1] = [5]
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.requestCredit()).toBe(true)
    expect(controller.state).toMatchObject({
      interaction: { kind: 'notice', resume: 'bank', notice: { eventKind: 'credit-granted' } },
      credit: { 1: { used: 0, available: 100000, score: 100 } },
    })
    expect(controller.state.players[0]!.cash).toBe(100_000)
    expect(controller.state.inventories[1]).toEqual([1, 5])
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.interaction?.kind).toBe('bank')
  })

  it('等级2 AI经过银行申请信用卡并按总现金资产重分配', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 18, row: 14 }, 1)
    game.activePlayerIndex = 1
    game.players[1] = { ...game.players[1]!, controller: 'ai', position: { column: 18, row: 14 }, direction: 1 }
    game.forcedDice = { 1: 1, 2: null, 3: null, 4: null }
    game.inventories[2] = [5]
    const controller = createGameController(game, timings(scheduler))
    scheduler.advance(20)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { eventKind: 'credit-granted' } })
    expect(controller.state.inventories[2]).toEqual([1, 5])
    expect(controller.state.credit[2]).toMatchObject({ available: 100000, used: 0 })
    expect(controller.state.players[1]!.cash).toBeGreaterThanOrEqual(50_000)
    expect(controller.state.players[1]!.cash).toBeLessThan(70_000)
    expect(controller.state.players[1]!.cash + controller.state.players[1]!.deposit).toBe(200_000)
  })

  it('AI在移动中途处理银行结果后以moving阶段继续精确余步', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 18, row: 14 }, 1)
    game.activePlayerIndex = 1
    game.players[1] = { ...game.players[1]!, controller: 'ai', position: { column: 18, row: 14 }, direction: 1 }
    game.forcedDice = { 1: null, 2: 3, 3: null, 4: null }
    game.inventories[2] = [5]
    const controller = createGameController(game, timings(scheduler))
    scheduler.advance(20)
    expect(controller.state).toMatchObject({
      phase: 'interaction', remainingSteps: 2,
      interaction: { kind: 'notice', resume: 'after-bank', notice: { eventKind: 'credit-granted' } },
    })
    expect(() => scheduler.advance(10)).not.toThrow()
    expect(controller.state).toMatchObject({ phase: 'moving', remainingSteps: 2, interaction: null })
    scheduler.advance(10)
    expect(controller.state.players[1]!.position).toEqual({ column: 20, row: 16 })
    expect(controller.state.remainingSteps).toBe(1)
  })

  it('卡片格、运气、奖券各只结算一次并等待确认', () => {
    const cases = [
      [{ column: 19, row: 1 }, 2, 'card', 1],
      [{ column: 14, row: 6 }, 2, 'luck', 0],
      [{ column: 15, row: 5 }, 2, 'tickets', 10],
    ] as const
    for (const [position, direction, kind, amount] of cases) {
      const scheduler = new FakeScheduler()
      const events: InteractionEvent[] = []
      const game = before(position, direction)
      const inventoryLength = game.inventories[1]!.length
      const ticketCount = game.tickets[1]!
      const controller = createGameController(game, timings(scheduler, events))
      controller.roll(); scheduler.advance(10)
      expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { kind } })
      expect(events).toHaveLength(1)
      const settled = structuredClone(controller.state)
      expect(controller.acknowledgeInteraction()).toBe(true)
      expect(controller.acknowledgeInteraction()).toBe(false)
      if (kind === 'card') expect(settled.inventories[1]).toHaveLength(inventoryLength + 1)
      if (kind === 'tickets') expect(settled.tickets[1]).toBe(ticketCount + amount)
    }
  })

  it('人类商店库存仅生成一次，买卖提示确认后返回同一商店', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 7, row: 11 }, 1)
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'shop', shop: { stock: expect.any(Array) } })
    const stock = structuredClone(controller.state.interaction)
    expect(controller.buyCard(0)).toBe(true)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', resume: 'shop' })
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.state.interaction).toMatchObject({ kind: 'shop' })
    expect(controller.state.interaction).not.toEqual(stock)
    expect(controller.sellCard(controller.state.inventories[1]!.length - 1)).toBe(true)
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.leaveShop()).toBe(true)
  })

  it('AI经过商店不生成库存也不消耗六次随机', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 7, row: 11 }, 1)
    game.activePlayerIndex = 1
    game.players[1] = { ...game.players[1]!, controller: 'ai', position: { column: 7, row: 11 }, direction: 1 }
    game.forcedDice = { 1: 1, 2: null, 3: null, 4: null }
    const rngState = game.rngState
    const controller = createGameController(game, timings(scheduler))
    scheduler.advance(20)
    expect(controller.state.interaction).toBeNull()
    expect(controller.state.rngState).toBe(rngState)
  })

  it('满24张踩卡片格既不加牌也不推进抽卡随机', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 19, row: 1 }, 2)
    game.inventories[1] = Array(24).fill(5)
    const rngState = game.rngState
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.state.inventories[1]).toHaveLength(24)
    expect(controller.state.rngState).toBe(rngState)
  })

  it('运气事件28只扣款并记录一次B01金额', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 14, row: 6 }, 2)
    game.rngState = 1091
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(10)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { kind: 'luck', amount: -1000, luckEvent: { id: 28, correction: 'B-01' } } })
    expect(controller.state.players[0]!.cash).toBe(99_000)
    expect(controller.state.lostAndFoundFunds).toEqual([1000, 1000])
    expect(controller.acknowledgeInteraction()).toBe(true)
    expect(controller.acknowledgeInteraction()).toBe(false)
  })

  it('完整轮次仅tick一次星期及3/5/7日状态', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 34, row: 8 }, 1)
    game.activePlayerIndex = 3
    game.players[3] = { ...game.players[3]!, position: { column: 34, row: 8 }, direction: 1 }
    game.world.statuses = {
      1: { state: 3, days: 3, godId: null, godDays: 0 },
      2: { state: 2, days: 5, godId: null, godDays: 0 },
      3: { state: 0, days: 0, godId: 2, godDays: 7 },
      4: { state: 0, days: 0, godId: null, godDays: 0 },
    }
    const controller = createGameController(game, timings(scheduler))
    controller.roll(); scheduler.advance(20)
    expect(controller.state.world).toMatchObject({ weekday: 2, elapsedDays: 1 })
    expect(controller.state.world.statuses[1]).toMatchObject({ days: 2 })
    expect(controller.state.world.statuses[2]).toMatchObject({ days: 4 })
    expect(controller.state.world.statuses[3]).toMatchObject({ godDays: 6 })
  })

  it('暂停、重开和销毁挡住或失效所有新交互命令', () => {
    const scheduler = new FakeScheduler()
    const controller = createGameController(gameWithCards([5]), timings(scheduler))
    controller.beginCard(0); controller.confirmCard(); controller.setPaused(true)
    expect(controller.chooseCard({ kind: 'dice', value: 4 })).toBe(false)
    const fresh = createGame([2], 99, 2)
    controller.restart(fresh)
    expect(controller.state).toEqual(fresh)
    expect(controller.chooseCard({ kind: 'dice', value: 4 })).toBe(false)
    controller.dispose()
    expect(controller.beginCard(0)).toBe(false)
  })

  it('AI世界结果确认计时可暂停，恢复后才继续', () => {
    const scheduler = new FakeScheduler()
    const game = before({ column: 34, row: 8 }, 1)
    game.activePlayerIndex = 1
    game.players[1] = { ...game.players[1]!, controller: 'ai', position: { column: 34, row: 8 }, direction: 1 }
    game.forcedDice = { 1: 1, 2: null, 3: null, 4: null }
    game.world.markers = { 221: 7 }
    const controller = createGameController(game, timings(scheduler))
    scheduler.advance(20)
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', resume: 'end-turn' })
    controller.setPaused(true)
    const frozen = structuredClone(controller.state)
    scheduler.advance(1_000)
    expect(controller.state).toEqual(frozen)
    controller.setPaused(false)
    scheduler.advance(10)
    expect(controller.state.activePlayerIndex).toBe(2)
  })

  it('AI限制解除提示确认后继续自动掷骰', () => {
    const scheduler = new FakeScheduler()
    const game = createGame([1], 0, 1)
    game.activePlayerIndex = 1
    game.world.statuses[2] = { state: 2, days: 0, godId: null, godDays: 0 }
    const controller = createGameController(game, timings(scheduler))
    expect(controller.state.interaction).toMatchObject({ kind: 'notice', notice: { eventKind: 'restriction-released' } })
    scheduler.advance(20)
    expect(controller.state.phase).toBe('moving')
  })
})
