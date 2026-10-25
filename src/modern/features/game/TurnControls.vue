<script setup lang="ts">
import { computed } from 'vue'
import HandPanel from './HandPanel.vue'
import UiIcon from './UiIcon.vue'
import { profileAssetUrl } from '../assets/profiles'
import type { GameState } from './types'
import type { InteractionAsset } from './interaction-assets'
import type { AssetProfile } from '../assets/profiles'

const props = defineProps<{
  game: GameState
  paused: boolean
  cardAssets: InteractionAsset[]
  preparedImages?: Record<string, string>
  assetProfile?: AssetProfile
}>()
const emit = defineEmits<{
  roll: []; pause: []; 'begin-card': [index: number]; 'asset-error': [error: Error, cardId: number]
}>()
const assetBase = import.meta.env.BASE_URL
const active = computed(() => props.game.players[props.game.activePlayerIndex]!)
const canRoll = computed(() => !props.paused && props.game.phase === 'awaiting-roll' && active.value.controller === 'human')
const showingPreviousTurn = computed(() => props.game.phase === 'awaiting-roll' && props.game.lastRoll !== null)
</script>

<template>
  <section class="turn-controls" aria-label="回合操作">
    <div class="roll-controls">
      <div class="turn-portrait" aria-hidden="true"><img :src="`${assetBase}${profileAssetUrl(`assets/activities/face-${active.characterId}/1.png`,assetProfile ?? 'original')}`" alt=""></div>
      <strong data-testid="current-player">{{ active.name }} · {{ active.controller === 'human' ? '人类' : active.controller === 'autoplay' ? '托管' : 'AI' }}</strong>
      <span data-testid="last-roll">骰子 {{ game.lastRoll ?? '—' }}{{ showingPreviousTurn ? '（上一回合）' : '' }}</span>
      <span data-testid="remaining-steps">剩余 {{ game.remainingSteps }} 步</span>
      <div class="actions">
        <button class="roll" :disabled="!canRoll" @click="emit('roll')"><UiIcon name="dice"/><span>掷骰</span></button>
        <button class="pause" :aria-label="paused ? '继续对局' : '暂停对局'" @click="emit('pause')"><UiIcon :name="paused ? 'play' : 'pause'"/><span>{{ paused ? '继续' : '暂停' }}</span></button>
      </div>
    </div>
    <HandPanel :game="game" :paused="paused" :card-assets="cardAssets" :prepared-images="preparedImages" :asset-profile="assetProfile" @begin-card="emit('begin-card', $event)" @asset-error="(error, cardId) => emit('asset-error', error, cardId)" />
  </section>
</template>

<style scoped>
.turn-controls{flex:none;display:grid;grid-template-columns:190px minmax(0,1fr);gap:18px;align-items:center;padding:12px 16px;background:#162f3df5;border-top:1px solid #4f6c76;color:#eaf4f1;font:14px/1.45 system-ui,"PingFang SC",sans-serif}.roll-controls{display:grid;grid-template-columns:1fr 1fr;gap:5px}.roll-controls strong{grid-column:1/-1;font-size:16px}.roll-controls>span{font-size:12px;color:#bfd0d3}.actions{grid-column:1/-1;display:flex;gap:8px;margin-top:5px}button{font:inherit;background:#2a5361;color:#eff8f5;border:1px solid #5d7d87;border-radius:8px;padding:9px 12px;cursor:pointer}button:focus-visible{outline:2px solid #ffe18a;outline-offset:2px}button:disabled{opacity:.42;cursor:default}.roll{background:#ffe18a;color:#23373c;border-color:#ffe18a;font-weight:700;min-width:72px}
.turn-controls :deep(.hand){border:0;padding:0;min-width:0}.turn-controls :deep(.cards){grid-template-columns:repeat(8,minmax(0,1fr))}.turn-controls :deep(.cards button){border:1px solid #5d7d87;border-radius:7px;color:#eaf4f1;cursor:pointer}.turn-controls :deep(.cards button:disabled){cursor:default}.turn-controls :deep(.cards button:focus-visible){outline:2px solid #ffe18a;outline-offset:2px}.turn-controls :deep(.cards img){width:42px;height:44px}
@media(max-width:700px){.turn-controls{grid-template-columns:1fr;gap:10px;padding:10px}.roll-controls{grid-template-columns:1fr auto;align-items:center}.roll-controls strong{grid-column:1}.roll-controls>span{display:none}.actions{grid-column:2;grid-row:1;margin:0}.turn-controls :deep(.cards){grid-template-columns:repeat(4,minmax(0,1fr))}.turn-controls :deep(.cards img){width:32px;height:34px}.turn-controls :deep(.cards span){font-size:11px}}
@media(max-height:600px){.turn-controls{grid-template-columns:150px minmax(0,1fr);gap:8px;padding:6px 10px}.roll-controls{display:flex;flex-direction:column;align-items:flex-start;gap:3px}.roll-controls strong{font-size:13px}.roll-controls>span{display:none}.actions{margin:0;gap:5px}.actions button{font-size:12px;padding:7px 8px}.roll{min-width:48px}.turn-controls :deep(.hand){gap:4px}.turn-controls :deep(.hand header){font-size:12px}.turn-controls :deep(.hand header strong){display:none}.turn-controls :deep(.cards){display:flex;overflow-x:auto;gap:4px}.turn-controls :deep(.cards button){flex:0 0 48px}.turn-controls :deep(.cards img){width:24px;height:26px}.turn-controls :deep(.cards span){font-size:10px}.turn-controls :deep(.cards small){font-size:10px}.turn-controls :deep(.hint){display:none}}
</style>
