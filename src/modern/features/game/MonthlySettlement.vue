<script setup lang="ts">
import { computed } from 'vue'
import { profileAssetUrl,type AssetProfile } from '../assets/profiles'
import type { GameState } from './types'
import type { FinanceEntry } from './finance-types'
import { getAssetStandings } from './queries'
import { monthlyQuotes, financeLabels, actualChanges } from './finance-presentation'

const props = defineProps<{ game: GameState; entries: FinanceEntry[]; paused: boolean; preparedImages?: Record<string, string>;assetProfile?:AssetProfile }>()
const emit = defineEmits<{ continue: []; 'asset-error': [error: Error] }>()
const standings = computed(() => getAssetStandings(props.game))
const champion = computed(() => standings.value.find(row => row.rank === 1))
const quote = computed(() => props.game.finance.monthlyQuoteIndex === null ? '' : monthlyQuotes[props.game.finance.monthlyQuoteIndex])
const portrait = (playerId: number) => {
  const characterId = props.game.players.find(player => player.id === playerId)!.characterId
  const path = `assets/monthly/champions/${characterId}.png`
  return props.preparedImages?.[path] ?? `${import.meta.env.BASE_URL}${path}`
}
const imageError = (event: Event) => emit('asset-error', new Error(`月结图片加载失败：${(event.target as HTMLImageElement).src}`))
const emblemUrl = computed(()=>`${import.meta.env.BASE_URL}${profileAssetUrl('assets/ui/emblem.png',props.assetProfile??'original')}`)
const number = (value: number) => value.toLocaleString('zh-CN')
const walletDelta = (entry: FinanceEntry) => (entry.cashDelta ?? 0) + (entry.depositDelta ?? 0)
</script>

<template>
  <div class="monthly-sheet">
    <header class="settlement-header">
      <img :src="emblemUrl" alt="" class="bank-emblem" @error="imageError">
      <div><h2>本月结算</h2><p>明日银行 · {{ game.world.year }}年{{ game.world.month }}月</p></div>
      <span class="settlement-seal">MONTHLY<br><b>资产报告</b></span>
    </header>
    <div class="monthly-summary">
      <article v-if="champion" class="champion" data-testid="monthly-champion">
        <span class="champion-title">本月冠军</span>
        <img class="champion-art" :src="portrait(champion.playerId)" :alt="`本月冠军${champion.name}`" @error="imageError">
        <div class="champion-copy"><h3>{{ champion.name }}</h3><p v-if="quote" class="champion-quote">“{{ quote }}”</p><p v-else class="champion-quote">本月净资产领跑全场</p></div>
      </article>
      <div class="ranking">
        <div class="section-title"><h3>本月资产排名</h3><span>净资产 / 元</span></div>
        <ol data-testid="monthly-standings">
          <li v-for="row in standings" :key="row.playerId" :data-player-id="row.playerId" :class="{ 'rank-first': row.rank === 1, eliminated: row.eliminated }">
            <span class="rank-number" :data-rank="row.rank">{{ row.rank ?? '—' }}</span>
            <img :src="portrait(row.playerId)" :alt="row.name" @error="imageError">
            <div class="rank-identity"><strong>{{ row.name }}</strong><small>{{ row.eliminated ? '已出局' : `地产 ${row.landCount} · 建筑 ${row.buildingCount}` }}</small></div>
            <span class="rank-assets">{{ row.eliminated ? '出局' : number(row.netWorth) }}</span>
          </li>
        </ol>
      </div>
    </div>
    <section class="monthly-finances" aria-labelledby="monthly-finances-title">
      <div class="section-title"><h3 id="monthly-finances-title">资金明细</h3><span>已结算至各账户</span></div>
      <ol v-if="entries.length" class="finance-lines" tabindex="0" aria-label="月结资金明细">
        <li v-for="(entry, index) in entries" :key="index">
          <span class="entry-symbol" :class="{ incoming: walletDelta(entry) > 0, outgoing: walletDelta(entry) < 0 }" aria-hidden="true">{{ walletDelta(entry) > 0 ? '+' : walletDelta(entry) < 0 ? '−' : '·' }}</span>
          <div class="entry-copy"><strong>{{ game.players.find(player => player.id === entry.playerId)?.name ?? '全局' }}<span> · {{ financeLabels[entry.kind] ?? entry.kind }}</span></strong><small v-if="entry.companyId">{{ game.finance.stocks[entry.companyId]?.name }}</small></div>
          <small class="entry-changes" :class="{ incoming: walletDelta(entry) > 0, outgoing: walletDelta(entry) < 0 }">{{ entry.kind === 'company-undistributed-profit' ? `来源金额 ${entry.sourceAmount}` : actualChanges(entry) }}</small>
        </li>
      </ol>
      <p v-else class="no-changes">本月没有资金变化</p>
    </section>
    <footer class="settlement-footer"><span>查看完毕后，继续新一月的旅程</span><button data-testid="monthly-acknowledge" :disabled="paused" @click="emit('continue')">确认月结，继续 <span aria-hidden="true">→</span></button></footer>
  </div>
</template>

<style scoped>
.monthly-sheet{display:flex;flex-direction:column;gap:12px;flex:1;min-height:0;color:#1a507c;font:14px/1.4 system-ui,"PingFang SC",sans-serif}.settlement-header{display:flex;align-items:center;gap:11px;flex:none;padding:0 4px 10px;border-bottom:1px solid #9bcdf0}.bank-emblem{width:44px;height:44px;object-fit:contain}.settlement-header h2{font-size:25px;line-height:1.15;color:#1266ad;margin:0 0 3px;font-weight:800;letter-spacing:.08em}.settlement-header p{margin:0;color:#507ea3;font-size:12px}.settlement-seal{margin-left:auto;text-align:right;font-size:9px;letter-spacing:.12em;color:#6192bb;line-height:1.5}.settlement-seal b{font-size:13px;letter-spacing:.15em;color:#2d7dbb}.monthly-summary{display:grid;grid-template-columns:210px minmax(0,1fr);gap:18px;flex:none}.champion{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;flex-direction:column;border-radius:14px;background:radial-gradient(ellipse at 50% 40%,#fff8cf,#fff8e9 55%,#d1ebff);border:1px solid #f4d98b;padding:8px 10px 10px;min-width:0}.champion::before,.champion::after{content:"";position:absolute;z-index:-1;width:110px;height:110px;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 94%,50% 72%,21% 94%,32% 57%,2% 35%,39% 35%);background:#ffdf6d55;transform:rotate(-16deg);left:-30px;top:40px}.champion::after{width:70px;height:70px;left:auto;right:-12px;top:0;transform:rotate(18deg)}.champion-title{font-size:12px;letter-spacing:.16em;font-weight:800;color:#8b591c}.champion-art{width:138px;height:120px;object-fit:contain;filter:drop-shadow(0 5px 3px #759fc233)}.champion-copy{text-align:center;min-width:0}.champion-copy h3{font-size:19px;margin:0;color:#815323}.champion-quote{font-size:11px;line-height:1.5;color:#805c39;margin:4px 0 0;overflow-wrap:anywhere}.section-title{display:flex;justify-content:space-between;gap:8px;align-items:center;flex:none;margin-bottom:7px}.section-title h3{margin:0;font-size:14px;color:#225f90}.section-title>span{font-size:10px;color:#557ea1}.ranking ol{padding:0;margin:0;list-style:none;display:grid;gap:5px}.ranking li{display:flex;align-items:center;gap:8px;min-width:0;min-height:40px;padding:4px 9px;background:#eff9ff;border:1px solid #b6dcf5;border-radius:10px;box-sizing:border-box}.ranking li.rank-first{background:#fff8de;border-color:#ecca72}.rank-number{width:22px;height:24px;display:grid;place-items:center;flex:none;font-size:14px;font-weight:800;color:#326a97}.rank-number[data-rank="1"]{border-radius:50%;background:linear-gradient(#ffeaa0,#e2a540);color:#7a4b10;box-shadow:inset 0 0 0 2px #fff3b9}.rank-number[data-rank="2"]{color:#4e6a8a}.rank-number[data-rank="3"]{color:#996348}.ranking img{width:32px;height:32px;object-fit:contain;flex:none}.rank-identity{display:grid;min-width:0;gap:1px}.rank-identity strong{font-size:12px;white-space:nowrap}.rank-identity small{font-size:9px;color:#557b9a}.rank-assets{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:800;font-size:17px;color:#155d96;white-space:nowrap}.eliminated{opacity:.65}.monthly-finances{flex:1;min-height:65px;display:flex;flex-direction:column}.monthly-sheet .finance-lines{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;list-style:none;padding:0 7px 0 0;margin:0;max-height:none;border-top:1px solid #b7dbf2}.finance-lines li{display:flex;align-items:center;gap:9px;padding:7px 4px;margin:0;border-bottom:1px solid #c6e1f3}.entry-symbol{display:grid;place-items:center;flex:none;width:25px;height:25px;background:#e6f1fb;border-radius:8px;font-size:18px;font-weight:700}.incoming{color:#207356!important}.outgoing{color:#a2532d!important}.entry-symbol.incoming{background:#d8f0e4}.entry-symbol.outgoing{background:#fff0dc}.entry-copy{min-width:0;flex:1}.entry-copy strong{font-size:12px;font-weight:650;display:block}.entry-copy strong span{font-weight:400}.entry-copy small{font-size:10px;display:block;color:#557e9f}.monthly-sheet .entry-changes{font-size:11px;max-width:46%;text-align:right;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.no-changes{margin:0;flex:1;display:grid;place-items:center;font-size:12px;color:#5b809f;border-top:1px solid #b7dbf2}.settlement-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex:none;border-top:1px solid #a2cfee;padding-top:10px}.settlement-footer>span{font-size:11px;color:#527b9d}.settlement-footer button{flex:none;min-height:36px;padding:7px 20px;border-radius:10px;border:1px solid #fff8cc;background:linear-gradient(#fff5b9,#ffd36c);box-shadow:0 0 0 1px #dba749,inset 0 1px #fff;color:#704a15;font:700 13px system-ui;cursor:pointer}.settlement-footer button:disabled{opacity:.45;cursor:default}.settlement-footer button:focus-visible{outline:3px solid #218be0;outline-offset:3px}.settlement-footer button span{margin-left:10px}
@media(max-width:620px){.monthly-sheet{gap:9px}.settlement-header{padding-bottom:7px;gap:8px}.bank-emblem{width:35px;height:35px}.settlement-header h2{font-size:21px}.settlement-header p{font-size:11px}.settlement-seal{font-size:8px}.settlement-seal b{font-size:11px}.monthly-summary{grid-template-columns:1fr;gap:9px}.champion{min-height:82px;flex-direction:row;gap:5px;padding:5px 10px}.champion-title{position:absolute;right:10px;top:7px;font-size:10px;letter-spacing:.08em}.champion-art{width:95px;height:77px;flex:none}.champion-copy{padding-top:12px;text-align:left}.champion-copy h3{font-size:17px}.champion-quote{font-size:10px;margin-top:1px}.ranking li{min-height:34px;padding:2px 7px;gap:6px}.ranking ol{gap:4px}.ranking img{width:26px;height:26px}.rank-identity small{display:none}.rank-assets{font-size:16px}.section-title{margin-bottom:5px}.section-title h3{font-size:13px}.monthly-finances{min-height:65px}.settlement-footer{padding-top:8px}.settlement-footer>span{display:none}.settlement-footer button{width:100%;min-height:35px}.entry-copy strong{font-size:11px}.monthly-sheet .entry-changes{font-size:10px}.finance-lines li{padding:6px 2px;gap:7px}}
</style>
