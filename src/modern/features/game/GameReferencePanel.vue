<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { GameState } from './types'
import { getAssetStandings, getHoldingsOverview, getStockOverview } from './queries'
import { getCardDefinition, getOrdinaryCardIds } from './card-economy'

import { profileAssetUrl,type AssetProfile } from '../assets/profiles'

export type ReferenceTab = 'assets' | 'stocks' | 'holdings' | 'help'
const props = defineProps<{ game?: GameState; tab: ReferenceTab;assetProfile?:AssetProfile }>()
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
const asset = (path: string) => `${import.meta.env.BASE_URL}${/^(?:ui|monthly)\//.test(path)?profileAssetUrl(`assets/${path}`,props.assetProfile??'original'):`assets/${path}`}`
const number = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
const portrait = (id: number) => asset(`monthly/champions/${props.game?.players.find(player => player.id === id)?.characterId}.png`)
const selectedPlayer = computed(() => props.game?.players.find(player => player.id === playerId.value))
const stockSummary = computed(() => ({
  shares: stocks.value.reduce((sum, row) => sum + row.shares, 0),
  value: Math.trunc(stocks.value.reduce((sum, row) => sum + row.shares * row.price, 0)),
  companies: stocks.value.filter(row => row.shares > 0).length,
  rising: stocks.value.filter(row => row.change > 0).length,
  falling: stocks.value.filter(row => row.change < 0).length,
  flat: stocks.value.filter(row => row.change === 0).length,
}))
const playerHoldings = computed(() => props.game?.players.map(player => ({
  id: player.id, name: player.name,
  shares: holdings.value.reduce((sum, row) => sum + (row.holdings.find(item => item.playerId === player.id)?.shares ?? 0), 0),
  companies: holdings.value.filter(row => row.holdings.some(item => item.playerId === player.id && item.shares > 0)).length,
  boards: holdings.value.filter(row => row.ceoId === player.id).length,
})) ?? [])
const helpSections = [
  { title: '开始与目标', image: 'monthly/champions/1.png', text: '选择1–4名人类角色，不足四人由AI补位。现金与存款合计不大于0，在回合收尾破产；不会自动卖出股票或土地救急。剩余一名存活角色获胜，人类全部出局且仅剩AI时结束。' },
  { title: '操作', image: 'activities/ludo-face-6/1.png', text: '↑ 掷骰；← 确认地产、卡牌或结果；→ 放弃地产或取消可取消的选择。输入框或按钮聚焦时使用该控件自身操作。拖动地图查看，点击地块或建筑查询；用卡选目标时点击执行选点。全图、跟随当前玩家、暂停和速度按钮位于侧栏。' },
  { title: '地产与金融', image: 'ui/deposit.png', text: '落到无主地可用现金购买，自有地可升级至5级。过路费合计地主在同一街道的全部地产；显示计费房屋与金额后自动扣款，无需确认，现金不足继续扣存款。银行可存取款、借还款及申请信用卡；星期日休息。股票交易在途经股市时办理，公司认购在落到公司时办理。月初依次处理公司分配、信用还款、贷款还款与存款利息，最后确认继续。' },
  { title: '地图与特殊地点', image: 'interactions/cards/9.png', text: '魔法门可选择目的站或留在原地；法院可选择合法被告与案件；彩票公司兑换现金和奖券。失物招领可领取累计款项。住院、拘留期间跳过回合，倒计时结束从医院或监狱出口恢复移动。神灵附身可改变收费或建筑效果，到期释放。' },
  { title: '小游戏', image: 'ui/tickets.png', text: '彩票投注：点击投注格放筹码，确认后掷三骰并结算。游乐场：倒数后用左右方向键或鼠标移动接物，20秒后计分换奖券。活动中的暂停会冻结计时，查询关闭后继续原阶段。' },
  { title: '托管与存档', image: 'ui/emblem.png', text: '托管和接管在安全回合结束时生效。三个手动槽位仅在稳定等待掷骰或终局可保存，移动、交互和小游戏途中先完成当前操作。保存成功后可刷新或关闭页面再读取；覆盖旧槽及读取替换当前局均需确认。没有自动存档，不兼容原Flash存档。存档服务不可用时保留当前对局，可关闭菜单继续。' },
]
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
      <header class="reference-header"><img :src="asset('ui/emblem.png')" alt=""><div><small>明日天空城 · 对局手册</small><h2>{{ tabs.find(item => item.id === tab)?.label }}</h2></div><button ref="closeButton" data-testid="reference-close" @click="emit('close')">关闭查询</button></header>
      <nav aria-label="查询分类">
        <button v-for="item in tabs.filter(item => game || item.id === 'help')" :key="item.id" :data-testid="`reference-${item.id}`" :aria-pressed="tab === item.id" @click="emit('tab', item.id)">{{ item.label }}</button>
      </nav>
      <div class="reference-body">
      <p v-if="game" class="hint pause-note"><span aria-hidden="true">Ⅱ</span> 查询期间对局暂停；关闭后恢复打开前的暂停状态。查询不会交易或用卡。</p>
      <template v-if="game && tab === 'assets'">
        <div class="asset-summary" data-testid="reference-asset-summary" aria-label="四人净资产速览">
          <article v-for="row in standings" :key="row.playerId" :data-testid="`reference-summary-player-${row.playerId}`" :class="{ leader: row.rank === 1, eliminated: row.eliminated }">
            <span class="rank-badge">{{ row.rank === null ? '已出局' : `第 ${row.rank} 名` }}</span>
            <img :src="portrait(row.playerId)" :alt="row.name">
            <div class="summary-identity"><strong>{{ row.name }}</strong><small>土地 {{ row.landCount }} · 建筑 {{ row.buildingCount }}</small></div>
            <div class="net-worth"><small>净资产 / 元</small><b>{{ number(row.netWorth) }}</b></div>
            <div class="wallet"><span><img :src="asset('ui/cash.png')" alt="现金">{{ number(row.cash) }}</span><span><img :src="asset('ui/deposit.png')" alt="存款">{{ number(row.deposit) }}</span></div>
          </article>
        </div>
        <div class="detail-heading"><h3>资产明细</h3><span>全部账户与负债 · 可横向滚动</span></div>
        <div class="table-scroll" tabindex="0" aria-label="资产明细，可横向滚动"><table data-testid="asset-standings">
          <caption>本局资产与排名</caption>
          <thead><tr><th>排名</th><th>角色</th><th>净资产</th><th>现金</th><th>存款</th><th>股票估值</th><th>房产估值</th><th>已用信用</th><th>贷款</th><th>土地</th><th>建筑</th><th>手牌</th><th>奖券</th></tr></thead>
          <tbody><tr v-for="row in standings" :key="row.playerId" :data-testid="`assets-player-${row.playerId}`"><td>{{ row.rank ?? '出局' }}</td><th scope="row">{{ row.name }}</th><td class="total">{{ row.netWorth }}</td><td>{{ row.cash }}</td><td>{{ row.deposit }}</td><td>{{ row.stockValue }}</td><td>{{ row.propertyValue }}</td><td>{{ row.usedCredit }}</td><td>{{ row.loan }}</td><td>{{ row.landCount }}</td><td>{{ row.buildingCount }}</td><td>{{ row.cards }}</td><td>{{ row.tickets }}</td></tr></tbody>
        </table></div>
        <p>净资产＝现金＋存款＋股票估值＋房产估值－已用信用－贷款。同值按参赛席位排序，已淘汰角色不参与排名。</p>
        <p class="hint">沿用原版估值：空地不直接按购地价计入资产；房屋按当前等级的累计建筑投入计价。奖券与可用信用不计入净资产。</p>
      </template>
      <template v-else-if="game && tab === 'stocks'">
        <div class="stock-toolbar"><h3>行情与个人持仓</h3><label>查询角色 <select v-model.number="playerId" aria-label="查询角色"><option v-for="player in game.players" :key="player.id" :value="player.id">{{ player.name }}</option></select></label></div>
        <div class="stock-summary" data-testid="reference-stock-summary">
          <article class="selected-investor"><img v-if="selectedPlayer" :src="portrait(selectedPlayer.id)" :alt="selectedPlayer.name"><div><small>正在查询</small><strong>{{ selectedPlayer?.name }}</strong><span data-testid="reference-stock-shares">{{ number(stockSummary.shares) }} 股 · {{ stockSummary.companies }} 家公司</span></div></article>
          <article><img class="metric-icon" :src="asset('ui/deposit.png')" alt=""><div><small>上市股票估值 / 元</small><b>{{ number(stockSummary.value) }}</b><span>按当前市价计算</span></div></article>
          <article><span class="market-symbol" aria-hidden="true">↗</span><div><small>12家公司行情</small><strong class="market-count"><span>涨 {{ stockSummary.rising }}</span><span>跌 {{ stockSummary.falling }}</span><span>平 {{ stockSummary.flat }}</span></strong><span>相对前价的涨跌家数</span></div></article>
        </div>
        <div class="table-scroll" tabindex="0" aria-label="股票行情明细，可横向滚动"><table data-testid="stock-overview">
          <caption>12家公司当前行情与所选角色持股</caption>
          <thead><tr><th>公司</th><th>前价</th><th>现价</th><th>涨跌</th><th>峰值</th><th>谷值</th><th>当日可买</th><th>持股</th><th>持股均价</th><th>董事</th></tr></thead>
          <tbody><tr v-for="row in stocks" :key="row.companyId" :data-testid="`stock-row-${row.companyId}`"><th scope="row">{{ row.name }}</th><td>{{ row.previousPrice }}</td><td>{{ row.price }}</td><td :class="{ rising: row.change > 0, falling: row.change < 0 }">{{ row.change > 0 ? '+' : '' }}{{ row.change }}</td><td>{{ row.high }}</td><td>{{ row.low }}</td><td>{{ row.dailyBuyLimit }}</td><td>{{ row.shares }}</td><td>{{ row.shares ? row.averageCost : '—' }}</td><td>{{ row.ceoName }}</td></tr></tbody>
        </table></div>
        <p class="hint">这里仅查看行情；买卖股票须在移动途经股市时办理。</p>
      </template>
      <template v-else-if="game && tab === 'holdings'">
        <div class="holding-summary" data-testid="reference-holdings-summary" aria-label="全员持股速览">
          <article v-for="player in playerHoldings" :key="player.id"><img :src="portrait(player.id)" :alt="player.name"><div><strong>{{ player.name }}</strong><b>{{ number(player.shares) }} <small>股</small></b><small>持有 {{ player.companies }} 家 · 董事 {{ player.boards }} 家</small></div></article>
        </div>
        <div class="detail-heading"><h3>全员持股明细</h3><span>包含3家非上市公共事业 · 可横向滚动</span></div>
        <div class="table-scroll" tabindex="0" aria-label="全员持股明细，可横向滚动"><table data-testid="holdings-overview">
          <caption>15家公司全员持股与董事归属</caption>
          <thead><tr><th>公司</th><th v-for="player in game.players" :key="player.id">{{ player.name }}<small>股数／均价</small></th><th>董事</th><th>市价</th><th>峰／谷</th><th>承销价</th><th>待认购</th><th>累计盈利</th></tr></thead>
          <tbody><tr v-for="row in holdings" :key="row.companyId" :data-testid="`holdings-row-${row.companyId}`"><th scope="row">{{ row.name }}</th><td v-for="holding in row.holdings" :key="holding.playerId" :data-testid="`holdings-player-${row.companyId}-${holding.playerId}`">{{ holding.shares }}<small>{{ holding.shares ? holding.averageCost : '—' }}</small></td><td>{{ row.ceoName }}</td><td>{{ row.listed ? row.price : '非上市' }}</td><td>{{ row.listed ? `${row.high}／${row.low}` : '—' }}</td><td>{{ row.basePrice }}</td><td>{{ row.offerShares }}</td><td>{{ row.profit }}</td></tr></tbody>
        </table></div>
        <p class="hint">后三家为非上市公共事业，可到对应公司认购；不作为普通股市交易股票。</p>
      </template>
      <article v-else class="help" data-testid="game-help">
        <div class="help-intro"><img :src="asset('monthly/champions/1.png')" alt="卷毛"><div><h3>一起出发，玩转天空城</h3><p>掷骰探索街道，经营地产，善用卡牌。规则与操作随时查阅。</p><div class="key-guide"><span><kbd>↑</kbd> 掷骰</span><span><kbd>←</kbd> 确认</span><span><kbd>→</kbd> 取消</span></div></div></div>
        <div class="help-topics"><section v-for="(topic, index) in helpSections" :key="topic.title"><div class="topic-title"><img :src="asset(topic.image)" alt=""><span>0{{ index + 1 }}</span><h3>{{ topic.title }}</h3></div><p>{{ topic.text }}</p></section></div>
        <div class="detail-heading card-heading"><h3>随身卡牌图鉴</h3><span>本版可获得并使用的17种卡</span></div>
        <dl class="card-guide"><div v-for="card in cards" :key="card.id"><img class="help-card-art" :src="asset(`interactions/cards/${card.id}.png`)" :alt="card.name"><dt data-testid="help-card">{{ card.name }}</dt><dd>{{ card.description }}</dd></div></dl>
      </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.reference-backdrop{position:fixed;inset:0;z-index:75;background:#11497165;display:grid;place-items:center;padding:20px;color:#1a507c;font:14px/1.5 system-ui,"PingFang SC",sans-serif}.reference-panel{width:min(1120px,100%);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;background:#dff1ff;border:3px solid #f8fdff;border-radius:20px;padding:20px;box-shadow:0 0 0 2px #399ce9,0 18px 65px #164b8166}.reference-header{display:flex;align-items:center;gap:12px;flex:none}.reference-header>img{width:46px;height:46px;object-fit:contain}.reference-header h2{margin:0;font-size:24px;color:#1467b2;line-height:1.3;letter-spacing:.06em}.reference-header small{font-size:11px;letter-spacing:.08em;color:#517b9c}.reference-header button{margin-left:auto;flex:none}nav{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 0;padding-bottom:14px;border-bottom:1px solid #a2cfee;flex:none}button,select{font:inherit;border:1px solid #91c5e8;border-radius:9px;padding:8px 12px;background:linear-gradient(#f8fdff,#bce5ff);color:#1a5e95;cursor:pointer}button[aria-pressed=true],header button{background:linear-gradient(#fff5b4,#ffdb6e);color:#714d13;border-color:#ecc576}button:focus-visible,select:focus-visible,.table-scroll:focus-visible{outline:3px solid #f3b417;outline-offset:2px}.reference-body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 2px 2px}.hint{color:#517b9c;font-size:12px}.pause-note{display:flex;gap:7px;align-items:center;margin:12px 0}.pause-note>span{background:#c7e7fb;border-radius:5px;padding:0 6px;font-weight:800}.asset-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:15px 0 19px}.asset-summary article{position:relative;display:grid;grid-template-columns:62px minmax(0,1fr);column-gap:8px;border:1px solid #a4d2f1;border-radius:13px;background:linear-gradient(#f8fdff,#eaf6ff);padding:35px 12px 11px;overflow:hidden}.asset-summary article.leader{background:linear-gradient(#fff9e3,#fff4d0);border-color:#e7c873}.rank-badge{position:absolute;left:11px;top:8px;color:#397eaf;font-size:11px;font-weight:750}.leader .rank-badge{color:#8f641d;background:#ffe7a3;border:1px solid #e5bf66;padding:0 7px;border-radius:12px}.asset-summary article>img{grid-row:1/3;width:62px;height:78px;align-self:center;object-fit:contain;filter:drop-shadow(0 3px 2px #528bc327)}.summary-identity{align-self:end}.summary-identity strong{font-size:16px;color:#195c91;display:block}.summary-identity small{font-size:10px}.net-worth{padding-top:5px}.net-worth small{font-size:10px;display:block;color:#6382a0}.net-worth b{font-size:22px;color:#1769a7;line-height:1.3;font-variant-numeric:tabular-nums}.wallet{grid-column:1/-1;display:flex;justify-content:space-between;gap:6px;border-top:1px solid #bddbed;margin-top:10px;padding-top:8px;font-size:11px;color:#4e7290}.wallet>span{display:flex;align-items:center;gap:4px;white-space:nowrap}.wallet img{width:19px;height:19px;object-fit:contain}.eliminated{opacity:.62}.detail-heading{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:8px 0}.detail-heading h3,.stock-toolbar h3{font-size:15px;color:#256c9e;margin:0}.detail-heading>span{font-size:11px;color:#6083a0}.table-scroll{max-width:100%;overflow:auto;border:1px solid #abd2ed;border-radius:10px;margin:10px 0 12px;scrollbar-color:#78b7e0 #d9edfa}table{width:100%;border-collapse:collapse;white-space:nowrap;font-variant-numeric:tabular-nums;text-align:right;font-size:12px}caption{text-align:left;padding:8px 10px;background:#eff9ff;font-size:11px;color:#527d9b}th,td{padding:8px 10px;border:1px solid #bddcef}thead th{background:#bce0fa;color:#1c608f}tbody th{text-align:left;background:#edf8ff}tbody tr:nth-child(even){background:#eaf6ff}.total{color:#136fba;font-weight:750}small{display:block;font-size:11px;color:#517b9c}.table-scroll small{font-size:10px}.reference-body>p{font-size:12px;line-height:1.7}.stock-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:13px 0}.stock-toolbar label{font-size:12px}.stock-toolbar select{padding:5px 10px}.stock-summary{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:12px;margin:12px 0 16px}.stock-summary article{border:1px solid #a7d2f0;border-radius:12px;background:#f3fbff;display:flex;gap:12px;align-items:center;padding:12px;min-width:0}.selected-investor>img{width:66px;height:70px;object-fit:contain}.stock-summary article>div{min-width:0;display:grid;gap:3px}.stock-summary strong{font-size:17px;color:#1b6298}.stock-summary b{font-size:24px;line-height:1.2;color:#1769a7}.stock-summary article span{font-size:11px;color:#537b9b}.stock-summary .metric-icon{width:43px;height:43px;object-fit:contain}.stock-summary .market-symbol{font-size:43px;line-height:1;color:#3e9ac9}.market-count{display:flex;gap:8px;flex-wrap:wrap}.stock-summary .market-count span{color:#226a9d;font-size:14px;font-weight:750}.rising{color:#aa5231;font-weight:700}.falling{color:#267c67;font-weight:700}.holding-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}.holding-summary article{display:flex;align-items:center;gap:10px;background:#f3fbff;border:1px solid #a7d2f0;border-radius:12px;padding:12px}.holding-summary img{width:52px;height:66px;object-fit:contain}.holding-summary strong{font-size:14px;display:block}.holding-summary b{display:block;font-size:20px;color:#196ba7;font-variant-numeric:tabular-nums}.holding-summary b small{display:inline;font-size:11px;font-weight:400}.holding-summary small{font-size:10px}.help-intro{display:flex;align-items:center;gap:20px;background:linear-gradient(110deg,#edfaff,#ceeaff);border:1px solid #a4d3f2;border-radius:14px;margin:16px 0;padding:12px 22px}.help-intro>img{width:93px;height:100px;object-fit:contain}.help h3{color:#136fba;margin:0 0 7px;font-size:16px}.help p{margin:0;font-size:12px;line-height:1.8}.key-guide{display:flex;gap:15px;flex-wrap:wrap;margin-top:10px;color:#40789f;font-size:11px}.key-guide kbd{background:white;box-shadow:0 2px #a8cce5;border:1px solid #b6d8ee;border-radius:5px;padding:2px 7px;font-size:13px;color:#286da0}.help-topics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.help-topics section{border:1px solid #afd5ef;border-radius:12px;background:#f3faff;padding:14px}.topic-title{display:flex;align-items:center;gap:8px;margin-bottom:9px}.topic-title img{width:34px;height:34px;object-fit:contain}.topic-title>span{color:#8db7d6;font-size:13px;font-weight:750}.topic-title h3{margin:0;font-size:14px}.card-heading{margin-top:22px}.card-guide{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:10px 0}.card-guide>div{display:grid;grid-template-columns:46px minmax(0,1fr);column-gap:10px;background:#f3faff;border:1px solid #afd5ef;border-radius:10px;padding:12px}.card-guide img{width:46px;height:58px;object-fit:contain;grid-row:1/3;filter:drop-shadow(0 2px 2px #75a2c055)}.card-guide dt{font-size:13px;font-weight:750;color:#226b9f;align-self:end}.card-guide dd{font-size:11px;line-height:1.7;margin:4px 0 0;color:#517b9c}
@media(max-width:900px){.asset-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.holding-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.stock-summary{grid-template-columns:1fr 1fr}.stock-summary article:last-child{grid-column:1/-1}.card-guide{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.reference-backdrop{padding:10px}.reference-panel{padding:13px;max-height:95dvh}.reference-header{gap:7px}.reference-header>img{width:34px;height:34px}.reference-header h2{font-size:20px}.reference-header small{font-size:9px;letter-spacing:0}.reference-header button{padding:7px 9px;font-size:11px}nav{gap:6px;margin-top:12px;padding-bottom:10px}nav button{padding:7px 8px;font-size:11px}.pause-note{font-size:10px;align-items:flex-start}.asset-summary{gap:8px;margin:12px 0}.asset-summary article{grid-template-columns:47px minmax(0,1fr);padding:30px 8px 9px;column-gap:4px}.asset-summary article>img{width:47px;height:64px}.summary-identity strong{font-size:14px}.summary-identity small{font-size:9px}.net-worth b{font-size:18px}.net-worth small{font-size:9px}.wallet{flex-direction:column;gap:3px;font-size:10px;margin-top:7px;padding-top:6px}.wallet img{width:16px;height:16px}.detail-heading{align-items:flex-start;gap:5px}.detail-heading h3{font-size:13px;white-space:nowrap}.detail-heading>span{font-size:9px;text-align:right}.stock-toolbar{align-items:center}.stock-toolbar h3{font-size:13px}.stock-toolbar label{font-size:10px}.stock-toolbar select{max-width:100px;font-size:11px}.stock-summary{gap:8px}.stock-summary article{padding:10px;gap:7px}.stock-summary .selected-investor{grid-column:1/-1}.stock-summary article:last-child{grid-column:auto}.selected-investor>img{width:51px;height:57px}.stock-summary strong{font-size:16px}.stock-summary b{font-size:20px}.stock-summary small,.stock-summary article span{font-size:10px}.stock-summary .metric-icon{display:none}.stock-summary .market-symbol{font-size:27px}.stock-summary .market-count{gap:4px}.stock-summary .market-count span{font-size:11px}.holding-summary{gap:8px}.holding-summary article{padding:9px 7px;gap:5px}.holding-summary img{width:41px;height:55px}.holding-summary strong{font-size:13px}.holding-summary b{font-size:18px}.holding-summary small{font-size:9px}.help-intro{gap:9px;padding:12px 10px}.help-intro>img{width:66px;height:84px}.help-intro h3{font-size:15px}.help-intro p{font-size:11px}.key-guide{gap:8px;font-size:10px}.help-topics{grid-template-columns:1fr;gap:9px}.help-topics section{padding:12px}.card-guide{grid-template-columns:1fr}.card-guide img{width:42px;height:55px}.card-guide>div{grid-template-columns:42px minmax(0,1fr)}.card-guide dt{align-self:center}}
</style>
