<script setup lang="ts">
import { computed,ref } from 'vue'
import { profileAssetUrl,type AssetProfile } from '../assets/profiles'
import UiIcon from '../game/UiIcon.vue'
import type { SaveSlot } from './snapshot-types'
const props=defineProps<{slots:SaveSlot[];canSave:boolean;busy:boolean;error:string;hasGame:boolean;message?:string;retryable?:boolean;assetProfile?:AssetProfile}>()
const emit=defineEmits<{save:[slot:number];load:[slot:number];refresh:[];close:[];retry:[]}>()
const confirm=ref<{kind:'save'|'load';slot:number}|null>(null)
const emblemUrl = computed(()=>`${import.meta.env.BASE_URL}${profileAssetUrl('assets/ui/emblem.png',props.assetProfile??'original')}`)
const slotState = (slot: SaveSlot) => slot.summary ? '已有存档' : slot.revision === 0 ? '空槽' : '摘要异常'
function save(slot:SaveSlot){if(slot.revision>0)confirm.value={kind:'save',slot:slot.slot};else emit('save',slot.slot)}
function load(slot:SaveSlot,hasGame:boolean){if(hasGame)confirm.value={kind:'load',slot:slot.slot};else emit('load',slot.slot)}
function accept(){const choice=confirm.value;confirm.value=null;if(choice?.kind==='save')emit('save',choice.slot);else if(choice)emit('load',choice.slot)}
</script>
<template>
 <section class="save-panel" role="dialog" aria-modal="true" aria-label="手动存读档" :aria-busy="busy">
  <header class="save-header">
   <img :src="emblemUrl" alt="" class="save-emblem">
   <div><h2>手动存读档</h2><p>保存旅程 · 随时继续对局</p></div>
   <span class="save-seal"><UiIcon name="save"/><span>本机存档<small>3 个手动槽位</small></span></span>
  </header>
  <p class="save-note">三个槽位保存在本机服务。仅点击保存才写入。</p>
  <div class="save-feedback">
   <p v-if="hasGame&&!canSave" class="notice">当前不能保存。请在稳定等待掷骰或对局结束时打开。</p>
   <p v-if="busy" class="notice processing" role="status"><UiIcon name="save"/>正在处理，请稍候…</p>
   <p v-if="error" class="notice error" role="alert">{{ error }}</p>
   <p v-if="message" class="notice success" role="status">{{ message }}</p>
  </div>
  <div class="slot-list">
   <article v-for="slot in slots" :key="slot.slot" class="slot-card" :class="{ 'slot-empty':slot.revision===0, 'slot-unavailable':slot.revision>0&&!slot.summary }" :data-testid="`save-row-${slot.slot}`" :aria-label="`槽位 ${slot.slot}，${slotState(slot)}`">
    <div class="slot-badge" aria-hidden="true"><UiIcon name="save"/><span>0{{ slot.slot }}</span></div>
    <div class="slot-content">
     <div class="slot-heading"><h3>槽位 {{ slot.slot }}</h3><span class="slot-status">{{ slotState(slot) }}</span><small>修订 {{ slot.revision }}</small></div>
     <template v-if="slot.summary">
      <div class="slot-progress"><strong>第{{ slot.summary.round }}轮</strong><span>{{ slot.summary.date }}</span></div>
      <ul class="slot-players" aria-label="对局玩家"><li v-for="(player,index) in slot.summary.players" :key="index">{{ player }}</li></ul>
      <p class="slot-timestamp">保存时间 <time v-if="slot.savedAt" :datetime="slot.savedAt">{{ new Date(slot.savedAt).toLocaleString('zh-CN') }}</time><span v-else>未知</span></p>
     </template>
     <template v-else><p class="slot-placeholder">{{ slot.revision===0?'空槽':'此槽位损坏或版本不兼容' }}</p><p class="slot-help">{{ slot.revision===0?'把当前旅程保存在这里':'无法显示摘要，可尝试读取或覆盖此槽位' }}</p></template>
    </div>
    <div class="slot-actions">
     <button class="primary-button" :data-testid="`save-slot-${slot.slot}`" :disabled="!canSave||busy" @click="save(slot)"><UiIcon name="save"/>保存至此槽</button>
     <button class="secondary-button" :data-testid="`load-slot-${slot.slot}`" :disabled="slot.revision===0||busy" @click="load(slot,hasGame)"><UiIcon name="play"/>读取此槽</button>
    </div>
   </article>
  </div>
  <div v-if="confirm" class="confirm" role="alertdialog" aria-label="确认存档操作">
   <div><strong>槽位 {{ confirm.slot }} · {{ confirm.kind==='save'?'覆盖存档':'读取存档' }}</strong><p>{{ confirm.kind==='save'?'覆盖该槽位的现有存档？':'读取将替换当前对局，尚未手动保存的进度会丢失。' }}</p></div>
   <div class="confirm-actions"><button class="primary-button" :data-testid="confirm.kind==='save'?'save-confirm':'load-confirm'" :disabled="busy" @click="accept">确认{{ confirm.kind==='save'?'覆盖':'读取' }}</button><button class="secondary-button" :disabled="busy" @click="confirm=null">取消</button></div>
  </div>
  <footer class="save-footer"><button class="quiet-button" :disabled="busy" @click="emit('refresh')">重新查看槽位</button><button v-if="retryable" class="quiet-button retry-button" :disabled="busy" @click="emit('retry')">重试同一保存请求</button><button class="secondary-button close-button" @click="emit('close')">关闭，返回对局</button></footer>
 </section>
</template>
<style scoped>
.save-panel{position:fixed;z-index:80;top:50%;left:50%;transform:translate(-50%,-50%);width:min(780px,94vw);max-height:94dvh;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;min-height:0;overflow:hidden;padding:19px;background:linear-gradient(#e4f5ff,#d9edfc);border:3px solid #f8fdff;border-radius:20px;color:#1a507c;box-shadow:0 0 0 2px #399ce9,0 12px 32px #164b8166,0 0 0 100vmax #123c677d;font:14px/1.45 system-ui,"PingFang SC",sans-serif}.save-header{display:flex;align-items:center;gap:11px;flex:none;padding-bottom:12px;border-bottom:1px solid #a2cfee}.save-emblem{width:48px;height:48px;object-fit:contain}.save-header h2{margin:0;font-size:25px;line-height:1.2;color:#1467b2;letter-spacing:.06em}.save-header p{margin:3px 0 0;font-size:12px;color:#5680a0}.save-seal{display:flex;align-items:center;gap:8px;margin-left:auto;color:#397fb5;font-weight:700;white-space:nowrap;font-size:12px}.save-seal>.ui-icon{width:28px;height:28px}.save-seal small{display:block;font-size:10px;font-weight:400;color:#5b829f;letter-spacing:.05em}.save-note{flex:none;margin:0;color:#527c9b;font-size:12px}.save-feedback{display:contents}.notice{display:flex;align-items:center;gap:7px;margin:0;padding:8px 11px;border:1px solid #c8b984;border-radius:8px;background:#fff7d9;color:#7a601e;font-size:12px;flex:none}.notice .ui-icon{width:16px;height:16px}.notice.processing{background:#eaf7ff;border-color:#8ec3e9;color:#296e9f}.notice.error{background:#fff0e8;border-color:#e5a88c;color:#904e35}.notice.success{background:#e7f7ed;border-color:#a1ceb4;color:#2f7754}.slot-list{display:grid;gap:10px;min-height:0;overflow:auto;overscroll-behavior:contain;padding:2px}.save-panel .slot-card{display:grid;grid-template-columns:70px minmax(0,1fr) 126px;align-items:center;gap:14px;min-height:133px;box-sizing:border-box;margin:0;padding:13px 14px;background:linear-gradient(110deg,#f9fdff,#ecf7ff);border:1px solid #9fcbee;border-radius:13px;box-shadow:inset 0 1px #fff,0 2px 3px #3a83b30b}.slot-badge{align-self:stretch;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:11px;background:linear-gradient(#d5f1ff,#9ed5fa);border:1px solid #b4def8;color:#216fa8;box-shadow:inset 0 1px #fff}.slot-badge .ui-icon{width:25px;height:25px}.slot-badge>span{font-size:25px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:.04em}.slot-content{min-width:0}.slot-heading{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.slot-heading h3{font-size:15px;margin:0;color:#1a639c}.slot-status{font-size:10px;color:#216c9e;background:#d7edfc;border:1px solid #b2d7f0;border-radius:20px;padding:1px 7px;white-space:nowrap}.slot-heading small{margin-left:auto;color:#6585a0;font-size:10px;white-space:nowrap}.slot-progress{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:12px;color:#4c7a9e}.slot-progress strong{font-size:17px;color:#1a5c91;line-height:1.2}.slot-players{display:flex;flex-wrap:wrap;gap:4px;list-style:none;padding:0;margin:6px 0}.slot-players li{font-size:11px;line-height:1.5;background:#e2f1fc;color:#376b92;border-radius:4px;padding:1px 6px;overflow-wrap:anywhere;max-width:100%;box-sizing:border-box}.slot-timestamp{margin:0;font-size:10px;color:#65839b;overflow-wrap:anywhere}.slot-actions{display:flex;flex-direction:column;gap:9px}.save-panel button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:35px;box-sizing:border-box;padding:6px 12px;margin:0;border-radius:9px;font:650 12px/1.3 system-ui,"PingFang SC",sans-serif;white-space:nowrap;cursor:pointer}.save-panel button .ui-icon{width:15px;height:15px}.save-panel .primary-button{background:linear-gradient(#fff7c6,#ffdd7d);border:1px solid #fff5cb;box-shadow:0 0 0 1px #dcb258,inset 0 1px #fff;color:#76531d;text-shadow:none}.save-panel .secondary-button{background:linear-gradient(#f3fcff,#c8e7fd);border:1px solid #95c3e6;box-shadow:inset 0 1px #fff;color:#215f92;text-shadow:none}.save-panel .quiet-button{background:transparent;border:1px solid transparent;box-shadow:none;color:#39749e;text-shadow:none;padding-inline:6px}.save-panel button:disabled{opacity:.45;cursor:default}.save-panel button:focus-visible{outline:3px solid #2089db;outline-offset:3px}.slot-placeholder{font-weight:650;font-size:14px;color:#517da1;margin:10px 0 3px}.slot-help{font-size:11px;color:#6788a2;margin:0;overflow-wrap:anywhere}.slot-empty .slot-badge{background:#e6f3fc;border-style:dashed;color:#78a1bd;box-shadow:none}.slot-empty .slot-status{background:#f1f7fc;color:#69879c;border-color:#d0e1ed}.slot-unavailable .slot-badge{background:linear-gradient(#fff7df,#f8e4b1);border-color:#e9cf91;color:#9b742a}.slot-unavailable .slot-status{background:#fff3d6;color:#946c21;border-color:#e9d49f}.slot-unavailable .slot-placeholder{color:#95683d}.confirm{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px;border:1px solid #dfbd6d;background:#fff6dc;border-radius:11px;color:#805e25}.confirm strong{font-size:13px}.confirm p{font-size:12px;margin:4px 0 0}.confirm-actions{display:flex;gap:8px;flex:none}.save-footer{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:none;border-top:1px solid #a2cfee;padding-top:11px}.save-footer .close-button{margin-left:auto;min-width:144px}.save-footer .retry-button{color:#986328}
@media(max-width:600px){.save-panel{padding:13px;gap:10px;width:94vw}.save-header{gap:8px;padding-bottom:10px}.save-emblem{width:38px;height:38px}.save-header h2{font-size:21px}.save-header p{font-size:10px}.save-seal{font-size:10px;gap:4px}.save-seal>.ui-icon{display:none}.save-seal small{font-size:9px}.save-note{font-size:10px}.save-panel .slot-card{grid-template-columns:45px minmax(0,1fr);gap:9px;padding:10px;min-height:0}.slot-badge{grid-row:1;min-height:72px}.slot-badge>span{font-size:21px}.slot-badge .ui-icon{width:21px;height:21px}.slot-heading{gap:6px}.slot-heading h3{font-size:13px}.slot-heading small{font-size:9px}.slot-status{font-size:9px;padding-inline:5px}.slot-progress{font-size:11px;gap:8px;margin-top:5px}.slot-progress strong{font-size:16px}.slot-players{gap:3px;margin:5px 0}.slot-players li{font-size:10px}.slot-timestamp{font-size:9px}.slot-placeholder{margin:5px 0 3px;font-size:12px}.slot-help{font-size:10px}.slot-actions{grid-column:1/-1;flex-direction:row;gap:8px}.slot-actions button{flex:1;min-height:33px}.save-footer{gap:5px;padding-top:9px}.save-footer .close-button{min-width:0}.save-panel button{font-size:11px;padding:6px 9px}.confirm{align-items:stretch;flex-direction:column;gap:9px;padding:10px}.confirm-actions button{flex:1}.notice{font-size:11px}.save-footer:has(.retry-button) .close-button{width:100%}}
@media(max-height:600px){.save-panel{max-height:94dvh;gap:8px;padding:12px 16px}.save-header{padding-bottom:7px}.save-emblem{width:35px;height:35px}.save-header h2{font-size:21px}.save-header p{display:none}.save-panel .slot-card{min-height:112px;padding-block:10px}.slot-list{gap:8px}.save-footer{padding-top:8px}.save-note{font-size:11px}}
</style>
