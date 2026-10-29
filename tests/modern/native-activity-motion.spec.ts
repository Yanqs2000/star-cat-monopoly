// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils'
import { shallowRef,nextTick } from 'vue'
import { afterEach,expect,it,vi } from 'vitest'
import NativeActivity from '../../src/modern/features/game/NativeActivity.vue'
import { animationFramesKey } from '../../src/modern/features/game/animation-context'
import type { ActivityClip } from '../../src/modern/features/game/activity-assets'
import type { PreparedAnimations } from '../../src/modern/features/game/animation-preload'
const clip:ActivityClip={id:'car2',sourceSymbol:865,fps:60,frames:[1,2,3,4].map(sourceFrame=>({sourceFrame,url:`frame-${sourceFrame}`,width:10,height:10,offsetX:0,offsetY:0,fields:[]}))}
const cache:PreparedAnimations={get:()=>undefined,clip:c=>({urls:c.frames.map(f=>f.url),release(){}}),release(){}}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()})
function raf(){let id=0,time=0;vi.spyOn(performance,'now').mockImplementation(()=>time);const pending=new Map<number,FrameRequestCallback>();vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{pending.set(++id,cb);return id});vi.stubGlobal('cancelAnimationFrame',(key:number)=>pending.delete(key));return async(now:number)=>{time=now;const batch=[...pending.values()];pending.clear();for(const cb of batch)cb(now);await nextTick()}}
it('高清活动在同一个30Hz源帧内显示第二个采样，暂停冻结，恢复后不越过源帧',async()=>{
 const advance=raf(),c=mount(NativeActivity,{props:{clip,frame:1,...{paused:false}},global:{provide:{[animationFramesKey as symbol]:shallowRef(cache)}}})
 await flushPromises();await advance(0);await advance(17)
 expect(c.attributes('data-display-frame')).toBe('2');expect(c.get('image').attributes('href')).toBe('frame-2')
 await c.setProps({paused:true} as any);await advance(1000);expect(c.get('image').attributes('href')).toBe('frame-2')
 await c.setProps({paused:false} as any);await advance(1001);await advance(1018);expect(c.get('image').attributes('href')).toBe('frame-2')
 await c.setProps({frame:2});expect(c.attributes('data-display-frame')).toBe('3');await advance(1035);expect(c.attributes('data-display-frame')).toBe('4')
 c.unmount()
})
it('骰子叠层依据自己的60Hz父时间轴取位移，静态底图不妨碍子帧运动',async()=>{
 const advance=raf(),base:ActivityClip={...clip,id:'ludo-game',fps:30,frames:[clip.frames[0]!]}
 const moving:ActivityClip={...clip,id:'ludo-dice',frames:clip.frames.map((f,i)=>({...f,placements:[{name:'tz1',x:i*10,y:20,matrix:[1,0,0,1]}]}))}
 const c=mount(NativeActivity,{props:{clip:base,overlays:[{clip:base,frame:1,x:640,y:200,...{placement:{clip:moving,frame:1,name:'tz1'}}}],...{paused:false}},global:{provide:{[animationFramesKey as symbol]:shallowRef(cache)}}})
 await flushPromises();await advance(0);await advance(17)
 expect(c.get('g').attributes('transform')).toContain('translate(650 220)')
 await c.setProps({paused:true} as any);await advance(2000);expect(c.get('g').attributes('transform')).toContain('translate(650 220)')
 c.unmount()
})

it('首个绘制回调直接反映已过去的17毫秒，不额外等一帧才开始子帧时钟',async()=>{
 const advance=raf(),c=mount(NativeActivity,{props:{clip,frame:1},global:{provide:{[animationFramesKey as symbol]:shallowRef(cache)}}})
 await flushPromises();await advance(17);expect(c.get('image').attributes('href')).toBe('frame-2');c.unmount()
})
