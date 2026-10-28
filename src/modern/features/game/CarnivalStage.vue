<script setup lang="ts">
import { computed,inject,onBeforeUnmount,onMounted,ref,watch } from 'vue'
import { Application,Container,ImageSource,Sprite,Text,Texture } from 'pixi.js'
import { activityPixelDensity,loadActivityFrames,type ActivityManifest,type ActivityFrame } from './activity-assets'
import type { CarnivalGame,CarnivalInput } from './carnival'
import { listenCarnivalInputs } from './carnival-input'
import { animationFramesKey } from './animation-context'
import { carnivalPresentationFrame } from '../assets/approved-artwork'
const prepared=inject(animationFramesKey,undefined)
const props=defineProps<{game:CarnivalGame;paused:boolean;human:boolean;assets:ActivityManifest}>()
const emit=defineEmits<{input:[input:CarnivalInput];ready:[id:string];'asset-error':[error:Error]}>()
const host=ref<HTMLDivElement>(),loaded=ref(false),abort=new AbortController()
let subframeMs=0
let app:Application|undefined,removeInputs:(()=>void)|undefined
const textures=new Map<string,Texture[]>(),owned:Texture[]=[],releases:(()=>void)[]=[]
const find=(id:string)=>props.assets.clips.find(c=>c.id===id)!
const background=new Container(),objects=new Container(),labels=new Container(),intro=new Container()
function releaseResources(){owned.splice(0).forEach(t=>t.destroy(true));releases.splice(0).forEach(release=>release());textures.clear()}
function picture(container:Container,id:string,frame:number,x:number,y:number,scaleY=1) {
 const native=find(id).frames[frame-1]!,texture=textures.get(id)![frame-1]!
 const sprite=new Sprite(texture);sprite.position.set(x+native.offsetX,y+native.offsetY*scaleY);sprite.scale.y=scaleY;container.addChild(sprite)
}
function text(frame:ActivityFrame) {
 labels.removeChildren().forEach(c=>c.destroy())
 const values:Record<string,string>={f1:String(props.game.counts[0]),f2:String(props.game.counts[1]),f3:String(props.game.counts[2]),f4:String(props.game.counts[3]),f:String(props.game.score),timez:String(props.game.remainingTenths)}
 for(const field of frame.fields){const label=new Text({text:values[field.variable] ?? '',style:{fontFamily:'Songti SC,SimSun,serif',fontSize:field.fontSize,fill:0x102f41}});label.position.set(field.x+(field.align===1?field.width:field.align===2?field.width/2:0),field.y);label.anchor.x=field.align===1?1:field.align===2?.5:0;labels.addChild(label)}
}
function draw() {
 if(!loaded.value||!app)return
 for(const c of [background,objects,intro])c.removeChildren().forEach(sprite=>sprite.destroy())
 const g=props.game,id=g.stage==='tally'?'carnival-score':'carnival-play'
 picture(background,id,1,0,0)
 picture(objects,g.pose===1?`carnival-boy-${g.characterId}`:`carnival-walk-${g.characterId}-${g.pose===2?'left':'right'}`,g.pose===1?1:g.boyFrame,g.x,500)
 for(const ball of [...g.balls].sort((a,b)=>a.kind===1&&b.kind>1?-1:a.kind>1&&b.kind===1?1:a.creation-b.creation))picture(objects,`carnival-ball-${ball.kind}`,carnivalPresentationFrame(ball.frame,subframeMs,find(`carnival-ball-${ball.kind}`).fps,1),ball.x,ball.y)
 if(g.stage==='intro')picture(intro,'carnival-intro',Math.max(1,g.frame),400.05,279.85,.9993286)
 text(find(id).frames[0]!);app.render()
}
const playing=computed(()=>props.human&&!props.paused&&loaded.value&&['intro','play'].includes(props.game.stage))
onMounted(async()=>{
 const clips=['carnival-play','carnival-score','carnival-intro',`carnival-boy-${props.game.characterId}`,`carnival-walk-${props.game.characterId}-left`,`carnival-walk-${props.game.characterId}-right`,...[1,2,3,4].map(i=>`carnival-ball-${i}`)].map(find)
 try {
  if(clips.some(c=>!c))throw new Error('缺少游乐场原素材')
  const jobs=clips.map(c=>prepared?.value?.clip(c) ?? loadActivityFrames(c,abort.signal))
  const results=await Promise.allSettled(jobs)
  for(const r of results)if(r.status==='fulfilled')releases.push(r.value.release)
  const failure=results.find(r=>r.status==='rejected');if(failure?.status==='rejected')throw failure.reason
  abort.signal.throwIfAborted()
  for(let i=0;i<results.length;i++) {
   const result=results[i]!;if(result.status!=='fulfilled')continue
   const frames:Texture[]=[]
   const resolution=activityPixelDensity(clips[i]!.frames[0]!.url)
   const shared=new Map<string,Texture>()
   for(const [index,url] of result.value.urls.entries()){
    let texture=shared.get(url)
    if(!texture){
     const cached=prepared?.value?.get(clips[i]!.frames[index]!.url)
     const image=cached?.image??new Image()
     if(!cached){image.src=url;await image.decode()}
     abort.signal.throwIfAborted()
     texture=new Texture({source:new ImageSource({resource:image,resolution,scaleMode:'linear'})});shared.set(url,texture);owned.push(texture)
    }
    frames.push(texture)
   }
   textures.set(clips[i]!.id,frames)
  }
  const candidate=new Application();await candidate.init({width:800,height:600,resolution:Math.min(devicePixelRatio || 1,2),autoDensity:true,backgroundAlpha:0,autoStart:false})
  if(abort.signal.aborted){candidate.destroy({removeView:true});releaseResources();return}
  app=candidate;app.canvas.style.width='100%';app.canvas.style.height='100%';host.value!.append(app.canvas);app.stage.addChild(background,objects,labels,intro)
  loaded.value=true;draw();// Carnival uses a real 30Hz clock even when the map speed is 2x.
  if(find('carnival-ball-1').fps===60){app.ticker.add(ticker=>{if(!props.paused&&['play','tally'].includes(props.game.stage)){subframeMs+=ticker.deltaMS;draw()}});app.start()}removeInputs=listenCarnivalInputs(host.value!,()=>playing.value,input=>emit('input',input))
  // Key state belongs to the active listener and cannot remain held through a rebuild.
  if(props.game.input.kind==='key'&&props.game.input.direction!==0)emit('input',{kind:'key',direction:0})
  emit('ready','carnival-play')
 } catch(error){releaseResources();if(!abort.signal.aborted)emit('asset-error',error instanceof Error?error:new Error(String(error)))}
})
watch(()=>props.game,(next,previous)=>{if(next.frame!==previous.frame||next.stage!==previous.stage)subframeMs=next.remainderMs;try{draw()}catch(error){emit('asset-error',error instanceof Error?error:new Error(String(error)))}})
onBeforeUnmount(()=>{loaded.value=false;const current=app;app=undefined;abort.abort();removeInputs?.();current?.destroy({removeView:true},{children:true});releaseResources()})
</script>
<template>
 <div class="carnival-stage" data-testid="carnival-original" :data-stage="game.stage" :data-frame="game.frame" :data-x="game.x" :data-score="game.score" :data-boy-frame="game.boyFrame" :data-boy-pose="game.pose">
  <div ref="host" class="canvas" role="application" aria-label="游乐场接物：左右方向键、A/D或鼠标移动" tabindex="0" />
  <img v-if="!loaded && prepared?.get(find('carnival-play').frames[0]!.url)" class="loading-poster" :src="prepared.get(find('carnival-play').frames[0]!.url)!.url" alt="游乐场">
  <div v-else-if="!loaded" class="loading" role="status" aria-label="活动素材加载">正在准备游乐场画面…</div>
  <p v-else class="status" aria-live="polite">{{ game.stage==='intro'?'准备接物，3秒倒数':game.stage==='play'?`剩余 ${(game.remainingTenths/10).toFixed(1)} 秒 · 左右键 / A、D / 鼠标移动`:`计分中 · ${game.score} 张奖券` }}{{ paused?' · 已暂停':'' }}</p>
 </div>
</template>
<style scoped>
.carnival-stage{width:100%;aspect-ratio:4/3;position:relative}.canvas{width:100%;height:100%;touch-action:none}.canvas:deep(canvas){width:100%;height:100%;display:block}.status{position:absolute;left:1%;right:1%;top:1%;margin:0;padding:5px 8px;background:#123a46dd;color:white;font-size:12px;pointer-events:none}
.loading-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.loading{position:absolute;inset:0;display:grid;place-items:center;background:#173c49;color:#f8fbff;border-radius:12px;font:20px/1.5 system-ui,"PingFang SC",sans-serif;text-align:center;padding:24px;box-sizing:border-box}
</style>
