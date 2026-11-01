import {it,expect} from 'vitest'
import {character25RigFor,character25ThumbnailUrl} from '../../src/modern/features/characters/characters-25-registry'
import {profileAssetUrl} from '../../src/modern/features/assets/profiles'
import {approvedActivityAssets} from '../../src/modern/features/assets/approved-artwork'
import native from '../../public/modern/assets/activities/manifest.json'
import complete from '../../src/modern/data/guaika-complete.json'
import type {ActivityManifest} from '../../src/modern/features/game/activity-assets'

it('routes every Guaika material family into the actual HD pipeline and preserves original',()=>{
 expect(character25RigFor(11,'hd')?.id).toBe(11)
 expect(character25RigFor(11,'original')).toBeUndefined()
 expect(character25ThumbnailUrl(11,'hd')).toBe(complete.thumbnailUrls['11'])
 for(const entry of complete.assets){
  expect(profileAssetUrl(entry.source,'hd')).toBe(entry.url)
  expect(profileAssetUrl(entry.source,'original')).toBe(entry.source)
 }
 const hd=approvedActivityAssets(native as ActivityManifest,'hd')
 for(const replacement of complete.activityClips)expect(hd.clips.find(c=>c.id===replacement.id)).toEqual(replacement)
 expect(approvedActivityAssets(native as ActivityManifest,'original')).toBe(native)
})
