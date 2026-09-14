<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import mapJson from './data/map.json'
import { parseAssetManifest, type AssetManifest } from './features/characters/assets'
import { createGameController, type GameController } from './features/game/controller'
import GamePanel from './features/game/GamePanel.vue'
import PropertyPanel from './features/game/PropertyPanel.vue'
import { createGame } from './features/game/setup'
import type { GameState } from './features/game/types'
import { createMapScene, type MapSceneHandle, type PlayerPose } from './features/map/MapScene'
import SceneInspector from './features/map/SceneInspector.vue'
import type { MapData } from './features/map/types'

interface CharacterIndexItem { id: number; name: string; manifestUrl: string }
interface PendingGame { state: GameState; lineup: string }

const map = mapJson as MapData
const mode = ref<'selection' | 'game' | 'inspection'>('selection')
const characters = ref<CharacterIndexItem[]>([])
const indexState = ref<'loading' | 'ready' | 'error'>('loading')
const indexError = ref('')
const selected = ref<number[]>([])
const pending = ref<PendingGame>()
const game = ref<GameState>()
const loadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const loadError = ref('')
const history = ref<string[]>([])
const paused = ref(false)
const speed = ref(1)
const following = ref(true)
const fullscreen = ref(false)
const fullscreenError = ref('')
const host = ref<HTMLElement>()
const stage = ref<HTMLElement>()
let scene: MapSceneHandle | undefined
let gameController: GameController | undefined
let abort: AbortController | undefined
let observer: ResizeObserver | undefined
let generation = 0

const selectedCharacters = computed(() => selected.value.map(id => characters.value.find(item => item.id === id)!).filter(Boolean))
const humanSummary = computed(() => `人类 ${selected.value.length} · AI ${4 - selected.value.length}`)
function thumbnail(item: CharacterIndexItem): string {
  return `${import.meta.env.BASE_URL}${item.manifestUrl.replace(/manifest\.json$/, 'walk/down-right/1.png')}`
}
function parseCharacterIndex(value: unknown): CharacterIndexItem[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { characters?: unknown }).characters)) throw new Error('角色索引结构错误')
  const items = (value as { characters: unknown[] }).characters
  if (items.length !== 12) throw new Error('角色索引必须包含12名角色')
  return items.map((value, index) => {
    const item = value as Partial<CharacterIndexItem>
    if (item.id !== index + 1 || typeof item.name !== 'string' || typeof item.manifestUrl !== 'string') throw new Error(`角色${index + 1}索引错误`)
    return { id: item.id, name: item.name, manifestUrl: item.manifestUrl }
  })
}
async function loadIndex() {
  indexState.value = 'loading'; indexError.value = ''
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/characters/index.json`)
    if (!response.ok) throw new Error(`角色索引加载失败（HTTP ${response.status}）`)
    characters.value = parseCharacterIndex(await response.json())
    indexState.value = 'ready'
  } catch (reason) {
    indexError.value = reason instanceof Error ? reason.message : String(reason)
    indexState.value = 'error'
  }
}
function toggleCharacter(id: number) {
  const index = selected.value.indexOf(id)
  if (index >= 0) selected.value.splice(index, 1)
  else {
    if (selected.value.length === 4) selected.value.shift()
    selected.value.push(id)
  }
}
function seed(): number {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return value[0]!
}
function poses(state: GameState): PlayerPose[] {
  return state.players.map((player, index) => ({
    characterId: player.characterId,
    position: player.position,
    direction: player.direction,
    active: index === state.activePlayerIndex,
    moving: state.phase === 'moving' && index === state.activePlayerIndex,
  }))
}
function cleanupGame() {
  generation += 1
  abort?.abort(); abort = undefined
  observer?.disconnect(); observer = undefined
  gameController?.dispose(); gameController = undefined
  scene?.destroy(); scene = undefined
}
async function fetchManifest(item: CharacterIndexItem, signal: AbortSignal): Promise<AssetManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}${item.manifestUrl}`, { signal })
  if (!response.ok) throw new Error(`角色素材清单加载失败：${item.manifestUrl}（HTTP ${response.status}）`)
  return parseAssetManifest(await response.json())
}
async function loadPendingGame() {
  if (!pending.value) return
  const current = ++generation
  abort?.abort(); observer?.disconnect(); gameController?.dispose(); scene?.destroy()
  gameController = undefined; scene = undefined
  abort = new AbortController()
  const signal = abort.signal
  loadState.value = 'loading'; loadError.value = ''; paused.value = false; following.value = true
  try {
    const entries = await Promise.all(pending.value.state.players.map(async player => {
      const item = characters.value.find(character => character.id === player.characterId)!
      return { characterId: player.characterId, manifest: await fetchManifest(item, signal) }
    }))
    if (current !== generation || !host.value) return
    const loaded = await createMapScene(host.value, map, entries[0]!.manifest, {
      signal,
      playerManifests: entries,
      onFrame: () => {},
      onManualCamera: () => { following.value = false },
    })
    if (current !== generation) { loaded.destroy(); return }
    scene = loaded
    const initial = pending.value.state
    game.value = initial
    scene.setPlayers(poses(initial))
    scene.setProperties(initial.properties)
    scene.showMarkers(true)
    scene.setSpeed(speed.value)
    scene.follow(initial.players[initial.activePlayerIndex]!.position)
    let previous = initial
    gameController = createGameController(initial, {
      onTransition: transition => scene?.transitionPlayer(transition),
      onState: state => {
        if (previous.phase === 'awaiting-roll' && state.phase === 'moving') {
          const player = state.players[state.activePlayerIndex]!
          history.value.push(`${player.name} ${player.controller === 'ai' ? 'AI ' : ''}掷出 ${state.lastRoll}`)
        }
        if (previous.phase === 'moving' && state.phase === 'landed') {
          const player = state.players[state.activePlayerIndex]!
          history.value.push(`${player.name} 到达 ${player.position.column},${player.position.row}`)
        }
        if (previous.lastPropertyEvent !== state.lastPropertyEvent && state.lastPropertyEvent) {
          const event = state.lastPropertyEvent
          const parcel = map.parcels.find(item => item.id === event.parcelId)!
          const actor = state.players.find(item => item.id === event.playerId)!
          const action = ({ purchased: '购买', upgraded: '升级', 'rent-paid': '支付租金', declined: '放弃', 'insufficient-cash': '现金不足', 'max-level': '已满级' })[event.kind]
          history.value.push(`${actor.name} ${action} ${parcel.streetName} #${parcel.id} · ${event.amount} · 现金 ${actor.cash} / 存款 ${actor.deposit}`)
        }
        const activeChanged = previous.activePlayerIndex !== state.activePlayerIndex
        const propertiesChanged = previous.properties !== state.properties
        previous = state
        game.value = state
        scene?.setPlayers(poses(state))
        if (propertiesChanged) scene?.setProperties(state.properties)
        if (following.value && activeChanged) scene?.follow(state.players[state.activePlayerIndex]!.position)
      },
    })
    observer = new ResizeObserver(([entry]) => { if (entry) scene?.resize(entry.contentRect.width, entry.contentRect.height) })
    observer.observe(host.value)
    loadState.value = 'ready'
  } catch (reason) {
    if (current !== generation || signal.aborted) return
    loadError.value = reason instanceof Error ? reason.message : String(reason)
    loadState.value = 'error'
  }
}
async function startGame() {
  if (selected.value.length === 0) return
  cleanupGame()
  const state = createGame([...selected.value], seed())
  pending.value = { state, lineup: state.players.map(player => player.name).join(' · ') }
  history.value = []
  speed.value = 1
  mode.value = 'game'
  await nextTick()
  await loadPendingGame()
}
function roll() { gameController?.roll() }
function decideProperty(choice: 'accept' | 'decline') { gameController?.decideProperty(choice) }
function acknowledgeProperty() { gameController?.acknowledgeProperty() }
function togglePause() {
  if (!gameController || !scene) return
  paused.value = !paused.value
  gameController.setPaused(paused.value)
  scene.setPaused(paused.value)
}
function changeSpeed(value: number) {
  speed.value = value
  gameController?.setSpeed(value)
  scene?.setSpeed(value)
}
function followCurrent() {
  if (!game.value) return
  following.value = true
  scene?.follow(game.value.players[game.value.activePlayerIndex]!.position)
}
function overview() { following.value = false; scene?.overview() }
async function toggleFullscreen() {
  fullscreenError.value = ''
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await stage.value?.requestFullscreen()
  } catch { fullscreenError.value = '当前浏览器未能进入全屏。' }
}
function returnToSelection() {
  if (document.fullscreenElement === stage.value) void document.exitFullscreen()
  fullscreenError.value = ''
  cleanupGame()
  pending.value = undefined
  game.value = undefined
  loadState.value = 'idle'
  mode.value = 'selection'
}
function fullscreenChanged() { fullscreen.value = document.fullscreenElement === stage.value }
function keydown(event: KeyboardEvent) {
  if (mode.value !== 'game' || event.defaultPrevented) return
  const target = event.target as HTMLElement | null
  if (target?.matches('input, select, textarea, button, [contenteditable=true]')) return
  if (event.key === 'ArrowUp' && gameController?.roll()) event.preventDefault()
  if (event.key === 'ArrowLeft' && gameController?.decideProperty('accept')) event.preventDefault()
  if (event.key === 'ArrowRight' && gameController?.decideProperty('decline')) event.preventDefault()
}
onMounted(() => {
  document.addEventListener('fullscreenchange', fullscreenChanged)
  document.addEventListener('keydown', keydown)
  void loadIndex()
})
onBeforeUnmount(() => {
  cleanupGame()
  document.removeEventListener('fullscreenchange', fullscreenChanged)
  document.removeEventListener('keydown', keydown)
})
</script>

<template>
  <SceneInspector v-if="mode === 'inspection'" @back="mode = 'selection'" />
  <main v-else-if="mode === 'selection'" class="selection-shell">
    <header><div><span class="eyebrow">原素材 · 独立现代回合</span><h1>星猫大富翁</h1></div><button @click="mode = 'inspection'">场景检查</button></header>
    <section class="selection-card">
      <div class="selection-title"><div><h2>选择参赛角色</h2><p>按选择顺序加入 1–4 名人类玩家，不足四人由 AI 随机补位；第五次选择会滚出最早选择。</p></div><strong data-testid="human-count">{{ humanSummary }}</strong></div>
      <div v-if="indexState === 'loading'" class="selection-state">正在读取12名原版角色…</div>
      <div v-else-if="indexState === 'error'" role="alert" class="selection-state"><p>{{ indexError }}</p><button @click="loadIndex">重试角色索引</button></div>
      <div v-else class="characters" data-testid="character-grid">
        <button v-for="item in characters" :key="item.id" :data-testid="`character-${item.id}`" :aria-pressed="selected.includes(item.id)" @click="toggleCharacter(item.id)">
          <span class="portrait"><img :src="thumbnail(item)" alt="" loading="eager"><b v-if="selected.includes(item.id)">{{ selected.indexOf(item.id) + 1 }}</b></span>
          <span>{{ item.name }}</span>
        </button>
      </div>
      <div class="selection-footer">
        <div><small>已选顺序</small><p data-testid="selected-order">{{ selectedCharacters.length ? selectedCharacters.map(item => item.name).join(' → ') : '请至少选择一名角色' }}</p></div>
        <button class="start" :disabled="selected.length === 0 || indexState !== 'ready'" @click="startGame">开始对局</button>
      </div>
    </section>
    <p class="scope">2C 住宅地交易：购买、升级与同街道租金；特殊地和完整破产流程留待后续批次。</p>
  </main>
  <main v-else class="game-shell">
    <header><div><span class="eyebrow">原素材 · 2C住宅交易</span><h1>星猫大富翁 · 回合演示</h1></div><span role="status">{{ loadState === 'ready' ? '对局已载入' : loadState === 'error' ? '加载失败' : '正在载入四名角色与地产素材…' }}</span></header>
    <section ref="stage" class="game-stage">
      <div ref="host" class="canvas-host" />
      <GamePanel v-if="game && loadState === 'ready'" :game="game" :paused="paused" :speed="speed" :history="history" @roll="roll" @pause="togglePause" @speed="changeSpeed" @overview="overview" @follow="followCurrent" @fullscreen="toggleFullscreen" @restart="returnToSelection" />
      <PropertyPanel v-if="game && loadState === 'ready'" :game="game" :paused="paused" @decide="decideProperty" @acknowledge="acknowledgeProperty" />
      <div v-if="game?.phase === 'insolvent'" class="insolvent" role="alert"><h2>资金耗尽，回合已停止</h2><p>本次租金已完整结算。完整破产处理尚未接入 2C，请返回选人重新开始。</p><button @click="returnToSelection">返回选人</button></div>
      <button v-if="fullscreen" class="exit-fullscreen" @click="toggleFullscreen">退出全屏</button>
      <p v-if="fullscreenError" class="fullscreen-error" role="alert">{{ fullscreenError }}</p>
      <div v-if="loadState !== 'ready'" class="overlay">
        <div v-if="loadState === 'loading'"><p>正在载入地图与四名角色动作…</p><p data-testid="pending-lineup">{{ pending?.lineup }}</p></div>
        <div v-else role="alert"><p>{{ loadError }}</p><p data-testid="pending-lineup">{{ pending?.lineup }}</p><div class="error-actions"><button @click="loadPendingGame">重试载入</button><button @click="returnToSelection">返回选人</button></div></div>
      </div>
    </section>
  </main>
</template>

<style scoped>
button,select{font:inherit;background:#294b58;color:#edf6f3;border:1px solid #55717a;border-radius:8px;padding:8px 12px;cursor:pointer}button:hover,select:hover{background:#376271}button:disabled{opacity:.42;cursor:default}button:focus-visible,select:focus-visible{outline:2px solid #ffe18a;outline-offset:3px}.eyebrow{font-size:11px;color:#a9c3c8;letter-spacing:.13em}
.selection-shell,.game-shell{min-height:100dvh;background:radial-gradient(circle at 50% 0,#28505f,#132a35 55%);color:#ebf4f2;font:14px/1.5 system-ui,"PingFang SC",sans-serif;padding:20px 28px}.selection-shell header,.game-shell header{width:min(1260px,100%);margin:0 auto 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}h1{margin:2px 0;font-size:24px}.selection-card{width:min(1120px,100%);margin:5vh auto 0;background:#183542e8;border:1px solid #466775;border-radius:18px;padding:24px;box-shadow:0 24px 70px #07151d88}.selection-title{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.selection-title h2{margin:0;font-size:25px}.selection-title p{margin:5px 0 18px;color:#abc1c5}.selection-title strong{white-space:nowrap;color:#ffe18a}.characters{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.characters button{padding:10px;display:flex;flex-direction:column;gap:6px;align-items:center;background:#20424f}.characters button[aria-pressed=true]{background:#40594f;border-color:#ffe18a;box-shadow:0 0 0 1px #ffe18a}.portrait{position:relative;width:72px;height:82px;display:grid;place-items:center;background:#68cef4;border-radius:11px;overflow:hidden}.portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:auto}.portrait b{position:absolute;top:5px;right:5px;z-index:1;width:22px;height:22px;display:grid;place-items:center;background:#ffe18a;color:#273733;border-radius:50%}.selection-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:22px}.selection-footer small{color:#9cb4b9}.selection-footer p{margin:2px 0;font-size:16px}.start{background:#ffe18a;color:#263d3b;border-color:#ffe18a;font-weight:800;padding:11px 24px}.selection-state{min-height:380px;display:grid;place-items:center;text-align:center}.scope{text-align:center;color:#91aab0;font-size:12px;margin:18px auto 0}
.game-shell{display:flex;flex-direction:column}.game-stage{position:relative;width:min(1400px,100%);height:calc(100dvh - 104px);min-height:570px;margin:0 auto;display:flex;overflow:hidden;background:#66ccff;border:1px solid #486a75;border-radius:12px;box-shadow:0 12px 45px #0006}.canvas-host{flex:1;min-width:0;height:100%;cursor:grab}.canvas-host:active{cursor:grabbing}.canvas-host :deep(canvas){display:block;width:100%;height:100%}.overlay{position:absolute;inset:0;z-index:3;display:grid;place-items:center;background:#17323df2;text-align:center;padding:28px}.overlay p{max-width:720px;overflow-wrap:anywhere}.error-actions{display:flex;justify-content:center;gap:10px}.exit-fullscreen{position:absolute;right:334px;top:14px;z-index:4}.fullscreen-error{position:absolute;z-index:4;left:16px;top:16px;margin:0;padding:9px 12px;border:1px solid #ffb19a;border-radius:8px;background:#5b2925;color:#fff}.game-stage:fullscreen{width:100vw;height:100vh;max-width:none;border:0;border-radius:0}.game-stage:fullscreen .canvas-host{height:100vh}
.insolvent{position:absolute;z-index:3;left:18px;bottom:18px;width:min(470px,calc(100% - 370px));padding:18px;border:1px solid #ffb19a;border-radius:12px;background:#572d2be8;color:#fff}.insolvent h2{margin:0 0 8px}.insolvent p{margin:0 0 12px}
@media(max-width:900px){.characters{grid-template-columns:repeat(4,1fr)}.game-stage{height:calc(100dvh - 90px);flex-direction:column}.canvas-host{min-height:58vh}.exit-fullscreen{right:14px}.game-shell{padding:12px}.game-shell header{margin-bottom:8px}}
@media(max-width:600px){.selection-shell{padding:14px}.selection-card{padding:15px;margin-top:2vh}.characters{grid-template-columns:repeat(3,1fr);gap:7px}.portrait{width:60px;height:66px}.selection-title,.selection-footer{align-items:stretch;flex-direction:column}}
</style>
