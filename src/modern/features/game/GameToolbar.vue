<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GameState } from './types'
import UiIcon from './UiIcon.vue'
import { profileAssetUrl,type AssetProfile } from '../assets/profiles'
const props = defineProps<{ game?: GameState; detailsOpen: boolean; blocked: boolean; fullscreen: boolean; busy: boolean; status: string;assetProfile?:AssetProfile }>()
const emit = defineEmits<{ saves: []; details: []; fullscreen: [] }>()
const settingsOpen = ref(false)
const active = computed(() => props.game?.players[props.game.activePlayerIndex])
const date = computed(() => props.game ? `${props.game.world.month}月${props.game.world.day}日 ${['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][props.game.world.weekday]}` : '正在准备对局')
const asset = (name: string) => `${import.meta.env.BASE_URL}${profileAssetUrl(`assets/ui/${name}.png`,props.assetProfile??'original')}`
watch(() => props.blocked, value => { if (value) settingsOpen.value = false })
</script>
<template>
  <header class="game-toolbar" :inert="blocked">
    <h1 class="sr-only">星猫大富翁 · 现代对局</h1>
    <div class="game-status-bar">
      <img class="brand-emblem" :src="asset('emblem')" alt="StarQ">
      <span class="game-date" data-testid="hud-date">{{ date }}<small v-if="game">第 {{ game.round }} 轮</small></span>
      <div v-if="active && game" class="hud-metrics">
        <span class="hud-metric"><img :src="asset('cash')" alt=""><span>现金 <b data-testid="hud-cash">{{ active.cash }}</b></span></span>
        <span class="hud-metric"><img :src="asset('deposit')" alt=""><span>存款 <b data-testid="hud-deposit">{{ active.deposit }}</b></span></span>
        <span class="hud-metric"><img :src="asset('tickets')" alt=""><span>奖券 <b data-testid="hud-tickets">{{ game.tickets[active.id] }}</b></span></span>
      </div>
      <span class="sr-only" role="status">{{ status }}</span>
    </div>
    <nav class="game-utilities" aria-label="游戏工具">
      <button data-testid="open-saves" :disabled="busy" @click="emit('saves')"><UiIcon name="save"/><span>存读档</span></button>
      <button data-testid="game-settings" :aria-expanded="settingsOpen" aria-controls="game-settings-panel" @click="settingsOpen=!settingsOpen"><UiIcon name="settings"/><span>设置</span></button>
      <button data-testid="toggle-game-details" aria-controls="game-details" :aria-expanded="detailsOpen" @click="settingsOpen=false;emit('details')"><UiIcon name="menu"/><span>{{ detailsOpen ? '收起侧栏' : '对局面板' }}</span></button>
      <button v-if="fullscreen" @click="emit('fullscreen')">退出全屏</button>
    </nav>
    <section v-show="settingsOpen" id="game-settings-panel" class="game-settings" aria-label="游戏设置" @keydown.esc.stop.prevent="settingsOpen=false"><slot/></section>
  </header>
</template>
