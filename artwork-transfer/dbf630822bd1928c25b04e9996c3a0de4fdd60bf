import { readFileSync } from 'node:fs'
import { expect,it } from 'vitest'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
const manifest=JSON.parse(readFileSync('public/modern/assets/activities/manifest.json','utf8'))
it('游乐场整组素材缺失必须报错，12角色/四种30帧落物/90帧开场来源完整',()=>{
 expect(()=>parseActivityAssets({...manifest,clips:manifest.clips.filter((c:{id:string})=>!c.id.startsWith('carnival-'))})).toThrow('carnival')
 for(const [id,count] of [['carnival-play',1],['carnival-score',1],['carnival-intro',90],...[1,2,3,4].map(i=>[`carnival-ball-${i}`,30]),...Array.from({length:12},(_,i)=>[`carnival-boy-${i+1}`,3])]) {
  const clip=manifest.clips.find((c:{id:string})=>c.id===id);expect(clip.frames).toHaveLength(Number(count))
  for(const f of clip.frames){const png=readFileSync(`public/modern/${f.url}`);expect(png.readUInt32BE(16)).toBe(f.width);expect(png.readUInt32BE(20)).toBe(f.height)}
 }
})

it('12角色左右步行子时间轴完整，保持原16/18/12/14帧差异与镜像',()=>{
 const counts=[16,16,16,18,16,12,16,16,16,14,16,16]
 for(let role=1;role<=12;role++)for(const side of ['left','right']) {
  const c=manifest.clips.find((c:{id:string})=>c.id===`carnival-walk-${role}-${side}`)
  expect(c,`缺少角色${role}${side}步行`).toBeDefined();expect(c.frames).toHaveLength(counts[role-1]!)
 }
})
