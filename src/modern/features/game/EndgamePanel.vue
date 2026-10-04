<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from './types'
const props=defineProps<{game:GameState;paused:boolean;preparedImages?:Record<string,string>}>()
const emit=defineEmits<{'acknowledge':[];'restart':[];'selection':[];'asset-error':[error:Error]}>()
const bankruptcy=computed(()=>props.game.interaction?.kind==='bankruptcy'?props.game.interaction:null)
const actor=computed(()=>props.game.players.find(player=>player.id===(bankruptcy.value?.playerId ?? props.game.outcome?.winnerId)))
const art=computed(()=>bankruptcy.value?'bankrupt':props.game.outcome?.kind==='victory'?'gamewin':'gameover')
const artUrl=computed(()=>{const path=`assets/activities/${art.value}/1.png`;return props.preparedImages?.[path] ?? `${import.meta.env.BASE_URL}${path}`})
</script>
<template>
 <section v-if="bankruptcy || game.outcome" class="endgame" data-testid="endgame-panel" aria-label="对局结果">
  <img :src="artUrl" alt="原版对局结果画面" @error="emit('asset-error',new Error(`素材加载失败：${artUrl}`))">
  <h2>{{ bankruptcy?`${actor?.name}破产`:game.outcome?.kind==='victory'?`${actor?.name}胜出`:'玩家全部出局，对局结束' }}</h2>
  <template v-if="bankruptcy">
   <p>现金 {{ bankruptcy.receipt.cashBefore }} → 0 · 存款 {{ bankruptcy.receipt.depositBefore }} → 0</p>
   <p>贷款 {{ bankruptcy.receipt.loanBefore }}、已用信用 {{ bankruptcy.receipt.creditUsedBefore }} 已清理</p>
   <p>回收 {{ Object.values(bankruptcy.receipt.sharesReturned).reduce((a,b)=>a+b,0) }} 股 · 释放 {{ bankruptcy.receipt.propertyIds.length }} 块地产（保留等级）</p>
   <button data-testid="bankruptcy-acknowledge" :disabled="paused || actor?.controller!=='human'" @click="emit('acknowledge')">确认破产，继续</button>
  </template>
  <template v-else>
   <p>第 {{ game.round }} 轮 · {{ game.world.year }}年{{ game.world.month }}月{{ game.world.day }}日</p>
   <ol><li v-for="player in game.players" :key="player.id">{{ player.name }} · {{ game.eliminatedPlayerIds.includes(player.id)?'已淘汰':'存活' }} · 现金 {{ player.cash }} · 存款 {{ player.deposit }}</li></ol>
   <button data-testid="endgame-restart" @click="emit('restart')">重新开局</button>
   <button data-testid="endgame-selection" @click="emit('selection')">返回选人</button>
  </template>
 </section>
</template>
<style scoped>
.endgame{position:absolute;z-index:20;left:50%;top:50%;transform:translate(-50%,-50%);width:min(600px,90%);max-height:90%;overflow:auto;padding:20px;border:1px solid #8ca7b0;border-radius:16px;background:#183744f5;color:#edf8f8;box-shadow:0 12px 48px #0006;font:14px/1.5 system-ui,"PingFang SC",sans-serif}.endgame img{width:100%;max-height:250px;object-fit:contain}.endgame h2{font-size:24px}.endgame button{padding:10px 16px;margin:5px;border:1px solid #6b929d;border-radius:8px;background:#ffe18a;color:#19333e;cursor:pointer}.endgame button:disabled{opacity:.4;cursor:default}
</style>
