<script setup lang="ts">
import { ref } from 'vue'
import type { SaveSlot } from './snapshot-types'
defineProps<{slots:SaveSlot[];canSave:boolean;busy:boolean;error:string;hasGame:boolean;message?:string;retryable?:boolean}>()
const emit=defineEmits<{save:[slot:number];load:[slot:number];refresh:[];close:[];retry:[]}>()
const confirm=ref<{kind:'save'|'load';slot:number}|null>(null)
function save(slot:SaveSlot){if(slot.revision>0)confirm.value={kind:'save',slot:slot.slot};else emit('save',slot.slot)}
function load(slot:SaveSlot,hasGame:boolean){if(hasGame)confirm.value={kind:'load',slot:slot.slot};else emit('load',slot.slot)}
function accept(){const choice=confirm.value;confirm.value=null;if(choice?.kind==='save')emit('save',choice.slot);else if(choice)emit('load',choice.slot)}
</script>
<template>
 <section class="save-panel" role="dialog" aria-modal="true" aria-label="手动存读档">
  <h2>手动存读档</h2>
  <p>三个槽位保存在本机服务。仅点击保存才写入。</p>
  <p v-if="hasGame&&!canSave">当前不能保存。请在稳定等待掷骰或对局结束时打开。</p>
  <p v-if="busy" role="status">正在处理，请稍候…</p>
  <p v-if="error" role="alert">{{ error }}</p><p v-if="message" role="status">{{ message }}</p>
  <article v-for="slot in slots" :key="slot.slot" :data-testid="`save-row-${slot.slot}`">
   <strong>槽位 {{ slot.slot }} · 修订 {{ slot.revision }}</strong>
   <template v-if="slot.summary"><p>第{{ slot.summary.round }}轮 · {{ slot.summary.date }} · {{ slot.summary.players.join('、') }}</p><p>保存时间 {{ slot.savedAt ? new Date(slot.savedAt).toLocaleString() : '未知' }}</p></template>
   <p v-else>{{ slot.revision===0?'空槽':'此槽位损坏或版本不兼容' }}</p>
   <button :data-testid="`save-slot-${slot.slot}`" :disabled="!canSave||busy" @click="save(slot)">保存至此槽</button>
   <button :data-testid="`load-slot-${slot.slot}`" :disabled="slot.revision===0||busy" @click="load(slot,hasGame)">读取此槽</button>
  </article>
  <div v-if="confirm" class="confirm" role="alertdialog" aria-label="确认存档操作">
   <p>{{ confirm.kind==='save'?'覆盖该槽位的现有存档？':'读取将替换当前对局，尚未手动保存的进度会丢失。' }}</p>
   <button :data-testid="confirm.kind==='save'?'save-confirm':'load-confirm'" :disabled="busy" @click="accept">确认{{ confirm.kind==='save'?'覆盖':'读取' }}</button>
   <button :disabled="busy" @click="confirm=null">取消</button>
  </div>
  <footer><button :disabled="busy" @click="emit('refresh')">重新查看槽位</button><button v-if="retryable" :disabled="busy" @click="emit('retry')">重试同一保存请求</button><button @click="emit('close')">关闭，返回对局</button></footer>
 </section>
</template>
<style scoped>
.save-panel{position:fixed;z-index:80;top:50%;left:50%;transform:translate(-50%,-50%);width:min(600px,94vw);max-height:92vh;overflow:auto;padding:20px;background:#173744;border:2px solid #8ab4bf;border-radius:14px;color:#edf8f8;box-shadow:0 0 0 100vmax #001b29aa;font:14px/1.5 system-ui}.save-panel h2{margin-top:0}.save-panel article{padding:12px;border:1px solid #648491;border-radius:8px;margin:10px 0}.save-panel p{margin:8px 0}.save-panel button{padding:8px 12px;margin:4px;border-radius:6px;border:1px solid #7094a0;background:#ffe18a;color:#15313d;cursor:pointer}.save-panel button:disabled{opacity:.45;cursor:default}.confirm{padding:12px;border:1px solid #ffe18a}footer{display:flex;flex-wrap:wrap}
</style>
