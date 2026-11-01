import{carnivalPresentationFrame}from'../assets/approved-artwork'
import type{ActivityClip}from'./activity-assets'

/** Presentation follows the fixed native clock; collision/RNG state is untouched. */
export function carnivalActorPresentation(clip:ActivityClip,sourceFrame:number,previousX:number,x:number,subframeMs:number){
 const fraction=Math.min(1,Math.max(0,subframeMs*30/1000))
 const articulated=clip.frames[0]?.url.startsWith('hd-characters/characters-25/')??false
 return{frame:carnivalPresentationFrame(sourceFrame,subframeMs,clip.fps,1),x:articulated?previousX+(x-previousX)*fraction:x}
}
