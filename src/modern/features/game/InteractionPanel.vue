<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getCardDefinition } from './card-economy'
import type { BankOperation } from './bank-operations'
import type { FinanceEntry } from './finance-types'
import { maxCompanySubscription } from './company'
import { maxStockBuy } from './stock-trading'
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
  'bank-operation': [operation: BankOperation, amount: number]
  'leave-bank': []
  'acknowledge-monthly': []
  'trade-stock': [side: 'buy' | 'sell', companyId: number, shares: number]
  'leave-stock': []
  'subscribe-company': [shares: number]
  'leave-company': []
  'asset-error': [error: Error]
}>()
const creditAmount = ref(0)
const bankAmount = ref(0)
const bankAction = ref<Exclude<BankOperation, 'apply-credit'>>('withdraw')
const stockId = ref(1)
const stockShares = ref(1)
const companyShares = ref(1)
const interaction = computed(() => props.game.interaction)
const active = computed(() => props.game.players[props.game.activePlayerIndex]!)
const player = computed(() => props.game.players.find(item => item.id === interaction.value?.playerId) ?? active.value)
const inventory = computed(() => props.game.inventories[player.value.id] ?? [])
const cardInteraction = computed(() => interaction.value && 'cardId' in interaction.value ? interaction.value : null)
const card = computed(() => cardInteraction.value ? getCardDefinition(cardInteraction.value.cardId) : null)
const canAct = computed(() => !props.paused && player.value.controller === 'human')
const bankMax = computed(() => {
  const account = props.game.credit[player.value.id]
  const loan = props.game.finance.loans[player.value.id] ?? 0
  switch (bankAction.value) {
    case 'withdraw': return Math.max(0, player.value.deposit)
    case 'deposit': return Math.max(0, player.value.cash)
    case 'borrow': return loan === 0 && (account?.score ?? 0) > 0 ? account!.score * 1000 : 0
    case 'repay-loan': return Math.max(0, Math.min(player.value.cash, loan))
    case 'repay-credit': return Math.max(0, Math.min(player.value.cash, account?.used ?? 0))
  }
})
const chosenStock = computed(() => props.game.finance.stocks[stockId.value]!)
const stockBuyMaximum = computed(() => maxStockBuy(props.game, player.value.id, stockId.value))
const stockSellMaximum = computed(() => chosenStock.value.holdings[player.value.id]?.shares ?? 0)
const stockGross = computed(() => chosenStock.value.price * stockShares.value)
const landedCompany = computed(() => interaction.value?.kind === 'company'
  ? props.game.finance.stocks[interaction.value.companyId] : null)
const companyMaximum = computed(() => interaction.value?.kind === 'company'
  ? maxCompanySubscription(props.game, player.value.id, interaction.value.companyId) : 0)
const financeLabels: Record<string, string> = {
  'bank-withdraw': '取款完成', 'bank-deposit': '存款完成', 'bank-borrow': '贷款完成',
  'bank-repay-loan': '还贷完成', 'bank-repay-credit': '刷卡额已缴纳',
  'company-distribution': '公司分配', 'credit-monthly-payment': '信用卡月还',
  'company-undistributed-profit': '未分配经营收入',
  'loan-monthly-payment': '贷款月还', 'deposit-interest': '存款利息',
  'credit-granted': '信用申请通过，信用卡已加入手牌',
  'stock-buy': '股票买入', 'stock-sell': '股票卖出',
  'company-subscribe': '公司认购', 'company-fee': '公司经营费',
}
const monthlyQuotes = [
  '就凭你们，也想和我斗！', '赢得太轻松了……真没意思呢', '有没有像样一点的对手呀？',
  '你们，这回逊毙了哦……', '用脚趾头想都知道，赢的当然是我啦',
  '我的垄断时代到了哟，HOHOHOHOHO~~~', '感谢CCTV、MTV以及明日TV给我这个机会',
  '玩游戏，要先看懂规则滴', '俺是世界第一等！', '哈哈哈哈哈哈哈哈哈哈哈~~~',
  '不好意思，各位承让了', '赢钱要靠技术的，你们学着点',
  '哼哼哼哼哼，你们也有今天呀', '这个宝座，我八百年前就预定好了',
  '能力越大，责任越大，我太辛苦了',
] as const
const actualChanges = (entry: FinanceEntry) => [
  ['现金', entry.cashDelta], ['存款', entry.depositDelta], ['贷款', entry.loanDelta],
  ['已用信用', entry.creditUsedDelta], ['可用信用', entry.creditAvailableDelta], ['持股', entry.sharesDelta],
].filter((item): item is [string, number] => typeof item[1] === 'number' && item[1] !== 0)
  .map(([label, amount]) => `${label} ${amount > 0 ? '+' : ''}${amount}`).join(' · ')
const cardAssetUrl = (id: number) => {
  const url = props.cardAssets.find(asset => asset.id === id)?.url ?? `assets/interactions/cards/${id}.png`
  return `${import.meta.env.BASE_URL}${url}`
}
const luckAssetUrl = (id: number) => {
  const url = props.luckAssets.find(asset => asset.id === id)?.url ?? `assets/interactions/luck/${id}.png`
  return `${import.meta.env.BASE_URL}${url}`
}
const reportImageError = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement
  const source = image.currentSrc || image.getAttribute('src') || 'unknown'
  emit('asset-error', new Error(`界面素材加载失败：${source}`))
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
  if (notice.kind === 'card' && (notice.message === 'received' || notice.message === 'full')) {
    return notice.message === 'full' ? '手牌已满，未抽取新卡' : `获得${notice.cardId ? getCardDefinition(notice.cardId).name : '卡片'}`
  }
  if (notice.kind === 'shop') return ({ bought: '购买成功', sold: '出售成功', 'sold-out': '这个货架已经售罄', 'insufficient-tickets': '奖券不足', 'inventory-full': '手牌已满' } as Record<string, string>)[notice.message] ?? notice.message
  if (notice.financeEntry) return financeLabels[notice.financeEntry.kind] ?? notice.financeEntry.kind
  if (notice.eventKind === 'god-encountered' && notice.npcId === 3) return (notice.amount ?? 0) < 0 ? '遇见穷神，现金减少' : '遇见穷神'
  const labels: Record<string, string> = {
    'credit-granted': '信用申请通过，信用卡已加入手牌', 'credit-declined': '信用申请未通过', 'bank-closed': '银行周日休息',
    'stock-closed': '股市周日休市',
    'barrier-placed': '障碍已放置', 'mine-placed': '地雷已放置', 'missile-fired': '飞弹已经发射',
    'god-summoned': '神灵已经附身', 'god-dismissed': '神灵已经离开', 'barrier-triggered': '路障使移动停止',
    'mine-triggered': '踩中地雷，已送往医院', 'god-encountered': '遇见神灵', 'npc-deferred': '遇到原版 NPC（遭遇规则将在 3C 接入）',
    'god-property-adjusted': '神灵改变了房屋等级', 'restriction-skipped': '本回合因限制状态跳过',
    'restriction-released': '限制状态已经解除', 'god-expired': '神灵附身已经到期',
  }
  const eventLabel = labels[notice.eventKind ?? notice.message] ?? financeLabels[notice.eventKind ?? notice.message]
  if (eventLabel) return eventLabel
  if (notice.kind === 'card' && notice.cardId !== undefined && notice.message === 'applied') return `${getCardDefinition(notice.cardId).name}已生效`
  return notice.message
}
watch(() => interaction.value?.kind, kind => {
  if (kind === 'credit-choice') creditAmount.value = props.game.credit[player.value.id]?.available ?? 0
  if (kind === 'bank') bankAmount.value = 0
  if (kind === 'stock') { stockId.value = 1; stockShares.value = 1 }
  if (kind === 'company') companyShares.value = 1
})
watch(bankAction, () => { bankAmount.value = 0 })
watch(stockId, () => { stockShares.value = 1 })
</script>

<template>
  <section v-if="interaction" class="interaction" role="dialog" aria-label="对局交互" data-testid="interaction-panel">
    <template v-if="cardInteraction && card">
      <div class="card-head">
        <img :src="cardAssetUrl(card.id)" :alt="card.name" @error="reportImageError">
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
          <template v-if="cardId !== null"><img :src="cardAssetUrl(cardId)" :alt="getCardDefinition(cardId).name" @error="reportImageError"><span>{{ getCardDefinition(cardId).name }}</span><small>售价 {{ getCardDefinition(cardId).price }}</small></template><span v-else>售罄</span>
        </button>
      </div>
      <strong>出售手牌</strong>
      <div class="sell-list"><button v-for="(cardId, index) in inventory" :key="index" :disabled="!canAct" @click="emit('sell', index)">{{ getCardDefinition(cardId).name }} · {{ getCardDefinition(cardId).price }}券</button></div>
      <button :disabled="!canAct" @click="emit('leave-shop')">离开卡片屋</button>
    </template>

    <template v-else-if="interaction.kind === 'bank'">
      <span class="eyebrow">银行</span><h2>银行业务</h2>
      <p class="balance">{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }} · 贷款 {{ game.finance.loans[player.id] ?? 0 }}</p>
      <p>信用评分 {{ game.credit[player.id]?.score }} · 已用 {{ game.credit[player.id]?.used }} · 可用 {{ game.credit[player.id]?.available }}</p>
      <p v-if="interaction.error" class="error" role="alert">{{ interaction.error }}</p>
      <form class="choice" data-testid="bank-form" @submit.prevent="emit('bank-operation', bankAction, bankAmount)">
        <label>办理业务
          <select v-model="bankAction" data-testid="bank-operation" :disabled="!canAct">
            <option value="withdraw">取款</option><option value="deposit">存款</option>
            <option value="borrow">贷款</option><option value="repay-loan">还贷</option>
            <option value="repay-credit">缴纳刷卡额</option>
          </select>
        </label>
        <label>金额
          <input v-model.number="bankAmount" data-testid="bank-amount" type="number" min="0" step="1" :max="bankMax" :disabled="!canAct">
        </label>
        <small>本次上限 {{ bankMax }}</small>
        <div class="actions"><button type="submit" :disabled="!canAct">确认办理</button><button type="button" :disabled="!canAct" @click="emit('request-credit')">申请信用卡</button><button type="button" :disabled="!canAct" @click="emit('leave-bank')">离开银行</button></div>
      </form>
    </template>

    <template v-else-if="interaction.kind === 'monthly-settlement'">
      <span class="eyebrow">银行月结</span><h2>{{ game.world.year }}年{{ game.world.month }}月结算</h2>
      <p v-if="game.finance.monthlyQuoteIndex !== null">排名台词：{{ monthlyQuotes[game.finance.monthlyQuoteIndex] }}</p>
      <ol class="finance-lines"><li v-for="(entry, index) in interaction.entries" :key="index">
        {{ game.players.find(value => value.id === entry.playerId)?.name ?? '全局' }} · {{ financeLabels[entry.kind] ?? entry.kind }}<span v-if="entry.companyId"> · {{ game.finance.stocks[entry.companyId]?.name }}</span>
        <small>{{ entry.kind === 'company-undistributed-profit' ? `来源金额 ${entry.sourceAmount}` : actualChanges(entry) }}</small>
      </li></ol>
      <p v-if="interaction.entries.length === 0">本月没有资金变化</p>
      <button data-testid="monthly-acknowledge" :disabled="!canAct" @click="emit('acknowledge-monthly')">确认月结，继续</button>
    </template>

    <template v-else-if="interaction.kind === 'stock'">
      <span class="eyebrow">股市</span><h2>股票交易</h2>
      <p class="balance">{{ player.name }} · 现金 {{ player.cash }}</p>
      <p v-if="interaction.error" class="error" role="alert">{{ interaction.error }}</p>
      <div class="choice">
        <label>公司
          <select v-model.number="stockId" data-testid="stock-company" :disabled="!canAct">
            <option v-for="stock in game.finance.stocks.slice(1, 13)" :key="stock.id" :value="stock.id">{{ stock.name }}</option>
          </select>
        </label>
        <p>{{ chosenStock.name }} · 现价 {{ chosenStock.price }} · 涨跌 {{ chosenStock.change }} · 当日可买 {{ chosenStock.dailyBuyLimit }} · 已持 {{ chosenStock.holdings[player.id]?.shares ?? 0 }}</p>
        <label>股数
          <input v-model.number="stockShares" data-testid="stock-shares" type="number" min="1" step="1" :max="Math.max(stockBuyMaximum, stockSellMaximum)" :disabled="!canAct">
        </label>
        <p>成交额 {{ Number.isFinite(stockGross) ? stockGross.toFixed(2) : '—' }} · 买入现金 -{{ Number.isFinite(stockGross) ? Math.trunc(stockGross) : '—' }} · 卖出现金 +{{ Number.isFinite(stockGross) ? Math.trunc(stockGross) : '—' }}</p>
        <small>最多可买 {{ stockBuyMaximum }} 股 · 最多可卖 {{ stockSellMaximum }} 股</small>
        <div class="actions"><button data-testid="stock-buy" :disabled="!canAct || !Number.isInteger(stockShares) || stockShares < 1 || stockShares > stockBuyMaximum" @click="emit('trade-stock', 'buy', stockId, stockShares)">买入</button><button data-testid="stock-sell" :disabled="!canAct || !Number.isInteger(stockShares) || stockShares < 1 || stockShares > stockSellMaximum" @click="emit('trade-stock', 'sell', stockId, stockShares)">卖出</button><button :disabled="!canAct" @click="emit('leave-stock')">离开股市</button></div>
      </div>
    </template>

    <template v-else-if="interaction.kind === 'company' && landedCompany">
      <span class="eyebrow">公司</span><h2>{{ landedCompany.name }}</h2>
      <p class="balance">{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }}</p>
      <p>承销价 {{ landedCompany.basePrice }} · 待认购 {{ landedCompany.offerShares }} 股 · 已持 {{ landedCompany.holdings[player.id]?.shares ?? 0 }} 股</p>
      <p>董事：{{ game.players.find(value => value.id === landedCompany?.ceoId)?.name ?? '暂无' }} · 累计经营费 {{ landedCompany.profit }}</p>
      <p v-if="interaction.chargeEntry" class="amount">本次经营费 {{ actualChanges(interaction.chargeEntry) }}</p>
      <p v-if="interaction.chargeEntry?.diceFaces">骰子 {{ interaction.chargeEntry.diceFaces[0] }} + {{ interaction.chargeEntry.diceFaces[1] }} = {{ interaction.chargeEntry.diceFaces[0] + interaction.chargeEntry.diceFaces[1] }}</p>
      <p v-if="interaction.error" class="error" role="alert">{{ interaction.error }}</p>
      <div class="choice"><label>认购股数
        <input v-model.number="companyShares" data-testid="company-shares" type="number" min="1" step="1" :max="companyMaximum" :disabled="!canAct">
      </label><p>成交额 {{ landedCompany.basePrice * companyShares }} · 现金 -{{ landedCompany.basePrice * companyShares }}</p>
      <small>本次最多认购 {{ companyMaximum }} 股</small>
      <div class="actions"><button data-testid="company-subscribe" :disabled="!canAct || !Number.isInteger(companyShares) || companyShares < 1 || companyShares > companyMaximum" @click="emit('subscribe-company', companyShares)">认购</button><button :disabled="!canAct" @click="emit('leave-company')">离开公司</button></div></div>
    </template>

    <template v-else-if="interaction.kind === 'notice'">
      <span class="eyebrow">结算结果</span><h2>{{ noticeText(interaction) }}</h2>
      <img v-if="interaction.notice.luckEvent" data-testid="luck-image" class="luck" :src="luckAssetUrl(interaction.notice.luckEvent.id)" :alt="`运气事件 ${interaction.notice.luckEvent.id}`" @error="reportImageError">
      <p v-if="interaction.notice.financeEntry" class="amount">{{ actualChanges(interaction.notice.financeEntry) || '账户无变化' }}</p>
      <p v-else-if="interaction.notice.amount !== undefined && interaction.notice.amount !== 0" class="amount">{{ interaction.notice.luckEvent?.kind === 'cash' || interaction.notice.eventKind === 'god-encountered' && interaction.notice.npcId === 3 ? '现金' : interaction.notice.kind === 'tickets' || interaction.notice.kind === 'shop' ? '奖券' : '数值' }} {{ interaction.notice.amount > 0 ? '+' : '' }}{{ interaction.notice.amount }}</p>
      <p>{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }} · 奖券 {{ game.tickets[player.id] }}</p>
      <p>状态：{{ statusText }}</p>
      <button data-testid="interaction-acknowledge" :disabled="!canAct" @click="emit('acknowledge')">知道了，继续</button>
    </template>
  </section>
</template>

<style scoped>
.interaction{position:absolute;z-index:5;left:18px;bottom:18px;width:min(510px,calc(100% - 370px));max-height:calc(100% - 36px);overflow:auto;box-sizing:border-box;background:#112f3bf5;color:#f1f8f5;border:1px solid #ffe18a;border-radius:15px;box-shadow:0 18px 42px #07151dcc;padding:18px 20px;font:14px/1.45 system-ui,"PingFang SC",sans-serif}.eyebrow{color:#ffe18a;font-size:11px;letter-spacing:.11em}h2{margin:4px 0 9px;font-size:21px}p{margin:6px 0}.card-head{display:flex;gap:14px}.card-head img{width:78px;height:80px;object-fit:contain}.card-head p{color:#bed1d4}.balance,.amount{padding:8px 10px;background:#254f5c;border-radius:8px}.error{color:#ffd0c4;border:1px solid #d77867;background:#612f2b;padding:8px;border-radius:8px}.actions,.dice,.targets,.sell-list{display:flex;gap:7px;flex-wrap:wrap}.choice{display:grid;gap:10px}.choice label{display:grid;gap:5px}.choice input,.choice select{font:inherit;padding:8px;border:1px solid #73929a;border-radius:7px;background:#ecf4f1;color:#17313a}.dice button{min-width:42px;font-size:17px}.shop-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0}.shop-grid button{min-width:0;padding:5px 2px;display:grid;place-items:center;gap:2px}.shop-grid img{width:42px;height:44px;object-fit:contain}.shop-grid span,.shop-grid small{font-size:9px;white-space:nowrap}.sell-list{max-height:86px;overflow:auto;margin:7px 0 12px}.finance-lines{max-height:260px;overflow:auto;padding-left:20px}.finance-lines li{margin:6px 0}.finance-lines small{display:block;color:#bfd0d3}.luck{display:block;width:min(360px,100%);aspect-ratio:4/3;object-fit:contain;margin:8px auto;background:#fff3;border-radius:9px}button{font:inherit;background:#2a5361;color:#eff8f5;border:1px solid #66858e;border-radius:7px;padding:7px 10px;cursor:pointer}button:hover{background:#386b7a}button:disabled{opacity:.42;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid #ffe18a;outline-offset:2px}@media(max-width:900px){.interaction{left:12px;right:12px;bottom:42vh;width:auto;max-height:55vh}.shop-grid{grid-template-columns:repeat(4,1fr)}}
</style>
