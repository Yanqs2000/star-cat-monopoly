// @vitest-environment jsdom
import { mount,flushPromises } from '@vue/test-utils'
import { shallowRef } from 'vue'
import { afterEach,expect,it,vi } from 'vitest'
import NativeActivity from '../../src/modern/features/game/NativeActivity.vue'
import { prepareAnimationFrames } from '../../src/modern/features/game/animation-preload'
import { animationFramesKey } from '../../src/modern/features/game/animation-context'
import type { ActivityClip } from '../../src/modern/features/game/activity-assets'
afterEach(()=>vi.unstubAllGlobals())
it('动态叠层未准备时仍复用已准备的底图，只请求缺少的图片',async()=>{
 const requests:string[]=[]
 vi.stubGlobal('fetch',async(url:string)=>{requests.push(url);return {ok:true,blob:async()=>new Blob()}})
 vi.stubGlobal('URL',{createObjectURL:()=>`blob:${requests.length}`,revokeObjectURL(){}})
 vi.stubGlobal('Image',class{src='';naturalWidth=1;naturalHeight=1;async decode(){}})
 const clip:ActivityClip={id:'trait-9',sourceSymbol:1319,fps:30,frames:[1,2].map(sourceFrame=>({sourceFrame,url:`assets/activities/trait-9/${sourceFrame}.png`,width:1,height:1,offsetX:0,offsetY:0,fields:[]}))}
 const extra:ActivityClip={...clip,id:'fog',frames:[{...clip.frames[0]!,url:'assets/activities/fog/1.png'}]}
 const cache=await prepareAnimationFrames(clip.frames,new AbortController().signal,'original')
 const panel=mount(NativeActivity,{props:{clip,preload:[extra]},global:{provide:{[animationFramesKey as symbol]:shallowRef(cache)}}})
 expect(panel.find('[role="status"]').exists()).toBe(false)
 await flushPromises()
 expect(requests).toEqual(['/assets/activities/trait-9/1.png','/assets/activities/fog/1.png'])
 panel.unmount();cache.release()
})
