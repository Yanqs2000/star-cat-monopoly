/** Source amounts and actual account changes are intentionally separate. */
export interface ActivityReceipt {
  kind: string
  sourceAmount?: number
  cashDelta?: number
  depositDelta?: number
  ticketDelta?: number
  rate?: number
  addedCardIds?: number[]
  removedCardIds?: number[]
  lostAndFoundDeltas?: [number, number]
}
