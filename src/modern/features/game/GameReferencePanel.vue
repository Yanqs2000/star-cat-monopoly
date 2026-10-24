<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { GameState } from './types'
import { getAssetStandings, getHoldingsOverview, getStockOverview } from './queries'
import { getCardDefinition, getOrdinaryCardIds } from './card-economy'

export type ReferenceTab = 'assets' | 'stocks' | 'holdings' | 'help'
const props = defineProps<{ game?: GameState; tab: ReferenceTab }>()
const emit = defineEmits<{ close: []; tab: [value: ReferenceTab] }>()
const root = ref<HTMLElement>(), closeButton = ref<HTMLButtonElement>()
const playerId = ref(props.game?.players[props.game.activePlayerIndex]?.id ?? 1)
const standings = computed(() => props.game ? getAssetStandings(props.game) : [])
const stocks = computed(() => props.game ? getStockOverview(props.game, playerId.value) : [])
const holdings = computed(() => props.game ? getHoldingsOverview(props.game) : [])
const tabs: { id: ReferenceTab; label: string }[] = [
  { id: 'assets', label: '资产与排名' }, { id: 'stocks', label: '股票行情' },
  { id: 'holdings', label: '全员持股' }, { id: 'help', label: '游戏帮助' },
]
const cards = [1, ...getOrdinaryCardIds()].map(getCardDefinition)
let previousFocus: HTMLElement | null = null
onMounted(() => { previousFocus = document.activeElement as HTMLElement | null; closeButton.value?.focus() })
onBeforeUnmount(() => { const target = previousFocus; void nextTick(() => { if (target?.isConnected) target.focus() }) })
function keydown(event: KeyboardEvent) {
  // Stop game shortcuts and fullscreen Escape while a query is open.
  event.stopPropagation()
  if (event.key === 'Escape') { event.preventDefault(); emit('close'); return }
  if (event.key !== 'Tab') return
  const items = Array.from(root.value?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]') ?? [])
  const first = items[0], last = items.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
</script>

<template>
  <div class="reference-backdrop">
    <section ref="root" class="reference-panel" role="dialog" aria-modal="true" aria-label="对局查询与帮助" @keydown="keydown">
      <header><h2>{{ tabs.find(item => item.id === tab)?.label }}</h2><button ref="closeButton" data-testid="reference-close" @click="emit('close')">关闭查询</button></header>
      <nav aria-label="查询分类">
        <button v-for="item in tabs.filter(item => game || item.id === 'help')" :key="item.id" :data-testid="`reference-${item.id}`" :aria-pressed="tab === item.id" @click="emit('tab', item.id)">{{ item.label }}</button>
      </nav>
      <p v-if="game" class="hint">查询期间对局暂停；关闭后恢复打开前的暂停状态。查询不会交易或用卡。</p>
      <template v-if="game && tab === 'assets'">
        <div class="table-scroll"><table data-testid="asset-standings">
          <caption>本局资产与排名</caption>
          <thead><tr><th>排名</th><th>角色</th><th>净资产</th><th>现金</th><th>存款</th><th>股票估值</th><th>房产估值</th><th>已用信用</th><th>贷款</th><th>土地</th><th>建筑</th><th>手牌</th><th>奖券</th></tr></thead>
          <tbody><tr v-for="row in standings" :key="row.playerId" :data-testid="`assets-player-${row.playerId}`"><td>{{ row.rank ?? '出局' }}</td><th scope="row">{{ row.name }}</th><td class="total">{{ row.netWorth }}</td><td>{{ row.cash }}</td><td>{{ row.deposit }}</td><td>{{ row.stockValue }}</td><td>{{ row.propertyValue }}</td><td>{{ row.usedCredit }}</td><td>{{ row.loan }}</td><td>{{ row.landCount }}</td><td>{{ row.buildingCount }}</td><td>{{ row.cards }}</td><td>{{ row.tickets }}</td></tr></tbody>
        </table></div>
        <p>净资产＝现金＋存款＋股票估值＋房产估值－已用信用－贷款。同值按参赛席位排序，已淘汰角色不参与排名。</p>
        <p class="hint">沿用原版估值：空地不直接按购地价计入资产；房屋按当前等级的累计建筑投入计价。奖券与可用信用不计入净资产。</p>
      </template>
      <template v-else-if="game && tab === 'stocks'">
        <label>查询角色 <select v-model.number="playerId" aria-label="查询角色"><option v-for="player in game.players" :key="player.id" :value="player.id">{{ player.name }}</option></select></label>
        <div class="table-scroll"><table data-testid="stock-overview">
          <caption>12家公司当前行情与所选角色持股</caption>
          <thead><tr><th>公司</th><th>前价</th><th>现价</th><th>涨跌</th><th>峰值</th><th>谷值</th><th>当日可买</th><th>持股</th><th>持股均价</th><th>董事</th></tr></thead>
          <tbody><tr v-for="row in stocks" :key="row.companyId" :data-testid="`stock-row-${row.companyId}`"><th scope="row">{{ row.name }}</th><td>{{ row.previousPrice }}</td><td>{{ row.price }}</td><td>{{ row.change }}</td><td>{{ row.high }}</td><td>{{ row.low }}</td><td>{{ row.dailyBuyLimit }}</td><td>{{ row.shares }}</td><td>{{ row.shares ? row.averageCost : '—' }}</td><td>{{ row.ceoName }}</td></tr></tbody>
        </table></div>
        <p class="hint">这里仅查看行情；买卖股票须在移动途经股市时办理。</p>
      </template>
      <template v-else-if="game && tab === 'holdings'">
        <div class="table-scroll"><table data-testid="holdings-overview">
          <caption>15家公司全员持股与董事归属</caption>
          <thead><tr><th>公司</th><th v-for="player in game.players" :key="player.id">{{ player.name }}<small>股数／均价</small></th><th>董事</th><th>市价</th><th>峰／谷</th><th>承销价</th><th>待认购</th><th>累计盈利</th></tr></thead>
          <tbody><tr v-for="row in holdings" :key="row.companyId" :data-testid="`holdings-row-${row.companyId}`"><th scope="row">{{ row.name }}</th><td v-for="holding in row.holdings" :key="holding.playerId" :data-testid="`holdings-player-${row.companyId}-${holding.playerId}`">{{ holding.shares }}<small>{{ holding.shares ? holding.averageCost : '—' }}</small></td><td>{{ row.ceoName }}</td><td>{{ row.listed ? row.price : '非上市' }}</td><td>{{ row.listed ? `${row.high}／${row.low}` : '—' }}</td><td>{{ row.basePrice }}</td><td>{{ row.offerShares }}</td><td>{{ row.profit }}</td></tr></tbody>
        </table></div>
        <p class="hint">后三家为非上市公共事业，可到对应公司认购；不作为普通股市交易股票。</p>
      </template>
      <article v-else class="help" data-testid="game-help">
        <h3>开始与目标</h3><p>选择1–4名人类角色，不足四人由AI补位。现金与存款合计不大于0，在回合收尾破产；不会自动卖出股票或土地救急。剩余一名存活角色获胜，人类全部出局且仅剩AI时结束。</p>
        <h3>操作</h3><p>↑ 掷骰；← 确认地产、卡牌或结果；→ 放弃地产或取消可取消的选择。输入框或按钮聚焦时使用该控件自身操作。拖动地图查看，点击地块或建筑查询；用卡选目标时点击执行选点。全图、跟随当前玩家、暂停和速度按钮位于侧栏。</p>
        <h3>地产与金融</h3><p>落到无主地可用现金购买，自有地可升级至5级。租金合计地主在同一街道的全部地产，现金不足继续扣存款。银行可存取款、借还款及申请信用卡；星期日休息。股票交易在途经股市时办理，公司认购在落到公司时办理。月初依次处理公司分配、信用还款、贷款还款与存款利息，最后确认继续。</p>
        <h3>地图与特殊地点</h3><p>魔法门可选择目的站或留在原地；法院可选择合法被告与案件；彩票公司兑换现金和奖券。失物招领可领取累计款项。住院、拘留期间跳过回合，倒计时结束从医院或监狱出口恢复移动。神灵附身可改变收费或建筑效果，到期释放。</p>
        <h3>小游戏</h3><p>彩票投注：点击投注格放筹码，确认后掷三骰并结算。游乐场：倒数后用左右方向键或鼠标移动接物，20秒后计分换奖券。活动中的暂停会冻结计时，查询关闭后继续原阶段。</p>
        <h3>托管与存档</h3><p>托管和接管在安全回合结束时生效。三个手动槽位仅在稳定等待掷骰或终局可保存，移动、交互和小游戏途中先完成当前操作。保存成功后可刷新或关闭页面再读取；覆盖旧槽及读取替换当前局均需确认。没有自动存档，不兼容原Flash存档。存档服务不可用时保留当前对局，可关闭菜单继续。</p>
        <h3>本版可获得并使用的17种卡</h3>
        <dl><template v-for="card in cards" :key="card.id"><dt data-testid="help-card">{{ card.name }}</dt><dd>{{ card.description }}</dd></template></dl>
      </article>
    </section>
  </div>
</template>

<style scoped>
.reference-backdrop{position:fixed;inset:0;z-index:75;background:#001b29b8;display:grid;place-items:center;padding:20px;color:#edf8f8;font:14px/1.6 system-ui,"PingFang SC",sans-serif}.reference-panel{width:min(1120px,100%);max-height:92dvh;overflow:auto;background:#173744;border:2px solid #8ab4bf;border-radius:14px;padding:20px;box-shadow:0 18px 65px #00111d88}.reference-panel header{display:flex;justify-content:space-between;align-items:center;gap:16px}h2{margin:0;font-size:23px}nav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}button,select{font:inherit;border:1px solid #7094a0;border-radius:6px;padding:8px 12px;background:#284e5d;color:#edf8f8;cursor:pointer}button[aria-pressed=true],header button{background:#ffe18a;color:#15313d}button:focus-visible,select:focus-visible{outline:3px solid #ffe18a;outline-offset:2px}.table-scroll{max-width:100%;overflow:auto;margin:12px 0}table{width:100%;border-collapse:collapse;white-space:nowrap;font-variant-numeric:tabular-nums;text-align:right}caption{text-align:left;margin-bottom:8px;font-weight:600}th,td{padding:9px 10px;border:1px solid #52717f}thead th{background:#234c5b}tbody th{text-align:left}.total{color:#ffe18a;font-weight:700}small{display:block;font-size:12px;color:#b4cbd1}.hint{color:#b4cbd1;font-size:13px}.help h3{color:#ffe18a;margin:20px 0 6px}.help p{margin:0}.help dl{display:grid;grid-template-columns:minmax(80px,110px) 1fr;gap:8px 16px}.help dt{font-weight:700}.help dd{margin:0;color:#d0e0e4}@media(max-width:700px){.reference-backdrop{padding:10px}.reference-panel{padding:14px;max-height:95dvh}}
</style>
