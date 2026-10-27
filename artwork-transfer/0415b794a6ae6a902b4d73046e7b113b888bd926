<script setup lang="ts">
import { computed } from 'vue'
import mapJson from '../../data/map.json'
import type { Parcel } from '../map/types'
import type { GameState } from './types'

const props = defineProps<{ game: GameState; paused: boolean }>()
const emit = defineEmits<{ decide: [choice: 'accept' | 'decline']; acknowledge: [] }>()
const offer = computed(() => props.game.propertyOffer)
const parcel = computed(() => (mapJson.parcels as Parcel[]).find(item => item.id === offer.value?.parcelId))
const player = computed(() => props.game.players[props.game.activePlayerIndex]!)
const owner = computed(() => props.game.players.find(item => item.id === props.game.properties[offer.value?.parcelId ?? -1]?.ownerId))
const level = computed(() => props.game.properties[offer.value?.parcelId ?? -1]?.level ?? 0)
const event = computed(() => props.game.lastPropertyEvent)
const title = computed(() => ({ purchase: '购买住宅地', upgrade: '升级建筑', rent: '支付租金', 'max-level': '建筑已满级' })[offer.value?.kind ?? 'purchase'])
const result = computed(() => {
  const current = event.value
  if (!current) return ''
  return ({
    purchased: `购买成功，现金支付 ${current.amount}`,
    upgraded: `升级至 ${current.level} 级，现金支付 ${current.amount}`,
    'upgrade-failed': `升级失败，现金支付 ${current.amount}，建筑仍为 ${current.level} 级`,
    'rent-paid': `已支付租金 ${current.amount}，地主存款增加 ${current.amount}`,
    declined: '已放弃本次交易，资金与产权不变',
    'insufficient-cash': `现金不足，需现金 ${current.amount}；存款不可用于购买或升级`,
    'max-level': '已达 5 级，本次不收费',
  })[current.kind]
})
</script>

<template>
  <section v-if="offer && parcel && player.controller === 'human'" class="property-panel" role="dialog" aria-label="地产交易" data-testid="property-panel">
    <span class="eyebrow">当前地块 · {{ parcel.streetName }}</span>
    <h2>{{ title }}</h2>
    <p class="location">地块 {{ parcel.id }} · 道路 {{ parcel.roadCell.column }},{{ parcel.roadCell.row }} · 地价 {{ parcel.basePrice }}</p>
    <p>产权：{{ owner?.name ?? '无人' }} · 建筑等级 {{ level }}/5</p>
    <p class="balances">{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }}</p>
    <template v-if="game.phase === 'property-decision'">
      <p v-if="offer.kind === 'rent'" class="amount">必须支付租金 {{ offer.amount }}；先扣现金，不足部分扣存款。</p>
      <p v-else class="amount">{{ offer.kind === 'purchase' ? '买价' : '升级费用' }} {{ offer.amount }} · 仅使用现金</p>
      <div class="actions">
        <button data-testid="property-accept" :disabled="paused" @click="emit('decide', 'accept')">{{ offer.kind === 'rent' ? '确认付款' : offer.kind === 'purchase' ? '购买' : '升级' }}</button>
        <button v-if="offer.kind !== 'rent'" data-testid="property-decline" :disabled="paused" @click="emit('decide', 'decline')">放弃</button>
      </div>
    </template>
    <template v-else-if="game.phase === 'property-result'">
      <p class="result" data-testid="property-result">{{ result }}</p>
      <button data-testid="property-acknowledge" :disabled="paused" @click="emit('acknowledge')">知道了，继续</button>
    </template>
  </section>
</template>

<style scoped>
.property-panel{position:absolute;left:18px;bottom:18px;z-index:2;width:min(440px,calc(100% - var(--game-sidebar-width,320px) - 36px));max-height:calc(100% - 36px);overflow:auto;background:#132e39f2;color:#f2f8f4;border:1px solid #ffe18a;border-radius:14px;box-shadow:0 15px 35px #07151dab;padding:18px 20px;font:14px/1.45 system-ui,"PingFang SC",sans-serif}.eyebrow{color:#ffe18a;font-size:11px;letter-spacing:.09em}h2{margin:5px 0 10px;font-size:22px}p{margin:7px 0}.location{color:#b9d1d5}.balances{font-weight:700}.amount,.result{padding:10px;border-radius:8px;background:#265160}.actions{display:flex;gap:9px;margin-top:12px}button{font:inherit;border:1px solid #ffe18a;border-radius:8px;background:#ffe18a;color:#263d3b;font-weight:700;padding:9px 18px;cursor:pointer}button:disabled{opacity:.45;cursor:default}button:focus-visible{outline:2px solid white;outline-offset:2px}.actions button+button{background:#294b58;color:#f2f8f4;border-color:#728a90}@media(max-width:900px){.property-panel{left:12px;right:12px;bottom:42vh;width:auto;max-height:45vh}}
</style>
