<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { loadActivityFrames, type ActivityClip } from './activity-assets'
const props = withDefaults(defineProps<{ clip: ActivityClip; frame?: number; text?: Record<string, string>; viewport?: boolean }>(), { frame: 1, text: () => ({}), viewport: false })
const emit = defineEmits<{ ready: [id: string]; 'asset-error': [error: Error] }>()
const loaded = shallowRef<{ urls: string[]; release(): void }>()
const current = computed(() => props.clip.frames[Math.min(props.frame, props.clip.frames.length) - 1]!)
watch(() => props.clip, (clip, _, onCleanup) => {
  const abort = new AbortController()
  loaded.value = undefined
  let frames: { urls: string[]; release(): void } | undefined
  onCleanup(() => { abort.abort(); frames?.release() })
  void loadActivityFrames(clip, abort.signal).then(result => {
    if (abort.signal.aborted) { result.release(); return }
    frames = result; loaded.value = result; emit('ready', clip.id)
  }).catch(error => { if (!abort.signal.aborted) emit('asset-error', error instanceof Error ? error : new Error(String(error))) })
}, { immediate: true })
</script>
<template>
  <svg class="native-activity" :viewBox="viewport ? '0 0 800 600' : `0 0 ${current.width} ${current.height}`" :data-clip="clip.id" :data-frame="frame" role="img" aria-label="原版活动画面">
    <template v-if="loaded">
      <image :href="loaded.urls[Math.min(frame,clip.frames.length)-1]" :width="current.width" :height="current.height" :x="viewport ? current.offsetX : 0" :y="viewport ? current.offsetY : 0" />
      <foreignObject v-for="field in current.fields" :key="field.characterId" x="0" y="0" :width="field.width" :height="field.height" :transform="`matrix(${field.matrix.join(' ')} ${field.x-current.offsetX} ${field.y-current.offsetY})`">
        <div xmlns="http://www.w3.org/1999/xhtml" :style="{ fontSize: `${field.fontSize}px`, textAlign: field.align === 2 ? 'center' : field.align === 1 ? 'right' : 'left' }" class="original-text">{{ text[field.variable] ?? '' }}</div>
      </foreignObject>
    </template>
  </svg>
</template>
<style scoped>
.native-activity{display:block;width:100%;height:auto}.original-text{font-family:'Songti SC','SimSun',serif;color:#122844;line-height:1.2;white-space:pre-wrap}
</style>
