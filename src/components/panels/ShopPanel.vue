<script setup lang="ts">
import { computed } from 'vue'
import { CARDS } from '@/core/config/cards'
import { ECONOMY } from '@/core/config/economy'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { CardId, Player } from '@/core/types'

const props = defineProps<{ player: Player }>()
const emit = defineEmits<{ buy: [cardId: CardId] }>()

const full = computed(() => props.player.cards.length >= ECONOMY.MAX_CARDS)
</script>

<template>
  <section class="shop">
    <p class="hint">
      手牌 {{ props.player.cards.length }} / {{ ECONOMY.MAX_CARDS }}。买下的卡片会进入手牌，随时可以打出。
    </p>

    <div class="grid">
      <button
        v-for="card in CARDS"
        :key="card.id"
        class="card"
        :disabled="full || props.player.cash < card.price"
        @click="emit('buy', card.id)"
      >
        <span class="ico">{{ card.icon }}</span>
        <span class="body">
          <span class="name">{{ card.name }}</span>
          <span class="desc">{{ card.desc }}</span>
        </span>
        <span class="price num">{{ fmtMoney(card.price) }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.shop {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hint {
  font-size: 11.5px;
  color: var(--ink-soft);
  font-weight: 600;
}
.grid {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 260px;
  overflow-y: auto;
}
.card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: var(--r-sm);
  background: #fff;
  border: 2px solid var(--ink);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.14);
  text-align: left;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.card:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 0 rgba(43, 33, 64, 0.14);
}
.card:disabled {
  opacity: 0.45;
  filter: grayscale(0.6);
  cursor: not-allowed;
}
.ico {
  font-size: 22px;
  width: 30px;
  text-align: center;
  flex: 0 0 auto;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}
.name {
  font-size: 12.5px;
  font-weight: 800;
}
.desc {
  font-size: 10.5px;
  color: var(--ink-soft);
  font-weight: 600;
  line-height: 1.45;
}
.price {
  font-size: 12px;
  font-weight: 800;
  color: var(--up);
  flex: 0 0 auto;
}
</style>
