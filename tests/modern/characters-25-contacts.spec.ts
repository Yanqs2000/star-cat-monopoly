import{it,expect}from'vitest'
import * as module from'../../src/modern/features/characters/characters-25-contacts'
const feet=[{key:'main/leftFoot',rest:{x:-8,y:-4},phase:0},{key:'main/rightFoot',rest:{x:9,y:-6},phase:.5}]
const create=()=>new module.Character25Contacts(feet,18)
const point=(f:{x:number;y:number})=>[f.x,f.y]
it('starts from standing contacts with no movement before the root actually moves',()=>{
 const c=create(),before=c.snapshot();c.setMoving(true)
 expect(c.snapshot().map(point)).toEqual(before.map(point));c.moveTo(0,0);expect(c.snapshot().map(point)).toEqual(before.map(point))
})
it('keeps supporting feet planted through movement, stopping and a90degree turn',()=>{
 const c=create();c.setMoving(true);let previous=c.snapshot(),checks=0
 for(let i=1;i<=90;i++){
  const x=i<=45?i*.5:22.5,y=i<=45?0:(i-45)*.5
  c.moveTo(x,y);const now=c.snapshot()
  for(const f of now){const p=previous.find(p=>p.key===f.key)!;if(f.support&&p.support&&f.contactId===p.contactId){expect(f.x).toBeCloseTo(p.x,9);expect(f.y).toBeCloseTo(p.y,9);checks++}}
  previous=now
 }
 const before=c.snapshot();c.setMoving(false);expect(c.snapshot().map(point)).toEqual(before.map(point))
 for(let i=0;i<30;i++){
  c.advanceIdle(10);const now=c.snapshot()
  for(const f of now){const p=previous.find(p=>p.key===f.key)!;if(f.support&&p.support&&f.contactId===p.contactId){expect(f.x).toBeCloseTo(p.x,9);expect(f.y).toBeCloseTo(p.y,9);checks++}}
  previous=now
 }
 expect(checks).toBeGreaterThan(30)
 for(const f of c.snapshot()){const rest=feet.find(p=>p.key===f.key)!.rest;expect(f.x).toBeCloseTo(22.5+rest.x,8);expect(f.y).toBeCloseTo(22.5+rest.y,8);expect(f.lift).toBe(0);expect(f.support).toBe(true)}
})
it('continues exactly the same stride across zero-time cell boundaries',()=>{
 const a=create(),b=create();a.setMoving(true);b.setMoving(true)
 for(let i=1;i<140;i++){
  if(i%21===0){b.setMoving(false);b.setMoving(true)}
  a.moveTo(i*.7,i*.5);b.moveTo(i*.7,i*.5)
  expect(b.snapshot()).toEqual(a.snapshot())
 }
})
it('preserves world contacts at facing changes, pause, and a quick restart while settling',()=>{
 const c=create();c.setMoving(true);c.moveTo(7,4);c.setMoving(false);c.advanceIdle(30)
 const before=c.snapshot();c.setRest(feet.map(f=>({...f,rest:{x:f.rest.x+2,y:f.rest.y-1}})))
 expect(c.snapshot().map(point)).toEqual(before.map(point));c.setMoving(true);expect(c.snapshot().map(point)).toEqual(before.map(point));c.advanceIdle(0);expect(c.snapshot().map(point)).toEqual(before.map(point))
 c.moveTo(8,5);expect(c.snapshot().every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y))).toBe(true)
})
it('samples the same trajectory for a long seek and many small world updates',()=>{
 const a=create(),b=create();a.setMoving(true);b.setMoving(true);a.moveTo(100,50)
 for(let i=1;i<=100;i++)b.moveTo(i,i/2)
 for(const foot of a.snapshot()){const other=b.snapshot().find(f=>f.key===foot.key)!;expect(foot.x).toBeCloseTo(other.x,8);expect(foot.y).toBeCloseTo(other.y,8);expect(foot.lift).toBeCloseTo(other.lift,8)}
})
