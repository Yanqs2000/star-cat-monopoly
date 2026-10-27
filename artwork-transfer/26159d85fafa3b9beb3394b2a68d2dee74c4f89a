import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { frameAtElapsed, parseAssetManifest } from '../../src/modern/features/characters/assets'

const readManifest = () => JSON.parse(readFileSync('public/modern/assets/manifest.json', 'utf8'))

function manifestWithFrames(count: number) {
  const manifest = readManifest()
  for (const clip of manifest.clips) clip.frames = clip.frames.slice(0, count)
  return manifest
}

describe('原素材转换产物', () => {
  it('发布的场景资源具备原图偏移和四方向24帧，而非仅一张人物图', () => {
    const path = 'public/modern/assets/manifest.json'
    expect(existsSync(path), '缺少原素材转换产物').toBe(true)
    const manifest = JSON.parse(readFileSync(path, 'utf8'))
    expect(manifest.map).toMatchObject({ width: 2700, height: 2552, offsetX: -184, offsetY: -313, sourceId: 20 })
    expect(manifest.clips.map((c: { facing: string }) => c.facing)).toEqual(['down-right', 'down-left', 'up-left', 'up-right'])
    for (const clip of manifest.clips) {
      expect(clip.frames).toHaveLength(24)
      expect(clip.frames.map((f: { sourceFrame: number }) => f.sourceFrame)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1))
      expect(clip.frames.reduce((sum: number, f: { durationMs: number }) => sum + f.durationMs, 0)).toBeCloseTo(800)
      for (const frame of clip.frames) {
        const bytes = readFileSync(resolve('public/modern', frame.url))
        expect(bytes.subarray(1, 4).toString()).toBe('PNG')
        expect(bytes[25], '导出帧必须保留透明通道').toBe(6)
        expect(Number.isFinite(frame.offsetX) && Number.isFinite(frame.offsetY)).toBe(true)
      }
    }
  })

  it.each([20, 16])('解析原版实际的 %i 帧动作并按其周期循环', (frameCount) => {
    const clip = parseAssetManifest(manifestWithFrames(frameCount)).clips[0]!
    const periodMs = frameCount * (1000 / 30)

    expect(clip.frames).toHaveLength(frameCount)
    expect(frameAtElapsed(clip, periodMs - 1).sourceFrame).toBe(frameCount)
    expect(frameAtElapsed(clip, periodMs + 1).sourceFrame).toBe(1)
  })

  it('拒绝缺少方向、空动作和不连续的原始帧序号', () => {
    const missingClip = manifestWithFrames(20)
    missingClip.clips.pop()
    expect(() => parseAssetManifest(missingClip)).toThrow('缺少四方向动作')

    const emptyClip = manifestWithFrames(20)
    emptyClip.clips[0].frames = []
    expect(() => parseAssetManifest(emptyClip)).toThrow('down-right')

    const wrongOrder = manifestWithFrames(20)
    wrongOrder.clips[0].frames[1].sourceFrame = 3
    expect(() => parseAssetManifest(wrongOrder)).toThrow('down-right 第2帧')
  })
})
