<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ECONOMY } from '@/core/config/economy'
import { catSvg } from '@/assets/catSvg'
import { getCharacter } from '@/core/config/characters'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { CharacterId } from '@/core/types'

const props = defineProps<{ characterId: CharacterId }>()
const emit = defineEmits<{ finish: [score: number] }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const timeLeft = ref<number>(ECONOMY.ARCADE_DURATION)
const score = ref(0)
const done = ref(false)

interface Coin {
  x: number
  y: number
  vy: number
  r: number
  kind: 'gold' | 'silver' | 'bomb'
}

let raf = 0
let ctx: CanvasRenderingContext2D | null = null
let coins: Coin[] = []
let catX = 0.5 // 归一化横坐标
let spawnTimer = 0
let lastTs = 0
let remaining = ECONOMY.ARCADE_DURATION
let catImg: HTMLImageElement | null = null

const W = () => canvasRef.value?.width ?? 600
const H = () => canvasRef.value?.height ?? 400

function resize() {
  const cv = canvasRef.value
  if (!cv) return
  const rect = cv.getBoundingClientRect()
  cv.width = Math.round(rect.width)
  cv.height = Math.round(rect.height)
}

function spawn() {
  const r = Math.random()
  const kind: Coin['kind'] = r < 0.12 ? 'bomb' : r < 0.45 ? 'silver' : 'gold'
  coins.push({
    x: 0.08 + Math.random() * 0.84,
    y: -0.05,
    vy: 0.32 + Math.random() * 0.28,
    r: 0.028 + Math.random() * 0.012,
    kind,
  })
}

function loop(ts: number) {
  const cv = canvasRef.value
  if (!cv || !ctx) return
  if (!lastTs) lastTs = ts
  const dt = Math.min(0.05, (ts - lastTs) / 1000)
  lastTs = ts

  remaining -= dt
  timeLeft.value = Math.max(0, Math.ceil(remaining))

  if (remaining <= 0) {
    finish()
    return
  }

  spawnTimer -= dt
  if (spawnTimer <= 0) {
    spawn()
    spawnTimer = 0.42
  }

  const w = W()
  const h = H()
  const catY = h - h * 0.12
  const catW = h * 0.18

  // 更新金币
  const kept: Coin[] = []
  for (const c of coins) {
    c.y += c.vy * dt
    const cx = c.x * w
    const cy = c.y * h
    const caught =
      cy + c.r * h > catY - catW * 0.45 &&
      cy < catY + catW * 0.5 &&
      Math.abs(cx - catX * w) < catW * 0.55
    if (caught) {
      if (c.kind === 'bomb') score.value = Math.max(0, score.value - 2)
      else if (c.kind === 'silver') score.value += 1
      else score.value += 2
      continue
    }
    if (c.y * h - c.r * h > h) continue
    kept.push(c)
  }
  coins = kept

  // 绘制
  ctx.clearRect(0, 0, w, h)

  // 背景
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#1d1b46')
  g.addColorStop(1, '#3d2a63')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // 星星
  ctx.fillStyle = 'rgba(255,255,255,.5)'
  for (let i = 0; i < 24; i++) {
    const sx = ((i * 97) % 100) / 100
    const sy = ((i * 53) % 70) / 100
    ctx.fillRect(sx * w, sy * h, 2, 2)
  }

  // 金币
  for (const c of coins) {
    const cx = c.x * w
    const cy = c.y * h
    const r = c.r * h
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    if (c.kind === 'bomb') {
      ctx.fillStyle = '#495057'
      ctx.fill()
      ctx.fillStyle = '#ff6b6b'
      ctx.fillRect(cx - r * 0.2, cy - r * 1.35, r * 0.4, r * 0.5)
    } else {
      ctx.fillStyle = c.kind === 'gold' ? '#ffd43b' : '#ced4da'
      ctx.fill()
      ctx.strokeStyle = 'rgba(43,33,64,.6)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // 猫
  if (catImg) {
    ctx.drawImage(catImg, catX * w - catW / 2, catY - catW / 2, catW, catW)
  }

  raf = requestAnimationFrame(loop)
}

function finish() {
  if (done.value) return
  done.value = true
  cancelAnimationFrame(raf)
  emit('finish', score.value)
}

function moveTo(clientX: number) {
  const cv = canvasRef.value
  if (!cv) return
  const rect = cv.getBoundingClientRect()
  catX = Math.min(0.94, Math.max(0.06, (clientX - rect.left) / rect.width))
}

function onPointer(e: PointerEvent) {
  moveTo(e.clientX)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') catX = Math.max(0.06, catX - 0.07)
  if (e.key === 'ArrowRight') catX = Math.min(0.94, catX + 0.07)
}

onMounted(() => {
  const cv = canvasRef.value
  if (!cv) return
  ctx = cv.getContext('2d')
  resize()

  // 把猫头像转成图片
  const character = getCharacter(props.characterId)
  const svg = catSvg(character)
  const img = new Image()
  img.onload = () => {
    catImg = img
  }
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', resize)
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <section class="arcade">
    <header class="head">
      <span class="stat">剩余 <b class="num">{{ timeLeft }}</b> 秒</span>
      <span class="stat">得分 <b class="num">{{ score }}</b></span>
      <span class="stat reward">≈ <b class="num">{{ fmtMoney(score * ECONOMY.ARCADE_REWARD_PER_POINT) }}</b></span>
    </header>

    <canvas
      ref="canvasRef"
      class="stage"
      @pointermove="onPointer"
      @pointerdown="onPointer"
      aria-label="游乐场小游戏：左右移动接住掉落的财富"
    />

    <p class="tip">拖动鼠标或按 ← → 移动，接住金币（金 2 分 / 银 1 分），躲开炸弹（−2 分）。</p>
  </section>
</template>

<style scoped>
.arcade {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.head {
  display: flex;
  gap: 14px;
  font-size: 12px;
  font-weight: 800;
  color: var(--ink-soft);
}
.head b {
  color: var(--ink);
  font-size: 14px;
}
.reward b {
  color: var(--up);
}
.stage {
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: var(--r-md);
  border: 3px solid var(--ink);
  background: #1d1b46;
  display: block;
  cursor: none;
  touch-action: none;
}
.tip {
  font-size: 11px;
  color: var(--ink-soft);
  font-weight: 600;
  line-height: 1.5;
}
</style>
