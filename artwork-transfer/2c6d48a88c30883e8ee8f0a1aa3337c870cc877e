import { describe, expect, it, vi } from 'vitest'
import { decodeBitmap } from '../../src/modern/features/map/bitmap-loader'

describe('地图位图解码生命周期', () => {
  it('解码晚于abort完成时立即关闭该bitmap并拒绝交付', async () => {
    let resolve!: (bitmap: ImageBitmap) => void
    const close = vi.fn()
    const bitmap = { close } as unknown as ImageBitmap
    const decode = vi.fn(() => new Promise<ImageBitmap>(done => { resolve = done }))
    const controller = new AbortController()
    const pending = decodeBitmap(new Blob(), controller.signal, decode)
    controller.abort()
    resolve(bitmap)
    await expect(pending).rejects.toThrow()
    expect(close).toHaveBeenCalledOnce()
  })
})
