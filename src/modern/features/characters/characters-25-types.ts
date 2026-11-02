import type {Facing} from './assets'

export type Point25=readonly[number,number]
export interface Part25 {url:string;width:number;height:number;pivot:Point25;axis?:Point25}
export interface Limb25 {
 name:string;root:string;middle:string;end:string;upper:string;lower:string;tip?:string;phase:number;bend:number;
 lengths?:Point25;hiddenParts?:('upper'|'lower')[]
}
export interface Appendage25 {part:string;joint:string;kind:'tail'|'wing'|'pan'|'ribbon'|'fixed'|'flipper';amplitude?:number;phase?:number;poseHand?:'leftHand'|'rightHand';maxAngle?:number;readyProp?:boolean;restAngle?:number}
export interface Actor25 {
 id:string;joints:Record<string,Point25>;parts:Record<string,Part25>;body?:string;head:string;
 legs:Limb25[];arms:Limb25[];appendages:Appendage25[];order:string[]
}
export interface Character25Rig {
 id:number;name:string;anatomy:string;density:number;mapAnchor:Point25;stridePx:number;motionScale:number;artworkSamples?:number;
 sourceSwfSha256:string;facings:Record<Facing,{actors:Actor25[];readyActorId?:string|null;shadow:{x:number;y:number;width:number;height:number}}>
}
export interface RenderPart25 {
 key:string;part:Part25;sourcePart:string;a:number;b:number;c:number;d:number;tx:number;ty:number;alpha:number;tint:number
}
