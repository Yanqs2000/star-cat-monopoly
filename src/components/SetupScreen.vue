<script setup lang="ts">
import { computed, ref } from 'vue'
import { catSvg } from '@/assets/catSvg'
import { CHARACTERS } from '@/core/config/characters'
import { ECONOMY } from '@/core/config/economy'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { CharacterId, WinReason } from '@/core/types'

const emit = defineEmits<{
  start: [payload: { myCharacter: CharacterId; opponents: CharacterId[]; winCondition: WinReason }]
}>()

const selected = ref<CharacterId>(CHARACTERS[0]!.id)
const winCondition = ref<WinReason>('bankruptcy')

const selectedDef = computed(() => CHARACTERS.find((c) => c.id === selected.value)!)

const WIN_LABELS: Record<WinReason, { label: string; desc: string }> = {
  bankruptcy: { label: '淘汰制', desc: '让对手全部破产，最后一位幸存者获胜' },
  monopoly: { label: '垄断制', desc: '率先集齐 3 个完整色组即获胜' },
  laps: { label: '长跑制', desc: '率先绕场跑满 10 圈即获胜' },
  wealth: { label: '财富制', desc: '打到回合上限后按总资产排名' },
}

function start() {
  const others = CHARACTERS.filter((c) => c.id !== selected.value).map((c) => c.id)
  // 取接下来的 3 只作为 AI 对手
  emit('start', {
    myCharacter: selected.value,
    opponents: others.slice(0, 3),
    winCondition: winCondition.value,
  })
}
</script>

<template>
  <div class="overlay">
    <div class="sheet">
      <h2><span class="em">🐱</span>选择你的星猫</h2>
      <p class="sub">
        12 只星座猫各有绝技。开局资金 {{ fmtMoney(ECONOMY.START_CASH) }}、
        存款 {{ fmtMoney(ECONOMY.START_DEPOSIT) }}、
        {{ ECONOMY.START_SHARES }} 股股票、{{ ECONOMY.START_TICKETS }} 张奖券。
      </p>

      <div class="grid">
        <button
          v-for="c in CHARACTERS"
          :key="c.id"
          class="cat"
          :class="{ sel: c.id === selected }"
          :style="{ '--c': c.color, '--t': c.tint }"
          @click="selected = c.id"
        >
          <span class="av" v-html="catSvg(c)" />
          <span class="body">
            <span class="nm">{{ c.name }}</span>
            <span class="zod">{{ c.zodiac }}</span>
            <span class="sk">{{ c.skill.icon }} {{ c.skill.name }}</span>
            <span class="desc">{{ c.skill.desc }}</span>
          </span>
        </button>
      </div>

      <h3 class="wc-title">胜利条件</h3>
      <div class="wc">
        <button
          v-for="(meta, key) in WIN_LABELS"
          :key="key"
          class="wc-btn"
          :class="{ sel: key === winCondition }"
          @click="winCondition = key as WinReason"
        >
          <b>{{ meta.label }}</b>
          <span>{{ meta.desc }}</span>
        </button>
      </div>

      <div class="sheet-actions">
        <button class="btn primary" @click="start">
          用 {{ selectedDef.name }} 开局
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}
.cat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 9px 7px;
  border-radius: var(--r-md);
  background: #fff;
  border: 2.5px solid var(--ink);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.16);
  text-align: center;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.2s ease;
}
.cat:hover {
  transform: translateY(-2px);
}
.cat.sel {
  background: var(--t);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.16), 0 0 0 3px var(--c);
}
.av :deep(svg) {
  width: 44px;
  height: 44px;
  display: block;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.nm {
  font-size: 12.5px;
  font-weight: 800;
}
.zod {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--ink-soft);
}
.sk {
  font-size: 10.5px;
  font-weight: 800;
  color: var(--c);
  margin-top: 2px;
}
.desc {
  font-size: 9.5px;
  font-weight: 600;
  color: var(--ink-soft);
  line-height: 1.35;
}

.wc-title {
  font-size: 13px;
  font-weight: 800;
  margin: 18px 0 8px;
}
.wc {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
}
.wc-btn {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  border-radius: var(--r-sm);
  background: #fff;
  border: 2px solid var(--hair);
  text-align: left;
  transition: border-color 0.14s ease, background 0.14s ease;
}
.wc-btn b {
  font-size: 12.5px;
  font-weight: 800;
}
.wc-btn span {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ink-soft);
  line-height: 1.4;
}
.wc-btn.sel {
  border-color: var(--ink);
  background: #fff8e6;
}
</style>
