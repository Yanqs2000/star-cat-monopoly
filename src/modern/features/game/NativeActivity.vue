<script setup lang="ts">
import { computed, inject, shallowRef, watch, onBeforeUnmount } from 'vue'
import { activityPresentationFrame } from '../assets/effect-timing'
import { loadActivityFrames, type ActivityClip, type NativeOverlay } from './activity-assets'
import { animationFramesKey } from './animation-context'
const prepared=inject(animationFramesKey,undefined)
const props = withDefaults(defineProps<{ clip: ActivityClip; frame?: number; paused?:boolean; text?: Record<string, string>; viewport?: boolean; preload?: ActivityClip[]; overlays?: NativeOverlay[] }>(), { frame: 1, paused:false, text: () => ({}), viewport: false, preload: () => [], overlays: () => [] })
const emit = defineEmits<{ ready: [id: string]; 'asset-error': [error: Error] }>()
const loaded = shallowRef<Map<string,{ urls: string[]; release(): void }>>()
const elapsed=shallowRef(0)
const displayFrame=(clip:ActivityClip,frame:number)=>activityPresentationFrame(frame,elapsed.value,clip.fps,clip.frames.length)
const mainFrame=computed(()=>displayFrame(props.clip,props.frame))
const current = computed(() => props.clip.frames[mainFrame.value - 1]!)
const assets = computed(() => [...new Map([props.clip,...props.preload].map(clip=>[clip.id,clip])).values()])
const poster=computed(()=>prepared?.value?.clip(props.clip))
const overlayFrame = (item: NativeOverlay) => item.clip.frames[displayFrame(item.clip,item.frame)-1]!
const overlayPose=(item:NativeOverlay)=>{
 const link=item.placement
 const placement=link?.clip.frames[displayFrame(link.clip,link.frame)-1]?.placements?.find(p=>p.name===link.name)
 return {x:item.x+(placement?.x??0),y:item.y+(placement?.y??0),matrix:placement?.matrix??item.matrix}
}
const hasMotion=computed(()=>props.clip.fps>30||props.overlays.some(i=>i.clip.fps>30||(i.placement?.clip.fps??30)>30))
const playhead=computed(()=>[props.clip.id,props.frame,...props.overlays.flatMap(i=>[i.clip.id,i.frame,i.placement?.clip.id,i.placement?.frame])].join('|'))
let animation=0,lastTime:number|undefined
function tick(now:number){if(lastTime!==undefined)elapsed.value+=Math.max(0,now-lastTime);lastTime=now;animation=requestAnimationFrame(tick)}
watch([playhead,()=>props.paused,hasMotion],([head,paused,motion],previous)=>{
 if(previous?.[0]!==head)elapsed.value=0
 if(animation)cancelAnimationFrame(animation)
 animation=0;lastTime=undefined
 if(motion&&!paused){lastTime=performance.now();animation=requestAnimationFrame(tick)}
},{immediate:true})
onBeforeUnmount(()=>{if(animation)cancelAnimationFrame(animation)})
watch(() => assets.value.map(clip=>clip.id).join('|'), (_, _old, onCleanup) => {
  const clip = props.clip
  const abort = new AbortController()
  loaded.value = undefined
  let frames: Map<string,{ urls: string[]; release(): void }> | undefined
  onCleanup(() => { abort.abort(); frames?.forEach(item=>item.release()) })
  const clips=assets.value
  const cached=clips.map(clip=>prepared?.value?.clip(clip))
  if(cached.every(item=>!!item)){loaded.value=new Map(cached.map((item,index)=>[clips[index]!.id,item!]));queueMicrotask(()=>{if(!abort.signal.aborted)emit('ready',clip.id)});return}
  const jobs=clips.map((item,index)=>cached[index] ?? loadActivityFrames(item,abort.signal))
  void Promise.all(jobs).then(results => {
    if (abort.signal.aborted) { results.forEach(item=>item.release());return }
    frames = new Map(results.map((result,index)=>[clips[index]!.id,result])); loaded.value = frames; emit('ready', clip.id)
  }).catch(async error => {
    const cancelled=abort.signal.aborted
    abort.abort()
    for(const result of await Promise.allSettled(jobs))if(result.status==='fulfilled')result.value.release()
    if(!cancelled)emit('asset-error',error instanceof Error ? error : new Error(String(error)))
  })
}, { immediate: true })
</script>
<template>
  <svg class="native-activity" :viewBox="viewport ? '0 0 800 600' : `0 0 ${current.width} ${current.height}`" :data-clip="clip.id" :data-frame="frame" :data-display-frame="mainFrame" :aria-busy="!loaded" role="img" aria-label="原版活动画面">
    <template v-if="!loaded && !poster">
      <rect width="100%" height="100%" fill="#173c49" rx="12" />
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" class="activity-loading" role="status" aria-label="活动素材加载">正在准备活动画面…</div>
      </foreignObject>
    </template>
    <template v-else>
      <image :href="(loaded?.get(clip.id) ?? poster)?.urls[mainFrame-1]" :width="current.width" :height="current.height" :x="viewport ? current.offsetX : 0" :y="viewport ? current.offsetY : 0" />
      <foreignObject v-for="field in current.fields" :key="field.characterId" x="0" y="0" :width="field.width" :height="field.height" :transform="`matrix(${field.matrix.join(' ')} ${field.x-current.offsetX} ${field.y-current.offsetY})`">
        <div xmlns="http://www.w3.org/1999/xhtml" :style="{ fontSize: `${field.fontSize}px`, textAlign: field.align === 2 ? 'center' : field.align === 1 ? 'right' : 'left' }" class="original-text">{{ text[field.variable] ?? '' }}</div>
      </foreignObject>
      <g v-for="(item,index) in loaded ? overlays : []" :key="index" :data-overlay-clip="item.clip.id" :data-display-frame="displayFrame(item.clip,item.frame)" :data-placement="item.placement?.name" :transform="`translate(${overlayPose(item).x-current.offsetX} ${overlayPose(item).y-current.offsetY}) scale(${item.scale ?? 1}) ${overlayPose(item).matrix ? `matrix(${overlayPose(item).matrix!.join(' ')} 0 0)` : ''}`" :opacity="item.opacity ?? 1">
        <image :href="loaded?.get(item.clip.id)?.urls[displayFrame(item.clip,item.frame)-1]" :x="overlayFrame(item).offsetX" :y="overlayFrame(item).offsetY" :width="overlayFrame(item).width" :height="overlayFrame(item).height" />
        <foreignObject v-for="field in overlayFrame(item).fields" :key="field.characterId" x="0" y="0" :width="field.width" :height="field.height" :transform="`matrix(${field.matrix.join(' ')} ${field.x} ${field.y})`">
          <div xmlns="http://www.w3.org/1999/xhtml" :style="{ fontSize: `${field.fontSize}px`, textAlign: field.align === 2 ? 'center' : 'left' }" class="original-text">{{ item.text?.[field.variable] ?? '' }}</div>
        </foreignObject>
      </g>
    </template>
  </svg>
</template>
<style scoped>
.native-activity{display:block;width:100%;height:auto}.original-text{text-rendering:optimizeLegibility;font-family:'Songti SC','SimSun',serif;color:#122844;line-height:1.2;white-space:pre-wrap}
.activity-loading{height:100%;display:grid;place-items:center;color:#f8fbff;font:20px/1.5 system-ui,"PingFang SC",sans-serif;text-align:center;padding:24px;box-sizing:border-box}
</style>
