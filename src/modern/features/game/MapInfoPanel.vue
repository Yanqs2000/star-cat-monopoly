<script setup lang="ts">
import type { MapInspection } from './queries'
import { profileAssetUrl,type AssetProfile } from '../assets/profiles'
const props=defineProps<{ info: MapInspection;assetProfile?:AssetProfile }>()
const emit = defineEmits<{ close: [] }>()
const asset = (name: string) => `${import.meta.env.BASE_URL}${profileAssetUrl(`assets/ui/${name}.png`,props.assetProfile??'original')}`
</script>
<template>
  <aside class="map-info" data-testid="map-info" aria-label="地图地点信息">
    <header><img :src="asset('emblem')" alt=""><div><small>{{ info.kind === 'property' ? '街道地产' : info.kind === 'company' ? '公司档案' : '城市地点' }}</small><strong>{{ info.name }}</strong></div><button aria-label="关闭地图信息" @click="emit('close')">×</button></header>
    <div class="map-location"><span aria-hidden="true">⌖</span> 位置 {{ info.position.column }}, {{ info.position.row }}<span>地图查询</span></div>
    <template v-if="info.kind === 'property'">
      <div class="property-overview"><div><small>地价 / 元</small><b>{{ info.price }}</b></div><div class="building-level"><strong>{{ info.level }}级</strong><div data-testid="map-property-level" role="img" :aria-label="`建筑等级 ${info.level} / 5`"><i v-for="level in 5" :key="level" class="level-step" :class="{ 'is-built': level <= info.level }" :style="{ height: `${9 + level * 4}px` }"></i></div></div></div>
      <p class="owner-line">地主：<strong>{{ info.ownerName }}</strong></p>
      <div class="toll-details"><p>同街基础过路费 <strong>{{ info.baseToll }}</strong></p><p class="current-toll"><img :src="asset('cash')" alt="">当前玩家应付 <strong>{{ info.toll }}</strong></p></div>
    </template>
    <template v-else-if="info.kind === 'company'">
      <p class="owner-line">总裁：<strong>{{ info.ceoName }}</strong></p>
      <div class="company-profit"><img :src="asset('deposit')" alt=""><div><small>累计盈利</small><b>{{ info.profit }}</b></div></div>
      <div class="toll-details"><p>待购股份 <strong>{{ info.offerShares }}</strong></p><p>承销价 <strong>{{ info.basePrice }}</strong></p></div>
    </template>
    <div v-else-if="info.amount !== undefined" class="company-profit"><img :src="asset('cash')" alt=""><div><small>累计金额 </small><b>{{ info.amount }}</b></div></div>
    <p v-else class="place-note">点击地块和建筑，查看地产、公司与地点信息。</p>
  </aside>
</template>
<style scoped>
.map-info{position:absolute;z-index:4;top:50%;left:50%;transform:translate(-50%,-50%);width:min(305px,calc(100% - var(--game-sidebar-width,0px) - 24px));box-sizing:border-box;padding:15px;border:3px solid #f8fdff;border-radius:18px;background:#dff1ff;color:#1a507c;font:13px/1.5 system-ui,"PingFang SC",sans-serif;box-shadow:0 0 0 2px #399ce9,0 12px 32px #164b8166}.map-info header{display:flex;gap:9px;align-items:center}.map-info header>img{width:37px;height:37px;object-fit:contain}.map-info header>div{flex:1;min-width:0}.map-info header strong{display:block;font-size:18px;color:#1467b2}.map-info small{color:#517b9c;font-size:10px;display:block}.map-info button{border:1px solid #f9fdff;border-radius:8px;background:linear-gradient(#d0f2ff,#4fb0f6 48%,#238ce7 52%,#7ccaff);box-shadow:0 0 0 1px #6baee4,inset 0 1px white;color:#124c83;font:20px/1 system-ui;cursor:pointer;padding:5px 8px;align-self:flex-start}.map-info button:focus-visible{outline:3px solid #f3b417;outline-offset:3px}.map-location{display:flex;align-items:center;gap:5px;border-bottom:1px solid #a7cfee;color:#6085a1;font-size:10px;margin:10px 0 12px;padding-bottom:9px}.map-location>span:last-child{margin-left:auto;color:#4e91c3}.map-location>span:first-child{font-size:16px}.property-overview{display:flex;align-items:center;justify-content:space-between;border:1px solid #acd4ed;border-radius:10px;background:#f4fbff;padding:10px 12px}.property-overview b{font-size:25px;line-height:1.3;font-variant-numeric:tabular-nums;color:#1c6ba6}.building-level{text-align:right}.building-level>strong{font-size:11px;color:#3b80af}.building-level>div{display:flex;align-items:flex-end;gap:3px;height:30px}.level-step{display:block;width:10px;background:#d5e9f6;border:1px solid #bed6e7;border-radius:3px 3px 1px 1px}.level-step.is-built{background:linear-gradient(#83d3ff,#2999e4);border-color:#4aa4df}.map-info .owner-line{font-size:12px;margin:11px 2px}.owner-line strong{color:#2276b2}.toll-details{border-top:1px solid #afd3ed;padding-top:6px}.toll-details p{display:flex;align-items:center;gap:5px;justify-content:space-between;margin:5px 0;font-size:11px;color:#5b809b}.toll-details p strong{margin-left:auto;color:#285e87;font-variant-numeric:tabular-nums}.toll-details .current-toll{background:#c8e8fc;margin:8px 0 0;padding:8px;border:1px solid #a7d2ee;border-radius:8px;color:#266c9f}.current-toll img{width:23px;height:23px;object-fit:contain}.toll-details .current-toll strong{font-size:20px;color:#1467b2}.company-profit{display:flex;gap:12px;align-items:center;padding:12px;background:#f1faff;border:1px solid #b0d6ef;border-radius:10px;margin:12px 0}.company-profit>img{width:44px;height:44px;object-fit:contain}.company-profit b{font-size:25px;color:#1c6ba6}.map-info .place-note{font-size:12px;line-height:1.8;margin:0;color:#517b9c}@media(max-width:700px){.map-info{padding:12px;width:min(290px,calc(100% - 24px))}.map-info header strong{font-size:17px}}
</style>
