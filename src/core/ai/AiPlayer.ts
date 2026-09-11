import { TILE_COUNT } from '../config/board'
import { CARDS } from '../config/cards'
import { ECONOMY } from '../config/economy'
import { getGod } from '../config/gods'
import { STOCKS } from '../config/stocks'
import { powerForTarget } from '../dice'
import { buildCost, rentFor } from '../rules/rent'
import type { GameAction, GameState, Player, PlayerId, TileId } from '../types'

/**
 * AI 决策。刻意写成一组纯函数：输入 GameState，输出一个 GameAction。
 * 这样既可以在引擎测试里跑整局模拟，也不会把任何 UI 逻辑缠进来。
 */
export function decideAI(s: GameState): GameAction {
  const p = s.players[s.turn]!
  if (!p) return { type: 'END_TURN' }

  if (s.phase === 'roll') {
    const bail = maybeSell(s, p)
    if (bail) return bail
    const card = maybePlayCard(s, p)
    if (card) return card
    return { type: 'ROLL', power: choosePower(s, p) }
  }

  const pending = s.pending
  if (!pending) return { type: 'END_TURN' }

  switch (pending.kind) {
    case 'buy':
      return decideBuy(s, p, pending.tileId)
    case 'manage':
      return decideManage(s, p, pending.tileId)
    case 'facility':
      return decideFacility(s, p, pending.tileId)
    case 'arcade':
      // 小游戏用「AI 手速」模拟：性格越赌越敢接
      return { type: 'ARCADE_RESULT', score: aiArcadeScore(p) }
    case 'card-target':
      return { type: 'PICK_TARGET', tileId: pickTileTarget(s, p, pending.options) }
    case 'card-target-player':
      return { type: 'PICK_TARGET', playerId: pickVictim(s, pending.options) }
    default:
      return { type: 'END_TURN' }
  }
}

/* ---------- 掷骰力度：先给每个落点打分，再反推力度 ---------- */

function choosePower(s: GameState, p: Player): number {
  let bestTarget = 3
  let bestScore = -Infinity

  for (let step = 1; step <= 6; step++) {
    const tile = s.tiles[(p.pos + step) % TILE_COUNT]!
    let score: number

    switch (tile.kind) {
      case 'property':
        if (tile.owner === null) score = 10 // 想买地
        else if (tile.owner === p.id) score = 4 // 想盖房
        else score = -Math.min(14, rentFor(s, tile.id, p.id) / 1_500) // 想避租
        break
      case 'start':
        score = 6
        break
      case 'park':
        score = 5
        break
      case 'bank':
      case 'stock':
        score = p.cash > 30_000 ? 3.5 : 1
        break
      case 'card':
      case 'news':
        score = 2
        break
      case 'lottery':
        score = p.tickets > 20 ? 2.5 : 0.5
        break
      case 'shop':
        score = 2
        break
      case 'gotojail':
      case 'tax':
        score = -9
        break
      case 'magic':
        score = 0.5
        break
      default:
        score = 1
    }

    // 轻微偏好大步数（推进得快），但不足以压过避租
    score += step * 0.15

    if (score > bestScore) {
      bestScore = score
      bestTarget = step
    }
  }

  return powerForTarget(bestTarget)
}

/* ---------- 买地 ---------- */

function decideBuy(s: GameState, p: Player, tileId: TileId): GameAction {
  const tile = s.tiles[tileId]!
  const liquid = p.cash + p.deposit
  const reserve = 8_000

  if (liquid - tile.price < reserve) return { type: 'DECLINE' }

  // 能凑齐一组就果断买
  if (tile.group) {
    const mates = s.tiles.filter((t) => t.group === tile.group)
    const mine = mates.filter((t) => t.owner === p.id).length
    if (mine >= mates.length - 1) return { type: 'BUY' }
    if (mine > 0 && liquid - tile.price > reserve * 3) return { type: 'BUY' }
  }

  // 便宜地无脑买；性格激进的更愿意出手
  const ratio = tile.price / Math.max(1, liquid)
  const threshold = p.characterId === 'juanmao' || p.characterId === 'dapai' ? 0.4 : 0.3
  if (ratio < threshold) return { type: 'BUY' }

  return { type: 'DECLINE' }
}

/* ---------- 盖房 ---------- */

function decideManage(s: GameState, p: Player, tileId: TileId): GameAction {
  const tile = s.tiles[tileId]!
  if (tile.level >= ECONOMY.MAX_LEVEL) return { type: 'END_TURN' }

  const cost = buildCost(tile)
  const liquid = p.cash + p.deposit
  if (liquid < cost * 2.5) return { type: 'END_TURN' }

  const mates = tile.group ? s.tiles.filter((t) => t.group === tile.group) : []
  const monopolized = mates.length > 0 && mates.every((t) => t.owner === p.id)

  // 垄断的地优先加高；否则只在钱很宽裕时盖
  if (monopolized || liquid > cost * 5) return { type: 'BUILD', tileId }

  return { type: 'END_TURN' }
}

/* ---------- 现金告急时变卖非核心地产 ---------- */

function maybeSell(s: GameState, p: Player): GameAction | null {
  if (p.cash + p.deposit > 25_000) return null

  const owned = s.tiles.filter((t) => t.kind === 'property' && t.owner === p.id)
  if (owned.length <= 1) return null

  // 优先卖「不在垄断组里」的、最便宜的地，保住能连片的资产
  const isMonopolyMember = (t: (typeof owned)[number]) =>
    !!t.group && s.tiles.filter((x) => x.group === t.group).every((x) => x.owner === p.id)

  const candidates = owned.filter((t) => !isMonopolyMember(t)).sort((a, b) => a.price - b.price)
  const target = candidates[0] ?? owned.slice().sort((a, b) => a.price - b.price)[0]
  return target ? { type: 'SELL', tileId: target.id } : null
}

/* ---------- 出牌：按「最有用」的优先级挑一张 ---------- */

function maybePlayCard(s: GameState, p: Player): GameAction | null {
  if (p.cards.length === 0) return null

  const has = (id: string) => p.cards.includes(id)
  const rivals = s.players.filter((q) => q.id !== p.id && !q.out)
  const richest = rivals.slice().sort((a, b) => b.cash + b.deposit - (a.cash + a.deposit))[0]

  // 1. 身上有坏神明，先送走
  if (p.god && !getGod(p.god.id).good && has('god')) return { type: 'PLAY_CARD', cardId: 'god' }

  // 2. 前方有路障，用机器娃娃清掉
  if (has('robot')) {
    for (let i = 1; i <= 10; i++) {
      if (s.tiles[(p.pos + i) % TILE_COUNT]!.barrier) return { type: 'PLAY_CARD', cardId: 'robot' }
    }
  }

  // 3. 抢富对手的卡
  if (richest && richest.cards.length > 0 && has('rob')) return { type: 'PLAY_CARD', cardId: 'rob' }

  // 4. 盖屋卡：给自己最贵的可升级地产加盖
  if (has('build')) {
    const own = s.tiles
      .filter((t) => t.kind === 'property' && t.owner === p.id && t.level < ECONOMY.MAX_LEVEL)
      .sort((a, b) => b.price - a.price)[0]
    if (own) return { type: 'PLAY_CARD', cardId: 'build' }
  }

  // 5. 拆屋卡：拆掉对手租金最高的房子
  if (has('demolish')) {
    const target = s.tiles
      .filter((t) => t.kind === 'property' && t.owner !== null && t.owner !== p.id && t.level > 0)
      .sort((a, b) => rentFor(s, b.id, p.id) - rentFor(s, a.id, p.id))[0]
    if (target) return { type: 'PLAY_CARD', cardId: 'demolish' }
  }

  // 6. 暂停卡：冻住比自己富的对手
  if (has('freeze') && richest && richest.cash + richest.deposit > (p.cash + p.deposit) * 1.2) {
    return { type: 'PLAY_CARD', cardId: 'freeze' }
  }

  // 7. 路障卡：放在自己前方可以设障的道路上
  if (has('barrier')) {
    for (let i = 1; i <= 12; i++) {
      const id = (p.pos + i) % TILE_COUNT
      const t = s.tiles[id]!
      if (t.kind !== 'property' && !t.barrier && id !== 0) {
        return { type: 'PLAY_CARD', cardId: 'barrier' }
      }
    }
  }

  return null
}

/* ---------- 设施 ---------- */

function decideFacility(s: GameState, p: Player, tileId: TileId): GameAction {
  const bail = maybeSell(s, p)
  if (bail) return bail

  const tile = s.tiles[tileId]!

  switch (tile.kind) {
    case 'bank': {
      const keep = 25_000
      if (p.cash > keep) return { type: 'DEPOSIT', amount: p.cash - keep }
      return { type: 'END_TURN' }
    }

    case 'stock': {
      if (p.cash < 50_000) return { type: 'END_TURN' }
      // 挑一只「低于基准价最多」的股票抄底
      const candidates = STOCKS.map((def) => {
        const price = s.stocks[def.symbol]?.price ?? def.basePrice
        return { def, price, discount: price / def.basePrice }
      }).sort((a, b) => a.discount - b.discount)

      const pickStock = candidates[0]!
      const budget = Math.round(p.cash * 0.3)
      const shares = Math.floor(budget / pickStock.price)
      if (shares >= 10) return { type: 'BUY_STOCK', symbol: pickStock.def.symbol, shares }
      return { type: 'END_TURN' }
    }

    case 'lottery': {
      if (p.tickets >= 10) return { type: 'BUY_LOTTERY', count: 10 }
      return { type: 'END_TURN' }
    }

    case 'shop': {
      if (p.cards.length >= ECONOMY.MAX_CARDS) return { type: 'END_TURN' }
      const affordable = CARDS.filter((c) => c.price <= p.cash * 0.25).sort((a, b) => b.price - a.price)
      if (affordable.length > 0) return { type: 'BUY_CARD', cardId: affordable[0]!.id }
      return { type: 'END_TURN' }
    }

    default:
      return { type: 'END_TURN' }
  }
}

/* ---------- 卡片目标 ---------- */

function pickTileTarget(s: GameState, p: Player, options: TileId[]): TileId {
  // 拆屋：拆租金最高的对手地产
  let best = options[0]!
  let bestValue = -Infinity
  for (const id of options) {
    const tile = s.tiles[id]!
    const value =
      tile.owner !== null && tile.owner !== p.id ? rentFor(s, id, p.id) : buildCost(tile) * -1
    if (value > bestValue) {
      bestValue = value
      best = id
    }
  }
  return best
}

function pickVictim(s: GameState, options: PlayerId[]): PlayerId {
  // 挑最富的对手下手
  let best = options[0]!
  let bestWorth = -Infinity
  for (const id of options) {
    const q = s.players[id]!
    const worth = q.cash + q.deposit
    if (worth > bestWorth) {
      bestWorth = worth
      best = id
    }
  }
  return best
}

/* ---------- 游乐场 ---------- */

function aiArcadeScore(p: Player): number {
  const base = { juanmao: 6, dapai: 7, jijimimi: 5, guaika: 6, afei: 7, dawei: 5 }[p.characterId] ?? 5
  return base
}
