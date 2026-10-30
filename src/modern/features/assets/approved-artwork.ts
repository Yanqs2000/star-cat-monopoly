import approved from '../../data/approved-non-character.json'
import effects from '../../data/non-character-effects.json'
import continuous from '../../data/continuous-non-character.json'
import npc22 from '../../data/npc-22.json'
import npc23 from '../../data/npc-23.json'
import type { AssetProfile } from './profiles'
import type { WorldAssetsManifest, WorldClip } from '../map/world-assets'
import type { ActivityManifest, ActivityClip } from '../game/activity-assets'

/** Replace presentation only, after the original manifests have passed source validation. */
export function approvedWorldAssets(manifest: WorldAssetsManifest, profile: AssetProfile): WorldAssetsManifest {
 if(profile==='original')return manifest
 const replacements=new Map<string,WorldClip>([...approved.worldClips,...effects.worldClips,...npc22.worldClips].map(c=>[c.id,c]))
 return {...manifest,clips:manifest.clips.map(c=>replacements.get(c.id)??c)}
}
export function approvedActivityAssets(manifest: ActivityManifest, profile: AssetProfile): ActivityManifest {
 if(profile==='original')return manifest
 const replacements=new Map<string,ActivityClip>([...approved.activityClips,...effects.activityClips,...continuous.activityClips as unknown as ActivityClip[],...npc23.activityClips as unknown as ActivityClip[]].map(c=>[c.id,c]))
 return {...manifest,clips:manifest.clips.map(c=>replacements.get(c.id)??c)}
}
/** Source gameplay advances at 30Hz; presentation can expose the intervening 60Hz sample. */
export function carnivalPresentationFrame(sourceFrame:number,elapsedMs:number,fps:number,speed:number):number {
 const fraction=Math.min(Math.max(elapsedMs*speed*30/1000,0),1-1e-6)
 return Math.floor((sourceFrame-1+fraction)*fps/30)+1
}
