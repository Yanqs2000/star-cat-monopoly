import { afterEach, expect, it, vi } from 'vitest'
import { loadActivityFrames, type ActivityClip } from '../../src/modern/features/game/activity-assets'
afterEach(() => vi.unstubAllGlobals())
it('一帧解码失败时释放所有并发已经创建的原图URL', async () => {
  const created: string[] = [], revoked: string[] = []
  vi.stubGlobal('URL', {
    createObjectURL: () => { const id = `blob:${created.length}`; created.push(id); return id },
    revokeObjectURL: (url: string) => revoked.push(url),
  })
  vi.stubGlobal('fetch', async () => ({ ok: true, blob: async () => new Blob() }))
  vi.stubGlobal('Image', class {
    src = ''; naturalWidth = 1; naturalHeight = 1
    async decode() { if (this.src === 'blob:0') throw new Error('decode failed') }
  })
  const clip: ActivityClip = { id: 'fog', sourceSymbol: 3758, fps: 30,
    frames: [1,2].map(sourceFrame => ({ sourceFrame, url: `assets/activities/fog/${sourceFrame}.png`, width: 1, height: 1, offsetX: 0, offsetY: 0, fields: [] })) }
  await expect(loadActivityFrames(clip, new AbortController().signal)).rejects.toThrow('decode failed')
  expect(created.length).toBeGreaterThan(0)
  expect(revoked.sort()).toEqual(created.sort())
})
