<script setup lang="ts">
import { computed } from 'vue'
import mapJson from '../../data/map.json'
import type { Parcel } from '../map/types'
import { getPropertySummary } from './property'
import type { GameState } from './types'

const props = defineProps<{
  game: GameState
  paused: boolean
  speed: number
  history: string[]
}>()
const emit = defineEmits<{
  roll: []
  pause: []
  speed: [value: number]
  overview: []
  follow: []
  fullscreen: []
  restart: []
}>()
const active = computed(() => props.game.players[props.game.activePlayerIndex]!)
const canRoll = computed(() => !props.paused && props.game.phase === 'awaiting-roll' && active.value.controller === 'human')
const showingPreviousTurn = computed(() => props.game.phase === 'awaiting-roll' && props.game.lastRoll !== null)
const owned = computed(() => (mapJson.parcels as Parcel[]).filter(parcel => props.game.properties[parcel.id]?.ownerId === active.value.id))
const phaseText = computed(() => ({
  'awaiting-roll': active.value.controller === 'human' ? '等待人类掷骰' : 'AI 正在思考',
  moving: '逐格移动中',
  landed: '已落地，准备换人',
  'property-decision': '等待地产决定',
  'property-result': '交易结果待确认',
  insolvent: '资金耗尽，回合已停止',
}[props.game.phase]))
</script>

<template>
  <aside class="panel" aria-label="对局控制">
    <div class="panel-head">
      <div><span class="eyebrow">2C 住宅交易</span><h2 data-testid="round">第 {{ game.round }} 轮</h2></div>
      <span class="phase">{{ phaseText }}</span>
    </div>
    <div class="turn-card">
      <strong data-testid="current-player">{{ active.name }} · {{ active.controller === 'human' ? '人类' : 'AI' }}</strong>
      <span data-testid="last-roll">骰子 {{ game.lastRoll ?? '—' }}{{ showingPreviousTurn ? '（上一回合）' : '' }}</span>
      <span data-testid="remaining-steps">剩余 {{ game.remainingSteps }} 步</span>
      <span>位置 {{ active.position.column }}, {{ active.position.row }}</span>
    </div>
    <div class="primary-actions">
      <button class="roll" :disabled="!canRoll" @click="emit('roll')">掷骰</button>
      <button @click="emit('pause')">{{ paused ? '继续对局' : '暂停对局' }}</button>
      <label>速度
        <select :value="String(speed)" aria-label="速度" @change="emit('speed', Number(($event.target as HTMLSelectElement).value))">
          <option value="1">标准速度</option><option value="2">快速（2倍）</option>
        </select>
      </label>
    </div>
    <div class="camera-actions">
      <button @click="emit('follow')">跟随当前玩家</button>
      <button @click="emit('overview')">全图</button>
      <button @click="emit('fullscreen')">全屏</button>
      <button @click="emit('restart')">返回选人</button>
    </div>
    <ol class="players" data-testid="player-list">
      <li v-for="(player, index) in game.players" :key="player.id" :class="{ active: index === game.activePlayerIndex }">
        <span class="token">{{ index + 1 }}</span>
        <span><strong>{{ player.name }}</strong><small>{{ player.controller === 'human' ? '人类' : 'AI' }} · {{ player.position.column }},{{ player.position.row }}</small><small>现金 {{ player.cash }} · 存款 {{ player.deposit }}</small><small>地 {{ getPropertySummary(game.properties, player.id).landCount }} · 建筑 {{ getPropertySummary(game.properties, player.id).buildingCount }}</small></span>
      </li>
    </ol>
    <div class="property-list" data-testid="property-list"><strong>{{ active.name }}的地产</strong><span v-if="!owned.length">暂无地产</span><ol v-else><li v-for="parcel in owned" :key="parcel.id">{{ parcel.streetName }} #{{ parcel.id }} · {{ game.properties[parcel.id]?.level }} 级</li></ol></div>
    <div class="path"><strong>{{ showingPreviousTurn ? '上一回合路径' : '本回合路径' }}</strong><span>{{ game.turnPath.length ? game.turnPath.map(point => `${point.column},${point.row}`).join(' → ') : '尚未掷骰' }}</span></div>
    <div class="history" data-testid="turn-history"><strong>已发生的回合与交易</strong><ol><li v-for="(item, index) in history" :key="index">{{ item }}</li></ol></div>
    <p class="scope">2C 仅结算普通住宅地；特殊事件与完整破产流程待后续批次。</p>
  </aside>
</template>

<style scoped>
.panel{width:320px;min-width:280px;height:100%;overflow:auto;background:#162d38f2;color:#eaf4f1;border-left:1px solid #4f6c76;padding:16px;display:flex;flex-direction:column;gap:12px;font:13px/1.4 system-ui,"PingFang SC",sans-serif}
.panel-head,.turn-card,.primary-actions,.camera-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.panel-head{justify-content:space-between}.eyebrow{color:#a9c3c8;font-size:10px;letter-spacing:.12em}h2{font-size:20px;margin:2px 0}.phase{color:#ffe18a;font-size:12px}.turn-card{display:grid;grid-template-columns:1fr 1fr;background:#234652;border-radius:10px;padding:12px}.turn-card strong{grid-column:1/-1;font-size:16px}
button,select{font:inherit;background:#2a5361;color:#eff8f5;border:1px solid #5d7d87;border-radius:7px;padding:7px 9px;cursor:pointer}button:hover,select:hover{background:#376979}button:focus-visible,select:focus-visible{outline:2px solid #ffe18a;outline-offset:2px}button:disabled{opacity:.4;cursor:default}.roll,.roll:hover{background:#ffe18a;color:#23373c;border-color:#ffe18a;font-weight:700}.primary-actions label{display:flex;gap:5px;align-items:center}.camera-actions button{font-size:12px}
.players{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:7px}.players li{display:flex;align-items:center;gap:7px;padding:7px;border:1px solid #46636c;border-radius:8px}.players li.active{border-color:#ffe18a;background:#304d50}.token{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#c96f55;font-weight:700}.players small{display:block;color:#a9c3c8}.path,.history{display:flex;flex-direction:column;gap:4px;color:#bfd0d3}.path span{font-size:11px;max-height:44px;overflow:auto}.history ol{margin:0;padding-left:20px;max-height:84px;overflow:auto}.scope{margin:auto 0 0;color:#96adb3;font-size:11px}
.property-list{display:flex;flex-direction:column;gap:4px;color:#bfd0d3;border-top:1px solid #486673;padding-top:8px}.property-list ol{margin:0;padding-left:20px;max-height:84px;overflow:auto}
@media(max-width:900px){.panel{width:100%;height:auto;max-height:42vh;border-left:0;border-top:1px solid #4f6c76}.players{grid-template-columns:repeat(4,1fr)}}
</style>
