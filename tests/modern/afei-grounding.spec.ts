import{it,expect}from'vitest'
import{Texture}from'pixi.js'
import{Character25Player}from'../../src/modern/features/characters/characters-25'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
import base from'../../src/modern/data/aniu-map-rig.json'
function centaur(){
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig;rig.id=9;rig.anatomy='centaur';rig.stridePx=24
 for(const f of Object.values(rig.facings))for(const actor of f.actors){
  const originals=actor.legs,legs=[]
  for(const[name,source,phase,dx]of[['leftFront',0,0,-3],['leftHind',0,.5,3],['rightFront',1,.5,-3],['rightHind',1,0,3]]as const){
   const old=originals[source]!,leg={...old,name,phase}
   for(const key of ['root','middle','end','upper','lower','tip']as const){const from=old[key];if(!from)continue;const to=from.replace(old.name,name);leg[key]=to;if(key==='root'||key==='middle'||key==='end'){const p=actor.joints[from]!;actor.joints[to]=[p[0]+dx,p[1]]}else{actor.parts[to]=actor.parts[from]!;actor.order.push(to)}}
   legs.push(leg)
  }actor.legs=legs
 }return rig
}
it('plants four horse hooves under one Afei body in alternating diagonals',()=>{
 const player=new Character25Player(centaur(),new Map(base.runtimeImages.map(p=>[p.url,Texture.WHITE])))
 player.setWorldPosition(0,0);player.setPose('down-right',true);expect(player.footContacts).toHaveLength(4)
 let previous=new Map<string,{x:number;y:number}>(),checks=0;const lifted=new Set<string>()
 for(let i=1;i<=180;i++){
  player.update(1000/60);player.setWorldPosition(i*.65,i*.4);const contacts=player.footContacts,now=new Map<string,{x:number;y:number}>()
  expect(contacts.every(f=>f.key.startsWith('main/'))).toBe(true);expect(contacts.filter(f=>f.support).length).toBeGreaterThanOrEqual(2)
  const air=contacts.filter(f=>!f.support).map(f=>f.key).sort();if(air.length===2){expect(air.some(k=>k.includes('Front'))).toBe(true);expect(air.some(k=>k.includes('Hind'))).toBe(true);lifted.add(air.join(','))}
  for(const f of contacts)if(f.support){const key=f.key+':'+f.contactId,p={x:f.x+i*.65,y:f.y+i*.4},old=previous.get(key);if(old){expect(p.x).toBeCloseTo(old.x,9);expect(p.y).toBeCloseTo(old.y,9);checks++}now.set(key,p)}previous=now
 }
 expect(checks).toBeGreaterThan(200);expect(lifted.size).toBe(2)
 const moving=player.footContacts;player.setPose('down-right',false);player.update(0);expect(player.footContacts).toEqual(moving);player.update(500);expect(player.footContacts.every(f=>f.support&&f.lift===0)).toBe(true);player.destroy()
})
