import { describe, expect, it } from 'vitest'
import { pickTargetAfterPointer } from '../../src/modern/features/map/target-selection'

describe('3A 地图点选与拖动隔离', () => {
  it('短距离点击按原 getpoint 网格/象限规则返回目标格', () => {
    expect(pickTargetAfterPointer(
      { x: 100, y: 100 },
      { x: 103, y: 104 },
      { x: 18 * 56 + 28, y: 2 * 40 + 20 },
    )).toEqual({ column: 18, row: 2 })
  })

  it('超过六像素的地图拖动绝不提交卡片目标', () => {
    expect(pickTargetAfterPointer(
      { x: 100, y: 100 },
      { x: 107, y: 100 },
      { x: 18 * 56 + 28, y: 2 * 40 + 20 },
    )).toBeUndefined()
  })
})
