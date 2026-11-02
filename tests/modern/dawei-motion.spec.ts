import{it,expect}from'vitest'
import{Texture,Sprite}from'pixi.js'
import{Character25Player}from'../../src/modern/features/characters/characters-25'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
import base from'../../src/modern/data/aniu-map-rig.json'
it('keeps both Dawei support paws fixed in world space and stops without a zero-time snap',()=>{
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig;rig.id=8;rig.anatomy='scorpion';rig.stridePx=18
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

import{sampleCharacter25Rig}from'../../src/modern/features/characters/characters-25-pose'
it('keeps the Dawei shell rigid while walking',()=>{
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig;rig.id=8;rig.anatomy='scorpion'
 for(let t=0;t<800;t+=13){const parts=sampleCharacter25Rig(rig,'down-right','walk',t);for(const p of parts.filter(p=>/\/(body|head)$/.test(p.key)))expect(Math.atan2(p.b,p.a)).toBe(0)}
})
it('keeps chained tail segment roots welded through movement and soot collapse',()=>{
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig;rig.id=8;rig.anatomy='scorpion'
 const actor=rig.facings['down-right'].actors[0]!;actor.joints.tailRoot=[-3,-7];actor.joints.tailUnused=[20,20]
 const source=actor.parts.body!;actor.parts.tailBase={...source,axis:[4,-3]};actor.parts.tailTip={...source,axis:[1,-4]}
 actor.appendages=[{part:'tailBase',joint:'tailRoot',kind:'tail',amplitude:.1,hurtRotation:.6},{part:'tailTip',joint:'tailUnused',kind:'tail',parentPart:'tailBase',amplitude:.07,phase:.15,hurtRotation:-.3}]
 actor.order.push('tailBase','tailTip')
 for(const action of ['neutral','walk','hurt']as const)for(let t=0;t<=1600;t+=7){
  const parts=sampleCharacter25Rig(rig,'down-right',action,t),a=parts.find(p=>p.sourcePart==='tailBase')!,b=parts.find(p=>p.sourcePart==='tailTip')!,axis=a.part.axis!
  expect(b.tx).toBeCloseTo(a.tx+a.a*axis[0]+a.c*axis[1],10);expect(b.ty).toBeCloseTo(a.ty+a.b*axis[0]+a.d*axis[1],10)
 }
})
import dawei from'../../src/modern/data/dawei-map-rig.json'
it('keeps the soot tail curled within its own footprint',()=>{
 const rig=dawei.characters[0]as unknown as Character25Rig
 for(const facing of ['up-left','up-right']as const){const tip=sampleCharacter25Rig(rig,facing,'hurt',1400).filter(p=>/\/tail[0-9]+$/.test(p.key)).at(-1)!;expect(Math.abs(tip.tx)).toBeLessThan(52)}
})
