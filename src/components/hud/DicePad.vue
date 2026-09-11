<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CHARGE_DURATION_MS, TAP_MS, powerLabel, rollDistribution } from '@/core/dice'

const props = defineProps<{
  disabled: boolean
  lastValue: number | null
}>()

const emit = defineEmits<{ roll: [power: number] }>()

const charging = ref(false)
const power = ref(0)
const tapping = ref(false)

let startAt = 0
let raf = 0

const dist = computed(() => rollDistribution(power.value))
const label = computed(() => powerLabel(power.value))
const percent = computed(() => Math.round(power.value * 100))

function tick(now: number) {
  power.value = Math.min(1, (now - startAt) / CHARGE_DURATION_MS)
  raf = requestAnimationFrame(tick)
}

function start() {
  if (props.disabled || charging.value) return
  startAt = performance.now()
  charging.value = true
  tapping.value = false
  power.value = 0
  raf = requestAnimationFrame(tick)
}

function commit() {
  if (!charging.value) return
  const elapsed = performance.now() - startAt
  cancelAnimationFrame(raf)
  charging.value = false

  if (elapsed < TAP_MS) {
    tapping.value = true
    power.value = 0.05
  }
  const finalPower = elapsed < TAP_MS ? 0.05 : power.value
  emit('roll', finalPower)
  setTimeout(() => {
    power.value = 0
    tapping.value = false
  }, 260)
}

function cancel() {
  if (!charging.value) return
  cancelAnimationFrame(raf)
  charging.value = false
  power.value = 0
}

/* 键盘：空格蓄力，松开掷出 */
function onKeyDown(e: KeyboardEvent) {
  if (e.code !== 'Space' || e.repeat) return
  if (props.disabled) return
  e.preventDefault()
  start()
}
function onKeyUp(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  e.preventDefault()
  commit()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="dice-pad" :class="{ disabled }">
    <button
      class="die"
      :class="{ charging, tapping }"
      :disabled="disabled"
      :aria-label="disabled ? '等待对手行动' : '按住蓄力，松开掷骰'"
      @pointerdown="start"
      @pointerup="commit"
      @pointerleave="cancel"
      @pointercancel="cancel"
    >
      <span class="face num">{{ lastValue ?? '?' }}</span>
      <span class="ripple" :style="{ transform: `scale(${0.6 + power * 0.7})` }" />
    </button>

    <div class="meter">
      <div class="meter-head">
        <span class="lbl">{{ charging ? label : disabled ? '等待中' : '按住蓄力 / 空格' }}</span>
        <span class="pct num">{{ charging ? `${percent}%` : '' }}</span>
      </div>

      <div class="bar">
        <div class="fill" :style="{ width: `${percent}%` }" />
        <span class="tick t20" /><span class="tick t40" /><span class="tick t60" />
        <span class="tick t80" />
      </div>

      <div class="dist" aria-hidden="true">
        <span
          v-for="(w, i) in dist"
          :key="i"
          class="col"
          :style="{ height: `${Math.max(6, w * 100)}%` }"
          :title="`P(${i + 1}) = ${(w * 100).toFixed(0)}%`"
        >
          <i>{{ i + 1 }}</i>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dice-pad {
  display: flex;
  align-items: center;
  gap: 14px;
}
.dice-pad.disabled {
  opacity: 0.7;
}

.die {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 15px;
  background: linear-gradient(160deg, #ffffff, #efe7ff);
  border: 3px solid var(--ink);
  box-shadow: 0 6px 0 rgba(43, 33, 64, 0.26);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  overflow: visible;
}
.die:not(:disabled):active,
.die.charging {
  transform: translateY(3px);
  box-shadow: 0 2px 0 rgba(43, 33, 64, 0.26);
}
.die.tapping {
  animation: land 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes land {
  0% {
    transform: scale(1.18) rotate(-6deg);
  }
  100% {
    transform: scale(1);
  }
}

.face {
  font-size: 24px;
  font-weight: 900;
  color: var(--ink);
  line-height: 1;
}

.ripple {
  position: absolute;
  inset: -6px;
  border-radius: 18px;
  border: 3px solid var(--gold);
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.die.charging .ripple {
  opacity: 0.85;
}

.meter {
  flex: 1 1 auto;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.meter-head {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 800;
  color: var(--ink-soft);
}
.bar {
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: rgba(43, 33, 64, 0.14);
  border: 2px solid var(--ink);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #74c0fc, #ffd43b 55%, #ff8787);
  transition: width 0.05s linear;
}
.tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1.5px;
  background: rgba(43, 33, 64, 0.3);
}
.t20 {
  left: 20%;
}
.t40 {
  left: 40%;
}
.t60 {
  left: 60%;
}
.t80 {
  left: 80%;
}

.dist {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 34px;
  padding-top: 2px;
}
.col {
  position: relative;
  flex: 1 1 0;
  min-height: 6px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(180deg, #b197fc, #7c3aed);
  transition: height 0.12s ease;
  display: flex;
  justify-content: center;
}
.col i {
  position: absolute;
  bottom: -14px;
  font-size: 9px;
  font-style: normal;
  font-weight: 800;
  color: var(--ink-faint);
}
</style>
