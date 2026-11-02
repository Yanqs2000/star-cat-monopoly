import{it,expect}from'vitest'
import{character25RigFor,character25ThumbnailUrl}from'../../src/modern/features/characters/characters-25-registry'
import{profileAssetUrl}from'../../src/modern/features/assets/profiles'
import{approvedActivityAssets}from'../../src/modern/features/assets/approved-artwork'
import native from'../../public/modern/assets/activities/manifest.json'
import type{ActivityManifest}from'../../src/modern/features/game/activity-assets'

it('routes all Afei HD material families and keeps the original game path intact',()=>{
 expect(character25RigFor(9,'hd')?.id).toBe(9);expect(character25RigFor(9,'original')).toBeUndefined()
 expect(character25ThumbnailUrl(9,'hd')).toContain('/role-09/thumbnail.webp')
 for(const source of['assets/activities/face-9/1.png','assets/activities/head-9/1.png','assets/monthly/champions/9.png',...[2,3,4,5,10,11].map(id=>`assets/characters/9/reactions/gods/${id}.png`)]){
  expect(profileAssetUrl(source,'hd')).not.toBe(source);expect(profileAssetUrl(source,'original')).toBe(source)
 }
 const ids=['face-9','head-9',...[1,2,3,4].map(i=>'fly-9-'+i),'carnival-boy-9','carnival-walk-9-left','carnival-walk-9-right']
 const hd=approvedActivityAssets(native as ActivityManifest,'hd')
 for(const id of ids){const clip=hd.clips.find(c=>c.id===id)!;expect(clip.frames.every(f=>f.url.includes('/role-09/'))).toBe(true)}
 expect(approvedActivityAssets(native as ActivityManifest,'original')).toBe(native)
})
