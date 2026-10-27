import catalog from '../../data/cards.json'
import { randomInt } from './random'

export interface CardDefinition {
  id: number
  name: string
  price: number
  useType: number
  handlerFrame: number
  description: string
}

export interface ShopState {
  stock: Array<number | null>
}

const definitions = catalog.definitions as CardDefinition[]
const definitionById = new Map(definitions.map(definition => [definition.id, definition]))

function copyShop(shop: ShopState): ShopState {
  if (shop.stock.length !== 12) throw new Error('卡片商店必须有12个槽位')
  return { stock: [...shop.stock] }
}

function copyInventory(inventory: readonly number[]): number[] {
  if (inventory.length > 24) throw new Error('卡片背包不能超过24张')
  return [...inventory]
}

export function getCardDefinition(id: number): CardDefinition {
  if (!Number.isInteger(id)) throw new Error('卡ID必须是整数')
  const definition = definitionById.get(id)
  if (!definition) throw new Error(`不存在卡 ${id}`)
  return { ...definition }
}

export function getOrdinaryCardIds(): number[] {
  return [...catalog.ordinaryPool]
}

export function createCardInventory(): number[] {
  return [...catalog.initialInventory]
}

export function drawCard(inventory: readonly number[], rngState: number): {
  inventory: number[]
  rngState: number
  cardId: number
  kind: 'received' | 'full'
} {
  const nextInventory = copyInventory(inventory)
  if (nextInventory.length === 24) {
    return {
      inventory: nextInventory,
      rngState,
      cardId: nextInventory[nextInventory.length - 1],
      kind: 'full',
    }
  }
  const draw = randomInt(rngState, catalog.ordinaryPool.length)
  const cardId = catalog.ordinaryPool[draw.value]
  nextInventory.push(cardId)
  return { inventory: nextInventory, rngState: draw.nextState, cardId, kind: 'received' }
}

export function createCardShop(rngState: number): { shop: ShopState; rngState: number } {
  const stock: Array<number | null> = [5, 6, 7, 5, 9, 6]
  let nextState = rngState
  for (let index = 0; index < 6; index += 1) {
    const draw = randomInt(nextState, catalog.ordinaryPool.length)
    stock.push(catalog.ordinaryPool[draw.value])
    nextState = draw.nextState
  }
  return { shop: { stock }, rngState: nextState }
}

export function buyShopCard(inventory: readonly number[], tickets: number, shop: ShopState, slot: number): {
  inventory: number[]
  tickets: number
  shop: ShopState
  kind: 'bought' | 'sold-out' | 'insufficient-tickets' | 'inventory-full'
  cardId: number | null
  amount: number
} {
  if (!Number.isInteger(slot) || slot < 0 || slot >= 12) throw new Error('商店槽位必须是0至11的整数')
  const nextInventory = copyInventory(inventory)
  const nextShop = copyShop(shop)
  const cardId = nextShop.stock[slot]
  if (cardId === null) {
    return { inventory: nextInventory, tickets, shop: nextShop, kind: 'sold-out', cardId: null, amount: 0 }
  }
  const price = getCardDefinition(cardId).price
  if (tickets < price) {
    return { inventory: nextInventory, tickets, shop: nextShop, kind: 'insufficient-tickets', cardId, amount: 0 }
  }
  if (nextInventory.length === 24) {
    return { inventory: nextInventory, tickets, shop: nextShop, kind: 'inventory-full', cardId, amount: 0 }
  }
  nextInventory.push(cardId)
  nextShop.stock[slot] = null
  return {
    inventory: nextInventory,
    tickets: tickets - price,
    shop: nextShop,
    kind: 'bought',
    cardId,
    amount: price,
  }
}

export function sellInventoryCard(inventory: readonly number[], tickets: number, index: number): {
  inventory: number[]
  tickets: number
  cardId: number
  amount: number
} {
  if (!Number.isInteger(index) || index < 0 || index >= inventory.length) throw new Error('背包索引无效')
  const nextInventory = copyInventory(inventory)
  const [cardId] = nextInventory.splice(index, 1)
  const price = getCardDefinition(cardId).price
  return { inventory: nextInventory, tickets: tickets + price, cardId, amount: price }
}
