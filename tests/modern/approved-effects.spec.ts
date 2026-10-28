import { describe,expect,it } from 'vitest'
import world from '../../public/modern/assets/world/manifest.json'
import activities from '../../public/modern/assets/activities/manifest.json'
import {parseActivityAssets} from '../../src/modern/features/game/activity-assets'
import { parseWorldAssets } from '../../src/modern/features/map/world-assets'
import { approvedWorldAssets, approvedActivityAssets } from '../../src/modern/features/assets/approved-artwork'

describe('13—17 高清连续单次特效',()=>{
 it('13卡牌100个显示帧保留原50/30秒、锚点和非循环末态',()=>{
  const original=parseWorldAssets(world),hd=approvedWorldAssets(original,'hd')
  expect(approvedWorldAssets(original,'original')).toBe(original)
  const source=original.clips.find(c=>c.id==='card-gain')!,card=hd.clips.find(c=>c.id==='card-gain')!
  expect(card.fps).toBe(60);expect(card.frames).toHaveLength(100);expect(card.loop).toBe(false)
  expect(card.frames.length/card.fps).toBe(source.frames.length/source.fps)
  expect(card.frames[0]!.offsetX).toBe(source.frames[0]!.offsetX)
  expect(card.frames[0]!.offsetY).toBe(source.frames[0]!.offsetY)
  expect(card.frames.every(f=>f.url.startsWith('hd-static/effects-13-17/card-gain/'))).toBe(true)
  expect(new Set(card.frames.slice(0,90).map(f=>f.url)).size).toBeGreaterThan(70)
 })
 it.each([['ticket-gain',60],['explosion',120],['rocket',160]] as const)('%s保持原时长并提供全部60fps采样', (id,count)=>{const source=parseWorldAssets(world),hd=approvedWorldAssets(source,'hd');const before=source.clips.find(c=>c.id===id)!,after=hd.clips.find(c=>c.id===id)!;expect(after.fps).toBe(60);expect(after.frames).toHaveLength(count);expect(after.frames.length/after.fps).toBe(before.frames.length/before.fps);expect(after.loop).toBe(false);expect(after.frames.every(f=>f.url.startsWith(`hd-static/effects-13-17/${id}/`))).toBe(true)})
 it('fog用38个显示采样保持19帧业务时间轴与原画质不变',()=>{const source=parseActivityAssets(activities);expect(approvedActivityAssets(source,'original')).toBe(source);const fog=approvedActivityAssets(source,'hd').clips.find(c=>c.id==='fog')!;expect(fog.fps).toBe(60);expect(fog.frames).toHaveLength(38);expect(fog.frames.length/fog.fps).toBe(19/30);expect(source.clips.find(c=>c.id==='fog')!.frames).toHaveLength(19)})
})
