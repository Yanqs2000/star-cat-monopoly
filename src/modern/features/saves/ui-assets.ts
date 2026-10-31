import type { GameState } from '../game/types'
import type { InteractionAssetsManifest } from '../game/interaction-assets'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'
export interface UiImageResource {url:string;release:()=>void}
export interface PreparedUiAssets {urls:Record<string,string>;release:()=>void}

/** Local object URLs prevent another network request after the candidate is committed. */
async function loadImage(url:string,signal:AbortSignal):Promise<UiImageResource>{
 const response=await fetch(`${import.meta.env.BASE_URL}${url}`,{signal,cache:'no-store'})
 if(!response.ok)throw new Error(`存档界面素材加载失败：${url}（HTTP ${response.status}）`)
 const local=URL.createObjectURL(await response.blob())
 const image=new Image();image.src=local
 const cancel=()=>{image.src=''}
 signal.addEventListener('abort',cancel,{once:true})
 try{await image.decode();signal.throwIfAborted()}
 catch(error){image.src='';URL.revokeObjectURL(local);throw error}
 finally{signal.removeEventListener('abort',cancel)}
 return {url:local,release:()=>{image.src='';URL.revokeObjectURL(local)}}
}
export async function prepareGameUiAssets(
 state:GameState,assets:InteractionAssetsManifest,signal:AbortSignal,
 load:(url:string,signal:AbortSignal)=>Promise<UiImageResource>=loadImage,
 profile:AssetProfile='original',
):Promise<PreparedUiAssets>{
 const needed=Array.from(new Set(Object.values(state.inventories).flat())).map(id=>{
  const asset=assets.cards.find(card=>card.id===id)
  if(!asset)throw new Error(`缺少存档手牌素材：${id}`)
  return asset.url
 })
 for(let face=1;face<=6;face++)needed.push(profileAssetUrl(`assets/activities/ludo-face-${face}/1.png`,profile))
 for(const player of state.players)needed.push(profileAssetUrl(`assets/monthly/champions/${player.characterId}.png`,profile))
 if(state.outcome)needed.push(profileAssetUrl(`assets/activities/${state.outcome.kind==='victory'?'gamewin':'gameover'}/1.png`,profile))
 if(state.interaction?.kind==='bankruptcy')needed.push(profileAssetUrl('assets/activities/bankrupt/1.png',profile))
 const results=await Promise.allSettled(needed.map(url=>load(url,signal)))
 const resources=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[])
 const failure=results.find(r=>r.status==='rejected')
 if(failure?.status==='rejected'||signal.aborted){resources.forEach(r=>r.release());throw failure?.status==='rejected'?failure.reason:new DOMException('Aborted','AbortError')}
 let released=false
 const urls=Object.fromEntries(results.map((r,i)=>[needed[i]!,r.status==='fulfilled'?r.value.url:'']))
 // Existing UI consumers can keep native portrait keys while both aliases
 // point to the exact same decoded image for the selected profile.
 for(const player of state.players){const source=`assets/monthly/champions/${player.characterId}.png`;urls[source]=urls[profileAssetUrl(source,profile)]!}
 return {urls,release:()=>{if(released)return;released=true;resources.forEach(r=>r.release())}}
}
