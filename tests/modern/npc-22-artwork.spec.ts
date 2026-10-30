import { expect, it } from 'vitest'
import { sampleNpc22Motion } from '../../src/modern/features/assets/npc-22-artwork'

const clip = {
 id: 'npc-10', sourceSymbol: 361, fps: 60, loop: true,
 frames: Array.from({ length: 36 }, (_, i) => ({ url: `body-${i % 4}.webp`, width: 80, height: 90, offsetX: -12, offsetY: -75 })),
}
const motion = {
 id: 'npc-10', sourceSymbol: 361, outerFps: 30,
 outerTrack: [
  { x: 0, y: 0, shadowX: 28, shadowY: 20, shadowScaleX: 1.12, shadowScaleY: .8 },
  { x: 0, y: -5, shadowX: 28, shadowY: 20, shadowScaleX: 1, shadowScaleY: .714 },
  { x: 0, y: -4, shadowX: 28, shadowY: 20, shadowScaleX: 1.02, shadowScaleY: .728 },
  { x: 0, y: -3, shadowX: 28, shadowY: 20, shadowScaleX: 1.04, shadowScaleY: .742 },
  { x: 0, y: -1, shadowX: 28, shadowY: 20, shadowScaleX: 1.10, shadowScaleY: .786 },
 ],
}

it('samples body and shadow independently of the pose-loop boundary', () => {
 const first = sampleNpc22Motion(motion, clip, 0)
 const loop = sampleNpc22Motion(motion, clip, 600)
 expect(first.frame.url).toBe('body-0.webp')
 expect(first.y).toBe(-75)
 expect(loop.frame.url).toBe('body-0.webp')
 // A pose-loop restart must not also reset the outer track:18ticks modulo5 is3.
 expect(loop.y).toBe(-78)
 const nextLoop = sampleNpc22Motion(motion, clip, 1200 + 1000 / 30)
 expect(nextLoop.frame.url).toBe('body-2.webp')
 expect(nextLoop.y).toBe(-79)
 expect(nextLoop.shadow.scaleY).toBeCloseTo(.728)
})

it('interpolates the source float halfway without stretching the body texture', () => {
 const sample = sampleNpc22Motion(motion, clip, 1000 / 60)
 expect(sample.frame.url).toBe('body-1.webp')
 expect(sample.x).toBe(-12)
 expect(sample.y).toBeCloseTo(-77.5)
 expect(sample.shadow.scaleX).toBeCloseTo(1.06)
 expect(sample.shadow.scaleY).toBeCloseTo(.757)
 expect(sample.shadow.x).toBe(28)
 expect(sample.frame.width).toBe(80)
 expect(sample.frame.height).toBe(90)
})

it('clamps negative time to the first frame and rejects mismatched identity', () => {
 expect(sampleNpc22Motion(motion, clip, -30).frame.url).toBe('body-0.webp')
 expect(() => sampleNpc22Motion({ ...motion, sourceSymbol: 310 }, clip, 0)).toThrow('来源')
})
