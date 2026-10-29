import { expect, it } from 'vitest'
import world from '../../public/modern/assets/world/manifest.json'
import activities from '../../public/modern/assets/activities/manifest.json'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
import { parseWorldAssets } from '../../src/modern/features/map/world-assets'
import { approvedActivityAssets, approvedWorldAssets } from '../../src/modern/features/assets/approved-artwork'

it('18三骰用80个显示采样，落定前不提前出现影子、源点数逻辑仍30Hz', () => {
 const original=parseActivityAssets(activities),hd=approvedActivityAssets(original,'hd')
 expect(approvedActivityAssets(original,'original')).toBe(original)
 const dice=hd.clips.find(c=>c.id==='ludo-dice')!
 expect(dice.fps).toBe(60);expect(dice.frames).toHaveLength(80)
 expect(dice.frames[31]!.placements?.some(p=>p.name==='tz4')).toBe(false)
 expect(dice.frames[32]!.placements?.some(p=>p.name==='tz4')).toBe(true)
 const source=original.clips.find(c=>c.id==='ludo-dice')!
 for(let i=0;i<40;i++)expect(dice.frames[i*2]!.placements).toEqual(source.frames[i]!.placements)
 const p=dice.frames[1]!.placements!.find(p=>p.name==='tz1')!
 expect(p.x).not.toBe(source.frames[0]!.placements!.find(p=>p.name==='tz1')!.x)
})

it('19静态提示框只重制母版，保留两个有意保持的源时间轴与文字登记', () => {
 const original=parseActivityAssets(activities),hd=approvedActivityAssets(original,'hd')
 for(const id of ['show2','show-npc4']){
  const before=original.clips.find(c=>c.id===id)!,after=hd.clips.find(c=>c.id===id)!
  expect(after.fps).toBe(30);expect(after.frames).toHaveLength(before.frames.length)
  expect(new Set(after.frames.map(f=>f.url)).size).toBe(1)
  expect(after.frames[0]!.url).toContain('hd-static/continuous-18-21/')
  for(let i=0;i<before.frames.length;i++)expect(after.frames[i]!.fields).toEqual(before.frames[i]!.fields)
 }
})

it.each([['car1',226],['car2',222]] as const)('21 %s保持源时长、统一画布、锚点和完整60Hz采样', (id,count) => {
 const original=parseActivityAssets(activities),hd=approvedActivityAssets(original,'hd')
 const source=original.clips.find(c=>c.id===id)!,clip=hd.clips.find(c=>c.id===id)!
 expect(clip.fps).toBe(60);expect(clip.frames).toHaveLength(count)
 expect(clip.frames.length/clip.fps).toBe(source.frames.length/source.fps)
 expect(clip.frames[0]!.offsetX).toBe(source.frames[0]!.offsetX)
 expect(clip.frames[0]!.offsetY).toBe(source.frames[0]!.offsetY)
 expect(new Set(clip.frames.map(f=>f.url)).size).toBeGreaterThan(100)
})

it('20按用户要求后移，帐篷小猫及其小地图图标保持原来的资源映射', () => {
 const source=parseWorldAssets(world),hd=approvedWorldAssets(source,'hd')
 expect(hd.clips.find(c=>c.id==='npc-1')).toBe(source.clips.find(c=>c.id==='npc-1'))
 const activity=parseActivityAssets(activities),after=approvedActivityAssets(activity,'hd')
 expect(after.clips.find(c=>c.id==='mini-npc-1')).toBe(activity.clips.find(c=>c.id==='mini-npc-1'))
})
