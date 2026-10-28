<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiIcon from './UiIcon.vue'
import { getCardDefinition } from './card-economy'
import type { InteractionAsset } from './interaction-assets'
import type { GameState } from './types'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'

const props = defineProps<{
  game: GameState
  paused: boolean
  cardAssets: InteractionAsset[]
  preparedImages?:Record<string,string>
  assetProfile?:AssetProfile
}>()
const emit = defineEmits<{ 'begin-card': [index: number]; 'asset-error': [error: Error, cardId: number] }>()
const page = ref(0)
const cardRailStyle=computed(()=>({'--card-rail-image': `url(${import.meta.env.BASE_URL}${profileAssetUrl('assets/ui/card-rail.png',props.assetProfile??'original')})`}))
const active = computed(() => props.game.players[props.game.activePlayerIndex]!)
const inventory = computed(() => props.game.inventories[active.value.id] ?? [])
const pages = computed(() => Math.max(1, Math.ceil(inventory.value.length / 8)))
const visibleCards = computed(() => inventory.value.slice(page.value * 8, page.value * 8 + 8)
  .map((id, offset) => ({ id, index: page.value * 8 + offset, definition: getCardDefinition(id) })))
const canUse = computed(() => !props.paused && props.game.phase === 'awaiting-roll' && active.value.controller === 'human')
const assetUrl = (id: number) => {
  const url = profileAssetUrl(props.cardAssets.find(asset => asset.id === id)?.url ?? `assets/interactions/cards/${id}.png`,props.assetProfile ?? 'original')
  return props.preparedImages?.[url] ?? `${import.meta.env.BASE_URL}${url}`
}
const reportImageError = (event: Event, cardId: number) => {
  const image = event.currentTarget as HTMLImageElement
  const source = image.currentSrc || image.getAttribute('src') || 'unknown'
  emit('asset-error', new Error(`界面素材加载失败：${source}`), cardId)
}
watch([inventory, pages], () => { if (page.value >= pages.value) page.value = pages.value - 1 })
</script>

<template>
  <section :style="cardRailStyle" class="hand" aria-label="当前手牌" data-testid="hand-panel">
    <header>
      <div><strong>{{ active.name }}的手牌</strong><span>{{ inventory.length }}/24</span></div>
      <div class="pager">
        <button data-testid="hand-prev" aria-label="上一页手牌" :disabled="page === 0" @click="page--"><UiIcon name="left"/></button>
        <span data-testid="hand-page">{{ page + 1 }} / {{ pages }}</span>
        <button data-testid="hand-next" aria-label="下一页手牌" :disabled="page + 1 >= pages" @click="page++"><UiIcon name="right"/></button>
      </div>
    </header>
    <div v-if="visibleCards.length" class="cards">
      <button v-for="card in visibleCards" :key="card.index" data-testid="hand-card"
        :data-card-id="card.id" :data-card-index="card.index"
        :disabled="!canUse" @click="emit('begin-card', card.index)">
        <img :src="assetUrl(card.id)" :alt="card.definition.name" draggable="false" @error="reportImageError($event, card.id)">
        <span>{{ card.definition.name }}</span>
        <small>{{ card.definition.price }}券</small>
      </button>
      <span v-for="slot in 8-visibleCards.length" :key="`empty-${slot}`" class="empty-card-slot" aria-hidden="true"/>
    </div>
    <p v-else class="empty">暂无手牌</p>
    <p class="hint" :aria-hidden="canUse">{{ paused ? '暂停时不能用卡' : '轮到人类掷骰前才可用卡' }}</p>
  </section>
</template>

<style scoped>
.hand{border-top:1px solid #496b76;padding-top:10px;display:grid;gap:8px}.hand header,.hand header>div,.pager{display:flex;align-items:center;justify-content:space-between;gap:7px}.hand header span{color:#a9c3c8;font-size:12px}.pager button{padding:2px 8px;min-width:28px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.cards button{min-width:0;padding:5px 3px;display:grid;place-items:center;gap:2px;background:#244b59}.cards button:disabled{opacity:.78}.cards button:disabled span{color:#f0f8f6}.cards img{width:46px;height:48px;object-fit:contain;image-rendering:auto}.cards span{width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}.cards small{font-size:11px;color:#ffe18a}.empty,.hint{margin:0;color:#9fb7bc;font-size:12px}.hint{text-align:center}
.hint[aria-hidden=true]{visibility:hidden}
</style>
