import{it,expect}from'vitest'
import * as display from '../../src/modern/features/game/carnival-character-presentation'
import{groundedFoot25}from'../../src/modern/features/characters/characters-25-motion'
import type{ActivityClip}from'../../src/modern/features/game/activity-assets'
const clip=(hd:boolean)=>({id:'carnival-walk-2-right',fps:hd?120:30,frames:[{url:hd?'hd-characters/characters-25/role-02/carnival-right-0.webp':'assets/activities/carnival-walk-2-right/1.png'}]})as ActivityClip
it('interpolates the new A-Niu between native8px steps while leaving original presentation intact',()=>{
 const sample=display.carnivalActorPresentation
 expect(sample(clip(false),2,400,408,1000/60)).toEqual({frame:2,x:408})
 expect(sample(clip(true),1,400,408,0)).toEqual({frame:1,x:400})
 expect(sample(clip(true),1,400,408,1000/60)).toEqual({frame:3,x:404})
 const last=sample(clip(true),1,400,408,1000/30-1e-7),next=sample(clip(true),2,408,416,0)
 expect(last.x).toBeCloseTo(next.x,5)
 expect(sample(clip(true),3,416,416,1000/60).x).toBe(416)
 expect(sample(clip(true),16,400,408,1000/30-1e-7).frame).toBe(64)
})
it('the baked120Hz leg phase plants the supporting foot under the actual native movement speed',()=>{
 const contacts=[]
 for(let sourceFrame=1;sourceFrame<=2;sourceFrame++)for(const fraction of[0,.25,.5,.75]){
  const p=display.carnivalActorPresentation(clip(true),sourceFrame,400+(sourceFrame-1)*8,400+sourceFrame*8,fraction*1000/30)
  const distance=((p.frame-1)%16)*2,foot=groundedFoot25(distance,32,0,{x:1,y:0})
  expect(foot.support).toBe(true);contacts.push(p.x+foot.x)
 }
 expect(Math.max(...contacts)-Math.min(...contacts)).toBeLessThan(1e-7)
})
