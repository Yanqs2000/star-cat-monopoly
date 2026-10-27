import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'
import aliases from '../../src/modern/data/animation-frame-aliases.json'
import { canonicalAnimationUrl, gameActivityClips, prepareAnimationFrames } from '../../src/modern/features/game/animation-preload'
import { profileAssetUrl } from '../../src/modern/features/assets/profiles'
import type { ActivityClip, ActivityManifest } from '../../src/modern/features/game/activity-assets'
const clip:ActivityClip={id:'trait-9',sourceSymbol:1319,fps:30,frames:Array.from({length:60},(_,i)=>({sourceFrame:i+1,url:`assets/activities/trait-9/${i+1}.png`,width:1,height:1,offsetX:0,offsetY:0,fields:[]}))}
afterEach(()=>vi.unstubAllGlobals())
function browserImages(density=1){
 const revoked:string[]=[],requests:string[]=[]
 vi.stubGlobal('URL',{createObjectURL:()=>`blob:${requests.length}`,revokeObjectURL:(url:string)=>revoked.push(url)})
 vi.stubGlobal('fetch',async(url:string)=>{requests.push(url);return {ok:true,blob:async()=>new Blob()}})
 vi.stubGlobal('Image',class{src='';naturalWidth=density;naturalHeight=density;async decode(){}})
 return {revoked,requests}
}
it.each(['original','hd'] as const)('%s整段重复画面只下载解码一次，弹窗关闭不销毁本局缓存',async profile=>{
 const {requests,revoked}=browserImages(profile==='hd'?2:1),progress:unknown[]=[]
 const cache=await prepareAnimationFrames(clip.frames,new AbortController().signal,profile,value=>progress.push(value))
 expect(requests).toHaveLength(1)
 expect(progress).toEqual([{completed:0,total:1},{completed:1,total:1}])
 const loaded=cache.clip(clip)!
 expect(loaded.urls).toHaveLength(60);expect(new Set(loaded.urls).size).toBe(1)
 loaded.release();expect(revoked).toEqual([])
 expect(cache.clip(clip)?.urls).toEqual(loaded.urls)
 cache.release();cache.release();expect(revoked).toEqual([loaded.urls[0]])
 expect(cache.get(clip.frames[0]!.url)).toBeUndefined()
})
it('取消开局立即中断尚未完成的图片解码并清理临时URL',async()=>{
 const {revoked}=browserImages();let image:{src:string}|undefined,complete!:()=>void,started!:()=>void
 const ready=new Promise<void>(resolve=>{started=resolve})
 vi.stubGlobal('Image',class{src='';naturalWidth=1;naturalHeight=1;constructor(){image=this}decode(){started();return new Promise<void>(resolve=>{complete=resolve})}})
 const abort=new AbortController(),loading=prepareAnimationFrames(clip.frames,abort.signal,'original');const rejection=expect(loading).rejects.toThrow()
 await ready;abort.abort()
 const srcAfterAbort=image!.src
 complete();await rejection
 expect(srcAfterAbort).toBe('')
 expect(revoked).toHaveLength(1)
})
it('准备失败释放所有已解码资源，不留下半套可复用缓存',async()=>{
 const {revoked}=browserImages();let attempts=0
 vi.stubGlobal('fetch',async()=>({ok:++attempts===1,status:404,blob:async()=>new Blob()}))
 await expect(prepareAnimationFrames([clip.frames[0]!,{...clip.frames[0]!,url:'assets/activities/witch/1.png'}],new AbortController().signal,'original')).rejects.toThrow('404')
 expect(revoked).toHaveLength(1)
})
it('预加载所有场景及本局角色，排除未参赛角色动作',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../../public/modern/assets/activities/manifest.json',import.meta.url),'utf8')) as ActivityManifest
 const ids=gameActivityClips(manifest,[1,3,7,12]).map(clip=>clip.id)
 expect(ids).toContain('trait-9');expect(ids).toContain('car2');expect(ids).toContain('carnival-walk-7-left');expect(ids).toContain('fly-12-4')
 expect(ids).not.toContain('carnival-walk-2-left');expect(ids).not.toContain('head-6')
})
it('重复帧索引在原版和高清中均逐字节相同，不替换不同画面',()=>{
 const root=new URL('../../public/modern/',import.meta.url)
 const hash=(url:string)=>createHash('sha256').update(readFileSync(new URL(url,root))).digest('hex')
 for(const [prefix,frames] of Object.entries(aliases))for(const [index,target] of frames.entries()){
  if(index+1===target)continue
  const source=`${prefix}/${index+1}.png`,canonical=`${prefix}/${target}.png`
  expect(canonicalAnimationUrl(source)).toBe(canonical)
  expect(hash(source)).toBe(hash(canonical))
  expect(hash(profileAssetUrl(source,'hd'))).toBe(hash(profileAssetUrl(canonical,'hd')))
 }
 expect(canonicalAnimationUrl('hd-static/companies/1.webp')).toBe('hd-static/companies/1.webp')
})
