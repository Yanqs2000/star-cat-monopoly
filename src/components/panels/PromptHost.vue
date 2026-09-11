<script setup lang="ts">
import { computed } from 'vue'
import { GROUPS } from '@/core/config/board'
import { ECONOMY } from '@/core/config/economy'
import { fmtMoney } from '@/core/engine/GameEngine'
import { baseRent, buildCost, rentFor, sellValue } from '@/core/rules/rent'
import type { CardId, GameAction, GameState, Player, PlayerId, TileId } from '@/core/types'
import ArcadeGame from './ArcadeGame.vue'
import BankPanel from './BankPanel.vue'
import LotteryPanel from './LotteryPanel.vue'
import ShopPanel from './ShopPanel.vue'
import StockPanel from './StockPanel.vue'

const props = defineProps<{
  state: GameState
  player: Player
  busy: boolean
}>()

const emit = defineEmits<{ act: [action: GameAction] }>()

const pending = computed(() => props.state.pending)

/** 只有轮到人类玩家时才弹出决策面板 */
const visible = computed(
  () => !props.player.isAI && props.state.phase === 'decide' && pending.value !== null,
)

const tile = computed(() => {
  const p = pending.value
  if (!p) return null
  if ('tileId' in p && p.tileId !== undefined) return props.state.tiles[p.tileId] ?? null
  return props.state.tiles[props.player.pos] ?? null
})

const facilityKind = computed(() => {
  const p = pending.value
  if (p?.kind !== 'facility') return null
  return props.state.tiles[p.tileId]?.kind ?? null
})

const buyPrice = computed(() => (pending.value?.kind === 'buy' ? pending.value.price : 0))
const canAfford = computed(
  () => props.player.cash + props.player.deposit >= buyPrice.value,
)

const upgradeCost = computed(() => (tile.value ? buildCost(tile.value) : 0))
const canUpgrade = computed(
  () =>
    !!tile.value &&
    tile.value.level < ECONOMY.MAX_LEVEL &&
    props.player.cash + props.player.deposit >= upgradeCost.value,
)
const saleValue = computed(() => (tile.value ? sellValue(tile.value) : 0))

const groupName = computed(() =>
  tile.value?.group ? GROUPS[tile.value.group]?.name ?? tile.value.group : '',
)
const groupColor = computed(() =>
  tile.value?.group ? GROUPS[tile.value.group]?.color ?? '#ccc' : '#ccc',
)

const rentPreview = computed(() => {
  if (!tile.value) return 0
  return rentFor(props.state, tile.value.id, props.player.id)
})

const title = computed(() => {
  const p = pending.value
  if (!p) return ''
  switch (p.kind) {
    case 'buy':
      return `${tile.value?.name ?? ''} · 无人认领`
    case 'manage':
      return `${tile.value?.name ?? ''} · 你的地盘`
    case 'facility':
      return tile.value?.name ?? ''
    case 'card-target':
      return '选择目标格子'
    case 'card-target-player':
      return '选择目标对手'
    case 'arcade':
      return '游乐场 · 接住财富'
  }
})

function act(action: GameAction) {
  emit('act', action)
}

function pickTile(id: TileId) {
  act({ type: 'PICK_TARGET', tileId: id })
}
function pickPlayer(id: PlayerId) {
  act({ type: 'PICK_TARGET', playerId: id })
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="visible" class="overlay">
      <div class="sheet">
        <h2>
          <span class="em">
            {{
              pending?.kind === 'buy'
                ? '🏠'
                : pending?.kind === 'manage'
                  ? '🏗️'
                  : pending?.kind === 'arcade'
                    ? '🎡'
                    : pending?.kind.startsWith('card')
                      ? '🃏'
                      : '🏛️'
            }}
          </span>
          {{ title }}
        </h2>

        <!-- ---------- 买地 ---------- -->
        <template v-if="pending?.kind === 'buy' && tile">
          <div class="detail">
            <div class="drow">
              <span>色组</span>
              <span class="group">
                <i :style="{ background: groupColor }" />{{ groupName }}
              </span>
            </div>
            <div class="drow"><span>地价</span><span class="num">{{ fmtMoney(tile.price) }}</span></div>
            <div class="drow"><span>基础租金</span><span class="num">{{ fmtMoney(baseRent(tile)) }}</span></div>
            <div class="drow"><span>满级租金</span>
              <span class="num">{{ fmtMoney(tile.price * ECONOMY.RENT_RATE * ECONOMY.LEVEL_MULTIPLIER[ECONOMY.MAX_LEVEL]!) }}</span>
            </div>
            <div class="drow"><span>你的现金</span><span class="num">{{ fmtMoney(player.cash) }}</span></div>
            <div class="drow"><span>你的存款</span><span class="num">{{ fmtMoney(player.deposit) }}</span></div>
          </div>

          <div class="sheet-actions">
            <button class="btn ghost" @click="act({ type: 'DECLINE' })">不买</button>
            <button
              class="btn primary"
              :disabled="!canAfford || busy"
              @click="act({ type: 'BUY' })"
            >
              买下 <small class="num">{{ fmtMoney(buyPrice) }}</small>
            </button>
          </div>
        </template>

        <!-- ---------- 自己的地产 ---------- -->
        <template v-else-if="pending?.kind === 'manage' && tile">
          <div class="detail">
            <div class="drow"><span>当前等级</span><span class="num">{{ tile.level }} / {{ ECONOMY.MAX_LEVEL }}</span></div>
            <div class="drow"><span>当前租金</span><span class="num">{{ fmtMoney(rentPreview) }}</span></div>
            <div class="drow"><span>盖房费用</span><span class="num">{{ fmtMoney(upgradeCost) }}</span></div>
            <div class="drow"><span>卖地可得</span><span class="num">{{ fmtMoney(saleValue) }}</span></div>
          </div>

          <div class="sheet-actions">
            <button class="btn ghost" @click="act({ type: 'END_TURN' })">结束回合</button>
            <button
              class="btn danger"
              :disabled="busy"
              @click="act({ type: 'SELL', tileId: tile.id })"
            >
              卖地
            </button>
            <button
              class="btn primary"
              :disabled="!canUpgrade || busy"
              @click="act({ type: 'BUILD', tileId: tile.id })"
            >
              {{ tile.level >= ECONOMY.MAX_LEVEL ? '已满级' : `升级到 ${tile.level + 1} 级` }}
              <small v-if="tile.level < ECONOMY.MAX_LEVEL" class="num">{{ fmtMoney(upgradeCost) }}</small>
            </button>
          </div>
        </template>

        <!-- ---------- 设施 ---------- -->
        <template v-else-if="pending?.kind === 'facility'">
          <BankPanel
            v-if="facilityKind === 'bank'"
            :state="state"
            :player="player"
            @deposit="(a) => act({ type: 'DEPOSIT', amount: a })"
            @withdraw="(a) => act({ type: 'WITHDRAW', amount: a })"
          />
          <StockPanel
            v-else-if="facilityKind === 'stock'"
            :state="state"
            :player="player"
            @buy="(s, n) => act({ type: 'BUY_STOCK', symbol: s, shares: n })"
            @sell="(s, n) => act({ type: 'SELL_STOCK', symbol: s, shares: n })"
          />
          <LotteryPanel
            v-else-if="facilityKind === 'lottery'"
            :player="player"
            @draw="(n) => act({ type: 'BUY_LOTTERY', count: n })"
          />
          <ShopPanel
            v-else-if="facilityKind === 'shop'"
            :player="player"
            @buy="(id: CardId) => act({ type: 'BUY_CARD', cardId: id })"
          />

          <div class="sheet-actions">
            <button class="btn ghost" @click="act({ type: 'END_TURN' })">离开</button>
          </div>
        </template>

        <!-- ---------- 卡片选目标 ---------- -->
        <template v-else-if="pending?.kind === 'card-target'">
          <div class="picks">
            <button
              v-for="id in pending.options"
              :key="id"
              class="pick"
              @click="pickTile(id)"
            >
              {{ state.tiles[id]?.name }}
              <small v-if="state.tiles[id]?.owner !== null">
                （{{ state.players[state.tiles[id]!.owner!]?.name }}）
              </small>
            </button>
          </div>
        </template>

        <template v-else-if="pending?.kind === 'card-target-player'">
          <div class="picks">
            <button
              v-for="id in pending.options"
              :key="id"
              class="pick"
              @click="pickPlayer(id)"
            >
              {{ state.players[id]?.name }}
              <small class="num">{{ fmtMoney(state.players[id]?.cash ?? 0) }}</small>
            </button>
          </div>
        </template>

        <!-- ---------- 游乐场 ---------- -->
        <template v-else-if="pending?.kind === 'arcade'">
          <ArcadeGame
            :character-id="player.characterId"
            @finish="(s) => act({ type: 'ARCADE_RESULT', score: s })"
          />
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.drow {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  font-weight: 700;
}
.drow > span:first-child {
  color: var(--ink-soft);
}
.group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.group i {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border: 2px solid var(--ink);
}

.picks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}
.pick {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  border-radius: var(--r-sm);
  background: #fff;
  border: 2px solid var(--ink);
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.14);
  font-size: 12.5px;
  font-weight: 800;
  text-align: left;
  transition: transform 0.12s ease;
}
.pick:hover {
  transform: translateY(-1px);
}
.pick small {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ink-soft);
}

.btn small {
  font-size: 10.5px;
  opacity: 0.75;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.18s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
</style>
