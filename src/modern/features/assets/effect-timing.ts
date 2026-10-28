import type {AssetProfile} from './profiles'
import type {GridPoint} from '../map/types'

/** A 30Hz business playhead can expose its intervening display sample without running ahead. */
export function activityPresentationFrame(sourceFrame:number,elapsedMs:number,fps:number,count:number):number {
 const ratio=fps/30,subframe=Math.min(Math.max(0,elapsedMs)*fps/1000,ratio-1e-6)
 return Math.min(count,Math.floor((sourceFrame-1)*ratio+subframe)+1)
}
/** AVM1: rocket body1079 signals relocation at40, impact at80. Original rendering is untouched. */
export function missilePresentationSchedule(profile:AssetProfile):{relocateAtMs:number;explosionDelayMs:number}|undefined {
 return profile==='hd'?{relocateAtMs:39/30*1000,explosionDelayMs:80/30*1000}:undefined
}
export function effectAnchor(origin:GridPoint,impact:GridPoint,elapsedMs:number,relocateAtMs:number):GridPoint {
 return elapsedMs<relocateAtMs?origin:impact
}
