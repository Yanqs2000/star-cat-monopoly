import{it,expect}from'vitest'
import{sampleCharacter25Rig}from'../../src/modern/features/characters/characters-25-pose'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
import index from'../../src/modern/data/ajie-carnival.json'
import nini from'../../src/modern/data/nini-carnival.json'
it.each([index,nini])('mirrors the carnival tail beat between native left and right activity directions for $activeIds',data=>{
 const rig=data.characters[0]as unknown as Character25Rig
 const at=(facing:'down-left'|'up-right',x:number)=>sampleCharacter25Rig(rig,facing,'walk',0,{distance:rig.stridePx/4,direction:{x,y:0}}).find(p=>p.key==='main/tail')!
 const left=at('down-left',-1),right=at('up-right',1)
 expect(Math.abs(left.b)).toBeGreaterThan(.05);expect(left.b+right.b).toBeCloseTo(0,10)
})

it.each([{data:index,samples:56,id:10},{data:nini,samples:64,id:12}]as const)('closes the exported native carnival cycle for $id without a last-to-first tail jump',({data,samples})=>{
 const rig=data.characters[0]as unknown as Character25Rig
 for(const [facing,direction]of[['down-left',-1],['up-right',1]]as const){
  const at=(frame:number)=>sampleCharacter25Rig(rig,facing,'walk',0,{distance:frame*2,direction:{x:direction,y:0}}).find(p=>p.key==='main/tail')!
  const first=at(0),next=at(samples)
  for(const key of['a','b','c','d','tx','ty']as const)expect(next[key]).toBeCloseTo(first[key],10)
  const angles=Array.from({length:samples},(_,i)=>Math.atan2(at(i).b,at(i).a))
  const ordinary=Math.max(...angles.slice(1).map((n,i)=>Math.abs(n-angles[i]!)))
  expect(Math.abs(angles.at(-1)!-angles[0]!)).toBeLessThanOrEqual(ordinary+1e-10)
 }
})
