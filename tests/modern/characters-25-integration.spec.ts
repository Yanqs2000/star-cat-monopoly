import{it,expect}from'vitest'
import * as selection from '../../src/modern/features/characters/characters-25-registry'
import {profileTextureResolution}from'../../src/modern/features/assets/profiles'

it('enables only the single in-progress identity and keeps original and accepted Juanmao routing',()=>{
 expect(selection.character25RigFor(2,'hd')?.id).toBe(2)
 for(const id of[1,3,4,5,6,7,8,9,10,11,12])expect(selection.character25RigFor(id,'hd')).toBeUndefined()
 expect(selection.character25RigFor(2,'original')).toBeUndefined()
 expect(selection.character25TextureUrls([1,3,12],'hd')).toEqual([])
 expect(selection.character25TextureUrls([2],'original')).toEqual([])
 const urls=selection.character25TextureUrls([2,2,1,12],'hd')
 expect(urls.length).toBeGreaterThan(50);expect(new Set(urls).size).toBe(urls.length)
 for(const url of urls){expect(url).toContain('/role-02/');expect(profileTextureResolution(url,'hd')).toBe(6);expect(profileTextureResolution(url,'original')).toBe(1)}
})
