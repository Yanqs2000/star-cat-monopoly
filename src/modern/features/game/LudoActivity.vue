<script setup lang="ts">
import { computed,ref,watch } from 'vue'
import NativeActivity from './NativeActivity.vue'
import type { ActivityManifest,NativeOverlay } from './activity-assets'
import { LUDO_CELLS,type LudoGame } from './ludo'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'
const props=withDefaults(defineProps<{game:LudoGame;paused:boolean;human:boolean;assets?:ActivityManifest;assetProfile?:AssetProfile}>(),{assetProfile:'original'})
const emit=defineEmits<{wager:[id:number];confirm:[];ready:[id:string];'asset-error':[error:Error]}>()
const loaded=ref(false)
const find=(id:string)=>props.assets?.clips.find(c=>c.id===id)
const clipId=computed(()=>props.game.stage==='betting'?props.human?'ludo-betting':'ludo-ai-betting':'ludo-game')
const clip=computed(()=>find(clipId.value))
const posterUrl=computed(()=>import.meta.env.BASE_URL+profileAssetUrl('assets/activities/'+clipId.value+'/1.png',props.assetProfile))
watch(clipId,()=>{loaded.value=false})
const canAct=computed(()=>props.human&&!props.paused&&props.game.stage==='betting'&&(!props.assets||loaded.value))
const prepared=computed(()=>['ludo-chip','ludo-dice','ludo-win','show2',...[1,2,3,4,5,6].flatMap(i=>[`ludo-face-${i}`,`ludo-shadow-${i}`])].map(find).filter(c=>!!c))
const overlays=computed(()=>{
 const g=props.game,items:NativeOverlay[]=[],chip=find('ludo-chip')
 if(chip&&g.stage==='betting') {
  for(let i=0;i<g.remaining;i++)items.push({clip:chip,frame:1,x:740-i*10,y:520})
  const counts:Record<number,number>={}
  for(const id of g.placements){const n=counts[id] ?? 0;counts[id]=n+1;items.push({clip:chip,frame:1,x:LUDO_CELLS[id]!.type===2?50+(id===7?120:260)+n*5:50+id%6*80+n*4+4,y:LUDO_CELLS[id]!.type===2?275:75+Math.trunc(id/6)*80+30})}
 }
 if(g.stage!=='betting') {
  const dice=find('ludo-dice'),frame=g.stage==='rolling'?Math.max(1,g.frame):40
  if(dice){items.push({clip:dice,frame,x:640,y:200});for(const placement of dice.frames[frame-1]?.placements ?? []) {
   const index=Number(placement.name.slice(2)),face=index===1?g.displayFaces[0]:index===2?g.displayFaces[1]:index===3?frame>=17?g.faces[0]:1:index===4?frame>=18?g.faces[1]:1:index===6?frame>=19?g.faces[2]:1:1
   const c=find(`ludo-${index<4?'face':'shadow'}-${face}`)
   if(c)items.push({clip:c,frame:1,x:640+placement.x,y:200+placement.y,matrix:placement.matrix})
  }}
  const win=find('ludo-win')
  if(win&&g.paid)for(const id of g.winningCells)items.push({clip:win,frame:(g.frame%40)+1,x:50+(id===7?120:id===9?280:id%6*80),y:75+(id===7||id===9?160:Math.trunc(id/6)*80)})
  const show=find('show2')
  if(show&&g.stage==='payout'&&g.payout===0&&g.frame<45)items.push({clip:show,frame:Math.max(1,g.frame),x:290,y:315,text:{show_say1:'衰~~~~',show_say2:'你的运气实在糟糕透了!'}})
  if(chip&&g.stage==='awards')for(let i=0;i<g.remaining+g.payout;i++)items.push({clip:chip,frame:1,x:560+Math.trunc(i/50)*50,y:520-i%50*5})
 }
 return items
})
const label=(id:number)=>{const c=LUDO_CELLS[id]!;return c.type===0?`三同号${c.value}`:c.type===1?`和值${c.value}`:c.value===0?'小（3至10）':'大（11至18）'}
function ready(id:string){loaded.value=true;emit('ready',id)}
</script>
<template>
 <div class="ludo-activity" data-testid="ludo-original" :data-stage="game.stage" :data-frame="game.frame">
  <NativeActivity v-if="clip" :key="clipId" :clip="clip" :text="{pay:String(game.remaining)}" :preload="prepared" :overlays="overlays" @ready="ready" @asset-error="emit('asset-error',$event)" />
  <img v-else :src="posterUrl" alt="原版投注盘">
  <template v-if="game.stage==='betting'&&human">
   <button v-for="(_,id) in LUDO_CELLS" :key="id" :data-testid="`ludo-cell-${id}`" class="hotspot cell" :style="{left:`${(50+id%6*80)/8}%`,top:`${(75+Math.trunc(id/6)*80)/6}%`}" :aria-label="label(id)" :disabled="!canAct||game.remaining<=0" @click="emit('wager',id)">{{ label(id) }}</button>
   <button data-testid="ludo-confirm" class="hotspot confirm" :disabled="!canAct" @click="emit('confirm')">开奖</button>
  </template>
  <p class="summary" aria-live="polite">{{ game.stage==='betting'?`剩余 ${game.remaining} 个筹码 · 入场奖券 -${game.debit}`:game.stage==='rolling'?'三骰开奖中':`骰子 ${game.faces.join('、')} · 奖券返还 +${game.credit} · 本场净变化 ${game.credit-game.debit}` }}</p>
 </div>
</template>
<style scoped>
.ludo-activity{position:relative;width:100%;aspect-ratio:4/3}.ludo-activity>img{display:block;width:100%}.hotspot{position:absolute;padding:0;border:0;border-radius:0;background:transparent;color:transparent;cursor:pointer}.hotspot:hover{outline:2px solid #ffe18a;background:#fff2}.hotspot:focus-visible{outline:3px solid #ffe18a}.cell{width:10%;height:13.33333%}.confirm{left:73%;top:74%;width:15%;height:8%}.hotspot:disabled{cursor:default}.summary{position:absolute;bottom:1%;left:2%;right:2%;margin:0;padding:6px;color:#f8fbff;background:#112c3bdd;font-size:13px;pointer-events:none}
</style>
