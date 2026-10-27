export interface CalendarDate {
  year: number
  month: number
  day: number
}

export interface StockHolding {
  shares: number
  averageCost: number
}

export interface StockCompany {
  id: number
  name: string
  basePrice: number
  previousPrice: number
  price: number
  change: number
  high: number
  low: number
  factorA: number
  factorB: number
  dailyBuyLimit: number
  poolBandValue: number
  holdings: Record<number, StockHolding>
  profit: number
  kind: 0 | 1 | 2 | 3
  ceoId: number | null
  mainRecordId: number
  offerShares: number
}

export interface FinanceEntry {
  kind: string
  playerId?: number
  companyId?: number
  sourceAmount?: number
  cashDelta?: number
  depositDelta?: number
  loanDelta?: number
  sharesDelta?: number
  priceBefore?: number
  priceAfter?: number
}

export interface FinanceState {
  stocks: StockCompany[]
  loans: Record<number, number>
  lastSettledMonth: string | null
  entries: FinanceEntry[]
}
