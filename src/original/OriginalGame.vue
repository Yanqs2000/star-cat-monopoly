<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { checkOriginalFiles, loadRuntime, type RuffleElement } from './runtime'

const stage = ref<HTMLElement>()
const mountPoint = ref<HTMLElement>()
const status = ref<'loading' | 'ready' | 'error'>('loading')
const error = ref('')
const muted = ref(false)
const restartDialog = ref(false)
const hdBuildings = new URLSearchParams(window.location.search).get('art') === 'hd'
let player: RuffleElement | undefined
let controller: AbortController | undefined
let generation = 0

async function start() {
  const current = ++generation
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  player?.remove()
  player = undefined
  status.value = 'loading'
  error.value = ''
  try {
    await Promise.all([loadRuntime(), checkOriginalFiles(signal)])
    if (current !== generation || !mountPoint.value) return
    const element = window.RufflePlayer!.newest!().createPlayer()
    player = element
    element.setAttribute('aria-label', '原版 Flash 游戏画面')
    mountPoint.value.replaceChildren(element)
    element.addEventListener('loadeddata', () => {
      if (current === generation) status.value = 'ready'
    }, { once: true })
    await element.ruffle().load({
      url: `${import.meta.env.BASE_URL}${hdBuildings ? 'hd-assets' : 'original'}/play.swf`,
      base: `${import.meta.env.BASE_URL}original/`,
      autoplay: 'on',
      unmuteOverlay: 'hidden',
      scale: 'showAll',
      forceScale: true,
      quality: 'high',
      // 原版动态文本使用设备中文字体；内置西文字体不包含这些字形。
      deviceFontRenderer: 'canvas',
      splashScreen: false,
      allowScriptAccess: false,
      allowNetworking: 'internal',
      openUrlMode: 'deny',
      backgroundColor: '#66ccff',
      letterbox: 'on',
    })
    if (current !== generation) return
    element.ruffle().volume = muted.value ? 0 : 1
    if (element.ruffle().readyState === 2) status.value = 'ready'
  } catch (reason) {
    if (current !== generation || signal.aborted) return
    status.value = 'error'
    error.value = reason instanceof Error ? reason.message : '原版加载失败，请重试'
    player?.remove()
    player = undefined
  }
}
function toggleSound() {
  muted.value = !muted.value
  if (player) player.ruffle().volume = muted.value ? 0 : 1
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await stage.value?.requestFullscreen()
  } catch { error.value = '当前浏览器不支持全屏，请使用浏览器缩放。' }
}
function restart() {
  restartDialog.value = false
  void start()
}
onMounted(start)
onBeforeUnmount(() => {
  generation++
  controller?.abort()
  player?.remove()
})
</script>

<template>
  <main class="original-shell">
    <header class="player-toolbar">
      <div class="identity"><strong>星猫大富翁</strong><span>{{ hdBuildings ? '高清建筑试用' : '4399 原版' }}</span></div>
      <nav aria-label="播放器控制">
        <span class="load-status" role="status">{{ status === 'ready' ? (hdBuildings ? '高清试用版已载入' : '原版已载入') : status === 'loading' ? '正在载入…' : '加载失败' }}</span>
        <button :disabled="status !== 'ready'" :aria-pressed="muted" @click="toggleSound">{{ muted ? '开启声音' : '静音' }}</button>
        <button @click="fullscreen">全屏</button>
        <button :disabled="status === 'loading'" @click="restartDialog = true">重新载入</button>
      </nav>
    </header>

    <section ref="stage" class="original-stage" role="application" aria-label="星猫大富翁原版游戏" :aria-busy="status === 'loading'">
      <div ref="mountPoint" class="game-mount" />
      <div v-if="status === 'loading'" class="status-overlay"><span class="spinner" /><p>正在载入原版游戏</p><small>首次载入需要一点时间</small></div>
      <div v-if="status === 'error'" class="status-overlay error-state" role="alert"><h2>游戏暂时未能载入</h2><p>{{ error }}</p><button @click="start">重试</button></div>
      <div v-if="restartDialog" class="confirm-backdrop">
        <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reload-title">
          <h2 id="reload-title">重新载入原版游戏？</h2>
          <p>未保存的进度会丢失。可先取消，在原游戏中保存进度。</p>
          <div><button autofocus @click="restartDialog = false">取消</button><button @click="restart">确认重新载入</button></div>
        </section>
      </div>
    </section>
    <footer><span>鼠标操作 · ↑ 掷骰 · ← 确认 · → 取消</span><a :href="hdBuildings ? './' : '?art=hd'" target="_blank" rel="noopener">{{ hdBuildings ? '打开原版' : '试用高清建筑' }}</a><a href="https://www.4399.com/flash/15000.htm" target="_blank" rel="noreferrer">原版来源 ↗</a></footer>
    <p v-if="hdBuildings" class="notice">已替换 11 张建筑素材；人物仍使用原版动画。试用版与原版请分别保存进度。</p>
    <p v-if="error && status !== 'error'" role="alert" class="notice">{{ error }}</p>
  </main>
</template>

<style scoped>
.original-shell{min-height:100dvh;box-sizing:border-box;background:#172630;color:#e8f1f5;padding:16px 24px;display:flex;flex-direction:column;align-items:center;gap:12px;font-family:system-ui,"PingFang SC","Microsoft YaHei",sans-serif}
.player-toolbar,footer{width:min(1100px,100%);display:flex;align-items:center;justify-content:space-between;gap:12px}
.identity{display:flex;align-items:center;gap:12px;white-space:nowrap}.identity strong{font-size:18px;letter-spacing:.08em}.identity span{color:#9bb7c4;font-size:12px;border-left:1px solid #45606c;padding-left:12px}
nav{display:flex;align-items:center;gap:8px}.load-status{font-size:12px;color:#a8bec8;margin-right:8px}
button{font:inherit;font-size:13px;color:#e8f1f5;background:#2b414d;border:1px solid #48626f;border-radius:6px;padding:8px 12px;cursor:pointer}button:hover{background:#3a5461}button:disabled{opacity:.4;cursor:default}button:focus-visible,a:focus-visible{outline:2px solid #fbd253;outline-offset:3px}
.original-stage{position:relative;width:min(1100px,100%,calc((100dvh - 118px)*4/3));aspect-ratio:4/3;background:#66ccff;box-shadow:0 8px 30px #0005;flex:none;overflow:hidden}
.game-mount{position:relative;z-index:0;width:100%;height:100%}.game-mount :deep(ruffle-player){display:block;width:100%;height:100%}
.status-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#182b38;color:#e5f4fb}.status-overlay p,.status-overlay h2{margin:0}.status-overlay small{color:#a6c0ce}.spinner{width:26px;height:26px;border:3px solid #45616d;border-top-color:#ffda75;border-radius:50%;animation:spin 1s linear infinite}
footer{font-size:12px;color:#9bb7c4;line-height:1.6}footer a{color:#afc9d7;text-decoration:none;white-space:nowrap}
.confirm-backdrop{position:absolute;inset:0;background:#0009;display:grid;place-items:center}.confirm-dialog{background:#223c4a;padding:28px;border:1px solid #5c7785;border-radius:12px;max-width:360px;margin:16px}.confirm-dialog h2{font-size:19px;margin:0 0 12px}.confirm-dialog p{font-size:14px;line-height:1.8;margin:0 0 20px;color:#bcd0d9}.confirm-dialog div{display:flex;justify-content:flex-end;gap:12px}.notice{font-size:13px;color:#ffe1a6}
.original-stage:fullscreen{width:100vw;height:100vh;aspect-ratio:auto;box-shadow:none}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:650px){.original-shell{padding:10px 8px;gap:12px;justify-content:center}.player-toolbar{align-items:flex-start;flex-direction:column}.identity strong{font-size:16px}nav{width:100%;justify-content:flex-end}.load-status{margin-right:auto;font-size:11px}button{font-size:12px;padding:8px}.original-stage{width:100%}footer{align-items:flex-start;font-size:11px}}
@media(prefers-reduced-motion:reduce){.spinner{animation:none}}
</style>
