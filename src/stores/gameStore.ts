import { defineStore } from 'pinia'
import { computed, markRaw, ref, shallowRef } from 'vue'
import { decideAI } from '@/core/ai/AiPlayer'
import { GameEngine } from '@/core/engine/GameEngine'
import type {
  CharacterId,
  GameAction,
  GameEvent,
  GameSettings,
  GameState,
  PlayerId,
} from '@/core/types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface Floater {
  id: number
  player: PlayerId
  delta: number
}

/**
 * 游戏状态容器。
 *
 * 三条约束（也是这个项目最容易出 bug 的地方）：
 *  1. 引擎状态用 shallowRef 持有，**绝不做深层响应式**——每次 dispatch 整体换新对象，
 *     这样「一个事件 = 一次界面更新」，没有 proxy 开销和局部失效问题。
 *  2. 所有输入都走 dispatch()，用 busy 闸门拦住重复点击。
 *  3. 动画只消费事件流，永远不回写游戏状态。
 */
export const useGameStore = defineStore('game', () => {
  const engine = shallowRef<GameEngine | null>(null)
  const state = shallowRef<GameState | null>(null)

  /** 棋子的「视觉位置」，逐格动画期间领先/落后于真实状态 */
  const visualPos = ref<number[]>([])
  const busy = ref(false)
  const speed = ref(1)
  const message = ref<string | null>(null)
  const floaters = ref<Floater[]>([])
  const dice = ref<{ value: number; power: number } | null>(null)
  const started = ref(false)

  let aiTimer: ReturnType<typeof setTimeout> | null = null
  let floaterSeq = 0

  /* ---------- 派生 ---------- */

  const currentPlayer = computed(() => {
    const s = state.value
    return s ? (s.players[s.turn] ?? null) : null
  })

  const human = computed(() => {
    const s = state.value
    return s ? (s.players[s.settings.humanId] ?? null) : null
  })

  /** 现在轮到人类做决策吗 */
  const awaitingHuman = computed(() => {
    const s = state.value
    if (!s || s.phase === 'over') return false
    const p = currentPlayer.value
    return !!p && !p.isAI && (s.phase === 'decide' || s.phase === 'roll')
  })

  const isOver = computed(() => state.value?.phase === 'over')

  /* ---------- 开局 ---------- */

  function newGame(characterIds: CharacterId[], settings: Partial<GameSettings> = {}, seed?: number) {
    const s: GameSettings = {
      winCondition: 'bankruptcy',
      lapsToWin: 10,
      monopolyGroups: 3,
      maxRounds: 200,
      humanId: 0,
      ...settings,
    }
    const realSeed = seed ?? Math.floor(Math.random() * 2 ** 31)
    const e = markRaw(new GameEngine(realSeed, characterIds, s))
    engine.value = e
    e.start()
    state.value = e.getState()
    visualPos.value = e.getState().players.map((p) => p.pos)
    started.value = true
    busy.value = false
    message.value = null
    floaters.value = []
    dice.value = null
    afterDrain()
  }

  function quit() {
    if (aiTimer) clearTimeout(aiTimer)
    aiTimer = null
    engine.value = null
    state.value = null
    started.value = false
  }

  /* ---------- 派发动作 ---------- */

  function dispatch(action: GameAction): void {
    const e = engine.value
    const s = state.value
    if (!e || !s || busy.value || s.phase === 'over') return

    // 记录动画起点
    const before = s.players.map((p) => p.pos)

    const result = e.dispatch(action)
    if (result.error) {
      message.value = result.error
      setTimeout(() => {
        if (message.value === result.error) message.value = null
      }, 2400)
      return
    }

    visualPos.value = before
    state.value = result.state
    void drain(result.events)
  }

  /* ---------- 事件播放 ---------- */

  async function drain(events: GameEvent[]): Promise<void> {
    busy.value = true
    try {
      for (const ev of events) {
        if (speed.value === 0) break
        await playEvent(ev)
      }
    } finally {
      const s = state.value
      if (s) visualPos.value = s.players.map((p) => p.pos)
      busy.value = false
      afterDrain()
    }
  }

  async function playEvent(ev: GameEvent): Promise<void> {
    const v = speed.value
    switch (ev.type) {
      case 'DICE_ROLLED':
        dice.value = { value: ev.value, power: ev.power }
        await sleep(720 / v)
        break

      case 'MOVED':
        visualPos.value[ev.player] = ev.to
        await sleep(155 / v)
        break

      case 'LANDED':
        await sleep(200 / v)
        break

      case 'MONEY':
        if (Math.abs(ev.delta) >= 500) pushFloater(ev.player, ev.delta)
        await sleep(70 / v)
        break

      case 'PROPERTY_BOUGHT':
      case 'TOLL_PAID':
      case 'BANKRUPT':
      case 'JAILED':
      case 'GAME_OVER':
        await sleep(220 / v)
        break

      default:
        break
    }
  }

  function pushFloater(player: PlayerId, delta: number): void {
    const id = ++floaterSeq
    floaters.value = [...floaters.value, { id, player, delta }]
    setTimeout(() => {
      floaters.value = floaters.value.filter((f) => f.id !== id)
    }, 1200)
  }

  /* ---------- 动画结束后的调度 ---------- */

  function afterDrain(): void {
    const s = state.value
    if (!s || s.phase === 'over') return
    const p = s.players[s.turn]
    if (p && p.isAI) scheduleAI()
  }

  function scheduleAI(): void {
    if (aiTimer) return
    const delay = 380 / Math.max(0.5, speed.value || 1)
    aiTimer = setTimeout(() => {
      aiTimer = null
      const s = state.value
      if (!s || busy.value || s.phase === 'over') return
      const p = s.players[s.turn]
      if (!p || !p.isAI) return
      dispatch(decideAI(s))
    }, delay)
  }

  /* ---------- 玩家操作 ---------- */

  const roll = (power: number) => dispatch({ type: 'ROLL', power })
  const choose = (action: GameAction) => dispatch(action)
  const useSkill = () => dispatch({ type: 'USE_SKILL' })
  const playCard = (cardId: string) => dispatch({ type: 'PLAY_CARD', cardId })

  function setSpeed(v: number): void {
    speed.value = v
  }

  return {
    // 状态
    engine,
    state,
    visualPos,
    busy,
    speed,
    message,
    floaters,
    dice,
    started,
    // 派生
    currentPlayer,
    human,
    awaitingHuman,
    isOver,
    // 操作
    newGame,
    quit,
    dispatch,
    roll,
    choose,
    useSkill,
    playCard,
    setSpeed,
  }
})
