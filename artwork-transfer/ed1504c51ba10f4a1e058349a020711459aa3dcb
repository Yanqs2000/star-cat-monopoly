import { createApp,defineComponent,h,onBeforeUnmount,ref } from 'vue'
import { createGame } from '../../src/modern/features/game/setup'
import { createGameController,type GameController,type GameScheduler } from '../../src/modern/features/game/controller'
import type { GameState } from '../../src/modern/features/game/types'
import { parseActivityAssets,type ActivityManifest } from '../../src/modern/features/game/activity-assets'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { mapAssetProfile } from '../../src/modern/features/assets/profiles'
const profile = new URLSearchParams(location.search).get('profile') === 'hd' ? 'hd' : 'original'
class Clock implements GameScheduler {
 time=0;id=0;jobs=new Map<number,{at:number;callback:()=>void}>()
 now=()=>this.time
 setTimeout=(callback:()=>void,ms:number)=>{const id=++this.id;this.jobs.set(id,{at:this.time+ms,callback});return id}
 clearTimeout=(id:unknown)=>{this.jobs.delete(id as number)}
 advance(ms:number){const until=this.time+ms;while(true){const next=[...this.jobs].filter(([,j])=>j.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;this.time=next[1].at;this.jobs.delete(next[0]);next[1].callback()}this.time=until}
}
function snapshot(scenario:string) {
 const game=createGame([1,2,3,4],1,1,{year:2026,month:9,day:28});game.world.markers={};game.phase='landed';game.continuation='handle-landing'
 game.players[0]!.position=scenario==='carnival-mid'?{column:1,row:29}:{column:6,row:24};game.tickets[1]=105
 const clock=new Clock(),controller=createGameController(game,{scheduler:clock});controller.setSpeed(2)
 if(scenario==='carnival-mid'){clock.advance(3100);controller.setCarnivalInput({kind:'pointer',x:600});clock.advance(7000)}
 else {controller.placeWager(7);controller.confirmWagers();clock.advance(1400)}
 const saved=structuredClone(controller.state);controller.dispose();return saved
}
const Fixture=defineComponent({setup(){
 const scenario=new URLSearchParams(location.search).get('scenario') ?? 'carnival-mid',clock=new Clock()
 const initial=snapshot(scenario)
 const state=ref<GameState>(initial),assets=ref<ActivityManifest>(),error=ref(''),ready=ref(false),paused=ref(false),version=ref(0)
 let controller:GameController
 const rebuild=(saved:GameState)=>createGameController(saved,{scheduler:clock,awaitActivityAssets:true,onState:s=>{state.value=structuredClone(s)}})
 controller=rebuild(initial);controller.setSpeed(2)
 void fetch('/assets/activities/manifest.json').then(async r=>{if(!r.ok)throw Error(`HTTP${r.status}`);assets.value=mapAssetProfile(parseActivityAssets(await r.json()),profile)}).catch(e=>{error.value=String(e)})
 const fail=(e:Error)=>{paused.value=true;controller.setPaused(true);error.value=e.message;ready.value=false}
 const retry=()=>{const saved=structuredClone(controller.state);controller.dispose();version.value++;state.value=saved;error.value='';paused.value=false;ready.value=false;controller=rebuild(saved);controller.setSpeed(2)}
 const summary=()=>{const i=state.value.interaction,g=i?.kind==='carnival'||i?.kind==='ludo'?i.game:undefined;return JSON.stringify({phase:g?.stage ?? i?.kind,frame:g?.frame,paid:g?.paid,tickets:state.value.tickets[1],rng:state.value.rngState})}
 onBeforeUnmount(()=>controller.dispose())
 return()=>h('main',[
  h('h1','已保存的游戏恢复测试夹具'),h('p',`明确标注：${scenario}，快照由真实规则及控制器推进生成；这是恢复边界测试，不冒称自然开局。`),
  h('pre',{'data-testid':'recovery-summary'},summary()),h('span',{'data-testid':'recovery-ready'},ready.value?'原素材已准备':'等待原素材'),
  h('button',{'data-testid':'recovery-advance',onClick:()=>clock.advance(100)},'推进100毫秒'),h('button',{'data-testid':'recovery-finish',onClick:()=>clock.advance(10000)},'完成本场'),
  error.value?h('div',{role:'alert'},[error.value,h('button',{'data-testid':'recovery-retry',onClick:retry},'重试恢复')]):null,
  h('div',{class:'recovery-stage'},[error.value?null:h(InteractionPanel,{key:version.value,game:state.value,paused:paused.value,cardAssets:[],activityAssets:assets.value,assetProfile:profile,
   onAssetError:fail,onActivityReady:(id:string)=>{controller.readyActivity(id);ready.value=true},onCarnivalInput:controller.setCarnivalInput,onPlaceWager:controller.placeWager,onConfirmWagers:controller.confirmWagers,onAcknowledge:controller.acknowledgeInteraction,
  })])
 ])
}})
const style=document.createElement('style');style.textContent='body{margin:0;background:#173c49;color:white;font:14px system-ui}main{padding:16px}button{margin:4px;padding:8px}.recovery-stage{position:relative;width:1200px;height:650px;background:#65c7fd}pre{white-space:pre-wrap}';document.head.append(style)
createApp(Fixture).mount('#app')
