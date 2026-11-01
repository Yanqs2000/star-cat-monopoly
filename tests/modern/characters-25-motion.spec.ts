import {describe,it,expect} from 'vitest'
import * as implementation from '../../src/modern/features/characters/characters-25-motion'
import {FACINGS,type Facing} from '../../src/modern/features/characters/assets'
import source from '../../src/modern/data/characters-25-source.json'

type Action='walk'|'neutral'|'ready'|'happy'|'sad'|'hurt'|'cheer'
const motion=implementation as unknown as {
 character25DurationMs:(id:number,action:Action,facing:Facing)=>number
 groundedFoot25:(distance:number,cycle:number,phase:number,direction:{x:number,y:number})=>{x:number,y:number,lift:number,support:boolean}
 sampleCharacter25:(id:number,action:Action,facing:Facing,time:number)=>{bodyY:number,bodyRotation:number,headRotation:number,expression:string}
 boneAffine25:(axis:{x:number,y:number},from:{x:number,y:number},to:{x:number,y:number})=>{a:number,b:number,c:number,d:number,tx:number,ty:number}
}

describe('25 source-specific timing and true support contacts',()=>{
 it('keeps limb width while mapping its source joint axis to the actual two joints',()=>{
  expect(typeof motion.boneAffine25).toBe('function')
  const axis={x:3,y:4},from={x:10,y:20}
  for(const to of[{x:18,y:20},{x:10,y:28},{x:2,y:20},{x:14,y:16}]){
   const m=motion.boneAffine25(axis,from,to)
   expect(m.a*3+m.c*4+m.tx).toBeCloseTo(to.x,8);expect(m.b*3+m.d*4+m.ty).toBeCloseTo(to.y,8)
   expect(Math.hypot(m.a*(-.8)+m.c*.6,m.b*(-.8)+m.d*.6)).toBeCloseTo(1,8)
  }
  expect(()=>motion.boneAffine25({x:0,y:0},from,from)).toThrow()
 })
 it('keeps every native identity, direction and action duration, including exceptional clips',()=>{
  expect(typeof motion.character25DurationMs).toBe('function')
  for(const id of Object.keys(source))for(const facing of FACINGS)for(const action of ['walk','neutral','ready','happy','sad','hurt','cheer']as const){
   expect(motion.character25DurationMs(+id,action,facing)).toBeCloseTo(source[id as keyof typeof source][facing][action],8)
  }
  expect(motion.character25DurationMs(8,'hurt','down-right')).toBe(1100)
  expect(motion.character25DurationMs(6,'walk','down-right')).toBeCloseTo(2000/3)
  expect(motion.character25DurationMs(7,'walk','down-right')).toBeCloseTo(1600/3)
 })
 it('plants support feet in world coordinates for distinct stride lengths and all map directions',()=>{
  expect(typeof motion.groundedFoot25).toBe('function')
  for(const cycle of [12,18,24,30])for(const dx of [-56,56])for(const dy of [-40,40])for(const phase of[0,.5]){
   const direction={x:dx,y:dy},unit={x:dx/Math.hypot(dx,dy),y:dy/Math.hypot(dx,dy)}
   for(let i=0;i<9;i++){
    const aDistance=cycle*((phase===0?0:.5)+.01+i*.04),bDistance=aDistance+.01
    const a=motion.groundedFoot25(aDistance,cycle,phase,direction),b=motion.groundedFoot25(bDistance,cycle,phase,direction)
    expect(a.support).toBe(true);expect(b.support).toBe(true)
    expect(bDistance*unit.x+b.x).toBeCloseTo(aDistance*unit.x+a.x,8)
    expect(bDistance*unit.y+b.y).toBeCloseTo(aDistance*unit.y+a.y,8)
   }
  }
 })
 it('has no discontinuity at support/swing and cycle boundaries',()=>{
  expect(typeof motion.groundedFoot25).toBe('function')
  for(const phase of[0,.5])for(const time of[0,12,24]){
   const a=motion.groundedFoot25(time-1e-6,24,phase,{x:56,y:40})
   const b=motion.groundedFoot25(time+1e-6,24,phase,{x:56,y:40})
   expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeLessThan(1e-4)
  }
 })
 it('leaves idle bodies still and normalizes reactions to their own clip clocks',()=>{
  expect(typeof motion.sampleCharacter25).toBe('function')
  for(let id=2;id<=12;id++)for(const facing of FACINGS){
   const neutral=motion.sampleCharacter25(id,'neutral',facing,800)
   expect(neutral.bodyY).toBe(0);expect(neutral.bodyRotation).toBe(0);expect(neutral.headRotation).toBe(0)
   for(const action of['happy','sad','hurt','cheer']as const){
    const end=motion.character25DurationMs(id,action,facing)
    const a=motion.sampleCharacter25(id,action,facing,end),b=motion.sampleCharacter25(id,action,facing,end+500)
    expect(b).toEqual(a)
   }
  }
 })
})
