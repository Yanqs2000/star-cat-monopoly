<script setup lang="ts">
import { ref } from 'vue'
import { ECONOMY } from '@/core/config/economy'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { Player } from '@/core/types'

const props = defineProps<{ player: Player }>()
const emit = defineEmits<{ draw: [count: number] }>()

const count = ref(10)

const PRIZES = [
  { label: '头奖', odds: '2%', amount: ECONOMY.LOTTERY_BASE_POOL },
  { label: '二等奖', odds: '10%', amount: 5_000 },
  { label: '三等奖', odds: '23%', amount: 1_000 },
]
</script>

<template>
  <section class="lottery">
    <div class="pool">
      <span class="k">奖池</span>
      <b class="num">{{ fmtMoney(ECONOMY.LOTTERY_BASE_POOL) }}</b>
    </div>

    <ul class="prizes">
      <li v-for="p in PRIZES" :key="p.label">
        <span>{{ p.label }}</span>
        <span class="odds num">{{ p.odds }}</span>
        <b class="num">{{ fmtMoney(p.amount) }}</b>
      </li>
    </ul>

    <p class="hint">当前持有 <b class="num">{{ props.player.tickets }}</b> 张奖券。</p>

    <div class="row">
      <input v-model.number="count" class="input num" type="number" min="1" step="10" />
      <button
        class="btn primary"
        :disabled="count <= 0 || props.player.tickets < count"
        @click="emit('draw', count)"
      >
        刮 {{ count }} 张
      </button>
    </div>
  </section>
</template>

<style scoped>
.lottery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pool {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 10px 13px;
  border-radius: var(--r-sm);
  background: linear-gradient(180deg, #fff8dc, #ffeaa7);
  border: 2px solid var(--ink);
}
.pool .k {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--ink-soft);
}
.pool b {
  font-size: 16px;
  font-weight: 900;
}
.prizes {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.prizes li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 6px 11px;
  border-radius: 8px;
  background: #fff;
  border: 2px solid var(--hair);
  font-size: 12px;
  font-weight: 700;
}
.odds {
  color: var(--ink-soft);
  font-size: 11px;
}
.prizes b {
  color: var(--up);
}
.hint {
  font-size: 11.5px;
  color: var(--ink-soft);
  font-weight: 600;
}
.hint b {
  color: var(--ink);
}
.row {
  display: flex;
  gap: 8px;
}
.input {
  width: 100px;
  padding: 9px 11px;
  border-radius: 10px;
  border: 2px solid var(--ink);
  background: #fff;
  font-size: 13px;
  font-weight: 800;
}
</style>
