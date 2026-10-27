import aliases from '../../data/animation-frame-aliases.json'
import { activityPixelDensity, type ActivityClip, type ActivityManifest } from './activity-assets'
import { profileAssetUrl, staticAssetPixels, type AssetProfile } from '../assets/profiles'
import type { WorldFrame } from '../map/world-assets'

export interface PreparedAnimationFrame { url: string; image: HTMLImageElement }
export interface PreparedAnimations {
 get(url: string): PreparedAnimationFrame | undefined
 clip(clip: ActivityClip): { urls: string[]; release(): void } | undefined
 release(): void
}
export interface AnimationProgress { completed: number; total: number }

export function canonicalAnimationUrl(url: string): string {
 const match=url.match(/^(assets(?:-hd)?\/.*)\/(\d+)\.(png|webp)$/)
 if(!match)return url
 const indices=(aliases as Record<string,number[]>)[match[1]!.replace(/^assets-hd\//,'assets/')]
 const frame=indices?.[Number(match[2])-1]
 return frame?`${match[1]}/${frame}.${match[3]}`:url
}

export function gameActivityClips(manifest: ActivityManifest, characters: number[]): ActivityClip[] {
 return manifest.clips.filter(clip=>{
  const character=clip.id.match(/^(?:carnival-(?:boy|walk)|face|head|fly)-(\d+)(?:-|$)/)
  return !character||characters.includes(Number(character[1]))
 })
}

/** One decoded copy per actual image, owned by the prepared game rather than a dialog. */
export async function prepareAnimationFrames(frames: WorldFrame[],signal:AbortSignal,profile:AssetProfile,onProgress:(progress:AnimationProgress)=>void=()=>{}):Promise<PreparedAnimations> {
 const unique=new Map(frames.map(frame=>[canonicalAnimationUrl(profileAssetUrl(frame.url,profile)),frame]))
 const entries=[...unique],resources=new Map<string,PreparedAnimationFrame>()
 const abort=new AbortController(),cancel=()=>{abort.abort(signal.reason);for(const frame of resources.values())frame.image.src=''}
 signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel()
 let cursor=0,completed=0,released=false
 const release=()=>{if(released)return;released=true;for(const frame of resources.values()){frame.image.src='';URL.revokeObjectURL(frame.url)}resources.clear()}
 onProgress({completed,total:entries.length})
 const jobs=Array.from({length:Math.min(6,entries.length)},async()=>{
  while(cursor<entries.length&&!abort.signal.aborted){
   const [url,frame]=entries[cursor++]!
   const response=await fetch(`${import.meta.env.BASE_URL}${url}`,{signal:abort.signal})
   if(!response.ok)throw new Error(`动画素材加载失败：${url}（HTTP ${response.status}）`)
   const blob=await response.blob();abort.signal.throwIfAborted()
   const local=URL.createObjectURL(blob),image=new Image();resources.set(url,{url:local,image});image.src=local
   await image.decode();abort.signal.throwIfAborted()
   const expected=staticAssetPixels(url)?.pixelSize??[frame.width*activityPixelDensity(url),frame.height*activityPixelDensity(url)]
   if(image.naturalWidth!==expected[0]||image.naturalHeight!==expected[1])throw new Error(`动画素材尺寸错误：${url}`)
   onProgress({completed:++completed,total:entries.length})
  }
 })
 try{
  await Promise.all(jobs);abort.signal.throwIfAborted()
  const get=(url:string)=>resources.get(canonicalAnimationUrl(profileAssetUrl(url,profile)))
  return {get,clip(clip){const frames=clip.frames.map(frame=>get(frame.url));return frames.every(frame=>!!frame)?{urls:frames.map(frame=>frame!.url),release(){}}:undefined},release}
 }catch(error){abort.abort(error);await Promise.allSettled(jobs);release();throw error}
 finally{signal.removeEventListener('abort',cancel)}
}
