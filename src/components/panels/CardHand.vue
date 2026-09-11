<script setup lang="ts">
import { computed } from 'vue'
import { getCard } from '@/core/config/cards'
import type { CardId, Player } from '@/core/types'

const props = defineProps<{
  player: Player
  canPlay: boolean
}>()

const emit = defineEmits<{ play: [cardId: CardId] }>()

const cards = computed(() => props.player.cards.map((id) => ({ id, def: getCard(id) })))
</script>

<template>
  <div class="hand">
    <span class="label">手牌</span>
    <div v-if="cards.length" class="list">
      <button
        v-for="(c, i) in cards"
        :key="`${c.id}-${i}`"
        class="card"
        :disabled="!canPlay"
        :title="c.def.desc"
        @click="emit('play', c.id)"
      >
        <span class="ico">{{ c.def.icon }}</span>
        <span class="name">{{ c.def.name }}</span>
      </button>
    </div>
    <span v-else class="empty">还没有卡片</span>
  </div>
</template>

<style scoped>
.hand {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  overflow: hidden;
}
.label {
  font-size: 11px;
  font-weight: 800;
  color: var(--ink-soft);
  flex: 0 0 auto;
}
.list {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.card {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 10px;
  background: #fff;
  border: 2px solid var(--ink);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.16);
  font-size: 11.5px;
  font-weight: 800;
  white-space: nowrap;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 rgba(43, 33, 64, 0.16);
}
.card:disabled {
  opacity: 0.45;
  filter: grayscale(0.6);
  cursor: not-allowed;
}
.ico {
  font-size: 15px;
}
.empty {
  font-size: 11.5px;
  color: var(--ink-faint);
  font-weight: 700;
}
</style>
