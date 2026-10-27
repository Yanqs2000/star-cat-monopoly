<script setup lang="ts">
import type { MapInspection } from './queries'
defineProps<{ info: MapInspection }>()
const emit = defineEmits<{ close: [] }>()
</script>
<template>
  <aside class="map-info" data-testid="map-info" aria-label="地图地点信息">
    <header><strong>{{ info.name }}</strong><button aria-label="关闭地图信息" @click="emit('close')">×</button></header>
    <small>位置 {{ info.position.column }}, {{ info.position.row }}</small>
    <template v-if="info.kind === 'property'"><p>地价 {{ info.price }} · {{ info.level }}级</p><p>地主：{{ info.ownerName }}</p><p>同街基础过路费 {{ info.baseToll }}</p><p>当前玩家应付 {{ info.toll }}</p></template>
    <template v-else-if="info.kind === 'company'"><p>总裁：{{ info.ceoName }}</p><p>累计盈利 {{ info.profit }}</p><p>待购股份 {{ info.offerShares }} · 承销价 {{ info.basePrice }}</p></template>
    <p v-else-if="info.amount !== undefined">累计金额 {{ info.amount }}</p>
  </aside>
</template>
<style scoped>
.map-info{position:absolute;z-index:4;top:50%;left:50%;transform:translate(-50%,-50%);width:min(285px,calc(100% - var(--game-sidebar-width,0px) - 24px));padding:12px 14px;border:1px solid #ffe18a;border-radius:10px;background:#173744f2;color:#edf8f8;font:14px/1.5 system-ui;box-shadow:0 8px 24px #001b2955}.map-info header{display:flex;justify-content:space-between;gap:12px;align-items:center}.map-info p{margin:5px 0}.map-info small{color:#b5cdd2}.map-info button{border:1px solid #7094a0;border-radius:4px;background:#284e5d;color:white;font:18px system-ui;cursor:pointer}.map-info button:focus-visible{outline:2px solid #ffe18a}
</style>
