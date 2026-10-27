import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseAssetManifest, frameAtElapsed } from '../../src/modern/features/characters/assets'

const readManifest = () => JSON.parse(readFileSync('public/modern/assets/manifest.json', 'utf8'))

describe('原版动作资源契约', () => {
  it('缺帧和乱序时明确拒绝，而不是播出错误动作', () => {
    const missing = readManifest()
    missing.clips[0].frames.splice(3, 1)
    expect(() => parseAssetManifest(missing)).toThrow('down-right')
    const wrongOrder = readManifest()
    wrongOrder.clips[1].frames.reverse()
    expect(() => parseAssetManifest(wrongOrder)).toThrow('down-left')
  })

  it('使用时间而非显示次数选帧，并在800毫秒后循环', () => {
    const clip = parseAssetManifest(readManifest()).clips[0]!
    expect(frameAtElapsed(clip, 0).sourceFrame).toBe(1)
    expect(frameAtElapsed(clip, 110).sourceFrame).toBe(4)
    expect(frameAtElapsed(clip, 790).sourceFrame).toBe(24)
    expect(frameAtElapsed(clip, 810).sourceFrame).toBe(1)
  })

  it('保留原根放置变换与精灵边界的合成偏移', () => {
    const clips = parseAssetManifest(readManifest()).clips
    expect(clips[0]!.frames[0]).toMatchObject({ offsetX: -13.5, offsetY: -58.65 })
    expect(clips[1]!.frames[0]).toMatchObject({ offsetX: 5.5, offsetY: -57.15 })
  })
})
