import { describe, expect, it, vi } from 'vitest'
import { HdMapRegionLoader } from '../../src/modern/features/map/hd-map-region-loader'

const tile = (url: string) => ({
  url, logicalRect: [0, 0, 257, 257] as [number, number, number, number],
  pixelDensity: 4, scenePosition: [0, 0] as [number, number],
})
type TestTile = ReturnType<typeof tile>

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('HD map tile texture lifecycle', () => {
  it('loads only requested tiles, then releases textures after they leave the view', async () => {
    const calls = { load: vi.fn(async (_region: TestTile) => {}), attach: vi.fn((_region: TestTile) => {}),
      detach: vi.fn((_region: TestTile) => {}), release: vi.fn((_region: TestTile) => {}) }
    const loader = new HdMapRegionLoader({
      load: calls.load, attach: calls.attach, detach: calls.detach, release: calls.release,
    })
    const [first, second] = [tile('first.webp'), tile('second.webp')]

    loader.update([first!, second!])
    await flush()
    loader.update([second!])

    expect(calls.load.mock.calls.map(call => call[0]!.url)).toEqual(['first.webp', 'second.webp'])
    expect(calls.attach.mock.calls.map(call => call[0]!.url)).toEqual(['first.webp', 'second.webp'])
    expect(calls.detach.mock.calls.map(call => call[0]!.url)).toEqual(['first.webp'])
    expect(calls.release.mock.calls.map(call => call[0]!.url)).toEqual(['first.webp'])
    loader.dispose()
    expect(calls.detach.mock.calls.map(call => call[0]!.url)).toEqual(['first.webp', 'second.webp'])
    expect(calls.release.mock.calls.map(call => call[0]!.url)).toEqual(['first.webp', 'second.webp'])
  })

  it('releases a tile that finishes loading after camera leaves it', async () => {
    let finishLoad!: () => void
    const calls = { load: vi.fn((_region: TestTile) => new Promise<void>(resolve => { finishLoad = resolve })),
      attach: vi.fn((_region: TestTile) => {}), detach: vi.fn((_region: TestTile) => {}),
      release: vi.fn((_region: TestTile) => {}) }
    const loader = new HdMapRegionLoader({
      load: calls.load, attach: calls.attach, detach: calls.detach, release: calls.release,
    })
    const first = tile('late.webp')

    loader.update([first])
    await flush()
    loader.update([])
    finishLoad()
    await flush()

    expect(calls.attach).not.toHaveBeenCalled()
    expect(calls.release.mock.calls.map(call => call[0]!.url)).toEqual(['late.webp'])
    loader.dispose()
  })

  it('allows a failed visible tile to be requested again', async () => {
    let fail = true
    const calls = { load: vi.fn(async (_region: TestTile) => { if (fail) throw new Error('404') }),
      attach: vi.fn((_region: TestTile) => {}), detach: vi.fn((_region: TestTile) => {}),
      release: vi.fn((_region: TestTile) => {}), onError: vi.fn((_error: Error) => {}) }
    const loader = new HdMapRegionLoader(calls)
    const first = tile('retry.webp')

    loader.update([first])
    await flush()
    fail = false
    loader.update([first])
    await flush()

    expect(calls.load).toHaveBeenCalledTimes(2)
    expect(calls.onError).toHaveBeenCalledTimes(1)
    expect(calls.attach.mock.calls.map(call => call[0]!.url)).toEqual(['retry.webp'])
    loader.dispose()
  })
})
