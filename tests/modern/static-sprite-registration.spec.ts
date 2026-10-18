import { describe, expect, it } from 'vitest'
import { spriteBoundsTransform } from '../../src/modern/features/assets/profiles'

describe('static sprite placement', () => {
  it('aligns visible artwork to its original footprint despite generated transparent padding', () => {
    const source = [7, 46, 87, 122] as const
    const rendered = [12, 58, 78, 118] as const
    const placement = spriteBoundsTransform(source, rendered)
    expect(rendered[0] * placement.scaleX + placement.x).toBeCloseTo(source[0])
    expect(rendered[1] * placement.scaleY + placement.y).toBeCloseTo(source[1])
    expect(rendered[2] * placement.scaleX + placement.x).toBeCloseTo(source[2])
    expect(rendered[3] * placement.scaleY + placement.y).toBeCloseTo(source[3])
  })

  it('leaves an already aligned sprite unchanged', () => {
    expect(spriteBoundsTransform([7, 46, 87, 122], [7, 46, 87, 122]))
      .toEqual({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
  })
})
