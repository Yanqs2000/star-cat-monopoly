import rules from '../../data/rules.json'
import worldRules from '../../data/world-rules.json'
import { createCardInventory } from './card-economy'
import { randomInt } from './random'
import { createFinanceState } from './finance-setup'
import type { CalendarDate } from './finance-types'
import { createPropertyLedger, createPropertyPrices } from './property'
import type { Direction, GameState, Hometown, PlayerController } from './types'
import { createWorldState } from './world-cards'

const CHARACTER_NAMES = [
  '卷毛', '阿牛', '吉吉&米米', '佳佳', '大牌', '薇薇',
  '帅戈', '大尾', '阿飞', '阿杰', '怪卡', '妮妮',
] as const

function takeRandom<T>(values: T[], rngState: number): { value: T; rngState: number } {
  const draw = randomInt(rngState, values.length)
  const [value] = values.splice(draw.value, 1)
  return { value: value!, rngState: draw.nextState }
}

/** Pure/headless callers default to Monday (1); the UI injects local getDay() once. */
export function createGame(
  humanCharacterIds: number[], seed: number, initialWeekday = 1,
  initialDate: CalendarDate = { year: 2026, month: 1, day: 5 },
): GameState {
  if (humanCharacterIds.length < 1 || humanCharacterIds.length > 4 ||
      humanCharacterIds.some(id => !Number.isInteger(id) || id < 1 || id > 12) ||
      new Set(humanCharacterIds).size !== humanCharacterIds.length) {
    throw new Error('人类角色必须是1至4个不重复的1..12整数')
  }
  if (!Number.isInteger(seed) || seed < 0 || seed >= 0x1_0000_0000) throw new Error('种子必须是uint32')

  let rngState = seed
  const selected = humanCharacterIds.map(characterId => ({ characterId, controller: 'human' as PlayerController }))
  const availableCharacters = Array.from({ length: 12 }, (_, index) => index + 1)
    .filter(id => !humanCharacterIds.includes(id))
  while (selected.length < 4) {
    const draw = takeRandom(availableCharacters, rngState)
    rngState = draw.rngState
    selected.push({ characterId: draw.value, controller: 'ai' })
  }

  const availableHometowns: Hometown[] = [1, 2, 3, 4]
  const assigned = selected.map(player => {
    const draw = takeRandom(availableHometowns, rngState)
    rngState = draw.rngState
    return { ...player, hometown: draw.value }
  })

  const players = assigned.map((player, index) => {
    const region = rules.spawnRegions[player.hometown - 1]!
    const draw = randomInt(rngState, region.variants.length)
    rngState = draw.nextState
    const variant = region.variants[draw.value]!
    return {
      id: index + 1,
      characterId: player.characterId,
      name: CHARACTER_NAMES[player.characterId - 1]!,
      controller: player.controller,
      hometown: player.hometown,
      position: { ...variant.position },
      direction: variant.direction as Direction,
      cash: rules.initialFunds.cash,
      deposit: rules.initialFunds.deposit,
    }
  })

  const worldState = createWorldState(players, rngState, initialWeekday, initialDate)
  rngState = worldState.rngState
  const playerEntries = players.map(player => player.id)

  return {
    players,
    finance: createFinanceState(players),
    properties: createPropertyLedger(),
    prices: createPropertyPrices(),
    inventories: Object.fromEntries(playerEntries.map(id => [id, createCardInventory()])),
    credit: Object.fromEntries(playerEntries.map(id => [id, { ...worldRules.initialCredit }])),
    forcedDice: Object.fromEntries(playerEntries.map(id => [id, null])),
    stayPlayerIds: [],
    unownedOwnerDeposit: 100_000,
    world: worldState.world,
    tickets: Object.fromEntries(playerEntries.map(id => [id, worldRules.initialTickets])),
    lostAndFoundFunds: [0, 0],
    activePlayerIndex: 0,
    round: 1,
    phase: 'awaiting-roll',
    remainingSteps: 0,
    lastRoll: null,
    rngState,
    turnPath: [],
    propertyOffer: null,
    lastPropertyEvent: null,
    interaction: null,
    skipLandingMarker: false,
    continuation: null,
  }
}
