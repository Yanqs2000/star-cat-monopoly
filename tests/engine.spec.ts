import { describe, expect, it } from 'vitest'
import { decideAI } from '../src/core/ai/AiPlayer'
import { TILE_COUNT } from '../src/core/config/board'
import { ECONOMY } from '../src/core/config/economy'
import { GameEngine } from '../src/core/engine/GameEngine'
import type { GameAction, GameState, Player } from '../src/core/types'

const IDS = ['juanmao', 'aniu', 'jiajia', 'dapai'] as const

/** 一个「够用就好」的自动决策器，用来把整局跑完 */
function decide(s: GameState, p: Player): GameAction {
  if (s.phase === 'roll') return { type: 'ROLL', power: 0.5 }

  const pending = s.pending
  if (!pending) return { type: 'END_TURN' }

  switch (pending.kind) {
    case 'buy':
      return p.cash + p.deposit > pending.price * 2 ? { type: 'BUY' } : { type: 'DECLINE' }
    case 'manage':
      return { type: 'END_TURN' }
    case 'facility':
      return { type: 'END_TURN' }
    case 'arcade':
      return { type: 'ARCADE_RESULT', score: 5 }
    case 'card-target':
      return { type: 'PICK_TARGET', tileId: pending.options[0]! }
    case 'card-target-player':
      return { type: 'PICK_TARGET', playerId: pending.options[0]! }
  }
}

/** 每步都检查的不变量：这些一旦被破坏就是真 bug */
function checkInvariants(s: GameState, where: string): void {
  for (const p of s.players) {
    expect(Number.isFinite(p.cash), `${where}: ${p.name} 现金不是有限数`).toBe(true)
    expect(Number.isFinite(p.deposit), `${where}: ${p.name} 存款不是有限数`).toBe(true)
    expect(p.cash, `${where}: ${p.name} 现金为负`).toBeGreaterThanOrEqual(0)
    expect(p.deposit, `${where}: ${p.name} 存款为负`).toBeGreaterThanOrEqual(0)
    expect(p.pos, `${where}: ${p.name} 位置越界`).toBeGreaterThanOrEqual(0)
    expect(p.pos, `${where}: ${p.name} 位置越界`).toBeLessThan(TILE_COUNT)
    expect(p.cards.length, `${where}: ${p.name} 手牌超上限`).toBeLessThanOrEqual(ECONOMY.MAX_CARDS)
  }
  for (const t of s.tiles) {
    expect(t.level, `${where}: ${t.name} 等级越界`).toBeGreaterThanOrEqual(0)
    expect(t.level, `${where}: ${t.name} 等级越界`).toBeLessThanOrEqual(ECONOMY.MAX_LEVEL)
    if (t.owner !== null) {
      expect(s.players[t.owner], `${where}: ${t.name} 拥有者不存在`).toBeTruthy()
    }
  }
  for (const key of Object.keys(s.stocks)) {
    const price = s.stocks[key]!.price
    expect(Number.isFinite(price), `${where}: ${key} 股价异常`).toBe(true)
    expect(price, `${where}: ${key} 股价非正`).toBeGreaterThan(0)
  }
}

function playGame(seed: number, maxSteps = 60_000) {
  const engine = new GameEngine(seed, [...IDS], { humanId: 0 })
  engine.start()
  let steps = 0

  while (engine.getState().phase !== 'over' && steps < maxSteps) {
    steps++
    // 用真实的 AI 决策跑整局，这样测的就是线上那条路径
    const result = engine.dispatch(decideAI(engine.getState()))
    if (result.error) throw new Error(`seed=${seed} 第 ${steps} 步被拒绝: ${result.error}`)
    if (steps % 25 === 0) checkInvariants(engine.getState(), `seed=${seed} step=${steps}`)
  }
  const finalState = engine.getState()
  if (finalState.phase !== 'over') {
    throw new Error(
      `seed=${seed} 跑了 ${steps} 步仍未结束，最后 10 条日志：\n` +
        finalState.log
          .slice(-10)
          .map((l) => `  ${l.text}`)
          .join('\n'),
    )
  }
  return { state: finalState, steps, engine }
}

/** 取一个稳定的状态指纹，用于比对两次运行是否完全一致 */
function fingerprint(s: GameState): string {
  return JSON.stringify({
    day: s.day,
    round: s.round,
    turn: s.turn,
    winner: s.winner,
    reason: s.winReason,
    rng: s.rngState,
    players: s.players.map((p) => [p.cash, p.deposit, p.pos, p.laps, p.out, p.cards.length, p.shares]),
    tiles: s.tiles.map((t) => [t.owner, t.level, t.barrier]),
    stocks: Object.values(s.stocks).map((v) => v.price),
  })
}

describe('引擎 · 整局模拟', () => {
  it('20 个种子都能正常跑完，全程不变量成立', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { state, steps } = playGame(seed)
      expect(state.phase, `seed=${seed} 没有结束`).toBe('over')
      expect(state.winner, `seed=${seed} 没有胜者`).not.toBeNull()
      expect(steps, `seed=${seed} 步数异常`).toBeGreaterThan(10)
    }
  })

  it('同一颗种子 + 同一串操作 = 完全相同的结局（可复现）', () => {
    const a = playGame(20260909)
    const b = playGame(20260909)
    expect(fingerprint(a.state)).toBe(fingerprint(b.state))
    expect(a.steps).toBe(b.steps)
  })

  it('不同种子会走出不同的局（随机确实生效）', () => {
    const a = playGame(1)
    const b = playGame(2)
    expect(fingerprint(a.state)).not.toBe(fingerprint(b.state))
  })

  it('非法动作被拒绝，且状态对象原封不动', () => {
    const engine = new GameEngine(3, [...IDS], { humanId: 0 })
    const before = engine.getState()

    // 开局是 roll 阶段，此时买地应当被拒绝
    const r1 = engine.dispatch({ type: 'BUY' })
    expect(r1.error).toBeTruthy()
    expect(r1.state).toBe(before)
    expect(r1.events).toHaveLength(0)

    // 还没掷骰就结束回合，同样应当被拒绝
    const r2 = engine.dispatch({ type: 'END_TURN' })
    expect(r2.error).toBeTruthy()
    expect(r2.state).toBe(before)
  })

  it('游戏结束后任何动作都被拒绝', () => {
    const { engine } = playGame(5)
    const res = engine.dispatch({ type: 'ROLL', power: 0.5 })
    expect(res.error).toBeTruthy()
  })
})

describe('引擎 · 具体规则', () => {
  it('经过起点会发薪水并累计圈数', () => {
    const engine = new GameEngine(11, [...IDS], { humanId: 0 })
    const s = engine.getState()
    const p = s.players[0]!
    p.pos = TILE_COUNT - 2

    const res = engine.dispatch({ type: 'ROLL', power: 1 })
    expect(res.error).toBeUndefined()

    const after = res.state.players[0]!
    expect(after.laps).toBe(1)
    // 薪水事件必须出现（落点还可能触发新闻罚款等，所以只断言事件）
    const salaryEvents = res.events.filter((e) => e.type === 'PASSED_START')
    expect(salaryEvents).toHaveLength(1)
    expect(salaryEvents[0]).toMatchObject({ player: 0, salary: ECONOMY.SALARY })
  })

  it('踩到别人的地要付过路费，钱进对方口袋', () => {
    const engine = new GameEngine(12, [...IDS], { humanId: 0 })
    const s = engine.getState()
    // 1 号地（草莓街）给玩家 1，玩家 0 停在起点前
    s.tiles[1]!.owner = 1
    s.tiles[1]!.level = 2
    s.players[0]!.pos = 0
    s.players[0]!.cash = 500_000
    s.players[1]!.cash = 0

    // 反复用 0 力度（绝大多数出 1 点）直到玩家 0 正好落到 1 号地
    let res = engine.dispatch({ type: 'ROLL', power: 0 })
    expect(res.error).toBeUndefined()

    const after = res.state
    if (after.players[0]!.pos === 1) {
      expect(after.players[0]!.cash).toBeLessThan(500_000)
      expect(after.players[1]!.cash).toBeGreaterThan(0)
      expect(res.events.some((e) => e.type === 'TOLL_PAID')).toBe(true)
    }
  })

  it('监狱：蹲满回合后自动出狱', () => {
    const engine = new GameEngine(13, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.players[0]!.jailTurns = 1
    s.turn = 3 // 让 3 号玩家行动，回合推进时会轮到 0 号（被跳过）

    // 3 号玩家可能落地触发决策，循环推进直到 0 号被处理过
    let guard = 0
    while (engine.getState().players[0]!.jailTurns > 0 && guard++ < 40) {
      const cur = engine.getState()
      const res = engine.dispatch(decide(cur, cur.players[cur.turn]!))
      expect(res.error).toBeUndefined()
    }
    expect(engine.getState().players[0]!.jailTurns).toBe(0)
  })

  it('垄断胜利：集齐设定数量的完整色组即获胜', () => {
    const engine = new GameEngine(14, [...IDS], {
      humanId: 0,
      winCondition: 'monopoly',
      monopolyGroups: 1,
    })
    const s = engine.getState()
    const p = s.players[0]!
    p.pos = 0
    // 把 berry 组两块给玩家 0，第三块留给下一次购买触发判定
    s.tiles[1]!.owner = 0
    s.tiles[2]!.owner = 0
    s.tiles[3]!.owner = null
    p.cash = 999_999
    s.turn = 0

    // 直接落到 3 号地并买下
    p.pos = 2
    const res = engine.dispatch({ type: 'ROLL', power: 0 })
    expect(res.error).toBeUndefined()
    const after = res.state
    if (after.players[0]!.pos === 3 && after.pending?.kind === 'buy') {
      const bought = engine.dispatch({ type: 'BUY' })
      expect(bought.error).toBeUndefined()
      expect(bought.state.winner).toBe(0)
      expect(bought.state.winReason).toBe('monopoly')
    }
  })

  it('长跑胜利：圈数达标即结束', () => {
    const engine = new GameEngine(15, [...IDS], {
      humanId: 0,
      winCondition: 'laps',
      lapsToWin: 1,
    })
    const s = engine.getState()
    const p = s.players[0]!
    p.pos = TILE_COUNT - 2
    s.turn = 0

    const res = engine.dispatch({ type: 'ROLL', power: 1 })
    expect(res.error).toBeUndefined()
    expect(res.state.winner).toBe(0)
    expect(res.state.winReason).toBe('laps')
  })

  it('在自己的地块上盖房：等级 +1、扣钱、事件正确', () => {
    const engine = new GameEngine(20, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.tiles[1]!.owner = 0
    s.players[0]!.cash = 100_000
    s.players[0]!.deposit = 0
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'manage', tileId: 1 }

    const res = engine.dispatch({ type: 'BUILD', tileId: 1 })
    expect(res.error).toBeUndefined()
    expect(res.state.tiles[1]!.level).toBe(1)
    expect(res.state.players[0]!.cash).toBeLessThan(100_000)
    expect(res.events.some((e) => e.type === 'BUILT')).toBe(true)
  })

  it('盖房有等级上限', () => {
    const engine = new GameEngine(21, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.tiles[1]!.owner = 0
    s.tiles[1]!.level = ECONOMY.MAX_LEVEL
    s.players[0]!.cash = 999_999
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'manage', tileId: 1 }

    const res = engine.dispatch({ type: 'BUILD', tileId: 1 })
    expect(res.error).toBeTruthy()
    expect(res.state).toBe(s)
  })

  it('不能给别人的地盖房', () => {
    const engine = new GameEngine(22, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.tiles[1]!.owner = 1
    s.players[0]!.cash = 999_999
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'manage', tileId: 1 }

    const res = engine.dispatch({ type: 'BUILD', tileId: 1 })
    expect(res.error).toBeTruthy()
  })

  it('卖地：清空归属与等级并返还现金', () => {
    const engine = new GameEngine(23, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.tiles[1]!.owner = 0
    s.tiles[1]!.level = 2
    s.players[0]!.cash = 0
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'manage', tileId: 1 }

    const res = engine.dispatch({ type: 'SELL', tileId: 1 })
    expect(res.error).toBeUndefined()
    expect(res.state.tiles[1]!.owner).toBeNull()
    expect(res.state.tiles[1]!.level).toBe(0)
    expect(res.state.players[0]!.cash).toBeGreaterThan(0)
  })

  it('银行存取款走通，且存款按天计息', () => {
    const engine = new GameEngine(24, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.players[0]!.cash = 50_000
    s.players[0]!.deposit = 0
    s.players[0]!.depositDay = 1
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'facility', tileId: 8 }

    const dep = engine.dispatch({ type: 'DEPOSIT', amount: 30_000 })
    expect(dep.error).toBeUndefined()
    expect(dep.state.players[0]!.cash).toBe(20_000)
    expect(dep.state.players[0]!.deposit).toBe(30_000)

    // 推进到第 11 天再取，应当有 10 天利息
    const s2 = engine.getState()
    s2.day = 11
    s2.turn = 0
    s2.phase = 'decide'
    s2.pending = { kind: 'facility', tileId: 8 }

    const wd = engine.dispatch({ type: 'WITHDRAW', amount: 30_000 })
    expect(wd.error).toBeUndefined()
    const interest = Math.round(30_000 * ECONOMY.INTEREST_RATE * 10)
    // 只取本金：利息留在账户里继续生息
    expect(wd.state.players[0]!.cash).toBe(20_000 + 30_000)
    expect(wd.state.players[0]!.deposit).toBe(interest)

    // 再取一次（取全部），此时连本带息都能拿出来
    const s3 = engine.getState()
    s3.turn = 0
    s3.phase = 'decide'
    s3.pending = { kind: 'facility', tileId: 8 }
    const all = engine.dispatch({ type: 'WITHDRAW', amount: interest })
    expect(all.error).toBeUndefined()
    expect(all.state.players[0]!.deposit).toBe(0)
    expect(all.state.players[0]!.cash).toBe(20_000 + 30_000 + interest)
  })

  it('彩市：消耗奖券，可能中奖', () => {
    const engine = new GameEngine(25, [...IDS], { humanId: 0 })
    const s = engine.getState()
    const p = s.players[0]!
    p.tickets = 100
    const cashBefore = p.cash
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'facility', tileId: 19 }

    const res = engine.dispatch({ type: 'BUY_LOTTERY', count: 50 })
    expect(res.error).toBeUndefined()
    expect(res.state.players[0]!.tickets).toBe(50)
    expect(res.events.some((e) => e.type === 'LOTTERY_DRAWN')).toBe(true)
    expect(res.state.players[0]!.cash).toBeGreaterThanOrEqual(cashBefore)
  })

  it('奖券不足时买彩票会被拒绝', () => {
    const engine = new GameEngine(26, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.players[0]!.tickets = 2
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'facility', tileId: 19 }

    const res = engine.dispatch({ type: 'BUY_LOTTERY', count: 10 })
    expect(res.error).toBeTruthy()
  })

  it('股市：买入扣钱、持股增加；卖出持股减少、现金回笼', () => {
    const engine = new GameEngine(27, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.players[0]!.cash = 100_000
    s.players[0]!.deposit = 0
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'facility', tileId: 14 }

    const before = s.players[0]!.shares['ZHHF'] ?? 0
    const buy = engine.dispatch({ type: 'BUY_STOCK', symbol: 'ZHHF', shares: 100 })
    expect(buy.error).toBeUndefined()
    expect(buy.state.players[0]!.shares['ZHHF']).toBe(before + 100)
    expect(buy.state.players[0]!.cash).toBeLessThan(100_000)

    const s2 = engine.getState()
    s2.turn = 0
    s2.phase = 'decide'
    s2.pending = { kind: 'facility', tileId: 14 }
    const cashBeforeSell = s2.players[0]!.cash

    const sell = engine.dispatch({ type: 'SELL_STOCK', symbol: 'ZHHF', shares: 100 })
    expect(sell.error).toBeUndefined()
    expect(sell.state.players[0]!.shares['ZHHF']).toBe(before)
    expect(sell.state.players[0]!.cash).toBeGreaterThan(cashBeforeSell)
  })

  it('持股不足时卖出会被拒绝', () => {
    const engine = new GameEngine(28, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.players[0]!.shares['ZHHF'] = 5
    s.turn = 0
    s.phase = 'decide'
    s.pending = { kind: 'facility', tileId: 14 }

    const res = engine.dispatch({ type: 'SELL_STOCK', symbol: 'ZHHF', shares: 100 })
    expect(res.error).toBeTruthy()
  })

  it('AI 踩到自己的地会加盖', () => {
    const engine = new GameEngine(30, [...IDS], { humanId: 0 })
    const s = engine.getState()
    s.players[1]!.cash = 100_000
    s.players[1]!.deposit = 0
    s.tiles[1]!.owner = 1
    s.turn = 1
    s.phase = 'decide'
    s.pending = { kind: 'manage', tileId: 1 }

    const action = decideAI(s)
    expect(action).toEqual({ type: 'BUILD', tileId: 1 })

    const res = engine.dispatch(action)
    expect(res.error).toBeUndefined()
    expect(res.state.tiles[1]!.level).toBe(1)
  })

  it('多局模拟里建筑确实会被盖起来（不是死代码）', () => {
    let built = 0
    for (let seed = 0; seed < 8; seed++) {
      const { state } = playGame(seed)
      built += state.tiles.reduce((a, t) => a + t.level, 0)
    }
    expect(built).toBeGreaterThan(0)
  })

  it('多局模拟能覆盖到所有主要系统（防止某个系统是死代码）', () => {
    const cover: Record<string, number> = {
      PROPERTY_BOUGHT: 0,
      PROPERTY_SOLD: 0,
      BUILT: 0,
      TOLL_PAID: 0,
      STOCK_TRADED: 0,
      LOTTERY_DRAWN: 0,
      CARD_GAINED: 0,
      CARD_PLAYED: 0,
      GOD_ATTACHED: 0,
      JAILED: 0,
      PASSED_START: 0,
      MONEY: 0,
    }

    for (let seed = 0; seed < 12; seed++) {
      const engine = new GameEngine(seed, [...IDS], { humanId: 0 })
      engine.start()
      for (let i = 0; i < 6000 && engine.getState().phase !== 'over'; i++) {
        const res = engine.dispatch(decideAI(engine.getState()))
        if (res.error) break
        for (const e of res.events) {
          if (e.type in cover) cover[e.type] = (cover[e.type] ?? 0) + 1
        }
      }
    }

    // 每一项都必须在 12 局里被触发过
    for (const [key, count] of Object.entries(cover)) {
      expect(count, `${key} 在 12 局里一次都没触发`).toBeGreaterThan(0)
    }
  })

  it('事件流里带上了渲染需要的动作（掷骰/移动/落地）', () => {
    const engine = new GameEngine(16, [...IDS], { humanId: 0 })
    const res = engine.dispatch({ type: 'ROLL', power: 0.5 })
    const types = res.events.map((e) => e.type)
    expect(types).toContain('DICE_ROLLED')
    expect(types).toContain('MOVED')
    expect(types).toContain('LANDED')
  })
})
