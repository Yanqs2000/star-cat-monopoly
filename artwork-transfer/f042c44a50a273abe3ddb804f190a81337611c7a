import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import catalog from '../../src/modern/data/cards.json'
import {
  buyShopCard,
  createCardInventory,
  createCardShop,
  drawCard,
  getCardDefinition,
  getOrdinaryCardIds,
  sellInventoryCard,
  type ShopState,
} from '../../src/modern/features/game/card-economy'

const tables = JSON.parse(readFileSync('docs/modernization/evidence/original-tables.json', 'utf8'))
const ordinaryCardIds = [5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33]

function shopWith(stock: Array<number | null>): ShopState {
  return { stock: [...stock, ...Array(12 - stock.length).fill(null)] }
}

describe('现代卡目录生成', () => {
  it('从原卡表和计数编码手牌生成37条资料、16张普通池及开局五张手牌', () => {
    const dir = mkdtempSync(join(tmpdir(), 'starcat-cards-'))
    try {
      const output = join(dir, 'cards.json')
      const result = spawnSync(process.execPath, ['scripts/build-modern-cards.mjs', '--output', output], { encoding: 'utf8' })
      expect(result.status, result.stderr).toBe(0)
      const generated = JSON.parse(readFileSync(output, 'utf8'))
      const sourceHash = createHash('sha256').update(readFileSync('public/original/play.swf')).digest('hex')
      const manifest = JSON.parse(readFileSync('public/original/manifest.json', 'utf8'))

      expect(generated).toEqual(catalog)
      expect(generated.sourceSha256).toBe(sourceHash)
      expect(generated.sourceSha256).toBe(manifest.files.find((file: { name: string }) => file.name === 'play.swf').sha256)
      expect(generated.definitions).toHaveLength(37)
      expect(generated.definitions).toEqual(tables.carddate.value.map((row: [string, number, number, number, string], id: number) => ({
        id,
        name: row[0],
        price: row[1],
        useType: row[2],
        handlerFrame: row[3],
        description: row[4],
      })))
      expect(generated.ordinaryPool).toEqual(ordinaryCardIds)
      expect(generated.initialInventory).toEqual([9, 6, 7, 27, 5])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('卡目录与背包', () => {
  it('保留未开放卡定义及原价，但普通获得池只有16张', () => {
    expect(getCardDefinition(0)).toEqual({ id: 0, name: '星象卡', price: 100, useType: 0, handlerFrame: 0, description: '' })
    expect(getCardDefinition(5)).toMatchObject({ name: '控骰卡', price: 30 })
    expect(getCardDefinition(7)).toMatchObject({ name: '地雷卡', price: 25 })
    expect(getCardDefinition(9)).toMatchObject({ name: '飞弹卡', price: 100 })
    expect(getOrdinaryCardIds()).toEqual(ordinaryCardIds)
  })

  it('目录、普通池和开局背包均返回调用方可安全修改的新值', () => {
    const definition = getCardDefinition(5)
    definition.price = 999
    const pool = getOrdinaryCardIds()
    pool[0] = 1
    const inventory = createCardInventory()
    inventory[0] = 1

    expect(getCardDefinition(5).price).toBe(30)
    expect(getOrdinaryCardIds()).toEqual(ordinaryCardIds)
    expect(createCardInventory()).toEqual([9, 6, 7, 27, 5])
  })

  it('拒绝不存在及非整数卡ID', () => {
    expect(() => getCardDefinition(-1)).toThrow()
    expect(() => getCardDefinition(37)).toThrow()
    expect(() => getCardDefinition(5.5)).toThrow()
  })

  it('未满24张时只推进一次既有随机源并追加确定性卡片', () => {
    const inventory = [5, 6]
    expect(drawCard(inventory, 0)).toEqual({
      inventory: [5, 6, 9],
      rngState: 1013904223,
      cardId: 9,
      kind: 'received',
    })
    expect(inventory).toEqual([5, 6])
  })

  it('满24张时返回最后一张且不推进随机源、不覆盖手牌', () => {
    const inventory = [...Array(23).fill(5), 33]
    const result = drawCard(inventory, 0)
    expect(result).toEqual({ inventory, rngState: 0, cardId: 33, kind: 'full' })
    expect(result.inventory).not.toBe(inventory)
  })
})

describe('卡片商店库存', () => {
  it('生成固定前六槽和六次独立随机抽样的12槽库存', () => {
    expect(createCardShop(0)).toEqual({
      shop: { stock: [5, 6, 7, 5, 9, 6, 9, 11, 26, 21, 15, 20] },
      rngState: 2670642822,
    })
  })

  it('随机栏允许重复卡且每次返回独立库存', () => {
    const first = createCardShop(1)
    const second = createCardShop(1)
    expect(first.shop.stock.slice(6)).toEqual([9, 14, 19, 22, 5, 14])
    first.shop.stock[0] = null
    expect(second.shop.stock[0]).toBe(5)
  })

  it('购买按目录原价扣奖券、追加背包，并只把所选槽置空', () => {
    const inventory = [6]
    const shop = shopWith([5, 7])
    const result = buyShopCard(inventory, 40, shop, 0)
    expect(result).toEqual({
      inventory: [6, 5],
      tickets: 10,
      shop: shopWith([null, 7]),
      kind: 'bought',
      cardId: 5,
      amount: 30,
    })
    expect(inventory).toEqual([6])
    expect(shop).toEqual(shopWith([5, 7]))
    expect(result.inventory).not.toBe(inventory)
    expect(result.shop).not.toBe(shop)
    expect(result.shop.stock).not.toBe(shop.stock)
    expect(buyShopCard.length).toBe(4)
  })

  it('售空槽不能重复购买且失败保持值并返回新副本', () => {
    const bought = buyShopCard([], 30, shopWith([5]), 0)
    const repeated = buyShopCard(bought.inventory, bought.tickets, bought.shop, 0)
    expect(repeated).toEqual({
      inventory: [5], tickets: 0, shop: shopWith([null]), kind: 'sold-out', cardId: null, amount: 0,
    })
    expect(repeated.inventory).not.toBe(bought.inventory)
    expect(repeated.shop).not.toBe(bought.shop)
  })

  it('奖券不足优先于背包已满，负余额保持原值且不刷新库存', () => {
    const inventory = Array(24).fill(6)
    const shop = shopWith([5])
    expect(buyShopCard(inventory, -10, shop, 0)).toEqual({
      inventory, tickets: -10, shop, kind: 'insufficient-tickets', cardId: 5, amount: 0,
    })
    expect(buyShopCard(inventory, 30, shop, 0)).toEqual({
      inventory, tickets: 30, shop, kind: 'inventory-full', cardId: 5, amount: 0,
    })
    expect(inventory).toHaveLength(24)
    expect(shop.stock[0]).toBe(5)
  })

  it('拒绝超出12槽的商店索引', () => {
    expect(() => buyShopCard([], 100, shopWith([5]), -1)).toThrow()
    expect(() => buyShopCard([], 100, shopWith([5]), 12)).toThrow()
    expect(() => buyShopCard([], 100, shopWith([5]), 1.5)).toThrow()
  })
})

describe('出售背包卡片', () => {
  it('按原价卖出第一张并允许既有奖券余额保持为负', () => {
    const inventory = [5, 7, 9]
    expect(sellInventoryCard(inventory, -50, 0)).toEqual({
      inventory: [7, 9], tickets: -20, cardId: 5, amount: 30,
    })
    expect(inventory).toEqual([5, 7, 9])
  })

  it('按索引卖出中间的重复卡并保持其余顺序', () => {
    expect(sellInventoryCard([5, 7, 5, 9], 10, 2)).toEqual({
      inventory: [5, 7, 9], tickets: 40, cardId: 5, amount: 30,
    })
  })

  it('拒绝不存在及非整数背包索引', () => {
    expect(() => sellInventoryCard([5], 0, -1)).toThrow()
    expect(() => sellInventoryCard([5], 0, 1)).toThrow()
    expect(() => sellInventoryCard([5], 0, 0.5)).toThrow()
  })
})
