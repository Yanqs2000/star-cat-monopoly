/**
 * 核心类型定义。
 *
 * 本文件（以及整个 src/core）不依赖 Vue、不依赖 DOM —— 所有规则都是纯函数，
 * 可以被 Vitest 直接单测，也可以在 Node 里跑整局模拟。
 */

/* ============================================================
   标识类型
   ============================================================ */

export type PlayerId = number
export type TileId = number
export type GroupId = string
export type StockSymbol = string
export type CardId = string
export type GodId = string
export type CharacterId = string

/* ============================================================
   棋盘
   ============================================================ */

export type TileKind =
  | 'start' // 起点（角落）
  | 'jail' // 监狱（角落，路过无事）
  | 'arcade' // 游乐场（角落，玩接财富小游戏）
  | 'park' // 星猫公园（角落，免费停留 + 小额奖励）
  | 'property' // 地产
  | 'bank' // 银行
  | 'stock' // 股市
  | 'lottery' // 彩市
  | 'news' // 新闻
  | 'shop' // 店铺
  | 'magic' // 魔法屋
  | 'gotojail' // 进监狱
  | 'tax' // 税务局
  | 'card' // 卡片格

/** 静态格子定义（来自 config/board.ts） */
export interface TileDef {
  readonly id: TileId
  readonly kind: TileKind
  readonly name: string
  /** 地产所属色组；非地产为 null */
  readonly group: GroupId | null
  /** 地价；非地产为 0 */
  readonly price: number
  /** 网格坐标（11×11 外围） */
  readonly row: number
  readonly col: number
}

/** 运行期格子状态 */
export interface Tile {
  readonly id: TileId
  readonly kind: TileKind
  readonly name: string
  readonly group: GroupId | null
  readonly price: number
  readonly row: number
  readonly col: number
  /** 拥有者；null = 无主 */
  owner: PlayerId | null
  /** 建筑等级 0..3 */
  level: number
  /** 是否被放置了路障卡 */
  barrier: boolean
}

/* ============================================================
   角色
   ============================================================ */

/** 角色技能：每回合一次的主动技（冷却若干回合） */
export interface SkillDef {
  readonly name: string
  readonly icon: string
  readonly cooldown: number
  readonly desc: string
}

export interface CharacterDef {
  readonly id: CharacterId
  readonly name: string
  /** 星座名，如「白羊座」 */
  readonly zodiac: string
  /** 性格标签，用于 AI 倾向 */
  readonly trait: 'aggressive' | 'steady' | 'cautious' | 'gambler'
  /** 主色 */
  readonly color: string
  /** 浅色（卡片底色） */
  readonly tint: string
  /** 毛色，用于生成 SVG */
  readonly fur: string
  readonly furLight: string
  readonly skill: SkillDef
}

/* ============================================================
   玩家
   ============================================================ */

export interface GodState {
  readonly id: GodId
  /** 还会附身多少回合 */
  turnsLeft: number
}

export interface Player {
  readonly id: PlayerId
  readonly characterId: CharacterId
  readonly name: string
  readonly isAI: boolean

  cash: number
  /** 银行存款 */
  deposit: number
  /** 最近一次存款的游戏日（用于按天计息） */
  depositDay: number
  /** 奖券 */
  tickets: number
  /** 持股数 */
  shares: Record<StockSymbol, number>

  /** 当前所在格 */
  pos: TileId
  /** 手牌 */
  cards: CardId[]
  /** 附身中的神明 */
  god: GodState | null
  /** 剩余监狱回合 */
  jailTurns: number
  /** 已完成的圈数 */
  laps: number
  /** 是否已出局 */
  out: boolean
  /** 技能剩余冷却 */
  skillCooldown: number

  /* ---------- 临时状态 ---------- */
  /** 本回合额外移动步数（回合结束时清零） */
  extraMove: number
  /** 本回合可以再掷一次骰子 */
  extraRoll: boolean
  /** 过路费减半的剩余回合数 */
  tollHalfTurns: number
  /** 需要跳过的回合数 */
  skipTurns: number
}

/* ============================================================
   股市
   ============================================================ */

export interface StockDef {
  readonly symbol: StockSymbol
  readonly name: string
  readonly basePrice: number
  /** 波动率，越大越疯 */
  readonly volatility: number
}

export interface StockState {
  price: number
  prevPrice: number
}

/* ============================================================
   卡片
   ============================================================ */

export type CardTarget =
  | { kind: 'none' }
  | { kind: 'tile'; filter: 'empty-road' | 'own-property' | 'opponent-property' }
  | { kind: 'player' }

export interface CardDef {
  readonly id: CardId
  readonly name: string
  readonly icon: string
  readonly price: number
  readonly desc: string
  readonly target: CardTarget
}

/* ============================================================
   神明
   ============================================================ */

export interface GodDef {
  readonly id: GodId
  readonly name: string
  readonly icon: string
  readonly good: boolean
  readonly desc: string
  /** 附身持续回合 */
  readonly duration: number
  /** 过路费倍率（财神 0.5 / 穷神 1.5 / 其余 1） */
  readonly tollMultiplier: number
  /** 购买/投资成功率（福神 1 / 衰神 0 / 其余 1） */
  readonly purchaseSuccessRate: number
}

/* ============================================================
   游戏状态
   ============================================================ */

export type Phase =
  | 'roll' // 等待当前玩家掷骰
  | 'decide' // 等待玩家决策
  | 'over'

export type WinReason = 'bankruptcy' | 'monopoly' | 'laps' | 'wealth'

export interface GameSettings {
  /** 胜利条件；'bankruptcy' = 淘汰制（最后一人） */
  readonly winCondition: WinReason
  /** 长跑胜利需要的圈数 */
  readonly lapsToWin: number
  /** 垄断胜利需要的「完整色组」数量 */
  readonly monopolyGroups: number
  /** 回合上限（防止无限局） */
  readonly maxRounds: number
  /** 人类玩家 id */
  readonly humanId: PlayerId
}

export type PendingDecision =
  /** 无主地产：买或不买 */
  | { kind: 'buy'; tileId: TileId; price: number }
  /** 自己的地产：盖房 / 卖地 */
  | { kind: 'manage'; tileId: TileId }
  /** 银行 / 股市 / 彩市 / 店铺：可操作，也可直接结束回合 */
  | { kind: 'facility'; tileId: TileId }
  /** 需要指定格子目标的卡片；resume 记录出牌前的决策，出牌后要还回去 */
  | { kind: 'card-target'; cardId: CardId; options: TileId[]; resume: PendingDecision | null }
  /** 需要指定对手的卡片 */
  | { kind: 'card-target-player'; cardId: CardId; options: PlayerId[]; resume: PendingDecision | null }
  /** 游乐场小游戏 */
  | { kind: 'arcade' }

export interface LogEntry {
  readonly day: number
  readonly text: string
  readonly tone: 'info' | 'good' | 'bad' | 'system' | 'trade'
}

export interface GameState {
  /** 随机种子（mulberry32 的当前状态，随每次随机推进） */
  rngState: number
  readonly settings: GameSettings

  /** 游戏日：每经过一轮所有玩家 +1 */
  day: number
  /** 当前回合数（从 1 开始） */
  round: number
  /** 当前玩家在 players 数组中的下标 */
  turn: number

  players: Player[]
  tiles: Tile[]
  stocks: Record<StockSymbol, StockState>

  phase: Phase
  pending: PendingDecision | null
  winner: PlayerId | null
  winReason: WinReason | null

  log: LogEntry[]
}

/* ============================================================
   玩家动作
   ============================================================ */

export type GameAction =
  /** 掷骰，power ∈ [0,1] 为力度 */
  | { type: 'ROLL'; power: number }
  /** 买下当前地块 */
  | { type: 'BUY' }
  /** 放弃购买 */
  | { type: 'DECLINE' }
  /** 在自己的地块上盖房 */
  | { type: 'BUILD'; tileId: TileId }
  /** 卖掉自己的地产 */
  | { type: 'SELL'; tileId: TileId }
  /** 结束决策阶段 */
  | { type: 'END_TURN' }
  /** 银行 */
  | { type: 'DEPOSIT'; amount: number }
  | { type: 'WITHDRAW'; amount: number }
  /** 股市 */
  | { type: 'BUY_STOCK'; symbol: StockSymbol; shares: number }
  | { type: 'SELL_STOCK'; symbol: StockSymbol; shares: number }
  /** 彩市 */
  | { type: 'BUY_LOTTERY'; count: number }
  /** 卡片商店 */
  | { type: 'BUY_CARD'; cardId: CardId }
  /** 使用卡片 */
  | { type: 'PLAY_CARD'; cardId: CardId }
  /** 卡片指定目标 */
  | { type: 'PICK_TARGET'; tileId?: TileId; playerId?: PlayerId }
  /** 游乐场小游戏结算 */
  | { type: 'ARCADE_RESULT'; score: number }
  /** 使用角色技能 */
  | { type: 'USE_SKILL' }

/* ============================================================
   引擎事件（供渲染层播放动画）
   ============================================================ */

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'ROUND_STARTED'; round: number; day: number }
  | { type: 'DICE_ROLLED'; player: PlayerId; power: number; value: number }
  | { type: 'MOVED'; player: PlayerId; from: TileId; to: TileId }
  | { type: 'PASSED_START'; player: PlayerId; salary: number }
  | { type: 'LANDED'; player: PlayerId; tileId: TileId }
  | { type: 'MONEY'; player: PlayerId; delta: number; reason: string }
  | { type: 'TOLL_PAID'; from: PlayerId; to: PlayerId; amount: number; tileId: TileId }
  | { type: 'PROPERTY_BOUGHT'; player: PlayerId; tileId: TileId; price: number }
  | { type: 'PROPERTY_SOLD'; player: PlayerId; tileId: TileId; amount: number }
  | { type: 'BUILT'; player: PlayerId; tileId: TileId; level: number }
  | { type: 'CARD_GAINED'; player: PlayerId; cardId: CardId }
  | { type: 'CARD_PLAYED'; player: PlayerId; cardId: CardId }
  | { type: 'GOD_ATTACHED'; player: PlayerId; godId: GodId; turns: number }
  | { type: 'GOD_LEFT'; player: PlayerId; godId: GodId }
  | { type: 'JAILED'; player: PlayerId; reason: string }
  | { type: 'RELEASED'; player: PlayerId }
  | { type: 'BANKRUPT'; player: PlayerId }
  | { type: 'STOCK_TRADED'; player: PlayerId; symbol: StockSymbol; shares: number; amount: number }
  | { type: 'LOTTERY_DRAWN'; player: PlayerId; prize: number }
  | { type: 'ARCADE_PLAYED'; player: PlayerId; score: number; reward: number }
  | { type: 'TURN_ENDED'; player: PlayerId }
  | { type: 'GAME_OVER'; winner: PlayerId; reason: WinReason }
  | { type: 'LOG'; entry: LogEntry }

/** 引擎一次 dispatch 的结果 */
export interface DispatchResult {
  readonly state: GameState
  readonly events: GameEvent[]
  /** 动作被拒绝时的原因（state 保持原样） */
  readonly error?: string
}
