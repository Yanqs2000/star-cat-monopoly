import{it,expect}from'vitest'
import{Texture,Sprite}from'pixi.js'
import{Character25Player}from'../../src/modern/features/characters/characters-25'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
import base from'../../src/modern/data/aniu-map-rig.json'
it('keeps both Dapai support paws fixed in world space and stops without a zero-time snap',()=>{
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig;rig.id=5;rig.anatomy='biped';rig.stridePx=18
 const player=new Character25Player(rig,new Map(base.runtimeImages.map(p=>[p.url,Texture.WHITE])))
 player.setWorldPosition(0,0);player.setPose('down-right',true);expect(player.footContacts).toHaveLength(2)
 const feet=()=>player.view.children.filter(c=>c instanceof Sprite&&/Foot$/.test(c.label)).map(c=>[c.label,c.x,c.y])
 let previous=new Map<string,{x:number;y:number}>(),checks=0
 for(let i=1;i<=120;i++){
  player.update(1000/60);player.setWorldPosition(i*.7,i*.5);const current=new Map<string,{x:number;y:number}>()
  expect(player.footContacts.some(f=>f.support)).toBe(true)
  for(const f of player.footContacts)if(f.support){const key=f.key+':'+f.contactId,p={x:f.x+i*.7,y:f.y+i*.5},old=previous.get(key);if(old){expect(p.x).toBeCloseTo(old.x,9);expect(p.y).toBeCloseTo(old.y,9);checks++}current.set(key,p)}
  previous=current
 }
 expect(checks).toBeGreaterThan(80);const moving=feet();player.setPose('down-right',false);player.update(0);expect(feet()).toEqual(moving);player.update(500);expect(player.footContacts.every(f=>f.support&&f.lift===0)).toBe(true);player.destroy()
})
