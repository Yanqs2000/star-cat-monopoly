<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { CharacterId, WinReason } from '@/core/types'
import Board3D from './components/board/Board3D.vue'
import PlayerCard from './components/hud/PlayerCard.vue'
import DicePad from './components/hud/DicePad.vue'
import CardHand from './components/panels/CardHand.vue'
import EstatePanel from './components/panels/EstatePanel.vue'
import LogPanel from './components/panels/LogPanel.vue'
import PromptHost from './components/panels/PromptHost.vue'
import ResultScreen from './components/ResultScreen.vue'
import SetupScreen from './components/SetupScreen.vue'

const store = useGameStore()

// 开发态调试钩子：浏览器控制台里可以直接看状态、改数值、驱动 AI
if (import.meta.env.DEV) {
  ;(window as unknown as { __scm: typeof store }).__scm = store
}

/** 云朵（纯装饰，位置固定，避免每次渲染抖动） */
const clouds = [
  { x: 8, y: 14, s: 1.1, o: 0.9 },
  { x: 62, y: 8, s: 0.8, o: 0.75 },
  { x: 82, y: 30, s: 1.3, o: 0.8 },
  { x: 28, y: 40, s: 0.65, o: 0.6 },
  { x: 46, y: 66, s: 1.0, o: 0.5 },
]

const state = computed(() => store.state)
const human = computed(() => store.human)
const current = computed(() => store.currentPlayer)

const isHumanTurn = computed(
  () => !!current.value && !!human.value && current.value.id === human.value.id,
)

const canRoll = computed(
  () => !!state.value && state.value.phase === 'roll' && isHumanTurn.value && !store.busy,
)

/** 某个玩家此刻能不能放技能（只有人类玩家、且轮到自己时） */
function canSkillFor(id: number): boolean {
  const s = state.value
  if (!s || !isHumanTurn.value || store.busy || s.phase === 'over') return false
  const p = s.players[id]
  if (!p || p.isAI || p.out || p.skillCooldown > 0) return false
  return p.id === s.settings.humanId
}

const canPlayCard = computed(() => {
  const s = state.value
  if (!s || !isHumanTurn.value || store.busy) return false
  return (
    s.phase === 'roll' ||
    (s.phase === 'decide' && (s.pending?.kind === 'manage' || s.pending?.kind === 'facility'))
  )
})

const showEstate = ref(false)

/** 自己回合内可以打开地产面板加盖/变卖 */
const canOpenEstate = computed(
  () =>
    !!state.value &&
    isHumanTurn.value &&
    !store.busy &&
    state.value.phase !== 'over' &&
    !human.value?.out,
)

const speeds = [0, 1, 2]
const speedLabel = computed(() => (store.speed === 0 ? '跳过' : `${store.speed}×`))

function cycleSpeed() {
  const i = speeds.indexOf(store.speed)
  store.setSpeed(speeds[(i + 1) % speeds.length]!)
}

function onStart(payload: {
  myCharacter: CharacterId
  opponents: CharacterId[]
  winCondition: WinReason
}) {
  store.newGame([payload.myCharacter, ...payload.opponents], {
    humanId: 0,
    winCondition: payload.winCondition,
  })
}

function again() {
  store.quit()
}
</script>

<template>
  <div class="app">
    <!-- 白天的天空 -->
    <div class="sky" aria-hidden="true">
      <span
        v-for="(c, i) in clouds"
        :key="i"
        class="cloud"
        :style="{
          left: `${c.x}%`,
          top: `${c.y}%`,
          transform: `scale(${c.s})`,
          opacity: c.o,
          animationDelay: `${i * -7}s`,
        }"
      />
      <div class="sun" />
    </div>

    <header class="topbar">
      <div class="brand">
        <span class="brand-star">★</span>
        <h1>星猫大富翁</h1>
        <span class="brand-sub">Star Cat Monopoly</span>
      </div>

      <div class="hud" v-if="state">
        <span class="chip">第 <b class="num">{{ state.round }}</b> 回合</span>
        <span class="chip">第 <b class="num">{{ state.day }}</b> 天</span>
        <span class="chip" v-if="current">
          {{ current.name }} 行动中
        </span>
        <button class="icon-btn" title="动画速度" @click="cycleSpeed">
          {{ speedLabel }}
        </button>
        <button class="icon-btn" title="重新开局" @click="again">↺</button>
      </div>
    </header>

    <main class="stage" v-if="state">
      <aside class="side left">
        <PlayerCard
          v-for="p in state.players"
          :key="p.id"
          :player="p"
          :state="state"
          :is-turn="state.turn === p.id"
          :can-use-skill="canSkillFor(p.id)"
          @skill="store.useSkill()"
        />
      </aside>

      <section class="center">
        <Board3D
          :state="state"
          :visual-pos="store.visualPos"
          :floaters="store.floaters"
          :dice="store.dice"
          :speed="store.speed"
        />
      </section>

      <aside class="side right">
        <LogPanel :log="state.log" />
      </aside>
    </main>

    <footer class="bottom" v-if="state">
      <DicePad
        :disabled="!canRoll"
        :last-value="store.dice?.value ?? null"
        @roll="store.roll($event)"
      />
      <CardHand
        v-if="human"
        :player="human"
        :can-play="canPlayCard"
        @play="store.playCard($event)"
      />
      <button class="btn sm estate-btn" :disabled="!canOpenEstate" @click="showEstate = true">
        🏙️ 地产
      </button>
      <Transition name="fade">
        <span v-if="store.message" class="toast">{{ store.message }}</span>
      </Transition>
    </footer>

    <PromptHost
      v-if="state && current"
      :state="state"
      :player="current"
      :busy="store.busy"
      @act="store.choose($event)"
    />

    <EstatePanel
      v-if="showEstate && state && human"
      :state="state"
      :player="human"
      :disabled="store.busy"
      @act="store.choose($event)"
      @close="showEstate = false"
    />

    <SetupScreen v-if="!store.started" @start="onStart" />

    <ResultScreen
      v-if="state && store.engine && store.isOver"
      :state="state"
      :engine="store.engine"
      @again="again"
    />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.1vh, 14px);
  padding: clamp(10px, 1.6vh, 18px) clamp(12px, 1.6vw, 22px);
  max-width: 1560px;
  margin: 0 auto;
}

/* ---------- 白天的天空 ---------- */
.sky {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(120% 80% at 50% 112%, #d9f1ff 0%, transparent 62%),
    linear-gradient(180deg, #4aa0e6 0%, #79c3ef 44%, #c3e6f8 100%);
}
.sun {
  position: absolute;
  right: 8vw;
  top: 7vh;
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 36%, #fffdf0 0%, #ffe9a8 58%, #ffd45e 100%);
  box-shadow: 0 0 54px 20px rgba(255, 226, 150, 0.45), 0 0 130px 54px rgba(255, 214, 120, 0.22);
}
.cloud {
  position: absolute;
  width: 118px;
  height: 42px;
  border-radius: 999px;
  background: #ffffff;
  animation: drift 78s ease-in-out infinite alternate;
}
.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: #fff;
}
.cloud::before {
  width: 58px;
  height: 58px;
  left: 15px;
  top: -25px;
}
.cloud::after {
  width: 42px;
  height: 42px;
  right: 17px;
  top: -17px;
}
@keyframes drift {
  from {
    translate: 0 0;
  }
  to {
    translate: 46px 6px;
  }
}

/* ---------- 顶栏 ---------- */
.topbar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex: 0 0 auto;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.brand-star {
  font-size: 22px;
  color: var(--gold);
  filter: drop-shadow(0 0 8px rgba(255, 212, 59, 0.75));
  align-self: center;
}
.brand h1 {
  font-size: clamp(17px, 2vw, 23px);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #fff;
  text-shadow: 0 2px 6px rgba(20, 40, 70, 0.55), 0 1px 0 rgba(43, 33, 64, 0.4);
}
.brand-sub {
  font-size: 11px;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.72);
  text-transform: uppercase;
  align-self: center;
  text-shadow: 0 1px 4px rgba(20, 40, 70, 0.5);
}
.hud {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chip {
  padding: 6px 13px;
  border-radius: 999px;
  background: rgba(24, 34, 66, 0.42);
  border: 1.5px solid rgba(255, 255, 255, 0.26);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
.chip b {
  font-weight: 800;
  color: var(--gold);
}
.icon-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  border-radius: 11px;
  background: rgba(24, 34, 66, 0.42);
  border: 1.5px solid rgba(255, 255, 255, 0.26);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: grid;
  place-items: center;
  transition: background 0.14s ease, transform 0.14s ease;
}
.icon-btn:hover {
  background: rgba(24, 34, 66, 0.62);
  transform: translateY(-1px);
}

/* ---------- 主区 ---------- */
.stage {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 272px;
  gap: clamp(10px, 1.2vw, 18px);
}
.side {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}
.center {
  min-width: 0;
  min-height: 0;
  display: grid;
}

/* ---------- 底栏 ---------- */
.bottom {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: clamp(12px, 2vw, 28px);
  min-height: 78px;
  padding: 10px 16px;
  border-radius: var(--r-md);
  background: rgba(28, 20, 56, 0.58);
  border: 1.5px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
}
.bottom :deep(.dice-pad) {
  flex: 0 0 auto;
  min-width: 210px;
}
.estate-btn {
  flex: 0 0 auto;
  margin-left: auto;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 999px;
  background: #fff3bf;
  border: 2px solid var(--ink);
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 6px 0 rgba(43, 33, 64, 0.2);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

/* ---------- 响应式 ---------- */
@media (max-width: 1180px) {
  .stage {
    grid-template-columns: 216px minmax(0, 1fr) 226px;
  }
}
@media (max-width: 980px) {
  .stage {
    grid-template-columns: minmax(0, 1fr) 220px;
  }
  .side.left {
    grid-column: 1 / -1;
    grid-row: 2;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .side.left :deep(.pcard) {
    flex: 1 1 210px;
    min-width: 190px;
  }
  .center {
    grid-column: 1;
    grid-row: 1;
  }
  .side.right {
    grid-column: 2;
    grid-row: 1;
  }
}
@media (max-width: 760px) {
  body {
    overflow: auto;
  }
  .app {
    height: auto;
    min-height: 100%;
  }
  .stage {
    display: flex;
    flex-direction: column;
  }
  .center {
    order: 1;
  }
  .side.left {
    order: 2;
  }
  .side.right {
    order: 3;
    max-height: 170px;
  }
  .brand-sub,
  .chip:nth-child(2) {
    display: none;
  }
  .bottom {
    position: sticky;
    bottom: 0;
    z-index: 20;
  }
}
</style>
