import { describe, expect, it } from 'vitest'
import world from '../../public/modern/assets/world/manifest.json'
import activities from '../../public/modern/assets/activities/manifest.json'
import { parseWorldAssets } from '../../src/modern/features/map/world-assets'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
import { profileAssetUrl, profileTextureResolution } from '../../src/modern/features/assets/profiles'
import { approvedWorldAssets, approvedActivityAssets, carnivalPresentationFrame } from '../../src/modern/features/assets/approved-artwork'
import characters25 from '../../src/modern/features/characters/characters-25-materials'
const npcIds=[2,3,4,5,9,10,11,12,13,14,15]
const newWorldIds=new Set(npcIds.map(id=>'npc-'+id))
const newActivityIds=new Set([...npcIds.map(id=>'mini-npc-'+id),...[9,12,13,14,15,23].map(id=>'trait-'+id),...characters25.activityClips.map(c=>c.id)])

describe('已验收01—12游戏接入',()=>{
 it('六个静态图只在高清模式替换，原图和查询参数保留',()=>{
  for(const path of ['ui/cash','ui/deposit','ui/tickets','ui/emblem','ui/card-rail','companies/calculator']){
   const source=`assets/${path}.png`
   expect(profileAssetUrl(source,'original')).toBe(source)
   expect(profileAssetUrl(source+'?v=1','hd')).toBe(`hd-static/approved-01-12/${path}.webp?v=1`)
  }
 })
 it('地雷60fps保留原时长、世界锚点和防裁切留白，其余世界动画不变',()=>{
  const original=parseWorldAssets(world),hd=approvedWorldAssets(original,'hd')
  expect(approvedWorldAssets(original,'original')).toBe(original)
  const before=original.clips.find(c=>c.id==='mine')!,after=hd.clips.find(c=>c.id==='mine')!
  expect(after.fps).toBe(60);expect(after.frames).toHaveLength(160)
  expect(new Set(after.frames.map(f=>f.url)).size).toBe(160)
  for(let i=1;i<after.frames.length;i++)expect(after.frames[i]!.url).not.toBe(after.frames[i-1]!.url)
  expect(after.frames.length/after.fps).toBe(before.frames.length/before.fps)
  expect(after.frames[0]!.offsetX).toBeCloseTo(before.frames[0]!.offsetX-4)
  expect(after.frames[0]!.offsetY).toBeCloseTo(before.frames[0]!.offsetY-4)
  expect(after.frames[0]!.width).toBe(before.frames[0]!.width+8)
  expect(profileTextureResolution(after.frames[0]!.url,'hd')).toBe(4)
  const protectedClip=(c:{id:string})=>!newWorldIds.has(c.id)&&!c.id.startsWith('barrier-')&&!['mine','card-gain','ticket-gain','explosion','rocket'].includes(c.id)
  expect(hd.clips.filter(protectedClip)).toEqual(original.clips.filter(protectedClip))
 })
 it('四种掉落物使用60帧且保持一秒时长，未启用人物和活动继续保留原动画',()=>{
  const original=parseActivityAssets(activities),hd=approvedActivityAssets(original,'hd')
  expect(approvedActivityAssets(original,'original')).toBe(original)
  for(let i=1;i<=4;i++){const c=hd.clips.find(c=>c.id===`carnival-ball-${i}`)!;expect(c.frames).toHaveLength(60);expect(c.fps).toBe(60);expect(c.frames.length/c.fps).toBe(1);expect(new Set(c.frames.map(f=>f.url)).size).toBeGreaterThanOrEqual(59);for(let j=1;j<c.frames.length;j++)expect(c.frames[j]!.url).not.toBe(c.frames[j-1]!.url)}
  const protectedClip=(c:{id:string})=>!newActivityIds.has(c.id)&&!c.id.startsWith('carnival-ball-')&&!['fog','show2','show-npc4','ludo-dice','car1','car2'].includes(c.id)
  expect(hd.clips.filter(protectedClip)).toEqual(original.clips.filter(protectedClip))
 })
 it('30fps游戏逻辑之间显示中间帧，暂停、倍速和末帧衔接不越界',()=>{
  expect(carnivalPresentationFrame(1,0,60,1)).toBe(1)
  expect(carnivalPresentationFrame(1,17,60,1)).toBe(2)
  expect(carnivalPresentationFrame(1,9,60,2)).toBe(2)
  expect(carnivalPresentationFrame(30,1000,60,1)).toBe(60)
  expect(carnivalPresentationFrame(1,0,30,1)).toBe(1)
 })
})
