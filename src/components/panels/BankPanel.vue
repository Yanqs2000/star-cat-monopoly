<script setup lang="ts">
import { computed, ref } from 'vue'
import { ECONOMY } from '@/core/config/economy'
import { fmtMoney } from '@/core/engine/GameEngine'
import { accruedInterest } from '@/core/rules/bank'
import type { GameState, Player } from '@/core/types'

const props = defineProps<{ state: GameState; player: Player }>()
const emit = defineEmits<{ deposit: [amount: number]; withdraw: [amount: number] }>()

const amount = ref(10_000)
const interest = computed(() => accruedInterest(props.player, props.state.day))
const maxDeposit = computed(() => props.player.cash)
const maxWithdraw = computed(() => props.player.deposit + interest.value)
</script>

<template>
  <section class="bank">
    <div class="stats">
      <div class="stat">
        <span class="k">现金</span>
        <b class="num">{{ fmtMoney(player.cash) }}</b>
      </div>
      <div class="stat">
        <span class="k">存款</span>
        <b class="num">{{ fmtMoney(player.deposit) }}</b>
      </div>
      <div class="stat">
        <span class="k">未结利息</span>
        <b class="num up">+{{ fmtMoney(interest) }}</b>
      </div>
    </div>

    <p class="hint">
      利息按<b>存放天数</b>结算（当前日利率
      {{ (ECONOMY.INTEREST_RATE * 100).toFixed(1) }}%）。急用钱时会强制支取存款，但那会损失未结利息。
    </p>

    <div class="row">
      <input
        v-model.number="amount"
        class="input num"
        type="number"
        min="0"
        step="1000"
        aria-label="存取金额"
      />
      <button class="btn sm" @click="amount = maxDeposit">全部现金</button>
      <button class="btn sm" @click="amount = maxWithdraw">全部存款</button>
    </div>

    <div class="row">
      <button
        class="btn primary"
        :disabled="amount <= 0 || maxDeposit <= 0"
        @click="emit('deposit', amount)"
      >
        存入
      </button>
      <button
        class="btn"
        :disabled="amount <= 0 || maxWithdraw <= 0"
        @click="emit('withdraw', amount)"
      >
        取出
      </button>
    </div>
  </section>
</template>

<style scoped>
.bank {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat {
  padding: 9px 10px;
  border-radius: var(--r-sm);
  background: #fff;
  border: 2px solid var(--ink);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat .k {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ink-soft);
}
.stat b {
  font-size: 13px;
  font-weight: 800;
}
.up {
  color: var(--up);
}
.hint {
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--ink-soft);
  font-weight: 600;
}
.hint b {
  color: var(--ink);
}
.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.input {
  flex: 1 1 120px;
  min-width: 100px;
  padding: 9px 11px;
  border-radius: 10px;
  border: 2px solid var(--ink);
  background: #fff;
  font-size: 13px;
  font-weight: 800;
}
</style>
