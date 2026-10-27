import rules from '../../data/rules.json'
import { randomInt } from './random'
import { createPropertyLedger } from './property'
import type { Direction, GameState, Hometown, PlayerController } from './types'

const CHARACTER_NAMES = [
  '卷毛', '阿牛', '吉吉&米米', '佳佳', '大牌', '薇薇',
  '帅戈', '大尾', '阿飞', '阿杰', '怪卡', '妮妮',
] as const

function takeRandom<T>(values: T[], rngState: number): { value: T; rngState: number } {
  const draw = randomInt(rngState, values.length)
  const [value] = values.splice(draw.value, 1)
  return { value: value!, rngState: draw.nextState }
}

export function createGame(humanCharacterIds: number[], seed: number): GameState {
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

  return {
    players,
    activePlayerIndex: 0,
    round: 1,
    phase: 'awaiting-roll',
    remainingSteps: 0,
    lastRoll: null,
    rngState,
    turnPath: [],
    properties: createPropertyLedger(),
    propertyOffer: null,
    lastPropertyEvent: null,
  }
}
