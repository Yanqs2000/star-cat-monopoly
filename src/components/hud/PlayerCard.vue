<script setup lang="ts">
import { computed } from 'vue'
import { catSvg } from '@/assets/catSvg'
import { GODS } from '@/core/config/gods'
import { getCharacter } from '@/core/config/characters'
import { monopoliesOf } from '@/core/rules/rent'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { GameState, Player } from '@/core/types'

const props = defineProps<{
  player: Player
  state: GameState
  isTurn: boolean
  canUseSkill: boolean
}>()

const emit = defineEmits<{ skill: [] }>()

const character = computed(() => getCharacter(props.player.characterId))
const svg = computed(() => catSvg(character.value))
const groups = computed(() => monopoliesOf(props.state, props.player.id))
const god = computed(() => (props.player.god ? GODS[props.player.god.id] : null))
const properties = computed(
  () => props.state.tiles.filter((t) => t.kind === 'property' && t.owner === props.player.id).length,
)
const skillReady = computed(() => props.player.skillCooldown <= 0)
</script>

<template>
  <article
    class="pcard"
    :class="{ turn: isTurn, out: player.out }"
    :style="{ '--pc': character.color, '--pc-soft': character.tint }"
  >
    <span v-if="!player.isAI" class="me">你</span>

    <div class="avatar" v-html="svg" />

    <div class="body">
      <div class="row">
        <span class="name">{{ player.name }}</span>
        <span class="zodiac">{{ character.zodiac }}</span>
        <span v-if="god" class="god" :title="god.desc">{{ god.icon }}</span>
      </div>
      <div class="cash num">{{ fmtMoney(player.cash) }}</div>
      <div class="meta">
        <span title="存款">🏦 {{ fmtMoney(player.deposit) }}</span>
        <span title="地产">🏠 {{ properties }}</span>
        <span v-if="player.tickets" title="奖券">🎟️ {{ player.tickets }}</span>
      </div>
      <div class="meta">
        <span v-if="groups.length" class="mono">👑 {{ groups.length }} 组垄断</span>
        <span v-if="player.tollHalfTurns > 0">🛡️ {{ player.tollHalfTurns }}</span>
        <span v-if="player.jailTurns > 0">🔒 {{ player.jailTurns }}</span>
        <span v-if="player.cards.length">🃏 {{ player.cards.length }}</span>
      </div>
    </div>

    <button
      class="skill"
      :disabled="!canUseSkill || !skillReady"
      :title="character.skill.desc"
      @click="emit('skill')"
    >
      <span>{{ character.skill.icon }}</span>
      <span>{{ character.skill.name }}</span>
      <span class="cd num">{{ skillReady ? '就绪' : `CD ${player.skillCooldown}` }}</span>
    </button>
  </article>
</template>

<style scoped>
.pcard {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  padding: 9px 11px;
  border-radius: var(--r-md);
  background: var(--panel);
  border: var(--bw) solid var(--ink);
  box-shadow: 0 4px 0 rgba(43, 33, 64, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.3s ease;
}
.pcard.turn {
  transform: translateX(4px);
  box-shadow: 0 4px 0 rgba(43, 33, 64, 0.18), 0 0 0 4px var(--pc);
}
.pcard.out {
  opacity: 0.42;
  filter: grayscale(0.7);
}

.me {
  position: absolute;
  top: -9px;
  right: 9px;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--gold);
  color: var(--ink);
  border: 2px solid var(--ink);
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: var(--pc-soft);
  border: 2px solid var(--ink);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.avatar :deep(svg) {
  width: 40px;
  height: 40px;
}

.body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.name {
  font-size: 13px;
  font-weight: 800;
}
.zodiac {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--pc-soft);
  color: var(--ink-2);
}
.god {
  font-size: 13px;
  margin-left: auto;
}
.cash {
  font-size: 14px;
  font-weight: 800;
}
.meta {
  display: flex;
  gap: 8px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ink-soft);
}
.mono {
  color: #7048e8;
  font-weight: 800;
}

.skill {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  border-radius: 10px;
  background: linear-gradient(180deg, #fff4d6, #ffe6a8);
  border: 2px solid var(--ink);
  font-size: 11.5px;
  font-weight: 800;
  box-shadow: 0 3px 0 rgba(43, 33, 64, 0.22);
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.2s ease;
}
.skill:not(:disabled):hover {
  transform: translateY(-1px);
}
.skill:not(:disabled):active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(43, 33, 64, 0.22);
}
.skill:disabled {
  filter: grayscale(0.85);
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: 0 2px 0 rgba(43, 33, 64, 0.15);
}
.skill .cd {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--ink-soft);
}
</style>
