import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
it('魔法门/法院原图包含选帧、判决45帧和拘留113帧，12角色飞行保留原矩阵锚点', () => {
  const root=resolve(import.meta.dirname,'../..')
  const manifest=JSON.parse(readFileSync(resolve(root,'public/modern/assets/activities/manifest.json'),'utf8'))
  const clip=(id:string)=>manifest.clips.find((item:{id:string})=>item.id===id)
  expect(clip('station'),'魔法门原图尚未接入').toBeDefined()
  expect(clip('station')).toMatchObject({sourceSymbol:2542,nativeFirstFrame:2})
  expect(clip('court-target')).toMatchObject({sourceSymbol:2683,nativeFirstFrame:1})
  expect(clip('court-case')).toMatchObject({sourceSymbol:2683,nativeFirstFrame:2})
  expect(clip('show2').frames).toHaveLength(45)
  expect(clip('car1').frames).toHaveLength(113)
  expect(clip('court-highlight').frames).toHaveLength(23)
  const newIds=['station','court-target','court-case','show2','car1','court-highlight']
  for(let character=1;character<=12;character++) {
    expect(clip(`face-${character}`)).toMatchObject({sourceSymbol:2042,nativeFirstFrame:character})
    newIds.push(`face-${character}`)
    for(let direction=1;direction<=4;direction++) {
      const id=`fly-${character}-${direction}`
      expect(clip(id)).toMatchObject({sourceSymbol:982,sourcePicFrame:(character-1)*10+direction})
      expect(clip(id).frames).toHaveLength(1)
      newIds.push(id)
    }
  }
  for(const id of newIds)for(const frame of clip(id).frames) {
    const png=readFileSync(resolve(root,'public/modern',frame.url))
    expect(png.readUInt32BE(16)).toBe(frame.width)
    expect(png.readUInt32BE(20)).toBe(frame.height)
  }
})
it('原小地图NPC、路障和地雷独立图标完整，帐篷沿原57×135小图锚点',()=>{
  const root=resolve(import.meta.dirname,'../..')
  const manifest=JSON.parse(readFileSync(resolve(root,'public/modern/assets/activities/manifest.json'),'utf8'))
  for(const id of [1,2,3,4,5,9,10,11,12,13,14,15])expect(manifest.clips.find((clip:{id:string})=>clip.id===`mini-npc-${id}`)?.frames).toHaveLength(1)
  for(const id of ['mini-barrier','mini-mine'])expect(manifest.clips.find((clip:{id:string})=>clip.id===id)?.frames).toHaveLength(1)
  const tent=manifest.clips.find((clip:{id:string})=>clip.id==='mini-npc-1')
  expect(tent).toMatchObject({sourceSymbol:296,frames:[{width:57,height:135,offsetX:0,offsetY:-95}]})
})
