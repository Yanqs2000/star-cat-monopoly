import { expect, it } from 'vitest'
import activities from '../../public/modern/assets/activities/manifest.json'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
import { approvedActivityAssets } from '../../src/modern/features/assets/approved-artwork'
import { profileTextureResolution, staticAssetPixels } from '../../src/modern/features/assets/profiles'

it('23 uses the eleven canonical NPC icons and preserves item20', () => {
 const source=parseActivityAssets(activities),hd=approvedActivityAssets(source,'hd')
 for(const id of [2,3,4,5,9,10,11,12,13,14,15]){
  const before=source.clips.find(c=>c.id==='mini-npc-'+id)!,after=hd.clips.find(c=>c.id===before.id)!
  expect(after.frames[0]!.url).toMatch(/^hd-characters\/npc-23\//)
  expect(after.frames.length).toBe(1)
  expect(after.frames[0]!.offsetX).toBe(before.frames[0]!.offsetX)
  expect(after.frames[0]!.offsetY).toBe(before.frames[0]!.offsetY)
  expect(profileTextureResolution(after.frames[0]!.url,'hd')).toBe(2)
  expect(staticAssetPixels(after.frames[0]!.url)?.pixelSize).toEqual([after.frames[0]!.width*2,after.frames[0]!.height*2])
 }
 expect(hd.clips.find(c=>c.id==='mini-npc-1')).toBe(source.clips.find(c=>c.id==='mini-npc-1'))
 expect(approvedActivityAssets(source,'original')).toBe(source)
})

it('23 retains each original static narrative hold, live text registration and duration', () => {
 const source=parseActivityAssets(activities),hd=approvedActivityAssets(source,'hd')
 for(const id of [9,12,13,14,15,23]){
  const before=source.clips.find(c=>c.id==='trait-'+id)!,after=hd.clips.find(c=>c.id===before.id)!
  expect(after.frames[0]!.url).toMatch(/^hd-characters\/npc-23\//)
  expect(after.frames.length).toBe(60);expect(after.fps).toBe(30)
  expect(new Set(after.frames.map(f=>f.url)).size).toBe(1)
  for(let i=0;i<60;i++)expect(after.frames[i]!.fields).toEqual(before.frames[i]!.fields)
 }
})
