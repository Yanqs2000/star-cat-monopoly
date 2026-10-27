/** Source amounts and actual account changes are intentionally separate. */
export interface ActivityPresentation {
  clipId: string
  frame: number
  totalFrames: number
  nextClip?: string
  cellId?: number
}

export interface ActivityReceipt {
  kind: string
  sourceAmount?: number
  cashDelta?: number
  depositDelta?: number
  ticketDelta?: number
  ticketDebit?: number
  ticketCredit?: number
  rate?: number
  addedCardIds?: number[]
  removedCardIds?: number[]
  lostAndFoundDeltas?: [number, number]
}
