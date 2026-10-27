import {createApp,defineComponent,h,ref,onMounted,onBeforeUnmount} from 'vue'
import mapJson from '../../src/modern/data/map.json'
import type {MapData} from '../../src/modern/features/map/types'
import {parseAssetManifest} from '../../src/modern/features/characters/assets'
import {parseReactionManifest} from '../../src/modern/features/characters/reactions'
import {createMapScene,type MapSceneHandle} from '../../src/modern/features/map/MapScene'
import {createGame} from '../../src/modern/features/game/setup'
import {settleBankruptcy} from '../../src/modern/features/game/lifecycle'
import {createGameController,type GameController} from '../../src/modern/features/game/controller'
import {buildPlayerPoses} from '../../src/modern/features/game/game-visuals'
import type {GameState} from '../../src/modern/features/game/types'
import GamePanel from '../../src/modern/features/game/GamePanel.vue'
import PropertyPanel from '../../src/modern/features/game/PropertyPanel.vue'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import EndgamePanel from '../../src/modern/features/game/EndgamePanel.vue'
const scenario=new URLSearchParams(location.search).get('scenario') ?? 'bankrupt'
const Fixture=defineComponent({setup(){
 let initial=createGame(scenario==='defeat'?[1]:[1,2,3,4],1,3,{year:2026,month:10,day:scenario==='monthly'?1:7})
 if(scenario==='victory'||scenario==='monthly')for(const id of scenario==='victory'?[2,3,4]:[3,4]){initial.players[id-1]!.cash=0;initial.players[id-1]!.deposit=0;initial=settleBankruptcy(initial,id)}
 if(scenario==='bankrupt'||scenario==='defeat'){initial.players[0]!.cash=0;initial.players[0]!.deposit=-300}
 initial.activePlayerIndex=scenario==='monthly'?1:0
 if(scenario!=='control'){initial.phase='landed';initial.continuation='finish-turn'}
 const state=ref(initial),paused=ref(false),host=ref<HTMLElement>(),ready=ref(false),error=ref('')
 let scene:MapSceneHandle|undefined,c:GameController|undefined,saved:GameState|undefined
 const open=(value:GameState)=>{c=createGameController(value,{onState:s=>{state.value=structuredClone(s);scene?.setPlayers(buildPlayerPoses(s));scene?.setProperties(s.properties)},onTransition:t=>scene?.transitionPlayer(t)});c.setPaused(paused.value)}
 onMounted(async()=>{try{
  const entries=await Promise.all(initial.players.map(async p=>({playerId:p.id,characterId:p.characterId,manifest:parseAssetManifest(await(await fetch(p.characterId===1?'/assets/manifest.json':`/assets/characters/${p.characterId}/manifest.json`)).json()),reactions:parseReactionManifest(await(await fetch(`/assets/characters/${p.characterId}/reactions/manifest.json`)).json())})))
  scene=await createMapScene(host.value!,mapJson as MapData,entries[0]!.manifest,{signal:new AbortController().signal,onFrame:()=>{},playerManifests:entries,onAssetError:e=>error.value=e.message})
  scene.resize(960,700);scene.setWorld(initial.world);scene.setCompanies(initial.players);scene.follow(initial.players[initial.activePlayerIndex]!.position)
  open(initial);ready.value=true
 }catch(e){error.value=String(e)}})
 onBeforeUnmount(()=>{c?.dispose();scene?.destroy()})
 return()=>h('main',[
  h('h1',`明确标注的3D真实组件夹具：${scenario}`),
  h('button',{onClick:()=>{saved=structuredClone(c!.state)}},'保存当前阶段测试快照'),
  h('button',{onClick:()=>{if(saved){c?.dispose();open(structuredClone(saved))}}},'恢复同一快照'),
  h('p',{'data-testid':'fixture-ready'},ready.value?'原素材已准备':'载入原素材'),
  error.value?h('p',{role:'alert'},error.value):null,
  h('pre',{'data-testid':'lifecycle-summary'},JSON.stringify({phase:state.value.phase,active:state.value.activePlayerIndex,day:state.value.world.day,rng:state.value.rngState,eliminated:state.value.eliminatedPlayerIds,receipts:state.value.bankruptcyReceipts.length,pending:state.value.pendingControl,outcome:state.value.outcome,cash:state.value.players.map(p=>[p.cash,p.deposit]),control:state.value.players.map(p=>p.controller)})),
  h('section',{style:'position:relative;display:flex;width:1280px;height:700px'},[
   h('div',{ref:host,style:'width:960px;height:700px'}),
   ready.value?h(GamePanel,{game:state.value,paused:paused.value,speed:c?.speed ?? 1,history:[],cardAssets:[],onRoll:()=>c?.roll(1),onPause:()=>{paused.value=!paused.value;c?.setPaused(paused.value);scene?.setPaused(paused.value)},onControl:(id:number,mode:'human'|'autoplay')=>c?.requestControl(id,mode),onSpeed:(s:number)=>c?.setSpeed(s),onOverview:()=>scene?.overview(),onFollow:()=>scene?.follow(state.value.players[state.value.activePlayerIndex]!.position)}):null,
   h(PropertyPanel,{game:state.value,paused:paused.value,onDecide:(v:'accept'|'decline')=>c?.decideProperty(v),onAcknowledge:()=>c?.acknowledgeProperty()}),
   h(InteractionPanel,{game:state.value,paused:paused.value,cardAssets:[],onAcknowledgeMonthly:()=>c?.acknowledgeMonthly(),onAcknowledge:()=>c?.acknowledgeInteraction()}),
   h(EndgamePanel,{game:state.value,paused:paused.value,onAcknowledge:()=>c?.acknowledgeBankruptcy(),onRestart:()=>location.reload(),onSelection:()=>location.assign('/modern.html')}),
  ]),
 ])
}})
createApp(Fixture).mount('#app')
