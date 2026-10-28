<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'

const props = defineProps<{ maximum: number; price: number; disabled: boolean; assetProfile?: AssetProfile }>()
const emit = defineEmits<{ confirm: [shares: number]; cancel: []; 'asset-error': [error: Error] }>()
const shares = ref(0)
const submitted = ref(false)
const root = ref<HTMLElement>()
const artwork = computed(()=>`${import.meta.env.BASE_URL}${profileAssetUrl('assets/companies/calculator.png',props.assetProfile??'original')}`)
const keys = [
  { label: '数字 7', value: '7', x: 33, y: 128 }, { label: '数字 8', value: '8', x: 83, y: 128 },
  { label: '数字 9', value: '9', x: 133, y: 128 }, { label: '最大', value: 'max', x: 257, y: 128 },
  { label: '数字 4', value: '4', x: 33, y: 165.5 }, { label: '数字 5', value: '5', x: 83, y: 165.5 },
  { label: '数字 6', value: '6', x: 133, y: 165.5 }, { label: '归零', value: 'clear', x: 197, y: 165.5 },
  { label: '退格', value: 'back', x: 257, y: 165.5 },
  { label: '数字 1', value: '1', x: 33, y: 203 }, { label: '数字 2', value: '2', x: 83, y: 203 },
  { label: '数字 3', value: '3', x: 133, y: 203 }, { label: '数字 0', value: '0', x: 197, y: 203 },
  { label: '确定认购', value: 'confirm', x: 257, y: 203 },
]
function press(value: string) {
  if (props.disabled || submitted.value) return
  if (value === 'confirm') {
    if (shares.value >= 0 && shares.value <= props.maximum) {
      submitted.value = true
      emit('confirm', shares.value)
    }
  } else if (value === 'max') shares.value = props.maximum
  else if (value === 'clear') shares.value = 0
  else if (value === 'back') shares.value = Math.trunc(shares.value / 10)
  else {
    const candidate = shares.value * 10 + Number(value)
    if (candidate <= props.maximum) shares.value = candidate
  }
}
function slide(event: Event) {
  if (!props.disabled && !submitted.value) shares.value = Number((event.target as HTMLInputElement).value)
}
function onKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  // Enter on a focused button must activate that button, including Cancel.
  if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) return
  // A focused range retains native arrow keys for precise single-share adjustment.
  if (event.target instanceof HTMLInputElement && event.target.type === 'range' && event.key.startsWith('Arrow')) return
  const value = /^\d$/.test(event.key) ? event.key : ({ Backspace: 'back', Delete: 'clear', ArrowLeft: 'clear', ArrowRight: 'back', ArrowUp: 'max', ArrowDown: 'confirm', Enter: 'confirm' } as Record<string, string>)[event.key]
  if (value) { event.preventDefault(); event.stopPropagation(); press(value) }
  if (event.key === 'Escape' && !props.disabled) { event.preventDefault(); event.stopPropagation(); emit('cancel') }
}
watch(() => props.maximum, maximum => { shares.value = Math.min(shares.value, maximum) })
onMounted(() => { void nextTick(() => root.value?.focus()) })
</script>

<template>
  <div ref="root" class="calculator" tabindex="-1" data-testid="company-calculator" aria-label="认购计算器" @keydown="onKey">
    <div class="face">
      <img :src="artwork" alt="" @error="emit('asset-error', new Error(`界面素材加载失败：${artwork}`))">
      <span class="maximum" aria-label="最多可认购股数">{{ maximum }}</span>
      <output class="number" data-testid="company-shares" aria-label="认购股数" aria-live="polite">{{ shares }}</output>
      <input class="slider" data-testid="company-slider" aria-label="认购股数滑块" type="range" min="0" :max="maximum" step="1" :value="shares" :disabled="disabled || submitted || maximum === 0" @input="slide">
      <button v-for="key in keys" :key="key.value" class="key original-hotspot" :aria-label="key.label" :style="{left:`${key.x/346*100}%`,top:`${key.y/266*100}%`}" :disabled="disabled || submitted" @click="press(key.value)"><span>{{ key.label }}</span></button>
    </div>
    <p class="total">成交额 {{ price * shares }} · 现金 -{{ price * shares }}</p>
    <button class="cancel" aria-label="取消认购" :disabled="disabled || submitted" @click="emit('cancel')">取消认购</button>
  </div>
</template>

<style scoped>
.calculator{width:346px;max-width:100%;margin:12px auto 0;outline:none;text-align:center}.face{position:relative;width:100%;aspect-ratio:346/266;container-type:inline-size}.face>img{display:block;width:100%;height:100%;pointer-events:none}.maximum,.number{position:absolute;font-family:Arial,sans-serif;color:#080766;font-variant-numeric:tabular-nums;line-height:1}.maximum{left:28%;top:25%;font-size:6cqw;color:#111}.number{right:14%;top:32%;font-size:10cqw}.slider{position:absolute;left:10.5%;top:43%;width:77%;height:5%;margin:0;accent-color:#137ee8;cursor:ew-resize}.key{position:absolute;width:13%;height:12%;padding:0;border:0;border-radius:50%;background:transparent;color:transparent;cursor:pointer}.key:hover:not(:disabled){background:#fff3;box-shadow:0 0 0 2px #fff8}.key:focus-visible{outline:3px solid #ffe18a;outline-offset:2px}.key:disabled{background:#102e6c44;cursor:default}.key span{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.total{margin:6px 0;font-size:14px}.cancel{font:inherit;padding:7px 16px;border:1px solid #73929a;border-radius:7px;background:#ecf4f1;color:#17313a;cursor:pointer}.cancel:disabled{opacity:.5}
</style>
