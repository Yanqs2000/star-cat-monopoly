import sourceRows from '../../data/stock-source.json'
import type { FinanceState, StockCompany } from './finance-types'
import type { PlayerState } from './types'

type SourceRow = [string, number, number, number, number, number, number, number, number,
  number, number, ...unknown[]]

const sourceStocks = sourceRows as SourceRow[]
const companyMainRecords = [124, 127, 130, 133] as const

export function createFinanceState(players: PlayerState[]): FinanceState {
  const stocks: StockCompany[] = sourceStocks.map((row, id) => ({
    id,
    name: row[0],
    basePrice: row[1],
    previousPrice: row[2],
    price: row[3],
    change: row[4],
    high: row[5],
    low: row[6],
    factorA: row[7],
    factorB: row[8],
    dailyBuyLimit: row[9],
    poolBandValue: row[10],
    holdings: Object.fromEntries(players.map(player => [player.id, { shares: 0, averageCost: 0 }])),
    profit: row[17] as number,
    kind: row[18] as 0 | 1 | 2 | 3,
    ceoId: (row[19] as number) || null,
    mainRecordId: row[20] as number,
    offerShares: id >= 13 ? 10000 : id > 0 ? 5000 : 0,
  }))

  for (const player of players) {
    const stock = stocks[player.characterId]!
    stock.holdings[player.id] = { shares: 3000, averageCost: 10 }
    stock.kind = 2
    stock.ceoId = player.id
    stock.mainRecordId = companyMainRecords[player.hometown - 1]!
    stock.basePrice = 20
    stock.previousPrice = 19
    stock.price = 20
    stock.change = 1
    stock.high = 25
    stock.low = 15
    stock.offerShares = 2000
  }

  return {
    stocks,
    loans: Object.fromEntries(players.map(player => [player.id, 0])),
    lastSettledMonth: null,
    monthlyQuoteIndex: null,
    entries: [],
  }
}
