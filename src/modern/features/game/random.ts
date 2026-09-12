export interface RandomResult {
  value: number
  nextState: number
}

const UINT32_RANGE = 0x1_0000_0000

export function randomInt(state: number, upperBound: number): RandomResult {
  if (!Number.isInteger(state) || state < 0 || state >= UINT32_RANGE) throw new Error('随机状态必须是uint32')
  if (!Number.isInteger(upperBound) || upperBound < 1) throw new Error('随机上界必须是正整数')
  const nextState = (Math.imul(state, 1664525) + 1013904223) >>> 0
  return { value: Math.floor(nextState / UINT32_RANGE * upperBound), nextState }
}
