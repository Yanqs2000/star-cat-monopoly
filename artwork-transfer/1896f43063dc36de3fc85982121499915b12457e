<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getCardDefinition } from './card-economy'
import type { DirectCardChoice } from './direct-cards'
import type { InteractionAsset } from './interaction-assets'
import type { GameInteraction } from './interaction-types'
import type { GameState } from './types'

const props = withDefaults(defineProps<{
  game: GameState
  paused: boolean
  cardAssets: InteractionAsset[]
  luckAssets?: InteractionAsset[]
}>(), { luckAssets: () => [] })
const emit = defineEmits<{
  confirm: []
  cancel: []
  choose: [choice: DirectCardChoice]
  acknowledge: []
  buy: [slot: number]
  sell: [index: number]
  'leave-shop': []
  'request-credit': []
  'leave-bank': []
}>()
const creditAmount = ref(0)
const interaction = computed(() => props.game.interaction)
const active = computed(() => props.game.players[props.game.activePlayerIndex]!)
const player = computed(() => props.game.players.find(item => item.id === interaction.value?.playerId) ?? active.value)
const inventory = computed(() => props.game.inventories[player.value.id] ?? [])
const cardInteraction = computed(() => interaction.value && 'cardId' in interaction.value ? interaction.value : null)
const card = computed(() => cardInteraction.value ? getCardDefinition(cardInteraction.value.cardId) : null)
const canAct = computed(() => !props.paused && player.value.controller === 'human')
const cardAssetUrl = (id: number) => {
  const url = props.cardAssets.find(asset => asset.id === id)?.url ?? `assets/interactions/cards/${id}.png`
  return `${import.meta.env.BASE_URL}${url}`
}
const luckAssetUrl = (id: number) => {
  const url = props.luckAssets.find(asset => asset.id === id)?.url ?? `assets/interactions/luck/${id}.png`
  return `${import.meta.env.BASE_URL}${url}`
}
const targetPlayers = computed(() => props.game.players.filter(item => item.id !== player.value.id))
const statusText = computed(() => {
  const status = props.game.world.statuses[player.value.id]
  if (!status) return '正常'
  const restriction = status.state === 2 ? `拘留 ${status.days}天` : status.state === 3 ? `住院 ${status.days}天` : status.state === 9 ? `受伤 ${status.days}天` : '正常'
  return status.godId === null ? restriction : `${restriction} · 神灵 ${status.godId}（${status.godDays}天）`
})
const noticeText = (value: Extract<GameInteraction, { kind: 'notice' }>) => {
  const notice = value.notice
  if (notice.kind === 'luck') return notice.message
  if (notice.kind === 'tickets') return `获得 ${notice.amount ?? 0} 张奖券`
  if (notice.kind === 'card-draw') return notice.message === 'full' ? '手牌已满，未抽取新卡' : `获得${notice.cardId ? getCardDefinition(notice.cardId).name : '卡片'}`
  if (notice.kind === 'shop') return ({ bought: '购买成功', sold: '出售成功', 'sold-out': '这个货架已经售罄', 'insufficient-tickets': '奖券不足', 'inventory-full': '手牌已满' } as Record<string, string>)[notice.message] ?? notice.message
  const labels: Record<string, string> = {
    'credit-granted': '信用申请通过，信用卡已加入手牌', 'credit-declined': '信用申请未通过', 'bank-closed': '银行周日休息',
    'barrier-placed': '障碍已放置', 'mine-placed': '地雷已放置', 'missile-fired': '飞弹已经发射',
    'god-summoned': '神灵已经附身', 'god-dismissed': '神灵已经离开', 'barrier-triggered': '路障使移动停止',
    'mine-triggered': '踩中地雷，已送往医院', 'god-encountered': '遇见神灵', 'npc-deferred': '遇到原版 NPC（遭遇规则将在 3C 接入）',
    'god-property-adjusted': '神灵改变了房屋等级', 'restriction-skipped': '本回合因限制状态跳过',
    'restriction-released': '限制状态已经解除', 'god-expired': '神灵附身已经到期',
  }
  const eventLabel = labels[notice.eventKind ?? notice.message]
  if (eventLabel) return eventLabel
  if (notice.kind === 'card' && notice.cardId !== undefined && notice.message === 'applied') return `${getCardDefinition(notice.cardId).name}已生效`
  return notice.message
}
watch(() => interaction.value?.kind, kind => {
  if (kind === 'credit-choice') creditAmount.value = props.game.credit[player.value.id]?.available ?? 0
})
</script>

<template>
  <section v-if="interaction" class="interaction" role="dialog" aria-label="对局交互" data-testid="interaction-panel">
    <template v-if="cardInteraction && card">
      <div class="card-head">
        <img :src="cardAssetUrl(card.id)" :alt="card.name">
        <div><span class="eyebrow">使用卡片</span><h2>{{ card.name }}</h2><p>{{ card.description }}</p></div>
      </div>
      <p class="balance">{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }} · 奖券 {{ game.tickets[player.id] }}</p>
      <p v-if="cardInteraction.choiceError" class="error" role="alert">{{ cardInteraction.choiceError }}</p>
      <div v-if="cardInteraction.kind === 'card-confirm'" class="actions">
        <button data-testid="interaction-confirm" :disabled="!canAct" @click="emit('confirm')">确认使用</button>
        <button data-testid="interaction-cancel" :disabled="!canAct" @click="emit('cancel')">取消</button>
      </div>
      <div v-else-if="cardInteraction.kind === 'dice-choice'" class="choice">
        <strong>选择下一次掷骰点数</strong>
        <div class="dice"><button v-for="value in 6" :key="value" :data-testid="`dice-${value}`" :disabled="!canAct" @click="emit('choose', { kind: 'dice', value })">{{ value }}</button></div>
        <button data-testid="interaction-cancel" :disabled="!canAct" @click="emit('cancel')">取消</button>
      </div>
      <form v-else-if="cardInteraction.kind === 'credit-choice'" data-testid="credit-form" class="choice" @submit.prevent="emit('choose', { kind: 'credit', amount: creditAmount })">
        <label>提取现金
          <input v-model.number="creditAmount" data-testid="credit-amount" type="number" min="0" :max="game.credit[player.id]?.available" step="1" :disabled="!canAct">
        </label>
        <small>可用额度 {{ game.credit[player.id]?.available ?? 0 }} · 已用 {{ game.credit[player.id]?.used ?? 0 }}</small>
        <div class="actions"><button data-testid="credit-submit" :disabled="!canAct" type="submit">提取</button><button data-testid="interaction-cancel" :disabled="!canAct" type="button" @click="emit('cancel')">取消</button></div>
      </form>
      <div v-else class="choice target-choice">
        <strong>在地图上点击目标格</strong><p>拖动地图不会提交；玩家卡也可直接选择下方真实位置。</p>
        <div class="targets"><button v-for="target in targetPlayers" :key="target.id" :data-testid="`target-player-${target.id}`" :disabled="!canAct" @click="emit('choose', { kind: 'cell', position: target.position })">{{ target.name }} · {{ target.position.column }},{{ target.position.row }}</button></div>
        <button data-testid="interaction-cancel" :disabled="!canAct" @click="emit('cancel')">取消</button>
      </div>
    </template>

    <template v-else-if="interaction.kind === 'shop'">
      <span class="eyebrow">卡片屋</span><h2>12 格真实库存</h2>
      <p class="balance">{{ player.name }} · 奖券 {{ game.tickets[player.id] }} · 手牌 {{ inventory.length }}/24</p>
      <div class="shop-grid">
        <button v-for="(cardId, slot) in interaction.shop.stock" :key="slot" data-testid="shop-slot" :disabled="!canAct || cardId === null" @click="emit('buy', slot)">
          <template v-if="cardId !== null"><img :src="cardAssetUrl(cardId)" :alt="getCardDefinition(cardId).name"><span>{{ getCardDefinition(cardId).name }}</span><small>售价 {{ getCardDefinition(cardId).price }}</small></template><span v-else>售罄</span>
        </button>
      </div>
      <strong>出售手牌</strong>
      <div class="sell-list"><button v-for="(cardId, index) in inventory" :key="index" :disabled="!canAct" @click="emit('sell', index)">{{ getCardDefinition(cardId).name }} · {{ getCardDefinition(cardId).price }}券</button></div>
      <button :disabled="!canAct" @click="emit('leave-shop')">离开卡片屋</button>
    </template>

    <template v-else-if="interaction.kind === 'bank'">
      <span class="eyebrow">银行</span><h2>申请信用卡</h2>
      <p>{{ player.name }} · 信用评分 {{ game.credit[player.id]?.score }}</p>
      <p>已用 {{ game.credit[player.id]?.used }} · 可用 {{ game.credit[player.id]?.available }}</p>
      <p>银行只办理本阶段所需的信用卡申请。</p>
      <div class="actions"><button :disabled="!canAct" @click="emit('request-credit')">申请信用</button><button :disabled="!canAct" @click="emit('leave-bank')">离开银行</button></div>
    </template>

    <template v-else-if="interaction.kind === 'notice'">
      <span class="eyebrow">结算结果</span><h2>{{ noticeText(interaction) }}</h2>
      <img v-if="interaction.notice.luckEvent" data-testid="luck-image" class="luck" :src="luckAssetUrl(interaction.notice.luckEvent.id)" :alt="`运气事件 ${interaction.notice.luckEvent.id}`">
      <p v-if="interaction.notice.amount !== undefined && interaction.notice.amount !== 0" class="amount">{{ interaction.notice.luckEvent?.kind === 'cash' ? '现金' : interaction.notice.kind === 'tickets' || interaction.notice.kind === 'shop' ? '奖券' : '数值' }} {{ interaction.notice.amount > 0 ? '+' : '' }}{{ interaction.notice.amount }}</p>
      <p>{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }} · 奖券 {{ game.tickets[player.id] }}</p>
      <p>状态：{{ statusText }}</p>
      <button data-testid="interaction-acknowledge" :disabled="!canAct" @click="emit('acknowledge')">知道了，继续</button>
    </template>
  </section>
</template>

<style scoped>
.interaction{position:absolute;z-index:5;left:18px;bottom:18px;width:min(510px,calc(100% - 370px));max-height:calc(100% - 36px);overflow:auto;box-sizing:border-box;background:#112f3bf5;color:#f1f8f5;border:1px solid #ffe18a;border-radius:15px;box-shadow:0 18px 42px #07151dcc;padding:18px 20px;font:14px/1.45 system-ui,"PingFang SC",sans-serif}.eyebrow{color:#ffe18a;font-size:11px;letter-spacing:.11em}h2{margin:4px 0 9px;font-size:21px}p{margin:6px 0}.card-head{display:flex;gap:14px}.card-head img{width:78px;height:80px;object-fit:contain}.card-head p{color:#bed1d4}.balance,.amount{padding:8px 10px;background:#254f5c;border-radius:8px}.error{color:#ffd0c4;border:1px solid #d77867;background:#612f2b;padding:8px;border-radius:8px}.actions,.dice,.targets,.sell-list{display:flex;gap:7px;flex-wrap:wrap}.choice{display:grid;gap:10px}.choice label{display:grid;gap:5px}.choice input{font:inherit;padding:8px;border:1px solid #73929a;border-radius:7px;background:#ecf4f1;color:#17313a}.dice button{min-width:42px;font-size:17px}.shop-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0}.shop-grid button{min-width:0;padding:5px 2px;display:grid;place-items:center;gap:2px}.shop-grid img{width:42px;height:44px;object-fit:contain}.shop-grid span,.shop-grid small{font-size:9px;white-space:nowrap}.sell-list{max-height:86px;overflow:auto;margin:7px 0 12px}.luck{display:block;width:min(360px,100%);aspect-ratio:4/3;object-fit:contain;margin:8px auto;background:#fff3;border-radius:9px}button{font:inherit;background:#2a5361;color:#eff8f5;border:1px solid #66858e;border-radius:7px;padding:7px 10px;cursor:pointer}button:hover{background:#386b7a}button:disabled{opacity:.42;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid #ffe18a;outline-offset:2px}@media(max-width:900px){.interaction{left:12px;right:12px;bottom:42vh;width:auto;max-height:55vh}.shop-grid{grid-template-columns:repeat(4,1fr)}}
</style>
