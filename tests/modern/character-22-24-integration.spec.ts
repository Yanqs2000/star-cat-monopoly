import { expect, it } from 'vitest'
import world from '../../public/modern/assets/world/manifest.json'
import { approvedWorldAssets } from '../../src/modern/features/assets/approved-artwork'
import { profileTextureResolution, staticAssetPixels } from '../../src/modern/features/assets/profiles'
import { parseWorldAssets } from '../../src/modern/features/map/world-assets'
import { JUANMAO_24_TEXTURE_URLS } from '../../src/modern/features/characters/juanmao-24'

it('22 selects complete registered HD NPC bodies while original and item20 keep source assets',()=>{
 const source=parseWorldAssets(world),hd=approvedWorldAssets(source,'hd')
 for(const id of [2,3,4,5,9,10,11,12,13,14,15]){
  const clip=hd.clips.find(c=>c.id==='npc-'+id)!
  expect(clip.fps).toBe(60)
  for(const frame of clip.frames){
   expect(frame.url).toMatch(/^hd-characters\/npc-22\//)
   expect(profileTextureResolution(frame.url,'hd')).toBe(2)
   expect(staticAssetPixels(frame.url)?.pixelSize).toEqual([frame.width*2,frame.height*2])
  }
 }
 expect(hd.clips.find(c=>c.id==='npc-1')).toBe(source.clips.find(c=>c.id==='npc-1'))
 expect(approvedWorldAssets(source,'original')).toBe(source)
})

it('24 registers the actual puppet textures at their native density without changing original profile',()=>{
 expect(JUANMAO_24_TEXTURE_URLS.length).toBeGreaterThan(30)
 for(const url of JUANMAO_24_TEXTURE_URLS){
  expect(profileTextureResolution(url,'hd')).toBe(6)
  expect(profileTextureResolution(url,'original')).toBe(1)
 }
})
