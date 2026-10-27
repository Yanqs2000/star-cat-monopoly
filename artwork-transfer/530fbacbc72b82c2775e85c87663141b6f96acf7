<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import mapJson from '../../data/map.json'
import { parseAssetManifest, type Facing } from '../characters/assets'
import { createMapScene, type MapSceneHandle } from './MapScene'
import type { MapData } from './types'

const emit = defineEmits<{ back: [] }>()
const map = mapJson as MapData
const host = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const state = ref<'loading' | 'ready' | 'error'>('loading')
const error = ref('')
const markers = ref(true)
const playing = ref(true)
const facing = ref<Facing>('down-right')
const frame = ref(1)
const isFullscreen = ref(false)
const position = ref('land')
const positions = [
  { id: 'land', name: '金星大道 · 地块 1', point: { column: 6, row: 32 } },
  { id: 'centre', name: '中央十字路口', point: { column: 20, row: 16 } },
  { id: 'east', name: '东侧转角', point: { column: 40, row: 14 } },
  { id: 'south', name: '南侧路口', point: { column: 5, row: 33 } },
  { id: 'portal', name: '北侧魔法门', point: { column: 30, row: 5 } },
]
const directions: { id: Facing; name: string }[] = [
  { id: 'down-right', name: '右下' }, { id: 'down-left', name: '左下' },
  { id: 'up-left', name: '左上' }, { id: 'up-right', name: '右上' },
]
let scene: MapSceneHandle | undefined
let abort: AbortController | undefined
let observer: ResizeObserver | undefined
let generation = 0
function focus() { scene?.focus(positions.find(point => point.id === position.value)!.point) }
function direction(id: Facing) { facing.value = id; scene?.setFacing(id) }
function togglePlaying() { playing.value = !playing.value; scene?.setPlaying(playing.value) }
async function load() {
  const current = ++generation
  abort?.abort(); observer?.disconnect(); scene?.destroy(); scene = undefined
  abort = new AbortController()
  const signal = abort.signal
  state.value = 'loading'; error.value = ''
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/manifest.json`, { signal })
    if (!response.ok) throw new Error(`素材清单加载失败：assets/manifest.json（HTTP ${response.status}）`)
    const manifest = parseAssetManifest(await response.json())
    if (current !== generation || !host.value) return
    const loaded = await createMapScene(host.value, map, manifest, { signal, onFrame: value => { frame.value = value } })
    if (current !== generation) { loaded.destroy(); return }
    scene = loaded
    scene.setFacing(facing.value); scene.setPlaying(playing.value); scene.showMarkers(markers.value); focus()
    observer = new ResizeObserver(([entry]) => { if (entry) scene?.resize(entry.contentRect.width, entry.contentRect.height) })
    observer.observe(host.value)
    state.value = 'ready'
  } catch (reason) {
    if (current !== generation || signal.aborted) return
    error.value = reason instanceof Error ? reason.message : String(reason)
    state.value = 'error'
  }
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await stage.value?.requestFullscreen()
  } catch { error.value = '当前浏览器未能进入全屏。' }
}
function fullscreenChanged() { isFullscreen.value = document.fullscreenElement === stage.value }
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && document.fullscreenElement === stage.value) void fullscreen()
}
function back() {
  if (document.fullscreenElement === stage.value) void document.exitFullscreen()
  emit('back')
}
onMounted(() => {
  document.addEventListener('fullscreenchange', fullscreenChanged)
  document.addEventListener('keydown', keydown)
  void load()
})
onBeforeUnmount(() => {
  generation++; abort?.abort(); observer?.disconnect(); scene?.destroy()
  document.removeEventListener('fullscreenchange', fullscreenChanged)
  document.removeEventListener('keydown', keydown)
})
</script>

<template>
  <main class="modern-shell">
    <header>
      <div><span class="eyebrow">2A · 独立场景检查</span><h1>星猫大富翁 · 现代场景</h1></div>
      <span class="status" role="status">{{ state === 'ready' ? '场景已载入' : state === 'error' ? '加载失败' : '正在载入原素材…' }}</span>
    </header>
    <div class="controls">
      <button @click="back">返回选人</button>
      <label>地图定位 <select v-model="position" aria-label="地图定位" :disabled="state !== 'ready'" @change="focus"><option v-for="point in positions" :key="point.id" :value="point.id">{{ point.name }}</option></select></label>
      <div class="direction" aria-label="人物方向"><button v-for="item in directions" :key="item.id" :aria-pressed="facing === item.id" :disabled="state !== 'ready'" @click="direction(item.id)">{{ item.name }}</button></div>
      <button :disabled="state !== 'ready'" @click="togglePlaying">{{ playing ? '暂停动画' : '继续动画' }}</button>
      <label class="check"><input v-model="markers" type="checkbox" :disabled="state !== 'ready'" @change="scene?.showMarkers(markers)">显示地块标记</label>
      <button :disabled="state !== 'ready'" @click="scene?.overview()">全图</button><button @click="fullscreen">全屏</button>
    </div>
    <section ref="stage" class="stage"><div ref="host" class="canvas-host" /><button v-if="isFullscreen" class="exit-fullscreen" @click="fullscreen">退出全屏</button><div v-if="state !== 'ready'" class="overlay"><p v-if="state === 'loading'">正在准备地图与四方向动画…</p><div v-else role="alert"><p>{{ error }}</p><button @click="load">重试</button></div></div></section>
    <footer><span>拖拽地图查看 · 56 块住宅地 · 16 条街道</span><span data-testid="scene-position">定位 {{ positions.find(point => point.id === position)!.point.column }}, {{ positions.find(point => point.id === position)!.point.row }} · 动画帧 {{ frame }}/{{ facing === 'down-right' ? 24 : 24 }}</span><button :disabled="state === 'loading'" @click="load">重新载入场景</button></footer>
    <p class="scope">2A 场景检查：地点与方向控制只影响检查画面，不会改动 2B 对局状态。</p>
  </main>
</template>

<style scoped>
.modern-shell{min-height:100dvh;background:#172c37;color:#eaf1ef;font:14px/1.6 system-ui,"PingFang SC",sans-serif;padding:20px 26px;display:flex;align-items:center;flex-direction:column;gap:14px}
header,.controls,footer,.scope{width:min(1160px,100%)}header{display:flex;justify-content:space-between;align-items:center;gap:18px}h1{font-size:21px;letter-spacing:.04em;margin:2px 0}.eyebrow{font-size:11px;color:#a9c3c8;letter-spacing:.12em}.status{font-size:12px;color:#bddccc}.controls{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
button,select{font:inherit;background:#2a4552;color:#ecf3f2;border:1px solid #51707b;border-radius:6px;padding:6px 11px;cursor:pointer}button:hover,select:hover{background:#375965}button[aria-pressed=true]{background:#ffe18a;color:#27352f;border-color:#ffe18a}button:disabled,select:disabled{opacity:.45;cursor:default}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #ffe18a;outline-offset:3px}.direction{display:flex;gap:4px}.check{display:flex;gap:6px;align-items:center}
.stage{position:relative;width:min(1100px,100%,calc((100dvh - 225px)*4/3));aspect-ratio:4/3;background:#66ccff;border-radius:4px;overflow:hidden;box-shadow:0 8px 30px #0004}.canvas-host{width:100%;height:100%;cursor:grab}.canvas-host:active{cursor:grabbing}.canvas-host :deep(canvas){display:block;width:100%;height:100%}.overlay{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:30px;background:#1c3540}.overlay p{max-width:620px;overflow-wrap:anywhere}.exit-fullscreen{position:absolute;top:16px;right:16px;z-index:2}
footer{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#afc4ca;font-size:12px}.scope{font-size:12px;margin:0;color:#97b1bb;text-align:center}.stage:fullscreen{width:100vw;height:100vh;aspect-ratio:auto;background:#122731;border-radius:0;display:grid;place-items:center}.stage:fullscreen .canvas-host{width:min(100vw,calc(100vh*4/3));height:min(100vh,calc(100vw*3/4))}
@media(max-width:800px){.modern-shell{padding:12px;gap:12px}.stage{width:100%;min-height:0}h1{font-size:18px}footer{flex-wrap:wrap;justify-content:center}.controls{font-size:12px}}
</style>
