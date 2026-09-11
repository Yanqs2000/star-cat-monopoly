<script setup lang="ts">
import { computed } from 'vue'
import { GROUPS } from '@/core/config/board'
import { ECONOMY } from '@/core/config/economy'
import { fmtMoney } from '@/core/engine/GameEngine'
import { buildCost, rentFor, sellValue } from '@/core/rules/rent'
import type { GameAction, GameState, Player } from '@/core/types'

const props = defineProps<{
  state: GameState
  player: Player
  disabled: boolean
}>()

const emit = defineEmits<{ act: [action: GameAction]; close: [] }>()

const mine = computed(() =>
  props.state.tiles
    .filter((t) => t.kind === 'property' && t.owner === props.player.id)
    .map((t) => ({
      tile: t,
      group: t.group ? GROUPS[t.group] : null,
      rent: rentFor(props.state, t.id, props.player.id),
      cost: buildCost(t),
      sale: sellValue(t),
    })),
)

const totalRent = computed(() => mine.value.reduce((a, r) => a + r.rent, 0))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="sheet">
      <h2><span class="em">🏙️</span>我的地产</h2>
      <p class="sub">
        共 {{ mine.length }} 块 · 每回合可收租 {{ fmtMoney(totalRent) }} ·
        在自己回合内随时可以加盖或变卖。
      </p>

      <div v-if="mine.length" class="list">
        <article v-for="row in mine" :key="row.tile.id" class="row">
          <span class="band" :style="{ background: row.group?.color }" />
          <div class="body">
            <div class="top">
              <span class="name">{{ row.tile.name }}</span>
              <span class="stars">
                <span
                  v-for="i in ECONOMY.MAX_LEVEL"
                  :key="i"
                  :class="{ dim: i > row.tile.level }"
                  >★</span
                >
              </span>
            </div>
            <div class="meta">
              <span>租金 <b class="num">{{ fmtMoney(row.rent) }}</b></span>
              <span>卖价 <b class="num">{{ fmtMoney(row.sale) }}</b></span>
            </div>
          </div>

          <div class="acts">
            <button
              class="btn sm primary"
              :disabled="disabled || row.tile.level >= ECONOMY.MAX_LEVEL || player.cash < row.cost"
              @click="emit('act', { type: 'BUILD', tileId: row.tile.id })"
            >
              {{ row.tile.level >= ECONOMY.MAX_LEVEL ? '满级' : `加盖 ${fmtMoney(row.cost)}` }}
            </button>
            <button
              class="btn sm danger"
              :disabled="disabled"
              @click="emit('act', { type: 'SELL', tileId: row.tile.id })"
            >
              卖出
            </button>
          </div>
        </article>
      </div>

      <p v-else class="empty">你还没有地产，先去踩几块无主地吧。</p>

      <div class="sheet-actions">
        <button class="btn ghost" @click="emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 46vh;
  overflow-y: auto;
  padding-right: 4px;
}
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 16px;
  border-radius: var(--r-md);
  background: #fff;
  border: 2.5px solid var(--ink);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.16);
  overflow: hidden;
}
.band {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
}
.body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name {
  font-size: 13px;
  font-weight: 800;
}
.stars {
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--gold);
  text-shadow: 0 1px 0 rgba(43, 33, 64, 0.2);
}
.stars .dim {
  color: var(--ink-faint);
  text-shadow: none;
}
.meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-soft);
}
.meta b {
  color: var(--ink);
  font-weight: 800;
}
.acts {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 0 0 auto;
}
.empty {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-soft);
  padding: 12px 0;
}
</style>
