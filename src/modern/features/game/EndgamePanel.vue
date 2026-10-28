<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from './types'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'
const props=withDefaults(defineProps<{game:GameState;paused:boolean;preparedImages?:Record<string,string>;assetProfile?:AssetProfile}>(),{assetProfile:'original'})
const emit=defineEmits<{'acknowledge':[];'restart':[];'selection':[];'asset-error':[error:Error]}>()
const bankruptcy=computed(()=>props.game.interaction?.kind==='bankruptcy'?props.game.interaction:null)
const actor=computed(()=>props.game.players.find(player=>player.id===(bankruptcy.value?.playerId ?? props.game.outcome?.winnerId)))
const art=computed(()=>bankruptcy.value?'bankrupt':props.game.outcome?.kind==='victory'?'gamewin':'gameover')
const artUrl=computed(()=>{const path=profileAssetUrl(`assets/activities/${art.value}/1.png`,props.assetProfile);return props.preparedImages?.[path] ?? `${import.meta.env.BASE_URL}${path}`})
const assetUrl=(source:string,profiled=true)=>{const path=profiled?profileAssetUrl(source,props.assetProfile):source;return props.preparedImages?.[path] ?? `${import.meta.env.BASE_URL}${path}`}
const assetError=(url:string)=>emit('asset-error',new Error(`素材加载失败：${url}`))
const portrait=(characterId:number)=>assetUrl(`assets/monthly/champions/${characterId}.png`,false)
const sharesReturned=computed(()=>bankruptcy.value?Object.values(bankruptcy.value.receipt.sharesReturned).reduce((a,b)=>a+b,0):0)
</script>
<template>
 <section v-if="bankruptcy || game.outcome" class="endgame" data-testid="endgame-panel" aria-label="对局结果">
  <header class="endgame-heading"><span>{{ bankruptcy?'资产清算':'本局结算' }}</span><h2>{{ bankruptcy?`${actor?.name}破产`:game.outcome?.kind==='victory'?`${actor?.name}胜出`:game.eliminatedPlayerIds.length===game.players.length?'玩家全部出局，对局结束':'人类玩家已出局，对局结束' }}</h2></header>
  <div class="endgame-body" tabindex="0" aria-label="对局结果详情">
   <div class="endgame-hero" :class="{ 'bankruptcy-hero': bankruptcy }">
    <img class="result-art" :src="artUrl" alt="原版对局结果画面" @error="assetError(artUrl)">
    <div v-if="actor" class="actor-spotlight"><img data-testid="endgame-actor-art" :src="portrait(actor.characterId)" :alt="actor.name" @error="assetError(portrait(actor.characterId))"><strong>{{ actor.name }}</strong><span>{{ bankruptcy?'本局出局':'本局胜出' }}</span></div>
   </div>
   <template v-if="bankruptcy">
    <div class="liquidation-funds">
     <div><img :src="assetUrl('assets/ui/cash.png')" alt="" @error="assetError(assetUrl('assets/ui/cash.png'))"><span>现金 {{ bankruptcy.receipt.cashBefore }} → 0</span></div>
     <div><img :src="assetUrl('assets/ui/deposit.png')" alt="" @error="assetError(assetUrl('assets/ui/deposit.png'))"><span>存款 {{ bankruptcy.receipt.depositBefore }} → 0</span></div>
    </div>
    <dl class="liquidation-details"><div><dt>股票回收</dt><dd><strong>{{ sharesReturned }}</strong> 股</dd></div><div><dt>地产释放</dt><dd><strong>{{ bankruptcy.receipt.propertyIds.length }}</strong> 块 <small>保留等级</small></dd></div><div><dt>贷款清理</dt><dd>{{ bankruptcy.receipt.loanBefore }} → 0</dd></div><div><dt>已用信用清理</dt><dd>{{ bankruptcy.receipt.creditUsedBefore }} → 0</dd></div></dl>
   </template>
   <template v-else>
    <p class="endgame-date">第 {{ game.round }} 轮 · {{ game.world.year }}年{{ game.world.month }}月{{ game.world.day }}日</p>
    <ul class="final-players"><li v-for="player in game.players" :key="player.id" :data-testid="`endgame-player-${player.id}`" :class="{ winner:player.id===game.outcome?.winnerId,eliminated:game.eliminatedPlayerIds.includes(player.id) }">
     <img class="player-portrait" :src="portrait(player.characterId)" :alt="player.name" @error="assetError(portrait(player.characterId))">
     <div class="player-summary"><div class="player-name"><strong>{{ player.name }}</strong><span>{{ player.id===game.outcome?.winnerId?'胜出':game.eliminatedPlayerIds.includes(player.id)?'已淘汰':'存活' }}</span></div><div class="player-funds"><span><img :src="assetUrl('assets/ui/cash.png')" alt="" @error="assetError(assetUrl('assets/ui/cash.png'))">现金 {{ player.cash }}</span><span><img :src="assetUrl('assets/ui/deposit.png')" alt="" @error="assetError(assetUrl('assets/ui/deposit.png'))">存款 {{ player.deposit }}</span></div></div>
    </li></ul>
   </template>
  </div>
  <div class="endgame-actions">
   <button v-if="bankruptcy" data-testid="bankruptcy-acknowledge" :disabled="paused || actor?.controller!=='human'" @click="emit('acknowledge')">确认破产，继续</button>
   <template v-else><button data-testid="endgame-restart" @click="emit('restart')">重新开局</button><button data-testid="endgame-selection" @click="emit('selection')">返回选人</button></template>
  </div>
 </section>
</template>
<style scoped>
.endgame{position:absolute;z-index:20;left:calc((100% - var(--game-sidebar-width,0px)) / 2);top:50%;transform:translate(-50%,-50%);width:min(600px,calc(100% - var(--game-sidebar-width,0px) - 36px));max-height:calc(100% - 36px);box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;padding:18px 20px;border:3px solid #f8fdff;border-radius:20px;background:#d4edff linear-gradient(#effaff,#d4edff);color:#194f7b;box-shadow:0 0 0 2px #399ce9,0 12px 48px #164b8166;font:14px/1.5 system-ui,"PingFang SC",sans-serif}.endgame-heading{flex:none}.endgame-heading>span{font-size:11px;color:#4181ae;letter-spacing:.12em}.endgame h2{font-size:25px;margin:2px 0 10px;color:#1467b2}.endgame-body{min-height:0;overflow:auto;overscroll-behavior:contain}.endgame-hero{display:flex;align-items:center;justify-content:center;gap:32px;min-height:150px;padding:8px 16px;border:1px solid #acd5f1;border-radius:14px;background:radial-gradient(ellipse at 75% 80%,#fff5b9 0,transparent 58%),linear-gradient(#ffffffc9,#badffd)}.endgame .result-art{width:52%;max-width:270px;max-height:175px;object-fit:contain;filter:drop-shadow(0 4px 4px #447ca73d)}.actor-spotlight{display:flex;flex-direction:column;align-items:center;min-width:100px}.actor-spotlight img{height:130px;width:110px;object-fit:contain;filter:drop-shadow(0 5px 3px #37729a55)}.actor-spotlight strong{font-size:18px;color:#2267a1}.actor-spotlight>span{padding:1px 12px;background:#ffdf6c;color:#7e5818;border-radius:12px;font-size:11px}.bankruptcy-hero{background:linear-gradient(#f5faff,#ccdeed)}.bankruptcy-hero .actor-spotlight>span{background:#d2e0eb;color:#45647e}.endgame-date{color:#517b9c;font-size:12px;text-align:center;margin:9px 0}.final-players{display:grid;grid-template-columns:1fr 1fr;gap:8px;list-style:none;padding:0;margin:0}.final-players li{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #abd0ea;border-radius:12px;background:#f7fbff}.final-players li.winner{background:linear-gradient(#fffcee,#fff0bb);border-color:#dfbf65}.player-portrait{width:44px;height:66px;object-fit:contain;flex:none}.eliminated .player-portrait{filter:saturate(.55)}.player-summary{min-width:0;flex:1}.player-name{display:flex;flex-wrap:wrap;justify-content:space-between;gap:3px;align-items:center;margin-bottom:5px}.player-name strong{font-size:13px}.player-name>span{font-size:10px;color:#517b9c;padding:0 5px;border-radius:6px;background:#deebf4}.winner .player-name>span{background:#ffdc6b;color:#795716}.player-funds{display:flex;flex-direction:column;gap:2px;font-size:11px;font-variant-numeric:tabular-nums}.player-funds>span{display:flex;align-items:center;gap:4px}.player-funds img{width:19px;height:19px;object-fit:contain}.liquidation-funds{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.liquidation-funds>div{display:flex;align-items:center;gap:7px;padding:10px;background:#f5fbff;border:1px solid #abd0ea;border-radius:10px;font-weight:700}.liquidation-funds img{width:32px;height:32px;object-fit:contain}.liquidation-details{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 0}.liquidation-details>div{padding:8px 12px;border-radius:10px;background:#c4e5fc}.liquidation-details dt{font-size:11px;color:#517b9c}.liquidation-details dd{margin:1px 0 0}.liquidation-details strong{font-size:20px}.liquidation-details small{font-size:10px;color:#517b9c}.endgame-actions{flex:none;display:flex;gap:10px;margin-top:14px;padding-top:10px;border-top:1px solid #b6d5ed}.endgame button{flex:1;padding:10px 16px;border:1px solid white;border-radius:10px;background:linear-gradient(#d0f2ff,#61b5f4);color:#124c83;box-shadow:0 0 0 1px #6baee4;font:inherit;font-weight:700;cursor:pointer}.endgame button:first-child{background:linear-gradient(#fff5b4,#ffdb6e);color:#714d13}.endgame button:disabled{opacity:.4;cursor:default}.endgame button:focus-visible{outline:2px solid #1979bc;outline-offset:3px}@media(max-width:900px){.endgame{left:50%;width:min(600px,calc(100% - 24px))}}@media(max-width:480px){.endgame{padding:12px 14px}.endgame h2{font-size:23px}.endgame-hero{gap:12px;padding:8px;min-height:130px}.endgame .result-art{width:55%;max-height:145px}.actor-spotlight{min-width:85px}.actor-spotlight img{height:110px;width:85px}.actor-spotlight strong{font-size:15px}.final-players{gap:6px}.final-players li{gap:4px;padding:6px}.player-portrait{width:30px;height:58px}.player-name strong{font-size:12px}.player-funds{font-size:10px}.player-funds img{width:15px;height:15px}.liquidation-funds>div{gap:5px;font-size:11px;padding:8px}.liquidation-funds img{width:24px;height:24px}.endgame button{font-size:13px;padding:10px 8px}}
</style>
