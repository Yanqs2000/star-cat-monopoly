import { expect,it } from 'vitest'
import { prepareGameUiAssets } from '../../src/modern/features/saves/ui-assets'
import { commitPreparedSave } from '../../src/modern/features/saves/restore'
import { createGame } from '../../src/modern/features/game/setup'
import rawAssets from '../../public/modern/assets/interactions/manifest.json'
import {parseInteractionAssets}from '../../src/modern/features/game/interaction-assets'
const assets=parseInteractionAssets(rawAssets)
const signal=new AbortController().signal
it('所有玩家/翻页手牌和终局图片先准备为本地资源，离开时统一释放',async()=>{
 const game=createGame([1],102);game.inventories={1:Array(9).fill(9).concat(1),2:[1],3:[],4:[]};game.outcome={kind:'defeat',winnerId:null}
 const urls:string[]=[];let released=0
 const result=await prepareGameUiAssets(game,assets,signal,async url=>{urls.push(url);return {url:`blob:${url}`,release:()=>released++}})
 expect(urls).toEqual(['assets/interactions/cards/9.png','assets/interactions/cards/1.png',
  'assets/activities/ludo-face-1/1.png','assets/activities/ludo-face-2/1.png','assets/activities/ludo-face-3/1.png',
  'assets/activities/ludo-face-4/1.png','assets/activities/ludo-face-5/1.png','assets/activities/ludo-face-6/1.png','assets/activities/gameover/1.png'])
 expect(result.urls['assets/interactions/cards/1.png']).toBe('blob:assets/interactions/cards/1.png')
 result.release();result.release();expect(released).toBe(9)
})
it('手牌素材失败发生在提交前，旧局不销毁，已加载候选资源释放',async()=>{
 const game=createGame([1],102);game.inventories={1:[1,9],2:[],3:[],4:[]}
 let oldDestroyed=false;let released=0
 await expect(commitPreparedSave(()=>prepareGameUiAssets(game,assets,signal,async url=>{
  if(url.endsWith('/1.png'))throw new Error('card1 HTTP503')
  return {url:'blob:card9',release:()=>released++}
 }),()=>{oldDestroyed=true},r=>r.release())).rejects.toThrow('card1 HTTP503')
 expect(oldDestroyed).toBe(false);expect(released).toBe(1)
})
