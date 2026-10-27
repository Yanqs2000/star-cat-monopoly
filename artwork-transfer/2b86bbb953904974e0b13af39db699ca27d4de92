import { computed, createApp, defineComponent, h, onBeforeUnmount, ref } from 'vue'
import GamePanel from '../../src/modern/features/game/GamePanel.vue'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import PropertyPanel from '../../src/modern/features/game/PropertyPanel.vue'
import { createGameController, type GameController, type GameScheduler } from '../../src/modern/features/game/controller'
import type { DirectCardChoice } from '../../src/modern/features/game/direct-cards'
import { createGame } from '../../src/modern/features/game/setup'
import type { Direction, GameState } from '../../src/modern/features/game/types'

class ManualScheduler implements GameScheduler {
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
}

function baseGame(): GameState {
  const game = createGame([1, 2, 3, 4], 0, 1)
  game.world.markers = {}
  return game
}

function before(position: { column: number; row: number }, direction: Direction, die = 1): GameState {
  const game = baseGame()
  game.players[0] = { ...game.players[0]!, position, direction }
  game.forcedDice = { 1: die, 2: null, 3: null, 4: null }
  return game
}

function resumedSnapshot(scenario: 'resume-bank' | 'resume-shop'): GameState {
  const scheduler = new ManualScheduler()
  const source = createGameController(
    scenario === 'resume-bank' ? before({ column: 18, row: 14 }, 1, 2) : before({ column: 7, row: 11 }, 1),
    { scheduler, stepDurationMs: 10, landingDurationMs: 10, aiThinkDurationMs: 10 },
  )
  source.roll()
  scheduler.advance(10)
  if (scenario === 'resume-bank') source.leaveBank()
  else source.leaveShop()
  const snapshot = structuredClone(source.state)
  source.dispose()
  return snapshot
}

function cardGame(cardId: number, invalid = false): GameState {
  const game = baseGame()
  game.inventories[1] = [cardId]
  game.players[0] = { ...game.players[0]!, position: { column: 6, row: 32 }, cash: 10_000 }
  game.players[1] = { ...game.players[1]!, position: { column: 27, row: 33 }, cash: 20_000 }
  game.credit[1] = { used: 0, available: 1000, score: 100 }
  if (cardId === 15 || cardId === 20) game.properties[1] = { ownerId: 2, level: 2 }
  if (cardId === 21) game.world.markers = { 1: 2 }
  if (cardId === 22) game.world.statuses[1] = { state: 0, days: 0, godId: 2, godDays: 4 }
  if (invalid && [11, 14, 18, 19].includes(cardId)) game.players[0] = { ...game.players[0]!, position: { column: 34, row: 8 } }
  if (invalid && cardId === 21) game.world.markers = {}
  return game
}

const choiceByCard: Partial<Record<number, DirectCardChoice>> = {
  1: { kind: 'credit', amount: 400 },
  5: { kind: 'dice', value: 6 },
  6: { kind: 'cell', position: { column: 18, row: 2 } },
  7: { kind: 'cell', position: { column: 18, row: 2 } },
  9: { kind: 'cell', position: { column: 27, row: 33 } },
  15: { kind: 'cell', position: { column: 6, row: 32 } },
  20: { kind: 'cell', position: { column: 6, row: 32 } },
  25: { kind: 'cell', position: { column: 27, row: 33 } },
  26: { kind: 'cell', position: { column: 27, row: 33 } },
  33: { kind: 'cell', position: { column: 27, row: 33 } },
}
const invalidChoiceByCard: Partial<Record<number, DirectCardChoice>> = {
  1: { kind: 'credit', amount: 1001 },
  5: { kind: 'dice', value: 7 },
  6: { kind: 'cell', position: { column: 0, row: 0 } },
  7: { kind: 'cell', position: { column: 0, row: 0 } },
  9: { kind: 'cell', position: { column: 0, row: 0 } },
  15: { kind: 'cell', position: { column: 0, row: 0 } },
  20: { kind: 'cell', position: { column: 0, row: 0 } },
  25: { kind: 'cell', position: { column: 0, row: 0 } },
  26: { kind: 'cell', position: { column: 0, row: 0 } },
  33: { kind: 'cell', position: { column: 0, row: 0 } },
}

const Fixture = defineComponent({
  setup() {
    const query = new URLSearchParams(location.search)
    const cardId = Number(query.get('card'))
    const invalid = query.get('invalid') === '1'
    const scenario = query.get('scenario') ?? (Number.isInteger(cardId) ? 'card' : 'b01')
    const scheduler = new ManualScheduler()
    let initial: GameState
    if (scenario === 'card') initial = cardGame(cardId, invalid)
    else if (scenario === 'resume-bank' || scenario === 'resume-shop') initial = resumedSnapshot(scenario)
    else if (scenario === 'b01') { initial = before({ column: 14, row: 6 }, 2); initial.rngState = 1091 }
    else if (scenario === 'mine-pass') { initial = before({ column: 34, row: 8 }, 1, 2); initial.world.markers = { 221: 7 } }
    else if (scenario === 'mine-land') { initial = before({ column: 34, row: 8 }, 1); initial.world.markers = { 221: 7 } }
    else if (scenario === 'barrier') { initial = before({ column: 18, row: 14 }, 1); initial.world.markers = { 142: 6 } }
    else if (scenario === 'god-property') {
      initial = before({ column: 7, row: 31 }, 2)
      initial.world.markers = { 1: 15 }
      initial.world.statuses[1] = { state: 0, days: 0, godId: 10, godDays: 7 }
    } else if (scenario === 'god-expiry') {
      initial = baseGame()
      initial.world.statuses[1] = { state: 0, days: 0, godId: 2, godDays: 0 }
    } else {
      initial = baseGame()
      initial.world.statuses[1] = { state: 3, days: 0, godId: null, godDays: 0 }
    }

    const state = ref(initial)
    const actionResults = ref<Record<string, boolean>>({})
    let controller: GameController
    controller = createGameController(initial, {
      scheduler,
      stepDurationMs: 10,
      landingDurationMs: 10,
      aiThinkDurationMs: 10,
      onState: next => { state.value = structuredClone(next) },
    })

    if (scenario === 'card') {
      actionResults.value.begin = controller.beginCard(0)
      actionResults.value.confirm = controller.confirmCard()
      const choice = (invalid ? invalidChoiceByCard : choiceByCard)[cardId]
      if (choice) {
        actionResults.value.settle = controller.chooseCard(choice)
        actionResults.value.duplicate = controller.chooseCard(choice)
      } else {
        actionResults.value.settle = actionResults.value.confirm
        actionResults.value.duplicate = controller.confirmCard()
      }
    } else if (['b01', 'mine-pass', 'mine-land', 'barrier', 'god-property'].includes(scenario)) {
      controller.roll()
      scheduler.advance(10)
    }

    const act = (command: () => boolean) => { command() }
    const summary = computed(() => JSON.stringify({
      scenario,
      invalid,
      cardId: Number.isInteger(cardId) ? cardId : null,
      actions: actionResults.value,
      phase: state.value.phase,
      activePlayerIndex: state.value.activePlayerIndex,
      remainingSteps: state.value.remainingSteps,
      continuation: state.value.continuation,
      rngState: state.value.rngState,
      interaction: state.value.interaction,
      inventory: state.value.inventories[1],
      cash: state.value.players[0]?.cash,
      position: state.value.players[0]?.position,
      property1: state.value.properties[1],
      status1: state.value.world.statuses[1],
      marker221: state.value.world.markers[221],
      lostAndFoundFunds: state.value.lostAndFoundFunds,
    }))
    onBeforeUnmount(() => controller.dispose())

    return () => h('main', { class: 'fixture-shell' }, [
      h('h1', `测试夹具：${scenario}${Number.isInteger(cardId) ? ` / 卡${cardId}` : ''}`),
      h('div', { class: 'fixture-controls' }, [
        h('button', { 'data-testid': 'advance', onClick: () => scheduler.advance(10) }, '推进一次'),
        h('button', { 'data-testid': 'double-ack', onClick: () => {
          actionResults.value = {
            ...actionResults.value,
            firstAck: controller.acknowledgeInteraction(),
            secondAck: controller.acknowledgeInteraction(),
          }
        } }, '重复确认'),
      ]),
      h('pre', { 'data-testid': 'fixture-summary' }, summary.value),
      h('div', { class: 'fixture-stage' }, [
        h(GamePanel, {
          game: state.value, paused: false, speed: 1, history: [], cardAssets: [],
          onRoll: () => act(() => controller.roll()),
          onBeginCard: (index: number) => act(() => controller.beginCard(index)),
        }),
        h(InteractionPanel, {
          game: state.value, paused: false, cardAssets: [], luckAssets: [],
          onConfirm: () => act(() => controller.confirmCard()),
          onCancel: () => act(() => controller.cancelInteraction()),
          onChoose: (choice: DirectCardChoice) => act(() => controller.chooseCard(choice)),
          onAcknowledge: () => act(() => controller.acknowledgeInteraction()),
          onBuy: (slot: number) => act(() => controller.buyCard(slot)),
          onSell: (index: number) => act(() => controller.sellCard(index)),
          onLeaveShop: () => act(() => controller.leaveShop()),
          onRequestCredit: () => act(() => controller.requestCredit()),
          onLeaveBank: () => act(() => controller.leaveBank()),
        }),
        h(PropertyPanel, {
          game: state.value,
          paused: false,
          onDecide: (choice: 'accept' | 'decline') => act(() => controller.decideProperty(choice)),
          onAcknowledge: () => act(() => controller.acknowledgeProperty()),
        }),
      ]),
    ])
  },
})

const style = document.createElement('style')
style.textContent = 'html,body,#app{margin:0;min-height:100%;background:#102631;color:#eef7f4;font-family:system-ui,sans-serif}.fixture-shell{padding:16px}.fixture-controls{display:flex;gap:8px;margin-bottom:8px}.fixture-controls button{padding:7px 10px}.fixture-shell pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#071820;padding:10px}.fixture-stage{position:relative;height:720px;display:flex;background:#66ccff}.fixture-stage aside{margin-left:auto}'
document.head.append(style)
createApp(Fixture).mount('#app')
