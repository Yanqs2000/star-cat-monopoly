import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parseWorldAssets,
  type WorldAssetsManifest,
  type WorldClip,
} from '../../src/modern/features/map/world-assets'

const ROOT = resolve(import.meta.dirname, '../..')
const EXPECTED_CLIPS = new Map<string, {
  frames: number
  sourceSymbol: number
  loop: boolean
}>([
  ['npc-1', { frames: 3, sourceSymbol: 298, loop: true }],
  ['npc-2', { frames: 54, sourceSymbol: 310, loop: true }],
  ['npc-3', { frames: 12, sourceSymbol: 372, loop: true }],
  ['npc-4', { frames: 55, sourceSymbol: 226, loop: true }],
  ['npc-5', { frames: 22, sourceSymbol: 335, loop: true }],
  ['npc-9', { frames: 104, sourceSymbol: 293, loop: true }],
  ['npc-10', { frames: 18, sourceSymbol: 361, loop: true }],
  ['npc-11', { frames: 18, sourceSymbol: 350, loop: true }],
  ['npc-12', { frames: 81, sourceSymbol: 263, loop: true }],
  ['npc-13', { frames: 33, sourceSymbol: 280, loop: true }],
  ['npc-14', { frames: 24, sourceSymbol: 248, loop: true }],
  ['npc-15', { frames: 26, sourceSymbol: 235, loop: true }],
  ['barrier-1', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['barrier-2', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['barrier-3', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['barrier-4', { frames: 10, sourceSymbol: 3689, loop: true }],
  ['mine', { frames: 80, sourceSymbol: 3696, loop: true }],
  ['rocket', { frames: 80, sourceSymbol: 1080, loop: false }],
  ['explosion', { frames: 60, sourceSymbol: 1027, loop: false }],
  ['card-gain', { frames: 50, sourceSymbol: 1163, loop: false }],
  ['ticket-gain', { frames: 30, sourceSymbol: 1185, loop: false }],
])

const frame = (url: string) => ({
  url,
  width: 90,
  height: 124,
  offsetX: -18,
  offsetY: -68.65,
})

function completeManifest(): WorldAssetsManifest {
  return {
    version: 1,
    sourceSha256: 'a'.repeat(64),
    clips: [...EXPECTED_CLIPS].map(([id, definition]) => ({
      id,
      fps: 30,
      loop: definition.loop,
      sourceSymbol: definition.sourceSymbol,
      frames: Array.from({ length: definition.frames }, (_, index) =>
        frame(`assets/world/${id}/${index + 1}.png`)),
    })),
    neutralHouses: [1, 2, 3, 4].flatMap((facing) =>
      [1, 2, 3, 4, 5].map((level) => ({
        ...frame(`assets/world/neutral-houses/${facing}/${level}.png`),
        facing: facing as 1 | 2 | 3 | 4,
        level: level as 1 | 2 | 3 | 4 | 5,
        sourceFrame: (facing - 1) * 10 + level + 1,
      })),
    ),
  }
}

function replaceClip(manifest: WorldAssetsManifest, id: string, replacement: WorldClip): void {
  manifest.clips[manifest.clips.findIndex(clip => clip.id === id)] = replacement
}

describe('原版世界动画、NPC 与中立房屋素材', () => {
  it('读取真实清单并覆盖 21 个完整源时间轴与 20 个中立房屋', () => {
    const raw = JSON.parse(
      readFileSync(resolve(ROOT, 'public/modern/assets/world/manifest.json'), 'utf8'),
    )
    const manifest = parseWorldAssets(raw)
    const sourceHash = createHash('sha256')
      .update(readFileSync(resolve(ROOT, 'public/original/play.swf')))
      .digest('hex')

    expect(manifest.sourceSha256).toBe(sourceHash)
    expect(manifest.clips).toHaveLength(21)
    expect(new Set(manifest.clips.map(({ id }) => id))).toEqual(new Set(EXPECTED_CLIPS.keys()))
    for (const clip of manifest.clips) {
      const expected = EXPECTED_CLIPS.get(clip.id)!
      expect(clip.frames, `${clip.id} full timeline`).toHaveLength(expected.frames)
      expect(clip.sourceSymbol, `${clip.id} source symbol`).toBe(expected.sourceSymbol)
      expect(clip.loop, `${clip.id} playback`).toBe(expected.loop)
      expect(clip.fps, `${clip.id} fps`).toBe(30)
    }

    expect(manifest.neutralHouses).toHaveLength(20)
    expect(new Set(manifest.neutralHouses.map(({ facing, level }) => `${facing}:${level}`)).size).toBe(20)
    expect(new Set(manifest.neutralHouses.map(({ width, height }) => `${width}x${height}`))).toEqual(new Set(['90x124']))
    expect(new Set(manifest.neutralHouses.map(({ offsetX, offsetY }) => `${offsetX}:${offsetY}`))).toEqual(new Set(['-18:-68.65']))

    const allFrames = [
      ...manifest.clips.flatMap(({ frames }) => frames),
      ...manifest.neutralHouses,
    ]
    expect(allFrames).toHaveLength(810)
    expect(new Set(allFrames.map(({ url }) => url)).size).toBe(810)
    for (const { url, width, height } of allFrames) {
      const png = readFileSync(resolve(ROOT, 'public/modern', url))
      expect(png.subarray(1, 4).toString(), url).toBe('PNG')
      expect(png.readUInt32BE(16), `${url} width`).toBe(width)
      expect(png.readUInt32BE(20), `${url} height`).toBe(height)
      expect(png[25], `${url} must retain RGBA transparency`).toBe(6)
    }
  })

  it('拒绝缺少、重复或未知的世界动画', () => {
    const missing = completeManifest()
    missing.clips.pop()
    expect(() => parseWorldAssets(missing)).toThrow('必须完整包含 21 个世界动画')

    const duplicate = completeManifest()
    duplicate.clips[20] = { ...duplicate.clips[0]! }
    expect(() => parseWorldAssets(duplicate)).toThrow('世界动画 ID 重复')

    const unknown = completeManifest()
    unknown.clips[0] = { ...unknown.clips[0]!, id: 'npc-99' }
    expect(() => parseWorldAssets(unknown)).toThrow('世界动画覆盖错误')
  })

  it('拒绝帧数、来源符号、播放速率或循环语义漂移', () => {
    const wrongLength = completeManifest()
    wrongLength.clips[0]!.frames.pop()
    expect(() => parseWorldAssets(wrongLength)).toThrow('世界动画来源定义错误')

    const wrongSource = completeManifest()
    wrongSource.clips[0]!.sourceSymbol = 999
    expect(() => parseWorldAssets(wrongSource)).toThrow('世界动画来源定义错误')

    const wrongFps = completeManifest()
    wrongFps.clips[0]!.fps = 24 as 30
    expect(() => parseWorldAssets(wrongFps)).toThrow('世界动画定义错误')

    const wrongLoop = completeManifest()
    wrongLoop.clips[0]!.loop = false
    expect(() => parseWorldAssets(wrongLoop)).toThrow('世界动画来源定义错误')
  })

  it('拒绝动画帧路径与动画 ID 或一基帧号不一致', () => {
    const wrongId = completeManifest()
    wrongId.clips[0]!.frames[0]!.url = 'assets/world/npc-2/1.png'
    expect(() => parseWorldAssets(wrongId)).toThrow('世界动画帧路径错误')

    const wrongFrame = completeManifest()
    wrongFrame.clips[0]!.frames[0]!.url = 'assets/world/npc-1/2.png'
    expect(() => parseWorldAssets(wrongFrame)).toThrow('世界动画帧路径错误')
  })

  it('拒绝缺少、重复或路径错误的中立房屋', () => {
    const missing = completeManifest()
    missing.neutralHouses.pop()
    expect(() => parseWorldAssets(missing)).toThrow('必须完整包含 20 个中立房屋')

    const duplicate = completeManifest()
    duplicate.neutralHouses[19] = { ...duplicate.neutralHouses[0]! }
    expect(() => parseWorldAssets(duplicate)).toThrow('中立房屋变体重复')

    const wrongPath = completeManifest()
    wrongPath.neutralHouses[0]!.url = 'assets/world/neutral-houses/2/1.png'
    expect(() => parseWorldAssets(wrongPath)).toThrow('中立房屋路径错误')
  })

  it('拒绝中立房屋源帧与朝向等级不一致', () => {
    const manifest = completeManifest()
    manifest.neutralHouses[0]!.sourceFrame = 3
    expect(() => parseWorldAssets(manifest)).toThrow('中立房屋源帧错误')
  })

  it('拒绝无效哈希、不安全路径和非有限几何', () => {
    const manifest = completeManifest()
    expect(() => parseWorldAssets({ ...manifest, sourceSha256: 'short' })).toThrow('来源哈希错误')

    const unsafe = completeManifest()
    unsafe.clips[0]!.frames[0]!.url = '../escape.png'
    expect(() => parseWorldAssets(unsafe)).toThrow('世界动画帧定义错误')

    const invalidGeometry = completeManifest()
    invalidGeometry.clips[0]!.frames[0]!.offsetX = Number.NaN
    expect(() => parseWorldAssets(invalidGeometry)).toThrow('世界动画帧定义错误')

    const emptyGeometry = completeManifest()
    replaceClip(emptyGeometry, 'npc-1', {
      ...emptyGeometry.clips[0]!,
      frames: emptyGeometry.clips[0]!.frames.map(item => ({ ...item, width: 0 })),
    })
    expect(() => parseWorldAssets(emptyGeometry)).toThrow('世界动画帧定义错误')
  })
})
