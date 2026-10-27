import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { parseAssetManifest } from '../../src/modern/features/characters/assets'

const ROOT = resolve(import.meta.dirname, '../..')

describe('12 角色原版行走资源', () => {
  it('索引中的每个角色都有独立、可解析且与原 SWF 哈希一致的四方向 PNG', () => {
    const original = JSON.parse(readFileSync(resolve(ROOT, 'public/original/manifest.json'), 'utf8'))
    const sourceHashes = new Map<string, string>()
    for (const file of original.files as { name: string; sha256: string }[]) {
      const actualHash = createHash('sha256')
        .update(readFileSync(resolve(ROOT, 'public/original', file.name)))
        .digest('hex')
      expect(actualHash, `${file.name} 与原始清单哈希不符`).toBe(file.sha256)
      sourceHashes.set(file.name, actualHash)
    }
    const index = JSON.parse(
      readFileSync(resolve(ROOT, 'public/modern/assets/characters/index.json'), 'utf8'),
    )
    const names = ['卷毛', '阿牛', '吉吉&米米', '佳佳', '大牌', '薇薇', '帅戈', '大尾', '阿飞', '阿杰', '怪卡', '妮妮']
    const frameCounts = [24, 24, 24, 24, 24, 20, 16, 24, 24, 24, 24, 24]

    expect(index.version).toBe(1)
    expect(index.characters.map((item: { id: number }) => item.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    )
    expect(index.characters.map((item: { name: string }) => item.name)).toEqual(names)

    const manifestUrls = index.characters.map((item: { manifestUrl: string }) => item.manifestUrl)
    expect(new Set(manifestUrls).size).toBe(12)

    const allFrameUrls = new Set<string>()
    for (const item of index.characters as { id: number; manifestUrl: string }[]) {
      const manifestPath = resolve(ROOT, 'public/modern', item.manifestUrl)
      const rawManifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      const manifest = parseAssetManifest(rawManifest)
      const starName = `star${item.id}.swf`

      expect(rawManifest.sourceHashes).toEqual({
        'play.swf': sourceHashes.get('play.swf'),
        [starName]: sourceHashes.get(starName),
      })

      const characterFrameUrls = manifest.clips.flatMap((clip) => clip.frames.map((frame) => frame.url))
      expect(manifest.clips.map((clip) => clip.frames.length)).toEqual(
        Array(4).fill(frameCounts[item.id - 1]),
      )
      expect(new Set(characterFrameUrls).size).toBe(4 * frameCounts[item.id - 1]!)
      for (const frameUrl of characterFrameUrls) {
        expect(allFrameUrls.has(frameUrl), `${frameUrl} 被多个角色重复引用`).toBe(false)
        allFrameUrls.add(frameUrl)
        const png = readFileSync(resolve(ROOT, 'public/modern', frameUrl))
        expect(png.subarray(1, 4).toString()).toBe('PNG')
        expect(png.readUInt32BE(16)).toBeGreaterThan(0)
        expect(png.readUInt32BE(20)).toBeGreaterThan(0)
        expect(png[25], `${frameUrl} 必须保留 RGBA 透明通道`).toBe(6)
      }
    }

    expect(allFrameUrls.size).toBe(4 * frameCounts.reduce((sum, count) => sum + count, 0))
  })
})
