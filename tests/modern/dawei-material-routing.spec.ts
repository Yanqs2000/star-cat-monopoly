import{it,expect}from'vitest'
import{character25RigFor,character25ThumbnailUrl}from'../../src/modern/features/characters/characters-25-registry'
import{profileAssetUrl}from'../../src/modern/features/assets/profiles'
import{approvedActivityAssets}from'../../src/modern/features/assets/approved-artwork'
import native from'../../public/modern/assets/activities/manifest.json'
import type{ActivityManifest}from'../../src/modern/features/game/activity-assets'

it('routes all Dawei HD material families and keeps the original game path intact',()=>{
 expect(character25RigFor(8,'hd')?.id).toBe(8);expect(character25RigFor(8,'original')).toBeUndefined()
 expect(character25ThumbnailUrl(8,'hd')).toContain('/role-08/thumbnail.webp')
 for(const source of['assets/activities/face-8/1.png','assets/activities/head-8/1.png','assets/monthly/champions/8.png',...[2,3,4,5,10,11].map(id=>`assets/characters/8/reactions/gods/${id}.png`)]){
  expect(profileAssetUrl(source,'hd')).not.toBe(source);expect(profileAssetUrl(source,'original')).toBe(source)
 }
 const ids=['face-8','head-8',...[1,2,3,4].map(i=>'fly-8-'+i),'carnival-boy-8','carnival-walk-8-left','carnival-walk-8-right']
 const hd=approvedActivityAssets(native as ActivityManifest,'hd')
 for(const id of ids){const clip=hd.clips.find(c=>c.id===id)!;expect(clip.frames.every(f=>f.url.includes('/role-08/'))).toBe(true)}
 expect(approvedActivityAssets(native as ActivityManifest,'original')).toBe(native)
})
