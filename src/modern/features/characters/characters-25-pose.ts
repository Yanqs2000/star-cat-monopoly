import type {Facing} from './assets'
import {juanmao24Joint} from './juanmao-24-motion'
import {boneAffine25,character25DurationMs,groundedFoot25,sampleCharacter25,type Character25Action} from './characters-25-motion'
import type {Character25Rig,RenderPart25,Point25} from './characters-25-types'

type Point={x:number;y:number}
const point=(p:Point25):Point=>({x:p[0],y:p[1]})

export function sampleCharacter25Rig(rig:Character25Rig,facing:Facing,action:Character25Action,elapsedMs:number,
 locomotion?:{distance:number;direction:Point;feet?:Record<string,Point25>;motionWeight?:number}):RenderPart25[]{
 const duration=character25DurationMs(rig.id,action,facing)
 const distance=action==='walk'?(locomotion?.distance??Math.max(0,elapsedMs)/duration*rig.stridePx):0
 const time=action==='walk'&&locomotion?distance/rig.stridePx*duration:elapsedMs
 const pose=sampleCharacter25(rig.id,action,facing,time),scale=rig.motionScale
 if(locomotion?.feet||(rig.anatomy==='floating'&&locomotion?.motionWeight!==undefined)){
  const walk=sampleCharacter25(rig.id,'walk',facing,locomotion.distance/rig.stridePx*character25DurationMs(rig.id,'walk',facing)),weight=locomotion.motionWeight??1
  for(const key of['bodyY','bodyRotation','headRotation']as const)pose[key]=(action==='walk'?0:pose[key])+walk[key]*weight
  for(const key of['leftHand','rightHand']as const)pose[key]={x:(action==='walk'?0:pose[key].x)+walk[key].x*weight,y:(action==='walk'?0:pose[key].y)+walk[key].y*weight}
 }
 const upright=rig.anatomy==='floating'&&(action==='walk'||action==='neutral')
 const bodyY=pose.bodyY*scale,rotation=upright?0:pose.bodyRotation*scale
 const headRotation=upright?0:pose.headRotation*scale
 const direction=locomotion?.direction??{x:facing.includes('right')?56:-56,y:facing.startsWith('down')?40:-40}
 const gray=Math.round(255-pose.soot*223),tint=gray*0x010101,result:RenderPart25[]=[]
 for(const actor of rig.facings[facing].actors){
  const states=new Map<string,RenderPart25>(),spine=point(actor.joints.spine!)
  const transformed=(name:string):Point=>{
   const p=point(actor.joints[name]!),dx=p.x-spine.x,dy=p.y-spine.y
   return{x:spine.x+dx*Math.cos(rotation)-dy*Math.sin(rotation),y:spine.y+bodyY+dx*Math.sin(rotation)+dy*Math.cos(rotation)}
  }
  const joints=new Map<string,Point>()
  const place=(key:string,partName:string,p:Point,angle=0,alpha=1,color=tint)=>{
   const part=actor.parts[partName]!
   states.set(key,{key:actor.id+'/'+key,sourcePart:partName,part,a:Math.cos(angle),b:Math.sin(angle),c:-Math.sin(angle),d:Math.cos(angle),tx:p.x,ty:p.y,alpha,tint:color})
  }
  const bone=(partName:string,a:Point,b:Point)=>{
   const part=actor.parts[partName]!,axis=part.axis!
   states.set(partName,{key:actor.id+'/'+partName,sourcePart:partName,part,...boneAffine25(point(axis),a,b),alpha:1,tint})
  }
  for(const leg of actor.legs){
   const original=point(actor.joints[leg.end]!)
   const offset=action==='walk'?groundedFoot25(distance,rig.stridePx,leg.phase,direction):pose[leg.phase<.25?'leftFoot':'rightFoot']
   const contact=locomotion?.feet?.[actor.id+'/'+leg.end]
   const target=contact?{x:contact[0]+(action==='walk'?0:offset.x*scale),y:contact[1]+(action==='walk'?0:offset.y*scale)}:{x:original.x+offset.x*(action==='walk'?1:scale),y:original.y+offset.y*(action==='walk'?1:scale)}
   const hip=transformed(leg.root),upper=actor.parts[leg.upper]!.axis!,lower=actor.parts[leg.lower]!.axis!
   const knee=juanmao24Joint(hip,target,Math.hypot(...upper),Math.hypot(...lower),leg.bend)
   bone(leg.upper,hip,knee);bone(leg.lower,knee,target)
   if(leg.tip)place(leg.tip,leg.tip,target)
   joints.set(leg.end,target)
  }
  for(const arm of actor.arms){
   const shoulder=transformed(arm.root),rest=transformed(arm.end)
   const offset=pose[arm.name.startsWith('left')?'leftHand':'rightHand']
   const target={x:rest.x+offset.x*scale,y:rest.y+offset.y*scale}
   const lengths=arm.lengths??[Math.hypot(...actor.parts[arm.upper]!.axis!),Math.hypot(...actor.parts[arm.lower]!.axis!)]
   const elbow=juanmao24Joint(shoulder,target,lengths[0],lengths[1],arm.bend)
   if(!arm.hiddenParts?.includes('upper'))bone(arm.upper,shoulder,elbow)
   if(!arm.hiddenParts?.includes('lower'))bone(arm.lower,elbow,target)
   if(arm.tip)place(arm.tip,arm.tip,target)
   joints.set(arm.end,target)
  }
  if(actor.body)place(actor.body,actor.body,{x:spine.x,y:spine.y+bodyY},rotation)
  const head=transformed('neck'),expression=pose.expression==='hurt'&&pose.soot<=.3?'neutral':pose.expression
  const expressionPart=actor.head+'-'+expression
  const expressionAvailable=expression!=='neutral'&&actor.parts[expressionPart]!==undefined
  // Complete replacement heads must never be alpha-overlaid: even aligned
  // necks cannot make independently drawn horns/eyes share one silhouette.
  if(expressionAvailable)place(actor.head+'-expression',expressionPart,head,rotation+headRotation,1,expression==='hurt'?0xffffff:tint)
  else place(actor.head,actor.head,head,rotation+headRotation)
  for(const extra of actor.appendages){
   const p=joints.get(extra.joint)??transformed(extra.joint)
   const weight=locomotion?.motionWeight??(action==='walk'?1:0)
   const beat=Math.sin((locomotion?.distance??distance)/rig.stridePx*Math.PI*2)
   const floatingWing=rig.anatomy==='floating'&&extra.kind==='wing'
   const side=floatingWing?Math.sign(p.x-spine.x)||1:1
   const wave=extra.kind==='fixed'?0:beat*(extra.amplitude??.035)*weight*side
   const restAngle=extra.restAngle??0
   let angle=extra.kind==='pan'?0:rotation+wave+restAngle
   const axis=actor.parts[extra.part]!.axis
   if(extra.kind==='flipper'&&extra.poseHand&&axis){
    const x=axis[0]*Math.cos(restAngle)-axis[1]*Math.sin(restAngle),y=axis[0]*Math.sin(restAngle)+axis[1]*Math.cos(restAngle)
    const hand=pose[extra.poseHand],turn=Math.atan2(y+hand.y*scale,x+hand.x*scale)-Math.atan2(y,x)
    const wrapped=Math.atan2(Math.sin(turn),Math.cos(turn)),limit=extra.maxAngle??.9
    angle+=Math.max(-limit,Math.min(limit,wrapped))
   }
   place(extra.part,extra.part,p,angle)
   if(floatingWing){const state=states.get(extra.part)!,fold=1-.38*beat*beat*weight;state.a*=fold;state.b*=fold}
  }
  for(const name of actor.order){const state=states.get(name);if(state)result.push(state)}
 }
 return result
}
