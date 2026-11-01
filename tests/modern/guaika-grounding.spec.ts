import {it,expect} from 'vitest'
import {Texture,Sprite} from 'pixi.js'
import {Character25Player} from '../../src/modern/features/characters/characters-25'
import type {Character25Rig} from '../../src/modern/features/characters/characters-25-types'
import base from '../../src/modern/data/aniu-map-rig.json'

it('applies grounded start/stop and world contacts to the next biped identity',()=>{
 const rig=structuredClone(base.characters[0])as unknown as Character25Rig
 rig.id=11;rig.name='怪卡'
 const player=new Character25Player(rig,new Map(base.runtimeImages.map(p=>[p.url,Texture.WHITE])))
 const feet=()=>player.view.children.filter(c=>c instanceof Sprite&&/Foot$/.test(c.label)).map(c=>[c.label,c.x,c.y])
 player.setWorldPosition(0,0)
 const rest=feet();player.setPose('down-right',true);player.update(0)
 expect(feet()).toEqual(rest)
 expect(player.footContacts).toHaveLength(2)
 let previous=new Map<number,{x:number;y:number}>(),checks=0
 for(let i=1;i<=120;i++){
  player.update(1000/60);player.setWorldPosition(i*.7,i*.5)
  const current=new Map<number,{x:number;y:number}>()
  for(const foot of player.footContacts)if(foot.support){
   const world={x:foot.x+i*.7,y:foot.y+i*.5},before=previous.get(foot.contactId)
   if(before){expect(world.x).toBeCloseTo(before.x,8);expect(world.y).toBeCloseTo(before.y,8);checks++}
   current.set(foot.contactId,world)
  }
  previous=current
 }
 expect(checks).toBeGreaterThan(50)
 const moving=feet();player.setPose('down-right',false);player.update(0);expect(feet()).toEqual(moving)
 player.destroy()
})
