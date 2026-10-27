import type { GameState } from '../game/types'
import type { InteractionAssetsManifest } from '../game/interaction-assets'
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
):Promise<PreparedUiAssets>{
 const needed=Array.from(new Set(Object.values(state.inventories).flat())).map(id=>{
  const asset=assets.cards.find(card=>card.id===id)
  if(!asset)throw new Error(`缺少存档手牌素材：${id}`)
  return asset.url
 })
 if(state.outcome)needed.push(`assets/activities/${state.outcome.kind==='victory'?'gamewin':'gameover'}/1.png`)
 if(state.interaction?.kind==='bankruptcy')needed.push('assets/activities/bankrupt/1.png')
 const results=await Promise.allSettled(needed.map(url=>load(url,signal)))
 const resources=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[])
 const failure=results.find(r=>r.status==='rejected')
 if(failure?.status==='rejected'||signal.aborted){resources.forEach(r=>r.release());throw failure?.status==='rejected'?failure.reason:new DOMException('Aborted','AbortError')}
 let released=false
 return {urls:Object.fromEntries(results.map((r,i)=>[needed[i]!,r.status==='fulfilled'?r.value.url:''])),release:()=>{if(released)return;released=true;resources.forEach(r=>r.release())}}
}
