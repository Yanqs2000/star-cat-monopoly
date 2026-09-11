<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { LogEntry } from '@/core/types'

const props = defineProps<{ log: LogEntry[] }>()

const box = ref<HTMLElement | null>(null)
/** 只渲染最近 60 条，避免长局把 DOM 撑爆 */
const tail = computed(() => props.log.slice(-60))

watch(
  () => props.log.length,
  async () => {
    await nextTick()
    if (box.value) box.value.scrollTop = box.value.scrollHeight
  },
)
</script>

<template>
  <div class="log-panel">
    <div class="head"><span class="dot" />星猫播报</div>
    <div ref="box" class="list">
      <p v-for="(entry, i) in tail" :key="i" class="item" :class="entry.tone">
        <span class="day num">D{{ entry.day }}</span>{{ entry.text }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.log-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--r-md);
  background: rgba(28, 20, 56, 0.58);
  border: 1.5px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.head {
  flex: 0 0 auto;
  padding: 9px 13px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.62);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 8px var(--gold);
}
.list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.list::-webkit-scrollbar {
  width: 6px;
}
.list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.22);
  border-radius: 3px;
}
.item {
  font-size: 11.5px;
  line-height: 1.5;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.82);
  padding: 5px 9px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.06);
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  word-break: break-word;
}
.item.good {
  border-left-color: #51cf66;
}
.item.bad {
  border-left-color: #ff6b6b;
}
.item.system {
  border-left-color: var(--gold);
  background: rgba(255, 212, 59, 0.12);
}
.item.trade {
  border-left-color: #4dabf7;
  background: rgba(77, 171, 247, 0.12);
}
.day {
  font-size: 9.5px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.4);
  margin-right: 6px;
}
</style>
