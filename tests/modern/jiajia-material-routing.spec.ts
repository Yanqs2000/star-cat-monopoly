import{it,expect}from'vitest'
import{character25RigFor,character25ThumbnailUrl}from'../../src/modern/features/characters/characters-25-registry'
import{profileAssetUrl}from'../../src/modern/features/assets/profiles'
import{approvedActivityAssets}from'../../src/modern/features/assets/approved-artwork'
import native from'../../public/modern/assets/activities/manifest.json'
import type{ActivityManifest}from'../../src/modern/features/game/activity-assets'

it('routes all Jiajia HD material families and keeps the original game path intact',()=>{
 expect(character25RigFor(4,'hd')?.id).toBe(4);expect(character25RigFor(4,'original')).toBeUndefined()
 expect(character25ThumbnailUrl(4,'hd')).toContain('/role-04/thumbnail.webp')
 for(const source of['assets/activities/face-4/1.png','assets/activities/head-4/1.png','assets/monthly/champions/4.png',...[2,3,4,5,10,11].map(id=>`assets/characters/4/reactions/gods/${id}.png`)]){
  expect(profileAssetUrl(source,'hd')).not.toBe(source);expect(profileAssetUrl(source,'original')).toBe(source)
 }
 const ids=['face-4','head-4',...[1,2,3,4].map(i=>'fly-4-'+i),'carnival-boy-4','carnival-walk-4-left','carnival-walk-4-right']
 const hd=approvedActivityAssets(native as ActivityManifest,'hd')
 for(const id of ids){const clip=hd.clips.find(c=>c.id===id)!;expect(clip.frames.every(f=>f.url.includes('/role-04/'))).toBe(true)}
 expect(approvedActivityAssets(native as ActivityManifest,'original')).toBe(native)
})
