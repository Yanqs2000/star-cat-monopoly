<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CityBoard3D } from '@/render3d/CityBoard3D'
import { SceneManager } from '@/render3d/SceneManager'
import type { Floater } from '@/stores/gameStore'
import type { GameState } from '@/core/types'

/**
 * 3D 棋盘的 Vue 包装。
 *
 * 桥接原则：**状态变化只做差异同步，绝不重建场景**。
 * 场景在挂载时建一次，之后每帧只做插值与动画。
 */
const props = defineProps<{
  state: GameState
  visualPos: number[]
  floaters: Floater[]
  dice: { value: number; power: number } | null
  speed: number
}>()

const host = ref<HTMLElement | null>(null)
const failure = ref<string | null>(null)

let manager: SceneManager | null = null
let board: CityBoard3D | null = null

function syncAll() {
  if (!board || !props.state) return
  board.syncTiles(props.state)
  board.syncTurnRing(props.state)
  board.syncTokens(props.state, props.visualPos)
}

onMounted(() => {
  const el = host.value
  if (!el) return
  try {
    manager = new SceneManager(el)
    board = new CityBoard3D(manager.renderer, manager)
    syncAll()
    board.syncFloaters(props.floaters)
    if (import.meta.env.DEV) {
      ;(window as unknown as { __scm3dScene?: unknown }).__scm3dScene = { manager, board }
    }
  } catch (err) {
    failure.value = (err as Error).message || '3D 渲染初始化失败'
    board?.dispose()
    manager?.dispose()
    board = null
    manager = null
  }
})

// 一次 dispatch 只触发一次（引擎每个动作才换一次 state 对象）
watch(
  () => props.state,
  () => syncAll(),
)

// visualPos 是就地改元素（每走一格改一个数字），必须 deep 才能逐格触发
watch(
  () => props.visualPos,
  (vp) => {
    if (!board || !props.state) return
    board.syncTokens(props.state, [...vp])
  },
  { deep: true },
)

watch(
  () => props.floaters,
  (list) => board?.syncFloaters(list),
  { deep: true },
)

watch(
  () => props.dice,
  (d) => {
    if (d) board?.rollDice(d.value, props.speed)
  },
)

onBeforeUnmount(() => {
  board?.dispose()
  manager?.dispose()
  board = null
  manager = null
})
</script>

<template>
  <div class="board3d-wrap">
    <div ref="host" class="board3d" />

    <div v-if="failure" class="fallback">
      <p class="title">3D 渲染不可用</p>
      <p class="desc">{{ failure }}</p>
      <p class="hint">你的浏览器或显卡可能不支持 WebGL。游戏逻辑仍然正常运行，可以继续用面板操作。</p>
    </div>

    <p v-if="!failure" class="tip">拖拽旋转 · 滚轮缩放</p>
  </div>
</template>

<style scoped>
.board3d-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: var(--r-lg);
  overflow: hidden;
  background: transparent;
}

.board3d {
  width: 100%;
  height: 100%;
  min-height: 0;
  cursor: grab;
  touch-action: none;
}
.board3d:active {
  cursor: grabbing;
}
.board3d :deep(canvas) {
  display: block;
}

.tip {
  position: absolute;
  right: 12px;
  bottom: 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(28, 20, 56, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  padding: 4px 11px;
  pointer-events: none;
  backdrop-filter: blur(6px);
}

.fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  background: rgba(28, 20, 56, 0.72);
  border: 2px dashed rgba(255, 255, 255, 0.24);
  border-radius: var(--r-lg);
}
.fallback .title {
  font-size: 15px;
  font-weight: 800;
  color: #ffd43b;
}
.fallback .desc {
  font-size: 12px;
  font-weight: 700;
  color: #ffb3b3;
  word-break: break-word;
}
.fallback .hint {
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.62);
  max-width: 320px;
  line-height: 1.6;
}

@media (max-width: 760px) {
  .board3d-wrap {
    aspect-ratio: 1 / 1;
    height: auto;
  }
}
</style>
