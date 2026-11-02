import{it,expect}from'vitest'
import * as selection from '../../src/modern/features/characters/characters-25-registry'
import {profileTextureResolution}from'../../src/modern/features/assets/profiles'

it('keeps accepted A-Niu and the Guaika/Weiwei candidates isolated from paused identities and original routing',()=>{
 expect(selection.character25RigFor(2,'hd')?.id).toBe(2)
 expect(selection.character25RigFor(11,'hd')?.id).toBe(11)
 expect(selection.character25RigFor(6,'hd')?.id).toBe(6)
 expect(selection.character25RigFor(10,'hd')?.id).toBe(10)
 expect(selection.character25RigFor(12,'hd')?.id).toBe(12)
 expect(selection.character25RigFor(3,'hd')?.id).toBe(3)
 expect(selection.character25RigFor(4,'hd')?.id).toBe(4)
 expect(selection.character25RigFor(7,'hd')?.id).toBe(7)
 for(const id of[1,5,8,9])expect(selection.character25RigFor(id,'hd')).toBeUndefined()
 expect(selection.character25RigFor(2,'original')).toBeUndefined()
 expect(selection.character25TextureUrls([1,5,9],'hd')).toEqual([])
 expect(selection.character25TextureUrls([2],'original')).toEqual([])
 const urls=selection.character25TextureUrls([2,2,1,9],'hd')
 expect(urls.length).toBeGreaterThan(50);expect(new Set(urls).size).toBe(urls.length)
 for(const url of urls){expect(url).toContain('/role-02/');expect(profileTextureResolution(url,'hd')).toBe(6);expect(profileTextureResolution(url,'original')).toBe(1)}
})
