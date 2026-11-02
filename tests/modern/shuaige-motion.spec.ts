import{it,expect}from'vitest'
import{character25RigFor}from'../../src/modern/features/characters/characters-25-registry'
import{sampleCharacter25Rig}from'../../src/modern/features/characters/characters-25-pose'
import{character25DurationMs}from'../../src/modern/features/characters/characters-25-motion'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
it('keeps the original floating anatomy and suspends both horizontal pans from moving hands',()=>{
 const rig=character25RigFor(7,'hd')as Character25Rig|undefined
 expect(rig).toBeDefined()
 for(const facing of['down-right','down-left','up-left','up-right']as const){
  expect(character25DurationMs(7,'walk',facing)).toBeCloseTo(16*1000/30,8)
  const actor=rig!.facings[facing].actors[0]!
  expect(actor.legs).toHaveLength(0);expect(actor.arms).toHaveLength(2)
  const pans=actor.appendages.filter(p=>p.kind==='pan');expect(pans).toHaveLength(2)
  for(const time of[0,73,240,400,530]){
   const sample=sampleCharacter25Rig(rig!,facing,'walk',time),head=sample.find(p=>p.key===actor.id+'/head')!
   expect(head.b).toBe(0);expect(head.a).toBe(1)
   for(const pan of pans){
    const state=sample.find(p=>p.key===actor.id+'/'+pan.part)!,arm=actor.arms.find(a=>a.end===pan.joint)!,hand=sample.find(p=>p.key===actor.id+'/'+arm.tip)!
    expect(state.a).toBe(1);expect(state.d).toBe(1);expect(Math.abs(state.b)+Math.abs(state.c)).toBe(0);expect(state.tx).toBeCloseTo(hand.tx,9);expect(state.ty).toBeCloseTo(hand.ty,9)
   }
   const repeat=sampleCharacter25Rig(rig!,facing,'walk',time+character25DurationMs(7,'walk',facing))
   for(const [index,part]of sample.entries())for(const key of['a','b','c','d','tx','ty']as const)expect(part[key]).toBeCloseTo(repeat[index]![key],8)
  }
 }
})
