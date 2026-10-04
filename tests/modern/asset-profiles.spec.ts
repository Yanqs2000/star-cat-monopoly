import { describe, expect, it } from 'vitest'
import { isCompleteHdProfileIndex, mapAssetProfile, profileAssetUrl } from '../../src/modern/features/assets/profiles'
import { createGameController } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'
import { createSnapshot } from '../../src/modern/features/saves/snapshot'

describe('HD 资源路径配置', () => {
  it('原始模式保持原URL，高清模式改用资产镜像中的无损WebP', () => {
    expect(profileAssetUrl('assets/walk/down-right/1.png', 'original')).toBe('assets/walk/down-right/1.png')
    expect(profileAssetUrl('assets/walk/down-right/1.png', 'hd')).toBe('assets-hd/walk/down-right/1.webp')
  })

  it('高清模式只改项目PNG资源，不碰音频、网络地址、JSON或其他字符串', () => {
    const source = {
      url: 'assets/activities/rocket/1.png?rev=4',
      sound: 'assets/audio/land.mp3',
      manifest: 'assets/world/manifest.json',
      title: 'assets/不是文件.png',
      remote: 'https://example.test/assets/banner.png',
    }
    expect(mapAssetProfile(source, 'hd')).toEqual({
      url: 'assets-hd/activities/rocket/1.webp?rev=4',
      sound: 'assets/audio/land.mp3',
      manifest: 'assets/world/manifest.json',
      title: 'assets/不是文件.png',
      remote: 'https://example.test/assets/banner.png',
    })
    expect(source.url).toBe('assets/activities/rocket/1.png?rev=4')
  })

  it('重复应用高清模式不重复增加目录或更换扩展名', () => {
    expect(profileAssetUrl('assets-hd/world/npc-1/1.webp', 'hd')).toBe('assets-hd/world/npc-1/1.webp')
  })

  it('转换动画清单时保留帧数、时序、逻辑边界和锚点', () => {
    const source = {
      fps: 30, loop: false,
      frames: [
        { url: 'assets/activities/fly-1-4/1.png', width: 166, height: 211, offsetX: -83, offsetY: -202, durationMs: 33.333 },
        { url: 'assets/activities/fly-1-4/2.png', width: 166, height: 211, offsetX: -83, offsetY: -202, durationMs: 33.333 },
      ],
    }
    const hd = mapAssetProfile(source, 'hd')
    const withoutUrls = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(withoutUrls)
      if (!value || typeof value !== 'object') return value
      return Object.fromEntries(Object.entries(value).filter(([key]) => !/url$/i.test(key)).map(([key, child]) => [key, withoutUrls(child)]))
    }
    expect(withoutUrls(hd)).toEqual(withoutUrls(source))
    expect(hd.frames.map(frame => frame.url)).toEqual([
      'assets-hd/activities/fly-1-4/1.webp', 'assets-hd/activities/fly-1-4/2.webp',
    ])
  })

  it('只接受声明覆盖了完整源图清单的高清图集', () => {
    expect(isCompleteHdProfileIndex({
      version: 1, profile: 'hd', pixelDensity: 2,
      sourceAssetCount: 15_849, assetCount: 15_849,
      manifest: 'hd-manifest.json', manifestSha256: 'a'.repeat(64), totalBytes: 100,
    })).toBe(true)
    expect(isCompleteHdProfileIndex({
      version: 1, profile: 'hd', pixelDensity: 2,
      sourceAssetCount: 15_849, assetCount: 12_617,
      manifest: 'hd-manifest.json', manifestSha256: 'a'.repeat(64), totalBytes: 100,
    })).toBe(false)
    expect(isCompleteHdProfileIndex({
      version: 1, profile: 'hd', pixelDensity: 1,
      sourceAssetCount: 15_849, assetCount: 15_849,
      manifest: 'hd-manifest.json', manifestSha256: 'a'.repeat(64), totalBytes: 100,
    })).toBe(false)
  })

  it('同种子和命令在两种画质下产生相同的完整状态与随机状态', () => {
    const replay = (profile: 'original' | 'hd') => {
      const game = createGame([1, 2, 3, 4], 123_456_789, 1)
      const displayAssets = mapAssetProfile({
        character: { url: 'assets/walk/down-right/1.png' },
        event: { url: 'assets/interactions/luck/12.png' },
      }, profile)
      const controller = createGameController(game, {
        scheduler: { now: () => 0, setTimeout: () => 1, clearTimeout: () => {} },
        stepDurationMs: 10,
      })
      expect(controller.roll()).toBe(true)
      const state = structuredClone(controller.state)
      controller.dispose()
      return { displayAssets, state }
    }

    const original = replay('original')
    const hd = replay('hd')
    expect(original.displayAssets.character.url).toBe('assets/walk/down-right/1.png')
    expect(hd.displayAssets.character.url).toBe('assets-hd/walk/down-right/1.webp')
    expect(hd.displayAssets.event.url).toBe('assets-hd/interactions/luck/12.webp')
    expect(hd.state).toEqual(original.state)
    expect(hd.state.rngState).toBe(original.state.rngState)
  })

  it('高清偏好不进入存档快照，也不改变快照状态或随机状态', () => {
    const saveFor = (profile: 'original' | 'hd') => {
      const state = createGame([1, 2, 3, 4], 987_654_321, 1)
      const sourceManifest = { url: 'assets/interactions/cards/1.png' }
      const displayedManifest = mapAssetProfile(sourceManifest, profile)
      const snapshot = createSnapshot(state, [1, 2, 3, 4], { speed: 1, paused: false }, '2026-10-04T00:00:00.000Z', '2026-10-04T00:00:00.000Z')
      return { displayedManifest, snapshot }
    }
    const original = saveFor('original')
    const hd = saveFor('hd')
    expect(original.displayedManifest.url).toBe('assets/interactions/cards/1.png')
    expect(hd.displayedManifest.url).toBe('assets-hd/interactions/cards/1.webp')
    expect(hd.snapshot).toEqual(original.snapshot)
    expect(hd.snapshot).not.toHaveProperty('assetProfile')
    expect(hd.snapshot.state.rngState).toBe(original.snapshot.state.rngState)
  })
})
