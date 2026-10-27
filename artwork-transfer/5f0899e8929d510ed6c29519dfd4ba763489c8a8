<script setup lang="ts">
import CompanyCalculator from './CompanyCalculator.vue'
import { getAssetStandings } from './queries'
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { getCardDefinition } from './card-economy'
import type { BankOperation } from './bank-operations'
import type { FinanceEntry } from './finance-types'
import { maxCompanySubscription } from './company'
import { maxStockBuy } from './stock-trading'
import type { DirectCardChoice } from './direct-cards'
import type { InteractionAsset } from './interaction-assets'
import type { GameInteraction } from './interaction-types'
import type { GameState } from './types'
import { ticketExchangeMaximum } from './ticket-exchange'
import { activityChanges, originalActivityText } from './activity-text'
import type { ActivityClip, ActivityManifest, NativeOverlay } from './activity-assets'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'
import NativeActivity from './NativeActivity.vue'
const CarnivalStage=defineAsyncComponent({loader:()=>import('./CarnivalStage.vue'),onError(error,_retry,fail){emit('asset-error',error);fail()}})
import type { CarnivalInput } from './carnival'
import LudoActivity from './LudoActivity.vue'
import { PORTALS } from './portal'
import { COURT_CASES, courtTargets } from './court'
import { getCardRecord } from './direct-cards'

const props = withDefaults(defineProps<{
  game: GameState
  paused: boolean
  cardAssets: InteractionAsset[]
  luckAssets?: InteractionAsset[]
  activityAssets?: ActivityManifest
  portalDecorations?: NativeOverlay[]
  assetProfile?: AssetProfile
}>(), { luckAssets: () => [], assetProfile:'original' })
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
  'exchange-tickets': [quantity: number]
  'leave-exchange': []
  'activity-ready': [clipId: string]
  'skip-activity': []
  'carnival-input':[input:CarnivalInput]
  'place-wager':[id:number]
  'confirm-wagers':[]
  'choose-portal': [destination: number]
  'court-target': [playerId: number]
  'court-case': [caseId: number]
}>()
const exchangeQuantity = ref(0)
const exchangeLoaded = ref(false)
const originalExchangeUrl = computed(() => `${import.meta.env.BASE_URL}${profileAssetUrl(`assets/activities/${interaction.value?.kind === 'ticket-exchange' && interaction.value.mode === 'sell' ? 'witch' : 'lottery'}/1.png`,props.assetProfile)}`)
const nativeImageUrl = (id: string) => `${import.meta.env.BASE_URL}${profileAssetUrl(`assets/activities/${id}/1.png`,props.assetProfile)}`
function nativeHotspot(id: string, left: number, top: number, width: number, height: number) {
  const frame = props.activityAssets?.clips.find(clip => clip.id === id)?.frames[0]
  const canvasWidth = frame?.width ?? (id === 'station' ? 814 : 824)
  const canvasHeight = frame?.height ?? (id === 'station' ? 614 : 624)
  return { left: `${left/canvasWidth*100}%`, top: `${top/canvasHeight*100}%`,
    width: `${width/canvasWidth*100}%`, height: `${height/canvasHeight*100}%` }
}

const creditAmount = ref(0)
const bankAmount = ref(0)
const bankAction = ref<Exclude<BankOperation, 'apply-credit'>>('withdraw')
const stockId = ref(1)
const stockShares = ref(1)
const companyCalculatorOpen = ref(false)
const companySubscribeButton = ref<HTMLButtonElement>()
function closeCompanyCalculator() {
  companyCalculatorOpen.value = false
  void nextTick(() => companySubscribeButton.value?.focus())
}
const companyDialogUrl = computed(() => `${import.meta.env.BASE_URL}${profileAssetUrl('assets/companies/dialog.png',props.assetProfile)}`)
const interaction = computed(() => props.game.interaction)
const active = computed(() => props.game.players[props.game.activePlayerIndex]!)
const player = computed(() => props.game.players.find(item => item.id === interaction.value?.playerId) ?? active.value)
const inventory = computed(() => props.game.inventories[player.value.id] ?? [])
const cardInteraction = computed(() => interaction.value && 'cardId' in interaction.value ? interaction.value : null)
const card = computed(() => cardInteraction.value ? getCardDefinition(cardInteraction.value.cardId) : null)
const presentation = computed(() => interaction.value && 'presentation' in interaction.value ? interaction.value.presentation : undefined)
const presentationBlocking = computed(() => !!presentation.value && !(presentation.value.clipId === 'fog' && presentation.value.frame >= 15))
const presentationClip = computed(() => props.activityAssets?.clips.find(clip => clip.id === presentation.value?.clipId))
const exchangeClip = computed(() => props.activityAssets?.clips.find(clip => clip.id === (interaction.value?.kind === 'ticket-exchange' && interaction.value.mode === 'sell' ? 'witch' : 'lottery')))
const exchangeMaximum = computed(() => interaction.value?.kind === 'ticket-exchange' ? ticketExchangeMaximum(props.game, player.value.id, interaction.value.mode) : 0)
const canAct = computed(() => !props.paused && !presentationBlocking.value && player.value.controller === 'human')
const activityText = computed(() => {
  const notice=interaction.value?.kind==='notice'?interaction.value.notice:undefined
  if(notice?.message==='court-no-targets')return {show_say1:'目的地~~~',show_say2:'明日法院'}
  if(notice?.message==='portal-cancel')return {show_say1:'目的地~~~',show_say2:PORTALS.find(item=>item.position.column===player.value.position.column&&item.position.row===player.value.position.row)?.name ?? '魔法门'}
  return originalActivityText(notice?.receipt)
})
const activityClip = (id: string) => props.activityAssets?.clips.find(clip=>clip.id===id)
const portalClip = computed(()=>activityClip('station'))
const portalPrepared = computed(()=> {
  const ids=['map-mini','magic-talk',...Object.values(props.game.world.markers).map(id=>id===6?'mini-barrier':id===7?'mini-mine':`mini-npc-${id}`),...props.game.players.filter(item=>props.game.world.statuses[item.id]?.state!==9).map(item=>`head-${item.characterId}`)]
  return [...ids.map(activityClip).filter((clip):clip is ActivityClip=>!!clip),...(props.portalDecorations ?? []).map(item=>item.clip)]
})
const portalOverlays = computed(()=> {
  const items: NativeOverlay[]=[]
  const mini=activityClip('map-mini')
  if(mini)items.push({clip:mini,frame:1,x:123.5,y:11.25,depth:9})
  items.push(...props.portalDecorations ?? [])
  for(const [recordId,npcId] of Object.entries(props.game.world.markers)) {
    const position=getCardRecord(Number(recordId))?.position
    const clip=activityClip(npcId===6?'mini-barrier':npcId===7?'mini-mine':`mini-npc-${npcId}`)
    if(position&&clip)items.push({clip,frame:1,x:170+position.column*14,y:90+position.row*10,scale:.25,depth:30000+position.row*3000+position.column*30+9})
  }
  const heads=interaction.value?.kind==='portal'?interaction.value.heads ?? []:[]
  for(const head of heads) {
    const player=props.game.players.find(item=>item.id===head.playerId)!
    const clip=activityClip(`head-${player.characterId}`)
    if(clip)items.push({clip,frame:1,x:170+player.position.column*14,y:90+player.position.row*10,scale:.25,opacity:head.alpha/100,depth:20000000+player.position.row*3000+player.position.column*30+8-player.id})
  }
  const talk=activityClip('magic-talk')
  if(talk)for(const [index,portal] of PORTALS.entries()) {
    const column=[30,34,10,6][index] ?? 0,row=[5,27,37,15][index] ?? 0
    items.push({clip:talk,frame:1,x:170+column*14,y:90+row*10,scale:.5,text:{say:portal.name},depth:10000+row*40000+column*560+16})
  }
  return items.sort((a,b)=>(a.depth ?? 0)-(b.depth ?? 0))
})
const courtInteraction = computed(()=>interaction.value?.kind==='court'?interaction.value:null)
const courtClipId = computed(()=>courtInteraction.value?.stage==='target'?'court-target':courtInteraction.value?.stage==='case'?'court-case':'court-verdict')
const courtClip = computed(()=>activityClip(courtClipId.value))
const eligibleCourtPlayers = computed(()=>courtTargets(props.game,player.value.id).map(id=>props.game.players.find(item=>item.id===id)!))
const courtText = computed(()=>Object.fromEntries(eligibleCourtPlayers.value.map((item,index)=>[`name${index+1}`,item.name])))
const verdictText = computed(()=>({show_say1:'法院宣判',show_say2:({win:'原 告 胜 诉',settle:'庭 外 和 解',lose:'原 告 败 诉'} as Record<string,string>)[courtInteraction.value?.verdict ?? ''] ?? ''}))
const courtPrepared = computed(()=> {
  const stage=courtInteraction.value?.stage
  const ids=stage==='target'?eligibleCourtPlayers.value.map(item=>`face-${item.characterId}`).concat('court-highlight'):stage==='case'?['court-highlight']:['show2']
  return ids.map(activityClip).filter((clip):clip is ActivityClip=>!!clip)
})
const courtOverlays = computed(()=> {
  const items: NativeOverlay[]=[]
  const court=courtInteraction.value
  if(!court)return items
  if(court.stage==='target')for(const [index,item] of eligibleCourtPlayers.value.entries()) {
    const clip=activityClip(`face-${item.characterId}`)
    if(clip)items.push({clip,frame:1,x:499.95,y:267+50*index})
  }
  const elapsed=court.presentation?.frame ?? 0
  if(player.value.controller==='ai' && elapsed>=30 && (court.stage==='target'||court.stage==='case')) {
    const clip=activityClip('court-highlight')
    const index=court.stage==='target'?eligibleCourtPlayers.value.findIndex(item=>item.id===court.targetId):court.caseId ?? 0
    if(clip)items.push({clip,frame:Math.min(23,elapsed-29),x:court.stage==='target'?475:300,y:court.stage==='target'?240+50*index:250+80*index})
  }
  if(court.stage==='judgement' && (court.verdictFrame ?? 1)<45) {
    const clip=activityClip('show2')
    if(clip)items.push({clip,frame:court.verdictFrame ?? 1,x:400,y:300,text:verdictText.value})
  }
  return items
})
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
  const url = profileAssetUrl(props.cardAssets.find(asset => asset.id === id)?.url ?? `assets/interactions/cards/${id}.png`,props.assetProfile)
  return `${import.meta.env.BASE_URL}${url}`
}
const luckAssetUrl = (id: number) => {
  const url = profileAssetUrl(props.luckAssets.find(asset => asset.id === id)?.url ?? `assets/interactions/luck/${id}.png`,props.assetProfile)
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
  if (notice.eventKind === 'npc-encountered') return ({ 9: '路遇恶犬，已送往医院', 12: '路遇警察', 13: '路遇流氓', 14: '路遇小偷', 15: '路遇乞丐' } as Record<number,string>)[notice.npcId!] ?? 'NPC遭遇'
  if (notice.message === 'lost-found') return '失物招领'
  if (notice.message === 'ticket-buy') return '购券完成'
  if (notice.message === 'ticket-sell') return '兑奖完成'
  if (notice.message.startsWith('court-')) return ({'court-no-targets':'法院没有合法被告','court-win':'原告胜诉','court-settle':'庭外和解','court-lose':'原告败诉'} as Record<string,string>)[notice.message] ?? notice.message
  if (notice.message === 'portal-cancel') return '魔法门：保持原地'
  if (notice.message === 'portal-arrived') return '魔法门：已抵达目的地'
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
  if(notice.message==='carnival-result')return '游乐场奖券到账'
  if(notice.message==='ludo-result')return '投注结果'
  return notice.message
}
watch(() => interaction.value?.kind, kind => {
  if (kind === 'credit-choice') creditAmount.value = props.game.credit[player.value.id]?.available ?? 0
  if (kind === 'bank') bankAmount.value = 0
  if (kind === 'stock') { stockId.value = 1; stockShares.value = 1 }
  companyCalculatorOpen.value = false
  if (kind === 'ticket-exchange') { exchangeQuantity.value = 0; exchangeLoaded.value = false }
})
watch(bankAction, () => { bankAmount.value = 0 })
watch(stockId, () => { stockShares.value = 1 })
</script>

<template>
  <section v-if="interaction" class="interaction" :style="{ '--activity-width': `${presentationClip?.frames[0]?.width ?? 462}px` }" :class="{ 'targeting-panel': interaction.kind === 'target-choice', 'minigame-panel': ['ludo','carnival'].includes(interaction.kind), 'exchange-panel': interaction.kind === 'ticket-exchange', 'portal-panel': interaction.kind === 'portal', 'court-panel': interaction.kind === 'court', 'court-transfer': interaction.kind==='court' && ['transfer','holding'].includes(interaction.stage), 'presentation-panel': presentationBlocking && !['portal','court'].includes(interaction.kind) }" role="dialog" aria-label="对局交互" data-testid="interaction-panel">
    <CarnivalStage v-if="interaction.kind==='carnival' && activityAssets" :game="interaction.game" :paused="paused" :human="player.controller==='human'" :assets="activityAssets" @input="emit('carnival-input',$event)" @ready="emit('activity-ready',$event)" @asset-error="emit('asset-error',$event)" />
    <LudoActivity v-else-if="interaction.kind==='ludo'" :game="interaction.game" :human="player.controller==='human'" :paused="paused" :assets="activityAssets" :asset-profile="assetProfile" @wager="emit('place-wager',$event)" @confirm="emit('confirm-wagers')" @ready="emit('activity-ready',$event)" @asset-error="emit('asset-error',$event)" />
    <template v-else-if="interaction.kind === 'portal'">
      <div v-if="interaction.stage === 'choice'" class="portal-original">
        <NativeActivity v-if="portalClip" data-testid="portal-original" :clip="portalClip" :preload="portalPrepared" :overlays="portalOverlays" @ready="emit('activity-ready',$event)" @asset-error="emit('asset-error',$event)" />
        <img v-else data-testid="portal-original" :src="nativeImageUrl('station')" alt="魔法门分布图" @error="reportImageError">
        <button v-for="destination in 5" :key="destination" :data-testid="`portal-${destination}`" class="original-hotspot portal-choice" :style="nativeHotspot('station',17,destination === 5 ? 319 : 88+(destination-1)*54,139,37)" :disabled="!canAct" :aria-label="destination === 5 ? '保持原地' : PORTALS[destination-1]?.name" @click="emit('choose-portal',destination)">{{ destination === 5 ? '保持原地' : PORTALS[destination-1]?.name }}</button>
        <p v-if="interaction.error" class="error">{{ interaction.error }}</p>
      </div>
      <span v-else class="sr-only" data-testid="portal-flight" :data-frame="interaction.flight?.frames">魔法门飞行途中</span>
    </template>
    <template v-else-if="interaction.kind === 'court'">
      <div v-if="['target','case','judgement'].includes(interaction.stage)" class="court-original">
        <NativeActivity v-if="courtClip" data-testid="court-original" :key="courtClip.id" :clip="courtClip" :preload="courtPrepared" :overlays="courtOverlays" :text="courtText" @pointerdown="interaction.stage === 'judgement' && emit('skip-activity')" @ready="emit('activity-ready',$event)" @asset-error="emit('asset-error',$event)" />
        <img v-else data-testid="court-original" :src="nativeImageUrl(courtClipId)" alt="法院" @error="reportImageError">
        <template v-if="interaction.stage === 'target'"><button v-for="(target,index) in eligibleCourtPlayers" :key="target.id" :data-testid="`court-target-${target.id}`" class="original-hotspot court-target" :style="nativeHotspot('court-target',490,252+index*50,190,48)" :disabled="!canAct" @click="emit('court-target',target.id)">{{ target.name }}</button></template>
        <template v-else-if="interaction.stage === 'case'"><button v-for="item in COURT_CASES" :key="item.id" :data-testid="`court-case-${item.id}`" class="original-hotspot court-case" :style="nativeHotspot('court-case',300,254+item.id*82,192,78)" :disabled="!canAct" @click="emit('court-case',item.id)">{{ item.name }} · {{ item.days }}天</button></template>
        <p v-if="interaction.error" class="error">{{ interaction.error }}</p>
      </div>
      <NativeActivity v-else-if="interaction.stage === 'transfer' && (interaction.verdictFrame ?? 45)<45 && activityClip('show2')" class="court-transit-verdict" :clip="activityClip('show2')!" :frame="interaction.verdictFrame" :text="verdictText" @asset-error="emit('asset-error',$event)" />
      <span v-else class="sr-only">拘留转运处理中</span>
    </template>
    <template v-else-if="presentationBlocking && presentation && ['fog','car2'].includes(presentation.clipId)">
      <span class="sr-only">{{ presentation.clipId === 'fog' ? '帐篷开启中' : '送医途中' }}</span>
    </template>
    <template v-else-if="presentationBlocking && presentation && presentationClip">
      <NativeActivity :key="presentationClip.id" :clip="presentationClip" :frame="presentation.frame" :text="activityText" :viewport="presentation.clipId === 'car2'" @pointerdown="emit('skip-activity')" @ready="emit('activity-ready', $event)" @asset-error="emit('asset-error', $event)" />
      <button v-if="presentation.clipId.startsWith('trait-') && presentation.frame >= 10 && presentation.frame < 55" :disabled="paused" @click="emit('skip-activity')">继续动画</button>
    </template>
    <template v-else-if="interaction.kind === 'ticket-exchange'">
      <div class="exchange-original">
        <NativeActivity v-if="exchangeClip" :key="exchangeClip.id" :clip="exchangeClip" :text="{ money: String(player.cash), jiang: String(game.tickets[player.id]) }" @ready="exchangeLoaded = true" @asset-error="emit('asset-error', $event)" />
        <img v-else data-testid="exchange-original" :src="originalExchangeUrl" alt="奖券兑换" @error="reportImageError">
        <form data-testid="exchange-form" class="exchange-form" @submit.prevent="emit('exchange-tickets', exchangeQuantity)">
          <label>{{ interaction.mode === 'sell' ? '兑奖张数' : '购券张数' }}
            <input v-model.number="exchangeQuantity" data-testid="exchange-quantity" type="number" min="0" :max="exchangeMaximum" step="1" :disabled="!canAct || !!exchangeClip && !exchangeLoaded">
          </label>
          <small>单次最多 100 张 · 本次上限 {{ exchangeMaximum }} · 每张 100 元</small>
          <p>{{ interaction.mode === 'sell' ? `现金 +${exchangeQuantity * 100} · 奖券 -${exchangeQuantity}` : `现金 -${exchangeQuantity * 100} · 奖券 +${exchangeQuantity}` }}</p>
          <p v-if="interaction.error" class="error" role="alert">{{ interaction.error }}</p>
          <div class="actions"><button data-testid="exchange-submit" type="submit" :disabled="!canAct || !!exchangeClip && !exchangeLoaded">确定</button><button type="button" :disabled="!canAct || !!exchangeClip && !exchangeLoaded" @click="emit('leave-exchange')">放弃</button></div>
        </form>
      </div>
    </template>
    <template v-else-if="cardInteraction && card">
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
        <strong>{{ card.name }} · 在地图上点击目标格</strong><p>拖动地图不会提交；玩家卡也可直接选择下方真实位置。</p>
        <div class="target-actions"><div class="targets"><button v-for="target in targetPlayers" :key="target.id" :data-testid="`target-player-${target.id}`" :disabled="!canAct" @click="emit('choose', { kind: 'cell', position: target.position })">{{ target.name }} · {{ target.position.column }},{{ target.position.row }}</button></div>
        <button data-testid="interaction-cancel" :disabled="!canAct" @click="emit('cancel')">取消</button></div>
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
      <h3>本月资产排名</h3><ol data-testid="monthly-standings"><li v-for="row in getAssetStandings(game)" :key="row.playerId">{{ row.rank ?? '出局' }} · {{ row.name }} · 净资产 {{ row.netWorth }}</li></ol>
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
      <p class="balance">{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }}</p>
      <div v-if="!companyCalculatorOpen" class="company-original">
        <img data-testid="company-original-frame" :src="companyDialogUrl" alt="" @error="reportImageError">
        <h2>{{ landedCompany.name }}</h2>
        <div class="company-summary">
          <p>承销价 {{ landedCompany.basePrice }} · 待认购 {{ landedCompany.offerShares }} 股</p>
          <p>已持 {{ landedCompany.holdings[player.id]?.shares ?? 0 }} 股 · 董事：{{ game.players.find(value => value.id === landedCompany?.ceoId)?.name ?? '暂无' }}</p>
          <p>累计经营费 {{ landedCompany.profit }}</p>
          <p v-if="interaction.chargeEntry">本次经营费 {{ actualChanges(interaction.chargeEntry) || '账户无变化' }}</p>
          <p v-if="interaction.chargeEntry?.diceFaces">骰子 {{ interaction.chargeEntry.diceFaces[0] }} + {{ interaction.chargeEntry.diceFaces[1] }} = {{ interaction.chargeEntry.diceFaces[0] + interaction.chargeEntry.diceFaces[1] }}</p>
        </div>
      </div>
      <p v-if="interaction.error" class="error" role="alert">{{ interaction.error }}</p>
      <h2 v-if="companyCalculatorOpen">{{ landedCompany.name }} · 承销价 {{ landedCompany.basePrice }}</h2>
      <CompanyCalculator v-if="companyCalculatorOpen" :maximum="companyMaximum" :price="landedCompany.basePrice" :disabled="!canAct" @confirm="$event === 0 ? emit('leave-company') : emit('subscribe-company', $event)" @cancel="closeCompanyCalculator" @asset-error="emit('asset-error', $event)" />
      <template v-else>
        <small>本次最多认购 {{ companyMaximum }} 股</small>
        <div class="actions"><button ref="companySubscribeButton" data-testid="company-subscribe" :disabled="!canAct || companyMaximum < 1" @click="companyCalculatorOpen = true">认购</button><button data-testid="company-leave" :disabled="!canAct" @click="emit('leave-company')">离开公司</button></div>
      </template>
    </template>

    <template v-else-if="interaction.kind === 'notice'">
      <span class="eyebrow">结算结果</span><h2>{{ noticeText(interaction) }}</h2>
      <img v-if="interaction.notice.luckEvent" data-testid="luck-image" class="luck" :src="luckAssetUrl(interaction.notice.luckEvent.id)" :alt="`运气事件 ${interaction.notice.luckEvent.id}`" @error="reportImageError">
      <p v-if="interaction.notice.financeEntry" class="amount">{{ actualChanges(interaction.notice.financeEntry) || '账户无变化' }}</p>
      <p v-else-if="interaction.notice.receipt" data-testid="activity-receipt" class="amount">{{ activityChanges(interaction.notice.receipt) }}</p>
      <p v-else-if="interaction.notice.amount !== undefined && interaction.notice.amount !== 0" class="amount">{{ interaction.notice.luckEvent?.kind === 'cash' || interaction.notice.eventKind === 'god-encountered' && interaction.notice.npcId === 3 ? '现金' : interaction.notice.kind === 'tickets' || interaction.notice.kind === 'shop' ? '奖券' : '数值' }} {{ interaction.notice.amount > 0 ? '+' : '' }}{{ interaction.notice.amount }}</p>
      <p>{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }} · 奖券 {{ game.tickets[player.id] }}</p>
      <p>状态：{{ statusText }}</p>
      <button data-testid="interaction-acknowledge" :disabled="!canAct" @click="emit('acknowledge')">知道了，继续</button>
    </template>
  </section>
</template>

<style scoped>
.interaction.minigame-panel{width:min(800px,calc(100% - var(--game-sidebar-width,0px) - 36px),calc((100cqh - 36px) * 4 / 3));padding:0;background:transparent;border:0;overflow:visible}
.interaction.portal-panel{width:min(814px,calc(100% - var(--game-sidebar-width,0px) - 36px),calc((100cqh - 36px) * 814 / 614));padding:0;background:transparent;border:0;overflow:visible}.interaction.court-panel{width:min(824px,calc(100% - var(--game-sidebar-width,0px) - 36px),calc((100cqh - 36px) * 824 / 624));padding:0;background:transparent;border:0;overflow:visible}.portal-original,.court-original{position:relative;width:100%}.portal-original>img,.court-original>img{display:block;width:100%;height:auto}.portal-map{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.original-hotspot{position:absolute;color:transparent;background:transparent;border:0;padding:0}.original-hotspot:hover{color:transparent;background:#fff2;outline:2px solid #fff7}.interaction.court-transfer{left:0;top:0;bottom:0;transform:none;width:calc(100% - var(--game-sidebar-width,0px));max-height:none}.court-transit-verdict{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:408px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.interaction.exchange-panel{width:min(824px,calc(100% - var(--game-sidebar-width,0px) - 36px),calc((100cqh - 36px) * 824 / 624));padding:0;background:transparent;border:0}.exchange-original{position:relative;width:100%;aspect-ratio:824/624}.exchange-original>img{display:block;width:100%;height:auto}.exchange-form{position:absolute;left:9%;top:42%;width:43%;display:grid;gap:10px;color:#182d45;font-size:16px}.exchange-form label{display:grid;gap:6px}.exchange-form input{width:120px;padding:7px;font:inherit}.exchange-form small{font-size:12px}.exchange-form p{font-size:13px}.interaction.presentation-panel{left:calc((100% - var(--game-sidebar-width,0px)) / 2);top:50%;bottom:auto;transform:translate(-50%,-50%);width:min(var(--activity-width,462px),70%);padding:0;background:transparent;border:0;box-shadow:none;overflow:visible}.presentation-panel:has([data-clip="car2"]){width:calc(100% - var(--game-sidebar-width,0px));max-height:none}.presentation-panel:has([data-clip="fog"]){width:182px}.presentation-panel>button{position:absolute;right:20px;bottom:15px}
.company-original{position:relative;width:408px;max-width:100%;aspect-ratio:408/356;margin:8px auto}.company-original>img{display:block;width:100%;height:100%}.company-original>h2{position:absolute;left:24%;top:10%;margin:0;color:white;font-size:21px}.company-summary{position:absolute;left:9%;top:27%;width:82%;height:55%;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:6px;color:#153043}.company-summary p{margin:0;font-size:14px}
.interaction{position:absolute;z-index:5;left:calc((100% - var(--game-sidebar-width,0px)) / 2);top:50%;bottom:auto;transform:translate(-50%,-50%);width:min(510px,calc(100% - var(--game-sidebar-width,0px) - 36px));max-height:calc(100% - 36px);overflow:auto;box-sizing:border-box;background:#112f3bf5;color:#f1f8f5;border:1px solid #ffe18a;border-radius:15px;box-shadow:0 18px 42px #07151dcc;padding:18px 20px;font:14px/1.45 system-ui,"PingFang SC",sans-serif}.eyebrow{color:#ffe18a;font-size:11px;letter-spacing:.11em}h2{margin:4px 0 9px;font-size:21px}p{margin:6px 0}.card-head{display:flex;gap:14px}.card-head img{width:78px;height:80px;object-fit:contain}.card-head p{color:#bed1d4}.balance,.amount{padding:8px 10px;background:#254f5c;border-radius:8px}.error{color:#ffd0c4;border:1px solid #d77867;background:#612f2b;padding:8px;border-radius:8px}.actions,.dice,.targets,.sell-list{display:flex;gap:7px;flex-wrap:wrap}.choice{display:grid;gap:10px}.choice label{display:grid;gap:5px}.choice input,.choice select{font:inherit;padding:8px;border:1px solid #73929a;border-radius:7px;background:#ecf4f1;color:#17313a}.dice button{min-width:42px;font-size:17px}.shop-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0}.shop-grid button{min-width:0;padding:5px 2px;display:grid;place-items:center;gap:2px}.shop-grid img{width:42px;height:44px;object-fit:contain}.shop-grid span,.shop-grid small{font-size:9px;white-space:nowrap}.sell-list{max-height:86px;overflow:auto;margin:7px 0 12px}.finance-lines{max-height:260px;overflow:auto;padding-left:20px}.finance-lines li{margin:6px 0}.finance-lines small{display:block;color:#bfd0d3}.luck{display:block;width:min(360px,100%);aspect-ratio:4/3;object-fit:contain;margin:8px auto;background:#fff3;border-radius:9px}button{font:inherit;background:#2a5361;color:#eff8f5;border:1px solid #66858e;border-radius:7px;padding:7px 10px;cursor:pointer}button:hover{background:#386b7a}button:disabled{opacity:.42;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid #ffe18a;outline-offset:2px}@media(max-width:900px){.interaction{width:calc(100% - 24px);max-height:calc(100% - 24px)}.shop-grid{grid-template-columns:repeat(4,1fr)}}
.interaction.targeting-panel{top:12px;transform:translateX(-50%);width:min(620px,calc(100% - 24px));padding:10px 12px;pointer-events:none}.targeting-panel .card-head,.targeting-panel .balance{display:none}.targeting-panel .target-choice{gap:4px}.targeting-panel .target-choice p{margin:0;font-size:12px}.targeting-panel .target-actions{display:flex;align-items:center;justify-content:space-between;gap:8px}.targeting-panel .target-actions button{pointer-events:auto}.targeting-panel .targets button{font-size:12px;padding:5px 7px}
</style>
