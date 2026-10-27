<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'
import type { RollPresentation } from './controller'

const props = defineProps<{ roll: RollPresentation | null; playerName: string; paused: boolean; speed: number; assetProfile: AssetProfile; preparedImages?: Record<string, string> }>()
const emit = defineEmits<{ complete: []; 'asset-error': [error: Error] }>()
const elapsed = ref(0)
let timer: ReturnType<typeof setInterval> | undefined, last = 0
const rolling = computed(() => !!props.roll && elapsed.value < props.roll.durationMs * 2 / 3)
const face = computed(() => rolling.value ? Math.floor(elapsed.value / 70) % 6 + 1 : props.roll?.value ?? 1)
const url = computed(() => {
  const path = profileAssetUrl(`assets/activities/ludo-face-${face.value}/1.png`, props.assetProfile)
  return props.preparedImages?.[path] ?? `${import.meta.env.BASE_URL}${path}`
})
function stop() { if (timer !== undefined) clearInterval(timer); timer = undefined }
watch(() => props.roll, roll => {
  stop(); elapsed.value = 0; last = performance.now()
  if (!roll) return
  timer = setInterval(() => {
    const now = performance.now()
    if (!props.paused) elapsed.value += (now - last) * props.speed
    last = now
    if (elapsed.value >= roll.durationMs) { stop(); emit('complete') }
  }, 30)
}, { immediate: true })
onBeforeUnmount(stop)
</script>
<template>
  <div v-if="roll" class="dice-animation" data-testid="dice-animation" :data-stage="rolling ? 'rolling' : 'result'" role="status" aria-label="掷骰子">
    <img :class="{ rolling }" :style="{ animationPlayState: paused ? 'paused' : 'running' }" :src="url" :alt="rolling ? '翻滚中的骰子' : `骰子 ${roll.value} 点`" @error="emit('asset-error', new Error('骰子画面加载失败'))">
    <strong>{{ rolling ? `${playerName}正在掷骰…` : `${playerName}掷出 ${roll.value} 点` }}</strong>
  </div>
</template>
<style scoped>
.dice-animation{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);z-index:8;display:grid;justify-items:center;gap:14px;pointer-events:none;padding:22px 30px;border-radius:22px;background:#e6f6ffe8;border:2px solid white;box-shadow:0 8px 26px #124b8066;color:#155987;font:700 19px/1.4 system-ui,"PingFang SC",sans-serif}
.dice-animation img{width:108px;height:118px;object-fit:contain;filter:drop-shadow(0 8px 5px #183a5555)}.rolling{animation:dice-tumble .22s linear infinite}
@keyframes dice-tumble{0%{transform:translateY(0) rotate(-16deg)}50%{transform:translateY(-18px) rotate(20deg)}100%{transform:translateY(0) rotate(-16deg)}}
@media(prefers-reduced-motion:reduce){.rolling{animation:none}}
</style>
