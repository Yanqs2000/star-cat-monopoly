import { readFileSync } from 'node:fs'
import { expect,it } from 'vitest'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
const manifest=JSON.parse(readFileSync('public/modern/assets/activities/manifest.json','utf8'))
it('投注整组原素材缺失会报错，不能留在不可恢复的空面板',()=>{
 expect(()=>parseActivityAssets({...manifest,clips:manifest.clips.filter((c:{id:string})=>!c.id.startsWith('ludo-'))})).toThrow('ludo')
})
it('原投注800×600、原40帧骰子与中奖动画、6种骰面阴影全部源几何对应PNG',()=>{
 for(const [id,count] of [['ludo-betting',1],['ludo-game',1],['ludo-dice',40],['ludo-win',40],['ludo-chip',1],...[1,2,3,4,5,6].flatMap(i=>[[`ludo-face-${i}`,1],[`ludo-shadow-${i}`,1]])]) {
  const clip=manifest.clips.find((c:{id:string})=>c.id===id);expect(clip.frames).toHaveLength(Number(count))
  for(const f of clip.frames){const png=readFileSync(`public/modern/${f.url}`);expect(png.readUInt32BE(16)).toBe(f.width);expect(png.readUInt32BE(20)).toBe(f.height)}
 }
 expect(manifest.clips.find((c:{id:string})=>c.id==='ludo-betting').frames[0]).toMatchObject({width:800,height:600})
 expect(manifest.clips.find((c:{id:string})=>c.id==='ludo-dice').frames[39].placements).toHaveLength(6)
})
