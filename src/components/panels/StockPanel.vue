<script setup lang="ts">
import { computed, ref } from 'vue'
import { STOCKS } from '@/core/config/stocks'
import { fmtMoney } from '@/core/engine/GameEngine'
import { buyCost, formatChange, sellProceeds } from '@/core/rules/stock'
import type { GameState, Player, StockSymbol } from '@/core/types'

const props = defineProps<{ state: GameState; player: Player }>()
const emit = defineEmits<{
  buy: [symbol: StockSymbol, shares: number]
  sell: [symbol: StockSymbol, shares: number]
}>()

const selected = ref<StockSymbol>(STOCKS[0]!.symbol)
const shares = ref(100)

const rows = computed(() =>
  STOCKS.map((def) => {
    const st = props.state.stocks[def.symbol]!
    return {
      def,
      price: st.price,
      change: st.prevPrice === 0 ? 0 : (st.price - st.prevPrice) / st.prevPrice,
      owned: props.player.shares[def.symbol] ?? 0,
      vsBase: st.price / def.basePrice,
    }
  }),
)

const current = computed(() => rows.value.find((r) => r.def.symbol === selected.value) ?? rows.value[0]!)
const cost = computed(() => buyCost(shares.value, current.value.price))
const proceeds = computed(() => sellProceeds(shares.value, current.value.price))
</script>

<template>
  <section class="stock">
    <p class="hint">
      股票<b>只能用现金交易</b>；现金不够会被强制从存款里扣，并损失未结利息。
    </p>

    <div class="table">
      <div
        v-for="row in rows"
        :key="row.def.symbol"
        class="line"
        :class="{ sel: row.def.symbol === selected }"
        @click="selected = row.def.symbol"
      >
        <span class="nm">{{ row.def.name }}</span>
        <span class="px num">{{ row.price.toFixed(2) }}</span>
        <span class="ch num" :class="row.change >= 0 ? 'up' : 'down'">
          {{ formatChange(row.change) }}
        </span>
        <span class="own num">{{ row.owned }} 股</span>
      </div>
    </div>

    <div class="trade">
      <label class="shares">
        股数
        <input v-model.number="shares" class="input num" type="number" min="1" step="10" />
      </label>
      <button class="btn primary" :disabled="cost <= 0" @click="emit('buy', selected, shares)">
        买入 <small class="num">{{ fmtMoney(cost) }}</small>
      </button>
      <button
        class="btn"
        :disabled="proceeds <= 0 || current.owned <= 0"
        @click="emit('sell', selected, shares)"
      >
        卖出 <small class="num">{{ fmtMoney(proceeds) }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.stock {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.table {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 190px;
  overflow-y: auto;
}
.line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 10px;
  align-items: center;
  padding: 7px 10px;
  border-radius: 9px;
  background: #fff;
  border: 2px solid var(--hair);
  cursor: pointer;
  transition: border-color 0.14s ease, background 0.14s ease;
}
.line.sel {
  border-color: var(--ink);
  background: #fff8e6;
}
.nm {
  font-size: 12.5px;
  font-weight: 800;
}
.px {
  font-size: 12.5px;
  font-weight: 800;
}
.ch {
  font-size: 11px;
  font-weight: 800;
  min-width: 56px;
  text-align: right;
}
.up {
  color: var(--up);
}
.down {
  color: var(--down);
}
.own {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ink-soft);
  min-width: 52px;
  text-align: right;
}

.trade {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.shares {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--ink-soft);
}
.input {
  width: 92px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 2px solid var(--ink);
  background: #fff;
  font-size: 13px;
  font-weight: 800;
}
.btn small {
  font-size: 10.5px;
  opacity: 0.75;
}
</style>
