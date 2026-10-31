import index from '../../data/characters-25.json'
import type{AssetProfile}from'../assets/profiles'
import type{Character25Rig}from'./characters-25-types'
const rigs=new Map<number,Character25Rig>((index.characters as unknown as Character25Rig[]).filter(r=>index.activeIds.includes(r.id)).map(r=>[r.id,r]))
export function character25RigFor(id:number,profile:AssetProfile):Character25Rig|undefined{return profile==='hd'?rigs.get(id):undefined}
export function character25ThumbnailUrl(id:number,profile:AssetProfile):string|undefined{
 return profile==='hd'?(index as unknown as{thumbnailUrls?:Record<string,string>}).thumbnailUrls?.[String(id)]:undefined
}
export function character25TextureUrls(ids:number[],profile:AssetProfile):string[]{
 return[...new Set(ids.flatMap(id=>{
  const rig=character25RigFor(id,profile)
  return rig?Object.values(rig.facings).flatMap(f=>f.actors.flatMap(a=>Object.values(a.parts).map(p=>p.url))):[]
 }))]
}
