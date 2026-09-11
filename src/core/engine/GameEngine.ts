import { TILE_COUNT, TILE_DEFS } from '../config/board'
import { CARD_BY_ID, CARDS, getCard } from '../config/cards'
import { CHARACTER_BY_ID, getCharacter } from '../config/characters'
import { ECONOMY } from '../config/economy'
import { ALL_GODS, GOOD_GODS, getGod } from '../config/gods'
import { STOCKS, getStock } from '../config/stocks'
import { rollWithPower } from '../dice'
import { accruedInterest, accrueDailyInterest, deposit, withdraw } from '../rules/bank'
import { receive, spend, transfer } from '../rules/money'
import { buildCost, monopoliesOf, rentFor, sellValue } from '../rules/rent'
import { advancePrices, buyCost, initialStockState, sellProceeds } from '../rules/stock'
import type {
  CharacterId,
  DispatchResult,
  GameAction,
  GameEvent,
  GameSettings,
  GameState,
  LogEntry,
  Player,
  PlayerId,
  Tile,
  TileId,
  WinReason,
} from '../types'
import { Rng } from './rng'

const DEFAULT_SETTINGS: GameSettings = {
  winCondition: 'bankruptcy',
  lapsToWin: 10,
  monopolyGroups: 3,
  maxRounds: 200,
  humanId: 0,
}

const REASON_TEXT: Record<WinReason, string> = {
  bankruptcy: '最后一位幸存者',
  monopoly: '垄断胜利',
  laps: '长跑胜利',
  wealth: '财富结算',
}

export function fmtMoney(n: number): string {
  return `¥${Math.round(n).toLocaleString('zh-CN')}`
}

/* ============================================================
   引擎
   ============================================================ */

export class GameEngine {
  private state: GameState
  private events: GameEvent[] = []

  constructor(seed: number, characterIds: CharacterId[], settings: Partial<GameSettings> = {}) {
    if (characterIds.length < 2 || characterIds.length > 4) throw new Error('需要 2~4 名玩家')
    this.state = createInitialState(seed, characterIds, { ...DEFAULT_SETTINGS, ...settings })
  }

  getState(): GameState {
    return this.state
  }

  /** 开局日志 */
  start(): DispatchResult {
    this.events = []
    const s = this.state
    this.log(s, `🎉 星猫乐园开盘！${s.players.map((p) => p.name).join('、')} 同场竞技`, 'system')
    this.emit({ type: 'GAME_STARTED' })
    return { state: s, events: this.events }
  }

  /* ---------- 主入口 ---------- */

  dispatch(action: GameAction): DispatchResult {
    if (this.state.phase === 'over') {
      return { state: this.state, events: [], error: '游戏已经结束了' }
    }

    const draft = structuredClone(this.state)
    const rng = new Rng(draft.rngState)
    this.events = []

    try {
      this.apply(draft, action, rng)
    } catch (err) {
      // 出错时丢弃整个 draft，保证状态原子性
      return { state: this.state, events: [], error: (err as Error).message }
    }

    draft.rngState = rng.state
    this.state = draft
    return { state: draft, events: this.events }
  }

  private apply(s: GameState, action: GameAction, rng: Rng): void {
    const actor = s.players[s.turn]!

    switch (action.type) {
      case 'ROLL':
        return this.handleRoll(s, actor, action.power, rng)
      case 'BUY':
        return this.handleBuy(s, actor)
      case 'DECLINE':
        this.requirePending(s, 'buy')
        s.pending = null
        return this.endTurn(s, actor)
      case 'BUILD':
        this.requireActable(s)
        return this.handleBuild(s, actor, action.tileId)
      case 'SELL':
        this.requireActable(s)
        return this.handleSell(s, actor, action.tileId)
      case 'END_TURN':
        if (s.phase !== 'decide') throw new Error('现在还不能结束回合')
        s.pending = null
        return this.endTurn(s, actor)
      case 'DEPOSIT':
        this.requireActable(s)
        return this.handleDeposit(s, actor, action.amount)
      case 'WITHDRAW':
        this.requireActable(s)
        return this.handleWithdraw(s, actor, action.amount)
      case 'BUY_STOCK':
        this.requireActable(s)
        return this.handleBuyStock(s, actor, action.symbol, action.shares)
      case 'SELL_STOCK':
        this.requireActable(s)
        return this.handleSellStock(s, actor, action.symbol, action.shares)
      case 'BUY_LOTTERY':
        this.requireActable(s)
        return this.handleLottery(s, actor, action.count, rng)
      case 'BUY_CARD':
        this.requireActable(s)
        return this.handleBuyCard(s, actor, action.cardId)
      case 'PLAY_CARD':
        return this.handlePlayCard(s, actor, action.cardId, rng)
      case 'PICK_TARGET':
        return this.handlePickTarget(s, actor, action.tileId, action.playerId, rng)
      case 'ARCADE_RESULT':
        return this.handleArcade(s, actor, action.score)
      case 'USE_SKILL':
        return this.handleSkill(s, actor, rng)
      default: {
        const never: never = action
        throw new Error(`未知动作: ${JSON.stringify(never)}`)
      }
    }
  }

  private requirePending(s: GameState, kind: string): void {
    if (s.phase !== 'decide') throw new Error('当前不能操作')
    if (!s.pending || s.pending.kind !== kind) throw new Error(`当前不是「${kind}」阶段`)
  }

  /**
   * 经营类动作（盖房/卖地/存取款/炒股/买彩票/买卡）的通用闸门：
   * 只允许在当前玩家的回合里做，且不能卡在「买地」「选目标」这类待决策上。
   */
  private requireActable(s: GameState): void {
    if (s.phase === 'over') throw new Error('游戏已经结束了')
    if (s.pending && s.pending.kind !== 'manage' && s.pending.kind !== 'facility') {
      throw new Error('现在不能操作地产或资产')
    }
  }

  /* ---------- 事件 / 日志 ---------- */

  private emit(event: GameEvent): void {
    this.events.push(event)
  }

  private log(s: GameState, text: string, tone: LogEntry['tone'] = 'info'): void {
    const entry: LogEntry = { day: s.day, text, tone }
    s.log.push(entry)
    if (s.log.length > 300) s.log.splice(0, s.log.length - 300)
    this.emit({ type: 'LOG', entry })
  }

  private money(s: GameState, p: Player, delta: number, reason: string): void {
    if (delta === 0) return
    if (delta > 0) receive(p, delta)
    else spend(p, -delta, s.day)
    this.emit({ type: 'MONEY', player: p.id, delta, reason })
  }

  /* ============================================================
     掷骰与移动
     ============================================================ */

  private handleRoll(s: GameState, p: Player, power: number, rng: Rng): void {
    if (s.phase !== 'roll') throw new Error('现在不能掷骰子')

    const base = rollWithPower(power, rng)
    const steps = base + p.extraMove
    p.extraMove = 0

    this.emit({ type: 'DICE_ROLLED', player: p.id, power, value: base })
    this.log(s, `🎲 ${p.name} 掷出 ${base} 点${steps !== base ? `（技能 +${steps - base}）` : ''}`)

    this.movePlayer(s, p, steps)
  }

  /** 逐格前进，途中处理起点薪水与路障 */
  private movePlayer(s: GameState, p: Player, steps: number): void {
    let pos = p.pos
    let blocked = false

    for (let i = 1; i <= steps; i++) {
      const prev = pos
      pos = (pos + 1) % TILE_COUNT
      this.emit({ type: 'MOVED', player: p.id, from: prev, to: pos })

      if (pos === 0) {
        p.laps++
        receive(p, ECONOMY.SALARY)
        this.emit({ type: 'PASSED_START', player: p.id, salary: ECONOMY.SALARY })
        this.log(s, `💰 ${p.name} 经过起点，领取薪水 ${fmtMoney(ECONOMY.SALARY)}`, 'good')
        if (this.checkLapWin(s, p)) return
      }

      // 路障：被拦停并消耗掉
      const tile = s.tiles[pos]!
      if (pos !== 0 && tile.barrier) {
        tile.barrier = false
        blocked = true
        this.log(s, `🚧 ${p.name} 撞上路障，停在了 ${tile.name}`, 'bad')
        break
      }
    }

    p.pos = pos
    if (blocked) return this.endTurn(s, p)
    this.resolveLanding(s, p)
  }

  /* ============================================================
     落地结算
     ============================================================ */

  private resolveLanding(s: GameState, p: Player): void {
    const tile = s.tiles[p.pos]!
    this.emit({ type: 'LANDED', player: p.id, tileId: tile.id })

    switch (tile.kind) {
      case 'property':
        return this.resolveProperty(s, p, tile)
      case 'start':
        this.money(s, p, 5_000, '停在起点')
        this.log(s, `🏁 ${p.name} 停在起点，额外获得 ${fmtMoney(5_000)}`, 'good')
        return this.endTurn(s, p)
      case 'park': {
        this.money(s, p, 8_000, '星猫公园')
        this.log(s, `🌳 ${p.name} 在星猫公园散步，捡到 ${fmtMoney(8_000)}`, 'good')
        return this.endTurn(s, p)
      }
      case 'jail':
        this.log(s, `🚔 ${p.name} 路过监狱，探望了一下老朋友`)
        return this.endTurn(s, p)
      case 'gotojail':
        this.sendToJail(s, p, '被星猫警长逮个正着')
        return this.endTurn(s, p)
      case 'tax': {
        const amount = Math.max(ECONOMY.TAX_MIN, Math.round(p.cash * ECONOMY.TAX_RATE))
        this.money(s, p, -amount, '税务局')
        this.log(s, `🧾 ${p.name} 缴税 ${fmtMoney(amount)}`, 'bad')
        return this.endTurn(s, p)
      }
      case 'news':
        return this.handleNews(s, p)
      case 'magic':
        return this.handleMagic(s, p)
      case 'card':
        this.giveCard(s, p, 1)
        return this.endTurn(s, p)
      case 'bank':
      case 'stock':
      case 'lottery':
      case 'shop':
        s.pending = { kind: 'facility', tileId: tile.id }
        s.phase = 'decide'
        this.log(s, `🏛️ ${p.name} 来到 ${tile.name}`)
        return
      case 'arcade':
        s.pending = { kind: 'arcade' }
        s.phase = 'decide'
        this.log(s, `🎡 ${p.name} 进入游乐场`)
        return
    }
  }

  private resolveProperty(s: GameState, p: Player, tile: Tile): void {
    if (tile.owner === null) {
      s.pending = { kind: 'buy', tileId: tile.id, price: tile.price }
      s.phase = 'decide'
      return
    }
    if (tile.owner === p.id) {
      s.pending = { kind: 'manage', tileId: tile.id }
      s.phase = 'decide'
      return
    }

    const owner = s.players[tile.owner]!
    const rent = rentFor(s, tile.id, p.id)
    const { paid, spend: result } = transfer(p, owner, rent, s.day)

    if (result.forfeitedInterest > 0) {
      this.log(s, `⚠️ ${p.name} 现金不足，强制支取存款，损失利息 ${fmtMoney(result.forfeitedInterest)}`, 'bad')
    }
    this.emit({ type: 'TOLL_PAID', from: p.id, to: owner.id, amount: paid, tileId: tile.id })
    this.log(s, `💸 ${p.name} 踩到 ${owner.name} 的 ${tile.name}，付过路费 ${fmtMoney(paid)}`, 'bad')

    if (result.shortfall > 0) {
      this.raiseCash(s, p, result.shortfall, owner)
    }
    return this.endTurn(s, p)
  }

  /* ============================================================
     买地 / 盖房 / 卖地
     ============================================================ */

  private handleBuy(s: GameState, p: Player): void {
    this.requirePending(s, 'buy')
    const pending = s.pending as Extract<GameState['pending'], { kind: 'buy' }>
    const tile = s.tiles[pending.tileId]!

    if (p.god && getGod(p.god.id).purchaseSuccessRate < 1) {
      this.log(s, `💀 ${p.name} 被衰神缠身，没能买下 ${tile.name}`, 'bad')
      s.pending = null
      return this.endTurn(s, p)
    }
    if (p.cash + p.deposit + accruedInterest(p, s.day) < tile.price) {
      this.log(s, `😿 ${p.name} 资金不足，买不起 ${tile.name}`, 'bad')
      s.pending = null
      return this.endTurn(s, p)
    }

    const result = spend(p, tile.price, s.day)
    if (result.forfeitedInterest > 0) {
      this.log(s, `⚠️ ${p.name} 现金不足，强制支取存款，损失利息 ${fmtMoney(result.forfeitedInterest)}`, 'bad')
    }
    tile.owner = p.id
    this.emit({ type: 'PROPERTY_BOUGHT', player: p.id, tileId: tile.id, price: tile.price })
    this.log(s, `🏠 ${p.name} 买下了 ${tile.name}（${fmtMoney(tile.price)}）`, 'good')

    if (tile.group && monopoliesOf(s, p.id).includes(tile.group)) {
      this.log(s, `👑 ${p.name} 垄断了「${tile.group}」色组，过路费翻倍！`, 'system')
    }

    s.pending = null
    if (this.checkMonopolyWin(s, p)) return
    return this.endTurn(s, p)
  }

  private handleBuild(s: GameState, p: Player, tileId: TileId): void {
    const tile = s.tiles[tileId]
    if (!tile || tile.kind !== 'property') throw new Error('这里不能盖房')
    if (tile.owner !== p.id) throw new Error('只能在自己的地产上盖房')
    if (tile.level >= ECONOMY.MAX_LEVEL) throw new Error('已经满级了')

    const cost = buildCost(tile)
    if (p.cash + p.deposit + accruedInterest(p, s.day) < cost) throw new Error('资金不足')

    spend(p, cost, s.day)
    tile.level++
    this.emit({ type: 'BUILT', player: p.id, tileId: tile.id, level: tile.level })
    this.log(s, `🏗️ ${p.name} 把 ${tile.name} 盖到 ${tile.level} 级（${fmtMoney(cost)}）`, 'good')
  }

  private handleSell(s: GameState, p: Player, tileId: TileId): void {
    const tile = s.tiles[tileId]
    if (!tile || tile.kind !== 'property') throw new Error('这里没有地产')
    if (tile.owner !== p.id) throw new Error('只能卖自己的地产')

    const amount = sellValue(tile)
    tile.owner = null
    tile.level = 0
    tile.barrier = false
    receive(p, amount)
    this.emit({ type: 'PROPERTY_SOLD', player: p.id, tileId: tile.id, amount })
    this.log(s, `💵 ${p.name} 卖掉了 ${tile.name}，得到 ${fmtMoney(amount)}`, 'info')
  }

  /* ============================================================
     银行 / 股市 / 彩市 / 游乐场
     ============================================================ */

  private handleDeposit(s: GameState, p: Player, amount: number): void {
    const { interest, added } = deposit(p, amount, s.day)
    if (interest > 0) this.log(s, `🏦 ${p.name} 存款结息 ${fmtMoney(interest)}`, 'good')
    this.log(s, `🏦 ${p.name} 存入 ${fmtMoney(added)}`)
  }

  private handleWithdraw(s: GameState, p: Player, amount: number): void {
    const { interest, taken } = withdraw(p, amount, s.day)
    if (interest > 0) this.log(s, `🏦 ${p.name} 存款结息 ${fmtMoney(interest)}`, 'good')
    this.log(s, `🏦 ${p.name} 取出 ${fmtMoney(taken)}`)
  }

  private handleBuyStock(s: GameState, p: Player, symbol: string, shares: number): void {
    const stock = s.stocks[symbol]
    if (!stock) throw new Error('没有这只股票')
    if (shares <= 0) throw new Error('数量不对')

    const cost = buyCost(shares, stock.price)
    if (p.cash + p.deposit + accruedInterest(p, s.day) < cost) throw new Error('资金不足')

    const result = spend(p, cost, s.day)
    if (result.forfeitedInterest > 0) {
      this.log(s, `⚠️ ${p.name} 现金不足，强制支取存款买股票，损失利息 ${fmtMoney(result.forfeitedInterest)}`, 'bad')
    }
    p.shares[symbol] = (p.shares[symbol] ?? 0) + shares
    this.emit({ type: 'STOCK_TRADED', player: p.id, symbol, shares, amount: cost })
    this.log(s, `📈 ${p.name} 买入 ${getStock(symbol).name} ${shares} 股（${fmtMoney(cost)}）`, 'trade')
  }

  private handleSellStock(s: GameState, p: Player, symbol: string, shares: number): void {
    const stock = s.stocks[symbol]
    if (!stock) throw new Error('没有这只股票')
    const owned = p.shares[symbol] ?? 0
    if (shares <= 0 || shares > owned) throw new Error('持股不足')

    const proceeds = sellProceeds(shares, stock.price)
    p.shares[symbol] = owned - shares
    receive(p, proceeds)
    this.emit({ type: 'STOCK_TRADED', player: p.id, symbol, shares: -shares, amount: proceeds })
    this.log(s, `📉 ${p.name} 卖出 ${getStock(symbol).name} ${shares} 股（${fmtMoney(proceeds)}）`, 'trade')
  }

  private handleLottery(s: GameState, p: Player, count: number, rng: Rng): void {
    const n = Math.max(1, Math.floor(count))
    if (p.tickets < n) throw new Error('奖券不足')

    p.tickets -= n
    let prize = 0
    let hits = 0
    for (let i = 0; i < n; i++) {
      const roll = rng.next()
      if (roll < 0.02) {
        prize += ECONOMY.LOTTERY_BASE_POOL
        hits++
      } else if (roll < 0.12) {
        prize += 5_000
        hits++
      } else if (roll < 0.35) {
        prize += 1_000
        hits++
      }
    }
    if (prize > 0) receive(p, prize)
    this.emit({ type: 'LOTTERY_DRAWN', player: p.id, prize })
    this.log(
      s,
      prize > 0
        ? `🎟️ ${p.name} 刮了 ${n} 张彩票，中了 ${fmtMoney(prize)}（${hits} 张有奖）`
        : `🎟️ ${p.name} 刮了 ${n} 张彩票，一张没中`,
      prize > 0 ? 'good' : 'bad',
    )
  }

  private handleBuyCard(s: GameState, p: Player, cardId: string): void {
    const card = getCard(cardId)
    if (p.cards.length >= ECONOMY.MAX_CARDS) throw new Error('手牌已满')
    if (p.cash + p.deposit + accruedInterest(p, s.day) < card.price) throw new Error('资金不足')

    spend(p, card.price, s.day)
    p.cards.push(cardId)
    this.emit({ type: 'CARD_GAINED', player: p.id, cardId })
    this.log(s, `🛒 ${p.name} 在卡片商店买了 ${card.icon} ${card.name}（${fmtMoney(card.price)}）`)
  }

  private handleArcade(s: GameState, p: Player, score: number): void {
    this.requirePending(s, 'arcade')
    const points = Math.max(0, Math.floor(score))
    const reward = points * ECONOMY.ARCADE_REWARD_PER_POINT
    if (reward > 0) receive(p, reward)
    this.emit({ type: 'ARCADE_PLAYED', player: p.id, score: points, reward })
    this.log(s, `🎡 ${p.name} 在游乐场接住 ${points} 个财富，兑换 ${fmtMoney(reward)}`, 'good')
    s.pending = null
    return this.endTurn(s, p)
  }

  /* ============================================================
     卡片
     ============================================================ */

  private giveCard(s: GameState, p: Player, count: number): void {
    for (let i = 0; i < count; i++) {
      if (p.cards.length >= ECONOMY.MAX_CARDS) {
        this.log(s, `🃏 ${p.name} 手牌已满`)
        return
      }
      const rng = new Rng(s.rngState)
      const card = rng.pick(CARDS)
      s.rngState = rng.state
      p.cards.push(card.id)
      this.emit({ type: 'CARD_GAINED', player: p.id, cardId: card.id })
      this.log(s, `🃏 ${p.name} 获得一张 ${card.icon} ${card.name}`)
    }
  }

  private handlePlayCard(s: GameState, p: Player, cardId: string, rng: Rng): void {
    const canPlayHere =
      s.phase === 'roll' ||
      (s.phase === 'decide' && (s.pending?.kind === 'manage' || s.pending?.kind === 'facility'))
    if (!canPlayHere) throw new Error('现在不能使用卡片')

    const idx = p.cards.indexOf(cardId)
    if (idx < 0) throw new Error('手里没有这张卡')
    const card = getCard(cardId)

    // 出牌前若正停在「自己的地」或「设施」上，出完牌要还回去
    const resume =
      s.pending && (s.pending.kind === 'manage' || s.pending.kind === 'facility') ? s.pending : null

    if (card.target.kind === 'tile') {
      const options = this.targetTiles(s, p, card.target.filter)
      if (options.length === 0) throw new Error('没有可以指定的目标')
      p.cards.splice(idx, 1)
      this.emit({ type: 'CARD_PLAYED', player: p.id, cardId })
      s.pending = { kind: 'card-target', cardId, options, resume }
      s.phase = 'decide'
      return
    }

    if (card.target.kind === 'player') {
      const options = s.players.filter((q) => q.id !== p.id && !q.out).map((q) => q.id)
      if (options.length === 0) throw new Error('没有可以指定的对手')
      p.cards.splice(idx, 1)
      this.emit({ type: 'CARD_PLAYED', player: p.id, cardId })
      s.pending = { kind: 'card-target-player', cardId, options, resume }
      s.phase = 'decide'
      return
    }

    // 无需目标：立即生效，回合继续
    p.cards.splice(idx, 1)
    this.emit({ type: 'CARD_PLAYED', player: p.id, cardId })
    this.applyCardEffect(s, p, cardId, rng, null, null)
  }

  private handlePickTarget(
    s: GameState,
    p: Player,
    tileId: TileId | undefined,
    playerId: PlayerId | undefined,
    rng: Rng,
  ): void {
    const pending = s.pending
    if (!pending || (pending.kind !== 'card-target' && pending.kind !== 'card-target-player')) {
      throw new Error('现在不需要选择目标')
    }
    this.applyCardEffect(s, p, pending.cardId, rng, tileId ?? null, playerId ?? null)

    // 出牌不结束回合：回到出牌前的决策（若没有，就回到「等待掷骰」）
    if (pending.resume) {
      s.pending = pending.resume
      s.phase = 'decide'
    } else {
      s.pending = null
      s.phase = 'roll'
    }
  }

  private targetTiles(s: GameState, p: Player, filter: string): TileId[] {
    if (filter === 'own-property') {
      return s.tiles
        .filter((t) => t.kind === 'property' && t.owner === p.id && t.level < ECONOMY.MAX_LEVEL)
        .map((t) => t.id)
    }
    if (filter === 'opponent-property') {
      return s.tiles
        .filter((t) => t.kind === 'property' && t.owner !== null && t.owner !== p.id && t.level > 0)
        .map((t) => t.id)
    }
    // empty-road：前方 12 格内、没有路障的非地产格
    const options: TileId[] = []
    for (let i = 1; i <= 12; i++) {
      const id = (p.pos + i) % TILE_COUNT
      const t = s.tiles[id]!
      if (t.kind !== 'property' && !t.barrier && id !== 0) options.push(id)
    }
    return options
  }

  private applyCardEffect(
    s: GameState,
    p: Player,
    cardId: string,
    rng: Rng,
    tileId: TileId | null,
    playerId: PlayerId | null,
  ): void {
    const card = CARD_BY_ID[cardId]
    if (!card) throw new Error('未知卡片')

    switch (cardId) {
      case 'barrier': {
        if (tileId === null) throw new Error('需要指定格子')
        s.tiles[tileId]!.barrier = true
        this.log(s, `🚧 ${p.name} 在 ${s.tiles[tileId]!.name} 放置了路障`)
        break
      }
      case 'robot': {
        let cleared = 0
        for (let i = 1; i <= 10; i++) {
          const t = s.tiles[(p.pos + i) % TILE_COUNT]!
          if (t.barrier) {
            t.barrier = false
            cleared++
          }
        }
        this.log(s, `🤖 ${p.name} 的机器娃娃清除了 ${cleared} 个路障`)
        break
      }
      case 'rob': {
        const target = s.players[playerId ?? -1]
        if (!target) throw new Error('需要指定对手')
        if (target.cards.length === 0) {
          this.log(s, `🫳 ${p.name} 想抢 ${target.name} 的卡，但对方手上没牌`, 'bad')
          break
        }
        const stolen = rng.pick(target.cards)
        target.cards.splice(target.cards.indexOf(stolen), 1)
        p.cards.push(stolen)
        this.log(s, `🫳 ${p.name} 从 ${target.name} 手里抢走了 ${getCard(stolen).icon} ${getCard(stolen).name}`, 'bad')
        break
      }
      case 'build': {
        if (tileId === null) throw new Error('需要指定地产')
        const tile = s.tiles[tileId]!
        tile.level++
        this.emit({ type: 'BUILT', player: p.id, tileId, level: tile.level })
        this.log(s, `🏗️ ${p.name} 用盖屋卡把 ${tile.name} 盖到 ${tile.level} 级`, 'good')
        break
      }
      case 'demolish': {
        if (tileId === null) throw new Error('需要指定地产')
        const tile = s.tiles[tileId]!
        tile.level = Math.max(0, tile.level - 1)
        this.log(s, `💣 ${p.name} 用拆屋卡把 ${tile.name} 拆到 ${tile.level} 级`, 'bad')
        break
      }
      case 'freeze': {
        const target = s.players[playerId ?? -1]
        if (!target) throw new Error('需要指定对手')
        target.skipTurns += 1
        this.log(s, `⏸️ ${p.name} 冻结了 ${target.name}，对方下回合暂停`, 'bad')
        break
      }
      case 'god': {
        if (p.god && !getGod(p.god.id).good) {
          const old = p.god.id
          p.god = null
          this.emit({ type: 'GOD_LEFT', player: p.id, godId: old })
          this.log(s, `🧧 ${p.name} 送走了 ${getGod(old).icon} ${getGod(old).name}`, 'good')
        } else {
          this.attachGod(s, p, rng.pick(GOOD_GODS))
        }
        break
      }
      default:
        throw new Error(`卡片 ${cardId} 没有实现`)
    }
  }

  /* ============================================================
     神明
     ============================================================ */

  private attachGod(s: GameState, p: Player, godId: string): void {
    const god = getGod(godId)
    if (p.god) this.emit({ type: 'GOD_LEFT', player: p.id, godId: p.god.id })
    p.god = { id: godId, turnsLeft: god.duration }
    this.emit({ type: 'GOD_ATTACHED', player: p.id, godId, turns: god.duration })
    this.log(
      s,
      `${god.icon} ${p.name} 被 ${god.name} 附身（${god.duration} 回合）：${god.desc}`,
      god.good ? 'good' : 'bad',
    )

    if (godId === 'caishen') this.money(s, p, 20_000, '财神附身')
    if (godId === 'fushen') this.giveCard(s, p, 1)
    if (godId === 'shuaishen' && p.cards.length > 0) {
      const lost = p.cards.pop()!
      this.log(s, `💀 ${p.name} 被衰神夺走了 ${getCard(lost).name}`, 'bad')
    }
    if (godId === 'qiongshen') this.money(s, p, -15_000, '穷神附身')
  }

  private tickGods(s: GameState): void {
    for (const p of s.players) {
      if (p.out) continue
      if (p.tollHalfTurns > 0) p.tollHalfTurns--
      if (!p.god) continue
      p.god.turnsLeft--
      if (p.god.turnsLeft <= 0) {
        const godId = p.god.id
        p.god = null
        this.emit({ type: 'GOD_LEFT', player: p.id, godId })
        this.log(s, `${getGod(godId).icon} ${p.name} 身上的 ${getGod(godId).name} 离开了`)
      }
    }
  }

  /* ============================================================
     新闻 / 魔法屋
     ============================================================ */

  private handleNews(s: GameState, p: Player): void {
    const rng = new Rng(s.rngState)
    const roll = rng.next()
    if (roll < 0.5) {
      const bonus = rng.int(5_000, ECONOMY.NEWS_BONUS_MAX)
      s.rngState = rng.state
      this.money(s, p, bonus, '天上掉馅饼')
      this.log(s, `🥧 天上掉馅饼！${p.name} 获得 ${fmtMoney(bonus)}`, 'good')
    } else {
      const fine = rng.int(3_000, ECONOMY.NEWS_FINE_MAX)
      s.rngState = rng.state
      this.money(s, p, -fine, '飞来横祸')
      this.log(s, `💥 飞来横祸！${p.name} 损失 ${fmtMoney(fine)}`, 'bad')
    }
    return this.endTurn(s, p)
  }

  private handleMagic(s: GameState, p: Player): void {
    const rng = new Rng(s.rngState)
    const roll = rng.next()
    s.rngState = rng.state

    if (roll < 0.45) {
      this.attachGod(s, p, rng.pick(ALL_GODS))
      s.rngState = rng.state
    } else if (roll < 0.75) {
      s.rngState = rng.state
      this.giveCard(s, p, 1)
    } else {
      const amount = rng.int(10_000, 40_000)
      const gain = rng.chance(0.5)
      s.rngState = rng.state
      this.money(s, p, gain ? amount : -amount, '魔法屋')
      this.log(s, `🔮 魔法屋：${p.name} ${gain ? '获得' : '失去'} ${fmtMoney(amount)}`, gain ? 'good' : 'bad')
    }
    return this.endTurn(s, p)
  }

  /* ============================================================
     角色技能
     ============================================================ */

  private handleSkill(s: GameState, p: Player, rng: Rng): void {
    if (p.skillCooldown > 0) throw new Error(`技能冷却中（还剩 ${p.skillCooldown} 回合）`)
    const skill = CHARACTER_BY_ID[p.characterId]!.skill
    p.skillCooldown = skill.cooldown

    const others = s.players.filter((q) => q.id !== p.id && !q.out)

    switch (p.characterId) {
      case 'juanmao':
      case 'ajie':
        p.extraMove += p.characterId === 'juanmao' ? 2 : 3
        break
      case 'aniu':
        p.tollHalfTurns = 3
        break
      case 'jijimimi':
        this.giveCard(s, p, 2)
        break
      case 'jiajia':
        receive(p, Math.round(p.deposit * 0.1))
        break
      case 'dapai': {
        if (others.length) {
          const target = rng.pick(others)
          transfer(target, p, Math.min(15_000, target.cash + target.deposit), s.day)
        }
        break
      }
      case 'weiwei':
        if (p.god && !getGod(p.god.id).good) {
          this.emit({ type: 'GOD_LEFT', player: p.id, godId: p.god.id })
          p.god = null
        }
        this.giveCard(s, p, 1)
        break
      case 'shuaige': {
        const total = p.cash + p.deposit
        p.cash = Math.round(total / 2)
        p.deposit = total - p.cash
        p.depositDay = s.day
        break
      }
      case 'dawei':
        if (others.length) rng.pick(others).skipTurns += 1
        break
      case 'afei':
        p.extraRoll = true
        break
      case 'guaika':
        receive(p, rng.int(20_000, 60_000))
        break
      case 'nini':
        p.tickets += 3
        receive(p, 10_000)
        break
      default:
        throw new Error('角色技能未实现')
    }

    this.log(s, `✨ ${p.name} 使用了技能「${skill.icon} ${skill.name}」`, 'system')
  }

  /* ============================================================
     监狱 / 破产 / 回合推进
     ============================================================ */

  private sendToJail(s: GameState, p: Player, reason: string): void {
    p.pos = 10
    p.jailTurns = ECONOMY.JAIL_SKIP
    this.emit({ type: 'JAILED', player: p.id, reason })
    this.log(s, `🔒 ${p.name} ${reason}，进监狱反省 ${ECONOMY.JAIL_SKIP} 回合`, 'bad')
  }

  /** 变卖资产还债；仍不够则破产 */
  private raiseCash(s: GameState, p: Player, need: number, creditor: Player): void {
    let owed = need
    const owned = s.tiles
      .filter((t) => t.kind === 'property' && t.owner === p.id)
      .sort((a, b) => sellValue(a) - sellValue(b))

    for (const tile of owned) {
      if (owed <= 0) break
      const amount = sellValue(tile)
      tile.owner = creditor.id
      tile.level = 0
      tile.barrier = false
      // 卖地所得优先抵债，剩余进自己口袋
      const toCreditor = Math.min(amount, owed)
      receive(creditor, toCreditor)
      receive(p, amount - toCreditor)
      owed -= toCreditor
      this.log(s, `🔨 ${p.name} 把 ${tile.name} 抵给了 ${creditor.name}（${fmtMoney(amount)}）`, 'bad')
    }

    if (p.cash + p.deposit <= 0) {
      p.out = true
      p.cards = []
      p.god = null
      for (const tile of s.tiles) if (tile.owner === p.id) tile.owner = creditor.id
      this.emit({ type: 'BANKRUPT', player: p.id })
      this.log(s, `💀 ${p.name} 破产出局！`, 'bad')
      this.checkLastStanding(s)
    }
  }

  private endTurn(s: GameState, p: Player): void {
    // 阿飞的「流星」：本回合再掷一次
    if (p.extraRoll) {
      p.extraRoll = false
      p.extraMove = 0
      s.phase = 'roll'
      s.pending = null
      this.log(s, `🌠 ${p.name} 触发流星，可以再掷一次骰子`)
      return
    }
    p.extraMove = 0
    this.emit({ type: 'TURN_ENDED', player: p.id })
    this.advanceTurn(s)
  }

  private advanceTurn(s: GameState): void {
    if (s.phase === 'over') return
    if (this.checkLastStanding(s)) return

    const n = s.players.length
    for (let guard = 0; guard < n * 4; guard++) {
      s.turn = (s.turn + 1) % n
      if (s.turn === 0) {
        this.onNewRound(s)
        if (s.winner !== null) return
        if (s.round > s.settings.maxRounds) return this.finishByWealth(s)
      }
      const p = s.players[s.turn]!
      if (p.out) continue

      // 监狱：跳过本回合
      if (p.jailTurns > 0) {
        p.jailTurns--
        this.emit({ type: 'RELEASED', player: p.id })
        this.log(
          s,
          `🔒 ${p.name} 在监狱里蹲着，跳过本回合${p.jailTurns === 0 ? '（下回合出狱）' : ''}`,
          'info',
        )
        continue
      }
      if (this.consumeSkip(s, p)) continue

      s.phase = 'roll'
      s.pending = null
      return
    }
    // 兜底：所有人都不行动
    this.finishByWealth(s)
  }

  private consumeSkip(s: GameState, p: Player): boolean {
    if (p.skipTurns <= 0) return false
    p.skipTurns--
    this.log(s, `⏸️ ${p.name} 被暂停，跳过本回合`)
    return true
  }

  private onNewRound(s: GameState): void {
    s.round++
    s.day++

    const credits = accrueDailyInterest(s.players, s.day)
    for (const c of credits) {
      this.log(s, `🏦 ${s.players[c.playerId]!.name} 存款利息 ${fmtMoney(c.interest)}`, 'good')
    }

    const rng = new Rng(s.rngState)
    const moves = advancePrices(s.stocks, rng)
    s.rngState = rng.state
    const top = moves.slice().sort((a, b) => Math.abs(b.changeRatio) - Math.abs(a.changeRatio))[0]
    if (top) {
      this.log(
        s,
        `📊 股市收盘：${top.name} ${top.changeRatio >= 0 ? '涨' : '跌'} ${Math.abs(top.changeRatio * 100).toFixed(1)}%`,
        'trade',
      )
    }

    this.tickGods(s)
    this.emit({ type: 'ROUND_STARTED', round: s.round, day: s.day })
  }

  /* ============================================================
     胜利判定
     ============================================================ */

  private checkLastStanding(s: GameState): boolean {
    const alive = s.players.filter((p) => !p.out)
    if (alive.length <= 1) {
      this.finish(s, alive[0]?.id ?? 0, 'bankruptcy')
      return true
    }
    return false
  }

  private checkLapWin(s: GameState, p: Player): boolean {
    if (s.settings.winCondition !== 'laps') return false
    if (p.laps >= s.settings.lapsToWin) {
      this.finish(s, p.id, 'laps')
      return true
    }
    return false
  }

  private checkMonopolyWin(s: GameState, p: Player): boolean {
    if (s.settings.winCondition !== 'monopoly') return false
    if (monopoliesOf(s, p.id).length >= s.settings.monopolyGroups) {
      this.finish(s, p.id, 'monopoly')
      return true
    }
    return false
  }

  private finishByWealth(s: GameState): void {
    const best = s.players
      .filter((p) => !p.out)
      .slice()
      .sort((a, b) => this.netWorth(s, b) - this.netWorth(s, a))[0]
    if (best) this.finish(s, best.id, 'wealth')
  }

  private finish(s: GameState, winnerId: PlayerId, reason: WinReason): void {
    s.phase = 'over'
    s.pending = null
    s.winner = winnerId
    s.winReason = reason
    const winner = s.players[winnerId]
    this.emit({ type: 'GAME_OVER', winner: winnerId, reason })
    this.log(s, `🏆 ${winner?.name ?? '???'} 获胜！（${REASON_TEXT[reason]}）`, 'system')
  }

  /* ---------- 查询 ---------- */

  /** 总资产：现金 + 存款（含未结利息）+ 地产估值 + 股票市值 */
  netWorth(s: GameState, p: Player): number {
    let total = p.cash + p.deposit + accruedInterest(p, s.day)
    for (const t of s.tiles) {
      if (t.kind === 'property' && t.owner === p.id) total += sellValue(t)
    }
    for (const def of STOCKS) {
      const shares = p.shares[def.symbol] ?? 0
      total += shares * (s.stocks[def.symbol]?.price ?? def.basePrice)
    }
    return Math.round(total)
  }

  ranking(s: GameState): { player: Player; netWorth: number; rank: number }[] {
    return s.players
      .slice()
      .sort((a, b) => {
        if (a.out !== b.out) return a.out ? 1 : -1
        return this.netWorth(s, b) - this.netWorth(s, a)
      })
      .map((p, i) => ({ player: p, netWorth: this.netWorth(s, p), rank: i + 1 }))
  }
}

/* ============================================================
   初始化
   ============================================================ */

function createInitialState(seed: number, characterIds: CharacterId[], settings: GameSettings): GameState {
  const rng = new Rng(seed)
  const sharePerStock = Math.floor(ECONOMY.START_SHARES / STOCKS.length)

  const players: Player[] = characterIds.map((cid, i) => {
    const character = getCharacter(cid)
    return {
      id: i,
      characterId: cid,
      name: character.name,
      isAI: i !== settings.humanId,
      cash: ECONOMY.START_CASH,
      deposit: ECONOMY.START_DEPOSIT,
      depositDay: 1,
      tickets: ECONOMY.START_TICKETS,
      shares: Object.fromEntries(STOCKS.map((s) => [s.symbol, sharePerStock])),
      pos: 0,
      cards: [],
      god: null,
      jailTurns: 0,
      laps: 0,
      out: false,
      skillCooldown: 0,
      extraMove: 0,
      extraRoll: false,
      tollHalfTurns: 0,
      skipTurns: 0,
    }
  })

  for (const p of players) {
    for (let i = 0; i < ECONOMY.START_CARDS; i++) p.cards.push(rng.pick(CARDS).id)
  }

  return {
    rngState: rng.state,
    settings,
    day: 1,
    round: 1,
    turn: 0,
    players,
    tiles: TILE_DEFS.map((def) => ({ ...def, owner: null, level: 0, barrier: false })),
    stocks: initialStockState(),
    phase: 'roll',
    pending: null,
    winner: null,
    winReason: null,
    log: [],
  }
}
