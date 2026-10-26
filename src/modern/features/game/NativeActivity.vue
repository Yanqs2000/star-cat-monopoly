<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { loadActivityFrames, type ActivityClip, type NativeOverlay } from './activity-assets'
const props = withDefaults(defineProps<{ clip: ActivityClip; frame?: number; text?: Record<string, string>; viewport?: boolean; preload?: ActivityClip[]; overlays?: NativeOverlay[] }>(), { frame: 1, text: () => ({}), viewport: false, preload: () => [], overlays: () => [] })
const emit = defineEmits<{ ready: [id: string]; 'asset-error': [error: Error] }>()
const loaded = shallowRef<Map<string,{ urls: string[]; release(): void }>>()
const current = computed(() => props.clip.frames[Math.min(props.frame, props.clip.frames.length) - 1]!)
const assets = computed(() => [...new Map([props.clip,...props.preload].map(clip=>[clip.id,clip])).values()])
const overlayFrame = (item: NativeOverlay) => item.clip.frames[Math.min(item.frame,item.clip.frames.length)-1]!
watch(() => assets.value.map(clip=>clip.id).join('|'), (_, _old, onCleanup) => {
  const clip = props.clip
  const abort = new AbortController()
  loaded.value = undefined
  let frames: Map<string,{ urls: string[]; release(): void }> | undefined
  onCleanup(() => { abort.abort(); frames?.forEach(item=>item.release()) })
  const clips=assets.value
  const jobs=clips.map(item=>loadActivityFrames(item,abort.signal))
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
  <svg class="native-activity" :viewBox="viewport ? '0 0 800 600' : `0 0 ${current.width} ${current.height}`" :data-clip="clip.id" :data-frame="frame" :aria-busy="!loaded" role="img" aria-label="原版活动画面">
    <template v-if="!loaded">
      <rect width="100%" height="100%" fill="#173c49" rx="12" />
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" class="activity-loading" role="status" aria-label="活动素材加载">正在准备活动画面…</div>
      </foreignObject>
    </template>
    <template v-else>
      <image :href="loaded.get(clip.id)?.urls[Math.min(frame,clip.frames.length)-1]" :width="current.width" :height="current.height" :x="viewport ? current.offsetX : 0" :y="viewport ? current.offsetY : 0" />
      <foreignObject v-for="field in current.fields" :key="field.characterId" x="0" y="0" :width="field.width" :height="field.height" :transform="`matrix(${field.matrix.join(' ')} ${field.x-current.offsetX} ${field.y-current.offsetY})`">
        <div xmlns="http://www.w3.org/1999/xhtml" :style="{ fontSize: `${field.fontSize}px`, textAlign: field.align === 2 ? 'center' : field.align === 1 ? 'right' : 'left' }" class="original-text">{{ text[field.variable] ?? '' }}</div>
      </foreignObject>
      <g v-for="(item,index) in overlays" :key="index" :transform="`translate(${item.x-current.offsetX} ${item.y-current.offsetY}) scale(${item.scale ?? 1}) ${item.matrix ? `matrix(${item.matrix.join(' ')} 0 0)` : ''}`" :opacity="item.opacity ?? 1">
        <image :href="loaded.get(item.clip.id)?.urls[Math.min(item.frame,item.clip.frames.length)-1]" :x="overlayFrame(item).offsetX" :y="overlayFrame(item).offsetY" :width="overlayFrame(item).width" :height="overlayFrame(item).height" />
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
