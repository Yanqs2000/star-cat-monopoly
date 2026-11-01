import {it,expect} from 'vitest'
import {Texture,Sprite} from 'pixi.js'
import {Character25Player} from '../../src/modern/features/characters/characters-25'
import {sampleCharacter25Rig} from '../../src/modern/features/characters/characters-25-pose'
import type {Character25Rig} from '../../src/modern/features/characters/characters-25-types'
import index from '../../src/modern/data/weiwei-map-rig.json'
const rig=index.characters[0]as unknown as Character25Rig
const create=()=>new Character25Player(rig,new Map(index.runtimeImages.map(p=>[p.url,Texture.WHITE])))
const visible=(p:Character25Player)=>p.view.children.filter(c=>c instanceof Sprite&&c.visible).map(c=>[c.label,c.x,c.y,c.rotation,c.width,c.height])

it('settles floating parts smoothly after stopping instead of snapping wings and hands to rest',()=>{
 const p=create();p.setWorldPosition(0,0);p.setPose('down-right',true)
 for(let i=1;i<=12;i++){p.update(1000/60);p.setWorldPosition(i*1.1,i*.8)}
 const before=visible(p);p.setPose('down-right',false);p.update(0)
 expect(visible(p)).toEqual(before)
 p.update(300);const rest=visible(p);p.update(400);expect(visible(p)).toEqual(rest);p.destroy()
})
it('keeps native wing phase through a map turn and holds still while the dice has not moved the root',()=>{
 const p=create();p.setWorldPosition(0,0);const standing=visible(p);p.setPose('down-right',true);p.update(300);expect(visible(p)).toEqual(standing)
 for(let i=1;i<=12;i++){p.update(1000/60);p.setWorldPosition(i*1.1,i*.8)}
 const wing=(label:string)=>p.view.children.find(c=>c instanceof Sprite&&c.label===label)as Sprite
 const phase=-wing('main/leftWing').rotation
 const distance=p.gaitDistance
 p.setPose('down-left',true);p.update(0)
 expect(p.gaitDistance).toBe(distance)
 expect(wing('main/rightWing').rotation).toBeCloseTo(phase,8);p.destroy()
})
it('folds opposite wings continuously around their own roots while keeping the floating head upright',()=>{
 const view=rig.facings['up-left'].actors[0]!,cycle=2000/3
 const at=(time:number)=>sampleCharacter25Rig(rig,'up-left','walk',time)
 const first=at(0),quarter=at(cycle/4)
 const find=(parts:ReturnType<typeof at>,name:string)=>parts.find(p=>p.key==='main/'+name)!
 const left=find(quarter,'leftWing'),right=find(quarter,'rightWing')
 expect(left.b*right.b).toBeLessThan(0)
 expect(Math.hypot(left.a,left.b)).toBeLessThan(.9)
 expect(Math.hypot(find(first,'leftWing').a,find(first,'leftWing').b)).toBeCloseTo(1,8)
 expect(left.tx).toBeCloseTo(view.joints.leftWingBase![0],8)
 expect(find(quarter,'head').b).toBe(0)
 const end=at(cycle-1e-6),start=at(cycle+1e-6)
 expect(find(end,'leftWing').a).toBeCloseTo(find(start,'leftWing').a,6)
})
it('shows the source die in the up-right ready pose using its visible left arm',()=>{
 const p=create();p.setPose('up-right',false);p.setReaction('ready');p.update(0)
 expect(p.view.children.at(-1)!.getLocalBounds().width).toBeGreaterThan(8)
 p.setPose('up-left',false);p.update(0);expect(p.view.children.at(-1)!.getLocalBounds().width).toBe(0);p.destroy()
})
