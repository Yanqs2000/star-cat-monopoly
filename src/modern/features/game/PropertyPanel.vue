<script setup lang="ts">
import { computed } from 'vue'
import mapJson from '../../data/map.json'
import type { Parcel } from '../map/types'
import { streetRentItems } from './property'
import type { GameState } from './types'
import propertyArtwork from '../../../../public/modern/assets/properties/manifest.json'
import { neutralHouses } from '../../../../public/modern/assets/world/manifest.json'
import { profileAssetUrl, profileSpriteTransform, type AssetProfile } from '../assets/profiles'

const props = withDefaults(defineProps<{ game: GameState; paused: boolean; previewing?: boolean; assetProfile?: AssetProfile; preparedImages?: Record<string, string> }>(), { assetProfile: 'original' })
const emit = defineEmits<{ decide: [choice: 'accept' | 'decline']; acknowledge: []; 'asset-error': [error: Error] }>()
const offer = computed(() => props.game.propertyOffer)
const parcel = computed(() => (mapJson.parcels as Parcel[]).find(item => item.id === offer.value?.parcelId))
const player = computed(() => props.game.players[props.game.activePlayerIndex]!)
const owner = computed(() => props.game.players.find(item => item.id === props.game.properties[offer.value?.parcelId ?? -1]?.ownerId))
const level = computed(() => props.game.properties[offer.value?.parcelId ?? -1]?.level ?? 0)
const event = computed(() => props.game.lastPropertyEvent)
const title = computed(() => ({ purchase: '购买住宅地', upgrade: '升级建筑', rent: '支付租金', 'max-level': '建筑已满级' })[offer.value?.kind ?? 'purchase'])
const rentItems = computed(() => offer.value?.kind === 'rent' && parcel.value ? streetRentItems(props.game.properties, offer.value.ownerId!, parcel.value.streetId, props.game.prices).map(item => ({ ...item, amount: item.amount * (props.game.world.statuses[player.value.id]?.godId === 2 ? 0 : props.game.world.statuses[player.value.id]?.godId === 3 ? 2 : 1) })) : [])
const assetUrl = (source: string) => {
  const path = source.startsWith('assets/ui/') ? source : profileAssetUrl(source, props.assetProfile)
  return props.preparedImages?.[path] ?? `${import.meta.env.BASE_URL}${path}`
}
const assetError = (source: string) => emit('asset-error', new Error(`素材加载失败：${assetUrl(source)}`))
const houseArt = (parcelId: number, next = false) => {
  const land = (mapJson.parcels as Parcel[]).find(item => item.id === parcelId)
  const property = props.game.properties[parcelId]
  return propertyArtwork.houses.find(item => item.ownerId === property?.ownerId && item.facing === land?.facing && item.level === Math.min(5, (property?.level ?? 0) + Number(next)))?.url ?? ''
}
const currentArt = computed(() => owner.value ? houseArt(parcel.value!.id) : level.value > 0 ? neutralHouses.find(item => item.facing === parcel.value?.facing && item.level === level.value)?.url ?? '' : propertyArtwork.sellSigns.find(item => item.facing === parcel.value?.facing)?.url ?? '')
const nextArt = computed(() => offer.value?.kind === 'upgrade' && props.game.phase === 'property-decision' && level.value < 5 ? houseArt(parcel.value!.id, true) : '')
const spriteStyle = (source: string) => {
  const { x, y, scaleX, scaleY } = profileSpriteTransform(source, props.assetProfile)
  return { transform: `matrix(${scaleX},0,0,${scaleY},${x},${y})` }
}
const result = computed(() => {
  const current = event.value
  if (!current) return ''
  return ({
    purchased: `购买成功，现金支付 ${current.amount}`,
    upgraded: `升级至 ${current.level} 级，现金支付 ${current.amount}`,
    'upgrade-failed': `升级失败，现金支付 ${current.amount}，建筑仍为 ${current.level} 级`,
    'rent-paid': `已支付租金 ${current.amount}，地主存款增加 ${current.amount}`,
    declined: '已放弃本次交易，资金与产权不变',
    'insufficient-cash': `现金不足，需现金 ${current.amount}；存款不可用于购买或升级`,
    'max-level': '已达 5 级，本次不收费',
  })[current.kind]
})
</script>

<template>
  <section v-if="offer && parcel && (player.controller === 'human' || offer.kind === 'rent')" class="property-panel" :class="{ 'rent-panel': offer.kind === 'rent' }" role="dialog" aria-label="地产交易" data-testid="property-panel">
    <header class="property-heading"><span class="eyebrow">{{ parcel.streetName }} · 地块 {{ parcel.id }}</span><h2>{{ title }}</h2></header>
    <div v-if="offer.kind !== 'rent'" class="property-showcase">
      <figure class="property-preview">
        <div class="property-sprite" :class="{ 'sale-sign': !owner && level === 0 }"><img data-testid="property-current-art" :src="assetUrl(currentArt)" :style="spriteStyle(currentArt)" :alt="owner ? `${owner.name}的${level}级建筑` : level > 0 ? `${parcel.streetName}中立${level}级建筑` : `${parcel.streetName}待售住宅地`" @error="assetError(currentArt)"></div>
        <figcaption>{{ owner ? `当前 ${level} 级` : level > 0 ? `中立建筑 · ${level} 级` : '待售住宅地' }}</figcaption>
      </figure>
      <span v-if="nextArt" class="upgrade-arrow" aria-hidden="true">→</span>
      <figure v-if="nextArt" class="property-preview next-preview">
        <div class="property-sprite"><img data-testid="property-next-art" :src="assetUrl(nextArt)" :style="spriteStyle(nextArt)" :alt="`升级后${level + 1}级建筑预览`" @error="assetError(nextArt)"></div>
        <figcaption>升级后预览 · {{ level + 1 }} 级</figcaption>
      </figure>
      <div v-else class="property-details"><strong>{{ parcel.streetName }}</strong><span>地价 {{ parcel.basePrice }}</span><span>{{ owner ? '已持有住宅地' : '购入后归你所有' }}</span></div>
    </div>
    <div class="ownership"><span>产权：{{ owner?.name ?? '无人' }}</span><span class="level-meter" :aria-label="`建筑等级 ${level}/5`"><i v-for="step in 5" :key="step" :class="{ filled: step <= level }"></i><small>{{ level }}/5</small></span></div>
    <p class="location">地块 {{ parcel.id }} · 道路 {{ parcel.roadCell.column }},{{ parcel.roadCell.row }} · 地价 {{ parcel.basePrice }}</p>
    <p v-if="offer.kind !== 'rent'" class="balances">{{ player.name }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }}</p>
    <template v-if="offer.kind === 'rent'">
      <p>{{ previewing ? '正在标出收费房屋…' : game.phase === 'property-result' ? '本次收费已结算' : paused ? '已暂停，继续后自动扣款' : '1 秒后自动扣款，无需操作' }}</p>
      <ul class="rent-items" tabindex="0" aria-label="收费房屋明细，可上下滚动"><li v-for="item in rentItems" :key="item.parcelId"><div class="property-sprite"><img data-testid="rent-house-art" :src="assetUrl(houseArt(item.parcelId))" :style="spriteStyle(houseArt(item.parcelId))" :alt="`${owner?.name}的地块${item.parcelId}，${game.properties[item.parcelId]!.level}级`" @error="assetError(houseArt(item.parcelId))"></div><span>#{{ item.parcelId }} · {{ game.properties[item.parcelId]!.level }}级 <strong>{{ item.amount }} 元</strong></span></li></ul>
    </template>
    <template v-if="game.phase === 'property-decision'">
      <div class="amount"><img :src="assetUrl('assets/ui/cash.png')" alt="" @error="assetError('assets/ui/cash.png')"><div><p><span>{{ offer.kind === 'rent' ? '必须支付租金' : offer.kind === 'purchase' ? '买价' : '升级费用' }} </span><strong>{{ offer.amount }}</strong></p><small>{{ offer.kind === 'rent' ? '先扣现金，不足部分扣存款' : '仅使用现金' }}</small></div></div>
      <div v-if="player.controller === 'human' && offer.kind !== 'rent'" class="actions">
        <button data-testid="property-accept" :disabled="paused || previewing" @click="emit('decide', 'accept')">{{ offer.kind === 'purchase' ? '购买' : '升级' }}</button>
        <button data-testid="property-decline" :disabled="paused || previewing" @click="emit('decide', 'decline')">放弃</button>
      </div>
    </template>
    <template v-else-if="game.phase === 'property-result'">
      <p class="result" data-testid="property-result">{{ result }}</p>
      <button v-if="player.controller === 'human' && offer.kind !== 'rent'" data-testid="property-acknowledge" :disabled="paused" @click="emit('acknowledge')">知道了，继续</button>
    </template>
  </section>
</template>

<style scoped>
.property-panel{position:absolute;left:calc((100% - var(--game-sidebar-width,0px)) / 2);top:50%;transform:translate(-50%,-50%);z-index:2;box-sizing:border-box;width:min(440px,calc(100% - var(--game-sidebar-width,0px) - 36px));max-height:calc(100% - 36px);overflow:auto;background:#d4edff linear-gradient(#effaff,#d4edff);color:#194f7b;border:3px solid #f8fdff;border-radius:20px;box-shadow:0 0 0 2px #399ce9,0 15px 35px #164b8166;padding:16px 20px;font:14px/1.45 system-ui,"PingFang SC",sans-serif}.eyebrow{color:#4181ae;font-size:11px;letter-spacing:.09em}h2{margin:2px 0 10px;font-size:24px;color:#1467b2}p{margin:7px 0}.property-showcase{display:flex;align-items:center;justify-content:center;gap:16px;padding:3px 12px 12px;background:linear-gradient(#ffffffbb,#b8e3ff99);border:1px solid #a4d1ef;border-radius:14px}.property-preview{margin:0;text-align:center;min-width:100px}.property-sprite{width:90px;height:124px;position:relative;margin:auto}.property-sprite:before{content:"";position:absolute;bottom:0;left:4px;width:84px;height:21px;border-radius:50%;background:#74b5d143;box-shadow:0 4px 7px #60a8ce29}.property-sprite img{position:absolute;width:90px;height:124px;left:0;top:0;transform-origin:0 0;object-fit:contain;filter:drop-shadow(0 3px 2px #3878a138)}.sale-sign img{width:58px;height:63px;left:16px;top:55px}.property-preview figcaption{font-size:12px;font-weight:700;margin-top:5px}.upgrade-arrow{font-size:26px;color:#3a98db}.next-preview figcaption{color:#127bb5}.property-details{display:flex;flex-direction:column;gap:5px}.property-details strong{font-size:19px}.property-details span{font-size:12px;color:#517b9c}.ownership{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:10px;font-weight:700}.level-meter{display:flex;gap:3px;align-items:center}.level-meter i{width:9px;height:12px;background:#b8d6eb;border-radius:2px;border:1px solid #8cbedf}.level-meter i.filled{background:#f9c753;border-color:#d5a53d}.level-meter small{margin-left:4px;font-size:11px}.location{font-size:11px;color:#517b9c}.balances{font-size:12px;text-align:center}.amount,.result{padding:10px;border-radius:10px;background:#c4e5fc;border:1px solid #a0cff0}.amount{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0 6px}.amount>img{width:38px;height:38px;object-fit:contain}.amount p{margin:0}.amount strong{font-size:26px;font-variant-numeric:tabular-nums;color:#1267aa}.amount small{display:block;font-size:11px;color:#517b9c}.actions{display:flex;gap:9px;margin-top:12px}.actions button{flex:1}button{font:inherit;border:1px solid white;border-radius:10px;background:linear-gradient(#fff5b4,#ffdb6e);color:#714d13;font-weight:700;padding:10px 18px;cursor:pointer;box-shadow:0 0 0 1px #6baee4}button:disabled{opacity:.45;cursor:default}button:focus-visible{outline:2px solid #1979bc;outline-offset:3px}.actions button+button{background:linear-gradient(#d0f2ff,#61b5f4);color:#124c83}.rent-panel{top:auto;bottom:12px;transform:translateX(-50%);padding:10px 16px;max-height:48%;font-size:12px}.rent-panel h2{font-size:18px;margin:2px 0}.rent-panel .location{display:none}.rent-panel .ownership{margin:4px 0}.rent-panel p{margin:3px 0}.rent-panel .amount{padding:5px;margin:6px 0 0}.rent-panel .amount strong{font-size:23px}.rent-panel .amount>img{width:30px;height:30px}.rent-items{display:flex;flex-wrap:wrap;gap:6px;padding:0;list-style:none;margin:6px 0}.rent-items li{display:flex;align-items:center;gap:6px;flex:1;min-width:130px;padding:3px 8px;background:#f5fbffbb;border:1px solid #a9d5f1;border-radius:10px}.rent-items .property-sprite{zoom:.5;flex:none;margin:0}.rent-items strong{display:block;font-size:16px;color:#1467b2}@media(max-width:900px){.property-panel{left:50%;width:calc(100% - 24px);max-height:calc(100% - 24px)}}@media(max-width:480px){.property-panel{padding:12px 14px}.property-showcase{gap:10px}.rent-panel{max-height:48%;padding:8px 12px}.rent-items li{min-width:110px;padding:2px 5px}.rent-items strong{font-size:14px}.rent-items .property-sprite{zoom:.42}.rent-panel .ownership .level-meter{display:none}}
.property-panel.rent-panel{display:flex;flex-direction:column;overflow:hidden}.rent-panel .property-heading,.rent-panel .ownership,.rent-panel>p,.rent-panel .amount,.rent-panel .result{flex:none}.rent-panel .rent-items{flex:1 1 auto;min-height:0;overflow:auto;align-content:flex-start;overscroll-behavior:contain}
@media(max-height:600px){.property-panel.rent-panel{max-height:calc(100% - 24px)}}
</style>
