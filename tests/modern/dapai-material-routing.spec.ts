import{it,expect}from'vitest'
import{character25RigFor,character25ThumbnailUrl}from'../../src/modern/features/characters/characters-25-registry'
import{profileAssetUrl}from'../../src/modern/features/assets/profiles'
import{approvedActivityAssets}from'../../src/modern/features/assets/approved-artwork'
import native from'../../public/modern/assets/activities/manifest.json'
import type{ActivityManifest}from'../../src/modern/features/game/activity-assets'

it('routes all Dapai HD material families and keeps the original game path intact',()=>{
 expect(character25RigFor(5,'hd')?.id).toBe(5);expect(character25RigFor(5,'original')).toBeUndefined()
 expect(character25ThumbnailUrl(5,'hd')).toContain('/role-05/thumbnail.webp')
 for(const source of['assets/activities/face-5/1.png','assets/activities/head-5/1.png','assets/monthly/champions/5.png',...[2,3,4,5,10,11].map(id=>`assets/characters/5/reactions/gods/${id}.png`)]){
  expect(profileAssetUrl(source,'hd')).not.toBe(source);expect(profileAssetUrl(source,'original')).toBe(source)
 }
 const ids=['face-5','head-5',...[1,2,3,4].map(i=>'fly-5-'+i),'carnival-boy-5','carnival-walk-5-left','carnival-walk-5-right']
 const hd=approvedActivityAssets(native as ActivityManifest,'hd')
 for(const id of ids){const clip=hd.clips.find(c=>c.id===id)!;expect(clip.frames.every(f=>f.url.includes('/role-05/'))).toBe(true)}
 expect(approvedActivityAssets(native as ActivityManifest,'original')).toBe(native)
})
