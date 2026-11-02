import{it,expect}from'vitest'
import{Texture,Sprite}from'pixi.js'
import{Character25Player}from'../../src/modern/features/characters/characters-25'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
import base from'../../src/modern/data/aniu-map-rig.json'

function pairedRig(){
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig;rig.id=3;rig.name='吉吉&米米';rig.anatomy='paired'
 for(const view of Object.values(rig.facings)){
  const first=view.actors[0]!;first.id='curl';const second=structuredClone(first);second.id='bandana'
  for(const name of Object.keys(second.joints)){const p=second.joints[name]!;second.joints[name]=[p[0]+26,p[1]-4]}
  view.actors.push(second)
 }
 return rig
}

it('keeps two independent pairs of world-grounded feet through movement and zero-time stopping',()=>{
 const rig=pairedRig()
 const player=new Character25Player(rig,new Map(base.runtimeImages.map(p=>[p.url,Texture.WHITE])))
 const sprites=()=>player.view.children.filter(c=>c instanceof Sprite&&/Foot$/.test(c.label)).map(c=>[c.label,c.x,c.y])
 player.setWorldPosition(0,0);const rest=sprites();player.setPose('down-right',true);player.update(0);expect(sprites()).toEqual(rest)
 expect(player.footContacts).toHaveLength(4)
 let previous=new Map<string,{x:number;y:number}>(),checks=0
 for(let i=1;i<=120;i++){
  player.update(1000/60);player.setWorldPosition(i*.7,i*.5)
  const current=new Map<string,{x:number;y:number}>()
  for(const id of['curl','bandana'])expect(player.footContacts.some(f=>f.key.startsWith(id+'/')&&f.support)).toBe(true)
  for(const foot of player.footContacts)if(foot.support){
   const world={x:foot.x+i*.7,y:foot.y+i*.5}
   // Each actor owns its contact serial, so identity is part of the key.
   const key=foot.key+':'+foot.contactId
   const old=previous.get(key)
   if(old){expect(world.x).toBeCloseTo(old.x,8);expect(world.y).toBeCloseTo(old.y,8);checks++}
   current.set(key,world)
  }
  previous=current
 }
 expect(checks).toBeGreaterThan(120)
 const moving=sprites();player.setPose('down-right',false);player.update(0);expect(sprites()).toEqual(moving)
 player.update(500);expect(player.footContacts.every(f=>f.support&&f.lift===0)).toBe(true);player.destroy()
})

it('puts the shared ready die on the declared twin and supports native occluded views',()=>{
 const measure=(rig:Character25Rig)=>{const player=new Character25Player(rig,new Map(base.runtimeImages.map(p=>[p.url,Texture.WHITE])));player.setReaction('ready');player.update(0);const b=player.view.children.at(-1)!.getLocalBounds();const result={x:b.x+b.width/2,y:b.y+b.height/2,width:b.width};player.destroy();return result}
 const original=measure(pairedRig()),target=pairedRig();target.facings['down-right'].readyActorId='bandana'
 const moved=measure(target);expect(moved.x-original.x).toBeCloseTo(26,8);expect(moved.y-original.y).toBeCloseTo(-4,8)
 const hidden=pairedRig();hidden.facings['down-right'].readyActorId=null;expect(measure(hidden).width).toBe(0)
})

it('initializes the horizontal carnival gait before its first displacement',()=>{
 const rig=pairedRig(),player=new Character25Player(rig,new Map(base.runtimeImages.map(p=>[p.url,Texture.WHITE])),false,false)
 player.setPose('down-left',true);player.setWorldPosition(0,0,{x:-1,y:0});player.update(0)
 for(const actor of rig.facings['down-left'].actors)for(const leg of actor.legs){
  const foot=player.view.children.find(c=>c instanceof Sprite&&c.label===actor.id+'/'+leg.tip)!
  expect(foot.y).toBeCloseTo(actor.joints[leg.end]![1],10)
 }
 player.destroy()
})
