import{it,expect}from'vitest'
import * as implementation from '../../src/modern/features/characters/characters-25-pose'
import type{Character25Rig,Actor25,Part25,RenderPart25}from '../../src/modern/features/characters/characters-25-types'
import type{Facing}from '../../src/modern/features/characters/assets'
const sample=(implementation as unknown as {sampleCharacter25Rig:(rig:Character25Rig,facing:Facing,action:'walk'|'neutral'|'happy',elapsed:number,locomotion?:{distance:number,direction:{x:number,y:number}})=>RenderPart25[]}).sampleCharacter25Rig
const part=(axis?:readonly[number,number]):Part25=>({url:'test-art.png',width:32,height:32,pivot:[2,2],axis})
function fixture(paired=false):Character25Rig{
 const actor:Actor25={id:'a',joints:{spine:[0,-20],neck:[0,-24],lh:[-4,-14],lk:[-7,-8],lf:[-5,0],rh:[4,-14],rk:[7,-8],rf:[5,0]},
  parts:{head:part(),body:part(),lu:part([-3,6]),ll:part([2,8]),lf:part(),ru:part([3,6]),rl:part([-2,8]),rf:part()},body:'body',head:'head',
  legs:[{name:'left',root:'lh',middle:'lk',end:'lf',upper:'lu',lower:'ll',tip:'lf',phase:0,bend:1},{name:'right',root:'rh',middle:'rk',end:'rf',upper:'ru',lower:'rl',tip:'rf',phase:.5,bend:-1}],
  arms:[],appendages:[],order:['lu','ll','lf','ru','rl','rf','body','head','head-expression']}
 const second={...actor,id:'b',joints:Object.fromEntries(Object.entries(actor.joints).map(([k,p])=>[k,[p[0]+20,p[1]-4]as const]))}
 const f={actors:paired?[actor,second]:[actor],shadow:{x:0,y:0,width:40,height:12}}
 return{id:2,name:'fixture',anatomy:paired?'paired':'biped',density:4,mapAnchor:[28,20],stridePx:24,motionScale:1,sourceSwfSha256:'0'.repeat(64),facings:{'down-right':f,'down-left':f,'up-left':f,'up-right':f}}
}
it('places every paired actor foot at its own support contact without moving head identity',()=>{
 expect(typeof sample).toBe('function')
 const rig=fixture(true),unit={x:56/Math.hypot(56,40),y:40/Math.hypot(56,40)}
 const a=sample(rig,'down-right','walk',0,{distance:1,direction:{x:56,y:40}})
 const b=sample(rig,'down-right','walk',0,{distance:1.2,direction:{x:56,y:40}})
 for(const key of ['a/lf','b/lf']){
  const p=a.find(p=>p.key===key)!,q=b.find(p=>p.key===key)!
  expect(q.tx+1.2*unit.x).toBeCloseTo(p.tx+unit.x,8);expect(q.ty+1.2*unit.y).toBeCloseTo(p.ty+unit.y,8)
 }
 expect(a.filter(p=>p.sourcePart==='head')).toHaveLength(2)
 expect(a.filter(p=>p.sourcePart==='body')).toHaveLength(2)
})
it('keeps neutral canonical joints and uses source texture parts, not white bridges',()=>{
 expect(typeof sample).toBe('function')
 const rig=fixture(),pose=sample(rig,'down-right','neutral',600)
 expect(pose.find(p=>p.key==='a/lf')).toMatchObject({tx:-5,ty:0})
 expect(pose.find(p=>p.key==='a/head')).toMatchObject({tx:0,ty:-24,alpha:1})
 expect(pose.every(p=>p.part.url==='test-art.png')).toBe(true)
})
it('renders floating identities without inventing legs or boots',()=>{
 expect(typeof sample).toBe('function')
 const rig=fixture();rig.id=6;rig.anatomy='floating'
 for(const f of Object.values(rig.facings))for(const a of f.actors){a.legs=[];a.order=['body','head','head-expression']}
 const pose=sample(rig,'down-right','walk',200,{distance:25,direction:{x:56,y:40}})
 expect(pose.filter(p=>p.alpha>0).map(p=>p.sourcePart)).toEqual(['body','head'])
})
it('keeps an occluded far arm hidden while placing its visible hand at the real joint',()=>{
 const rig=fixture(),actor=rig.facings['down-right'].actors[0]!
 actor.arms=[{name:'right',root:'rh',middle:'rk',end:'rf',upper:'hidden-u',lower:'hidden-l',tip:'rf',phase:0,bend:1,lengths:[8,9],hiddenParts:['upper','lower']}]
 const pose=sample(rig,'down-right','neutral',0)
 expect(pose.some(p=>p.sourcePart==='hidden-u'||p.sourcePart==='hidden-l')).toBe(false)
 expect(pose.find(p=>p.key==='a/rf')).toMatchObject({tx:5,ty:0})
})
it('never overlays two complete faces during expression transitions',()=>{
 const rig=fixture(),actor=rig.facings['down-right'].actors[0]!
 actor.parts['head-happy']=part();actor.parts['head-sad']=part();actor.parts['head-hurt']=part()
 for(const action of['happy','sad','hurt','cheer']as const)for(let t=0;t<900;t+=10){
  const states=implementation.sampleCharacter25Rig(rig,'down-right',action,t)
  const heads=states.filter(p=>p.key==='a/head'||p.key==='a/head-expression').filter(p=>p.alpha>0)
  expect(heads).toHaveLength(1);expect(heads[0]!.alpha).toBe(1)
 }
})
