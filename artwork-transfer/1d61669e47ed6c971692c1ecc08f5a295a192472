import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { parseReactionManifest } from '../../src/modern/features/characters/reactions'

it('3C欢呼使用原brow2四向完整子动画，保留20个既有动作和原角色来源', () => {
  for (let id = 1; id <= 12; id++) {
    const raw = JSON.parse(readFileSync(`public/modern/assets/characters/${id}/reactions/manifest.json`, 'utf8'))
    const cheers = raw.clips.filter((clip: { name: string }) => clip.name === 'cheer')
    expect(cheers, `角色${id}缺少源brow2`).toHaveLength(4)
    expect(raw.clips.filter((clip: { name: string }) => clip.name !== 'cheer')).toHaveLength(20)
    expect(raw.sourceSha256).toBe(createHash('sha256').update(readFileSync(`public/original/star${id}.swf`)).digest('hex'))
    const parsed = parseReactionManifest(raw)
    for (const [index, clip] of cheers.entries()) {
      expect(clip.sourceRootFrame).toBe(index * 30 + 2)
      expect(parsed.clips).toContainEqual(clip)
      for (const frame of clip.frames) {
        const png = readFileSync(`public/modern/${frame.url}`)
        expect(png.readUInt32BE(16)).toBe(frame.width)
        expect(png.readUInt32BE(20)).toBe(frame.height)
      }
    }
    if (id === 1) expect(cheers[0]).toMatchObject({ sourceSymbol: 52, sourceRootFrame: 2, frames: expect.any(Array) })
    if (id === 1) expect(cheers[0].frames).toHaveLength(68)
  }
})
