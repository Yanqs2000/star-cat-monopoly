import{it,expect}from'vitest'
import{Texture}from'pixi.js'
import{Character25Player}from'../../src/modern/features/characters/characters-25'
import{sampleCharacter25Rig}from'../../src/modern/features/characters/characters-25-pose'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
import base from'../../src/modern/data/aniu-map-rig.json'
function crab(){
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig;rig.id=4;rig.anatomy='crab';rig.stridePx=18
 for(const view of Object.values(rig.facings)){
  const actor=view.actors[0]!,part=actor.parts.head!
  for(const [name,phase]of[['sideLeg0',0],['sideLeg1',.5]]as const){actor.joints[name]=actor.joints.neck!;actor.parts[name]=part;actor.order.push(name);actor.appendages.push({part:name,joint:name,kind:'tail',amplitude:.1,phase}as never)}
  actor.parts['sideLeg0-happy']={...part,url:'closed-eye.webp'}
 }
 return rig
}
it('moves the carapace as a rigid shell instead of bending a human neck',()=>{
 const rig=crab()
 for(const action of['walk','sad','happy','hurt','cheer']as const){
  const parts=sampleCharacter25Rig(rig,'down-right',action,600),head=parts.find(p=>/\/head(?:-expression)?$/.test(p.key))!,body=parts.find(p=>/\/body$/.test(p.key))!
  expect(head.a).toBeCloseTo(body.a,12);expect(head.b).toBeCloseTo(body.b,12)
  if(action==='walk')expect(head.b).toBe(0)
 }
})
it('alternates side legs and uses a single exclusive expression surface per eyestalk',()=>{
 const rig=crab(),parts=sampleCharacter25Rig(rig,'down-right','walk',200),a=parts.find(p=>p.key.endsWith('/sideLeg0'))!,b=parts.find(p=>p.key.endsWith('/sideLeg1'))!
 expect(a.b).toBeGreaterThan(.09);expect(b.b).toBeLessThan(-.09)
 const happy=sampleCharacter25Rig(rig,'down-right','happy',600).filter(p=>p.key.endsWith('/sideLeg0'))
 expect(happy).toHaveLength(1);expect(happy[0]!.part.url).toBe('closed-eye.webp')
})
it('plants the two main crab feet while the six side appendages remain independent',()=>{
 const rig=crab(),player=new Character25Player(rig,new Map(base.runtimeImages.map(p=>[p.url,Texture.WHITE])))
 player.setWorldPosition(0,0);player.setPose('down-right',true);expect(player.footContacts).toHaveLength(2)
 let previous=new Map<string,{x:number;y:number}>(),checked=0
 for(let i=1;i<=90;i++){
  player.update(1000/60);player.setWorldPosition(i*.7,i*.5);const current=new Map<string,{x:number;y:number}>()
  for(const f of player.footContacts)if(f.support){const key=f.key+':'+f.contactId,p={x:f.x+i*.7,y:f.y+i*.5},old=previous.get(key);if(old){expect(p.x).toBeCloseTo(old.x,9);expect(p.y).toBeCloseTo(old.y,9);checked++}current.set(key,p)}
  previous=current
 }
 expect(checked).toBeGreaterThan(30);player.destroy()
})
