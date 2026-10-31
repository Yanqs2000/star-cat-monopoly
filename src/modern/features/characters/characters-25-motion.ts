import clocks from '../../data/characters-25-source.json'
import type {Facing} from './assets'
import {juanmao24DurationMs,sampleJuanmao24,type Juanmao24Action,type Juanmao24Point} from './juanmao-24-motion'

export type Character25Action=Juanmao24Action

/** Stretch along a limb's axis, preserving its transverse thickness. */
export function boneAffine25(axis:Juanmao24Point,from:Juanmao24Point,to:Juanmao24Point){
 const sourceLength=Math.hypot(axis.x,axis.y)
 if(sourceLength<1e-6)throw new Error('分件关节轴长度为零')
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)
 const ax=axis.x/sourceLength,ay=axis.y/sourceLength
 const bx=length>1e-6?dx/length:ax,by=length>1e-6?dy/length:ay
 const stretch=length/sourceLength
 return{a:stretch*bx*ax+by*ay,b:stretch*by*ax-bx*ay,
        c:stretch*bx*ay-by*ax,d:stretch*by*ay+bx*ax,tx:from.x,ty:from.y}
}

/** Source durations belong to each identity, rather than to the template rig. */
export function character25DurationMs(id:number,action:Character25Action,facing:Facing):number {
 const identity=clocks[String(id)as keyof typeof clocks]
 if(!identity)throw new Error(`25未登记角色${id}`)
 return identity[facing][action]
}

export function sampleCharacter25(id:number,action:Character25Action,facing:Facing,elapsedMs:number){
 const duration=character25DurationMs(id,action,facing)
 const time=action==='walk'?Math.max(0,elapsedMs)%duration:Math.min(duration,Math.max(0,elapsedMs))
 return sampleJuanmao24(action,facing,time/duration*juanmao24DurationMs(action,facing))
}

/** Ground-space linear support and C1 swing; supports any anatomical leg phase. */
export function groundedFoot25(distancePx:number,cyclePx:number,phaseOffset:number,direction:Juanmao24Point){
 if(!(cyclePx>0))throw new Error('步幅必须为正数')
 const p=(Math.max(0,distancePx)/cyclePx+phaseOffset)%1
 const unitLength=Math.hypot(direction.x,direction.y)||1
 const u=(p-.5)*2
 const travel=p<=.5?1-4*p:-1-2*u+12*u*u-8*u*u*u
 const lift=p<=.5?0:Math.sin(u*Math.PI)**2*Math.min(3.2,cyclePx*.14)
 return{x:travel*cyclePx/4*direction.x/unitLength,y:travel*cyclePx/4*direction.y/unitLength-lift,lift,support:p<=.5}
}
