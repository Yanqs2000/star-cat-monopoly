<script setup lang="ts">
import type { PlayerState } from './types'
import { profileAssetUrl,type AssetProfile } from '../assets/profiles'
const props=defineProps<{ player:PlayerState; tickets?:number; loan?:number; preparedImages?:Record<string,string>;assetProfile?:AssetProfile }>()
const emit=defineEmits<{'asset-error':[error:Error]}>()
const image=(path:string)=>{const url=path.startsWith('assets/ui/')?profileAssetUrl(path,props.assetProfile??'original'):path;return props.preparedImages?.[url]??`${import.meta.env.BASE_URL}${url}`}
const error=(event:Event)=>emit('asset-error',new Error(`账户图片加载失败：${(event.target as HTMLImageElement).src}`))
</script>
<template>
 <div class="player-wallet" data-testid="player-wallet">
  <div class="wallet-owner"><img :src="image(`assets/monthly/champions/${player.characterId}.png`)" :alt="player.name" @error="error"><strong>{{ player.name }}</strong></div>
  <div class="wallet-values">
   <span class="wallet-value"><img :src="image('assets/ui/cash.png')" alt="" @error="error"><span>现金 <strong>{{ player.cash }}</strong></span></span>
   <span class="wallet-value"><img :src="image('assets/ui/deposit.png')" alt="" @error="error"><span>存款 <strong>{{ player.deposit }}</strong></span></span>
   <span v-if="loan!==undefined" class="wallet-value loan"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h3"/></svg><span>贷款 <strong>{{ loan }}</strong></span></span>
   <span v-else-if="tickets!==undefined" class="wallet-value"><img :src="image('assets/ui/tickets.png')" alt="" @error="error"><span>奖券 <strong>{{ tickets }}</strong></span></span>
  </div>
 </div>
</template>
<style scoped>
.player-wallet{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #aad5f3;background:linear-gradient(115deg,#f5fcff,#d9efff);border-radius:12px;color:#1d557f}.wallet-owner{display:grid;place-items:center;flex:none;min-width:48px;gap:1px}.wallet-owner>img{width:44px;height:39px;object-fit:contain}.wallet-owner>strong{font-size:10px;line-height:1.2}.wallet-values{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);flex:1;min-width:0;gap:8px}.wallet-value{display:flex;align-items:center;gap:5px;min-width:0;font-size:10px;color:#547c9c}.wallet-value>img,.wallet-value>svg{width:24px;height:25px;object-fit:contain;flex:none}.wallet-value>span{min-width:0}.wallet-value strong{display:block;font-size:17px;line-height:1.3;color:#125f9b;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.loan strong{color:#945e37}@media(max-width:620px){.player-wallet{padding:7px 8px;gap:8px}.wallet-values{gap:5px}.wallet-owner{min-width:42px}.wallet-owner>img{width:38px;height:34px}.wallet-value{gap:3px}.wallet-value>img,.wallet-value>svg{width:18px;height:20px}.wallet-value strong{font-size:14px}}
</style>
