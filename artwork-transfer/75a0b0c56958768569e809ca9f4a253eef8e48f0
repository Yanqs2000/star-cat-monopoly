import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { ImageSource, Texture } from 'pixi.js'
import { activityPixelDensity, loadActivityFrames, parseActivityAssets } from '../../src/modern/features/game/activity-assets'

it('3C原图完整保留NPC60帧、烟雾19帧、送医111帧和原800×600兑换场景', () => {
  const root = resolve(import.meta.dirname, '../..')
  const text = (() => { try { return readFileSync(resolve(root, 'public/modern/assets/activities/manifest.json'), 'utf8') } catch { return null } })()
  expect(text, '3C原版活动素材尚未导出').not.toBeNull()
  const manifest = JSON.parse(text!)
  expect(manifest.sourceSha256).toBe('790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba')
  for (const npcId of [9, 12, 13, 14, 15, 23]) {
    const clip = manifest.clips.find((value: { id: string }) => value.id === `trait-${npcId}`)
    expect(clip).toMatchObject({ sourceSymbol: 1319, sourcePicFrame: npcId, fps: 30 })
    expect(clip.frames).toHaveLength(60)
    expect(clip.frames[29]).toMatchObject({ width: 462, height: 433, offsetX: -231, offsetY: -212 })
  }
  for (const [id, count, width, height, offsetX, offsetY] of [
    ['witch', 1, 824, 624, -12, -12], ['lottery', 1, 824, 624, -12, -12],
    ['fog', 19, 182, 152, -59, -82], ['car2', 111, 1273, 212, -236.8, 120.25],
    ['show-npc4', 50, 408, 255, -204, -129],
  ] as const) {
    const clip = manifest.clips.find((value: { id: string }) => value.id === id)
    expect(clip.frames).toHaveLength(count)
    expect(clip.frames[0]).toMatchObject({ width, height, offsetX, offsetY })
  }
  for (const clip of manifest.clips) {
    for (const frame of clip.frames) {
      const png = readFileSync(resolve(root, 'public/modern', frame.url))
      expect(png.readUInt32BE(16)).toBe(frame.width)
      expect(png.readUInt32BE(20)).toBe(frame.height)
      expect(png[25]).toBe(6)
    }
  }
})

it('活动清单缺少必须的烟雾或NPC时间轴时明确失败，避免对局永远等待素材', () => {
  const root = resolve(import.meta.dirname, '../..')
  const manifest = JSON.parse(readFileSync(resolve(root, 'public/modern/assets/activities/manifest.json'), 'utf8'))
  expect(parseActivityAssets(manifest).clips.length).toBeGreaterThan(0)
  manifest.clips = manifest.clips.filter((clip: { id: string }) => clip.id !== 'fog')
  expect(() => parseActivityAssets(manifest)).toThrow('缺少活动时间轴')
})

afterEach(() => vi.unstubAllGlobals())

it('高清活动图片允许像素尺寸为逻辑画布的2倍', async () => {
  vi.stubGlobal('fetch', async () => new Response(new Uint8Array([1,2,3]), { status: 200 }))
  class HighDensityImage {
    naturalWidth=20
    naturalHeight=40
    set src(_value:string) {}
    async decode() {}
  }
  vi.stubGlobal('Image', HighDensityImage)
  const assets=await loadActivityFrames({id:'hd-fixture',sourceSymbol:1,fps:30,frames:[{
    sourceFrame:1,url:'assets-hd/activities/fixture/1.webp',width:10,height:20,
    offsetX:0,offsetY:0,fields:[],
  }]},new AbortController().signal)
  expect(assets.urls).toHaveLength(1)
  assets.release()
})

it('给自定义Pixi活动渲染器传入匹配源图倍率的纹理分辨率', () => {
  expect(activityPixelDensity('assets/activities/carnival-boy-1/1.png')).toBe(1)
  expect(activityPixelDensity('assets-hd/activities/carnival-boy-1/1.webp')).toBe(2)

  const texture = (width:number,height:number,url:string) => new Texture({
    source:new ImageSource({
      resource:{width,height,naturalWidth:width,naturalHeight:height,complete:true} as unknown as HTMLImageElement,
      resolution:activityPixelDensity(url),scaleMode:'linear',
    }),
  })
  const original = texture(800,600,'assets/activities/carnival-play/1.png')
  const hd = texture(1600,1200,'assets-hd/activities/carnival-play/1.webp')
  expect([original.width,original.height]).toEqual([800,600])
  expect([hd.width,hd.height]).toEqual([800,600])
  original.destroy(true);hd.destroy(true)
})
