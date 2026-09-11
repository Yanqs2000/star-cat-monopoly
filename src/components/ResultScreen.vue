<script setup lang="ts">
import { computed } from 'vue'
import { catSvg } from '@/assets/catSvg'
import { getCharacter } from '@/core/config/characters'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { GameEngine } from '@/core/engine/GameEngine'
import type { GameState } from '@/core/types'

const props = defineProps<{
  state: GameState
  engine: GameEngine
}>()

const emit = defineEmits<{ again: [] }>()

const REASON: Record<string, string> = {
  bankruptcy: '最后一位幸存者',
  monopoly: '垄断胜利',
  laps: '长跑胜利',
  wealth: '财富结算',
}

const ranking = computed(() => props.engine.ranking(props.state))
const winner = computed(() => props.state.players[props.state.winner ?? 0])
</script>

<template>
  <div class="overlay">
    <div class="sheet">
      <h2><span class="em">🏆</span>星猫城结算</h2>
      <p class="sub">
        {{ winner?.name }} 获胜 · {{ REASON[state.winReason ?? 'wealth'] }} · 共 {{ state.round }} 回合
      </p>

      <ol class="rank">
        <li
          v-for="row in ranking"
          :key="row.player.id"
          class="row"
          :class="{ first: row.rank === 1 }"
        >
          <span class="rk">{{ ['🥇', '🥈', '🥉', '4️⃣'][row.rank - 1] ?? row.rank }}</span>
          <span class="av" v-html="catSvg(getCharacter(row.player.characterId))" />
          <span class="body">
            <span class="nm">
              {{ row.player.name }}
              <span v-if="!row.player.isAI" class="me">你</span>
              <span v-if="row.player.out" class="out">已出局</span>
            </span>
            <span class="meta">
              现金 {{ fmtMoney(row.player.cash) }} · 存款 {{ fmtMoney(row.player.deposit) }}
            </span>
          </span>
          <span class="total num">{{ fmtMoney(row.netWorth) }}</span>
        </li>
      </ol>

      <div class="sheet-actions">
        <button class="btn primary" @click="emit('again')">再来一局</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rank {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 13px;
  border-radius: var(--r-md);
  background: #fff;
  border: 2.5px solid var(--ink);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.16);
}
.row.first {
  background: linear-gradient(180deg, #fff8dc, #ffeaa7);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.16), 0 0 0 3px var(--gold);
}
.rk {
  font-size: 17px;
  font-weight: 800;
  width: 24px;
  text-align: center;
}
.av :deep(svg) {
  width: 34px;
  height: 34px;
  display: block;
}
.av {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 11px;
  background: #f6f1ff;
  border: 2px solid var(--ink);
  display: grid;
  place-items: center;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.nm {
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
}
.me {
  font-size: 9.5px;
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--gold);
  border: 1.5px solid var(--ink);
}
.out {
  font-size: 9.5px;
  color: var(--down);
}
.meta {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ink-soft);
}
.total {
  margin-left: auto;
  font-size: 14px;
  font-weight: 900;
}
</style>
