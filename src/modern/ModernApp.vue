<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import mapJson from './data/map.json'
import SavePanel from './features/saves/SavePanel.vue'
import { SaveClient, SaveClientError } from './features/saves/client'
import { createSnapshot, canSaveGame } from './features/saves/snapshot'
import { commitPreparedSave } from './features/saves/restore'
import { prepareGameUiAssets, type PreparedUiAssets } from './features/saves/ui-assets'
import type { SaveSlot, SaveSnapshot } from './features/saves/snapshot-types'
import { parseAssetManifest, type AssetManifest } from './features/characters/assets'
import { parseReactionManifest, type ReactionManifest } from './features/characters/reactions'
import type { GameController, GameControllerOptions } from './features/game/controller'
import GamePanel from './features/game/GamePanel.vue'
import InteractionPanel from './features/game/InteractionPanel.vue'
import { parseInteractionAssets, type InteractionAssetsManifest } from './features/game/interaction-assets'
import { parseActivityAssets, type ActivityManifest, type NativeOverlay } from './features/game/activity-assets'
import { activityChanges } from './features/game/activity-text'
import PropertyPanel from './features/game/PropertyPanel.vue'
import EndgamePanel from './features/game/EndgamePanel.vue'
import { AudioSession, sceneTrack, soundForEvent } from './features/game/audio'
import { activityCameraTarget, buildPlayerPoses, buildWorldVisual, worldVisualKey, interactionVisualPlan, reactionManifestUrl, VisualRecoveryTracker, visualForHandAssetFailure, type InteractionVisualPlan } from './features/game/game-visuals'
import { restoreControllerAfterVisual } from './features/game/visual-recovery'
import { getCardRecord } from './features/game/direct-cards'
import { createGame } from './features/game/setup'
import type { GameState } from './features/game/types'
import { createMapScene, type MapCameraState, type MapSceneHandle } from './features/map/MapScene'
import SceneInspector from './features/map/SceneInspector.vue'
import type { MapData } from './features/map/types'
import { loadHdMapArtwork } from './features/assets/hd-map-art'
import { isCompleteHdProfileIndex, mapAssetProfile, profileAssetUrl, type AssetProfile } from './features/assets/profiles'

interface CharacterIndexItem { id: number; name: string; manifestUrl: string }
interface PreparedGame { loaded:MapSceneHandle; interactions:InteractionAssetsManifest; activities:ActivityManifest; ui:PreparedUiAssets; assetProfile:AssetProfile; stagingHost?:HTMLElement; committed?:boolean }
interface PendingGame { state: GameState; lineup: string; assetProfile:AssetProfile; visual?: InteractionVisualPlan }

const map = mapJson as MapData
const mode = ref<'selection' | 'game' | 'inspection'>('selection')
function storedAssetProfile():AssetProfile {
  try{return localStorage.getItem('star-cat-monopoly:asset-profile')==='hd'?'hd':'original'}
  catch{return 'original'}
}
const assetProfile=ref<AssetProfile>(storedAssetProfile())
const assetProfileSelection=ref<AssetProfile>(assetProfile.value)
const assetProfileNotice=ref('')
const assetProfileBusy=ref(false)
const assetProfileBusyLabel=computed(()=>mode.value==='selection'
  ?assetProfileSelection.value==='hd'?'正在校验高清图集…':'正在保存原版素材偏好…'
  :assetProfileSelection.value==='hd'?'正在准备高清素材…':'正在准备原版素材…')
const characters = ref<CharacterIndexItem[]>([])
const indexState = ref<'loading' | 'ready' | 'error'>('loading')
const indexError = ref('')
const selected = ref<number[]>([])
const pending = ref<PendingGame>()
const game = ref<GameState>()
const interactionAssets = ref<InteractionAssetsManifest>()
const activityAssets = ref<ActivityManifest>()
const controllerReady=ref(false)
let continuePausedReplay:(()=>void)|undefined
const portalDecorations=ref<NativeOverlay[]>([])
const loadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const loadError = ref('')
const history = ref<string[]>([])
const paused = ref(false)
const savesOpen=ref(false), savesBusy=ref(false), savesError=ref(''), savesMessage=ref('')
const saveSlots=ref<SaveSlot[]>([])
const saveClient=new SaveClient()
let savesEpoch=0, pauseBeforeSaves=false, saveAbort:AbortController|undefined
let retrySave:{slot:number;revision:number;requestId:string;snapshot:SaveSnapshot}|undefined
const retryableSave=ref(false)
let matchCreatedAt=new Date().toISOString()
const saveAllowed=computed(()=>!!game.value&&loadState.value==='ready'&&controllerReady.value&&canSaveGame(game.value))
const audioError = ref<string|null>(null)
const musicVolume = ref(1), effectsVolume = ref(1), muted = ref(false)
const audio = new AudioSession(undefined,message=>{audioError.value=message})
audio.setTracks(Date.now()%2?'startmusic1':'startmusic2',null)
let backgroundMusic = 'backmusic1'
const speed = ref(1)
const following = ref(true)
const fullscreen = ref(false)
const fullscreenError = ref('')
const host = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const fullscreenToolbar = ref<HTMLElement>()
const preparedImages=ref<Record<string,string>>({})
let ownedUiAssets:PreparedUiAssets|undefined
let scene: MapSceneHandle | undefined
let gameController: GameController | undefined
let sceneActivityAssets:ActivityManifest|undefined
let assetProfileRequest = 0
let assetProfileAbort: AbortController | undefined
let abort: AbortController | undefined
let observer: ResizeObserver | undefined
let generation = 0
const visualRecovery = new VisualRecoveryTracker()
let latestNoticeVisual: InteractionVisualPlan | undefined

const selectedCharacters = computed(() => selected.value.map(id => characters.value.find(item => item.id === id)!).filter(Boolean))
const humanSummary = computed(() => `人类 ${selected.value.length} · AI ${4 - selected.value.length}`)
const canSwitchAssetProfile=computed(()=>mode.value==='selection'||(
  mode.value==='game'&&paused.value&&loadState.value==='ready'&&controllerReady.value&&
  gameController!==undefined&&game.value!==undefined&&canSaveGame(gameController.state)
))
function thumbnail(item: CharacterIndexItem): string {
  const path=item.manifestUrl.replace(/manifest\.json$/, 'walk/down-right/1.png')
  return `${import.meta.env.BASE_URL}${profileAssetUrl(path,assetProfile.value)}`
}
async function verifyHdAssetProfile(signal?:AbortSignal){
 const response=await fetch(`${import.meta.env.BASE_URL}assets-hd/hd-profile.json`,{signal})
 if(!response.ok)throw new Error(`高清图集不可用（HTTP ${response.status}）`)
 const profile=await response.json()
 if(!isCompleteHdProfileIndex(profile))throw new Error('高清图集不完整或清单无效')
 const manifestResponse=await fetch(`${import.meta.env.BASE_URL}assets-hd/hd-manifest.json`,{signal})
 if(!manifestResponse.ok)throw new Error(`高清图集清单不可用（HTTP ${manifestResponse.status}）`)
 const bytes=await manifestResponse.arrayBuffer()
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))
 const actualHash=Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('')
 if(actualHash.toLowerCase()!==String(profile.manifestSha256).toLowerCase())throw new Error('高清图集清单校验失败')
}
async function setAssetProfile(event:Event){
 const requested=(event.target as HTMLSelectElement).value==='hd'?'hd':'original'
 assetProfileSelection.value=requested
 const request=++assetProfileRequest
 assetProfileAbort?.abort()
 const controller=new AbortController()
 assetProfileAbort=controller
 assetProfileNotice.value=''
 assetProfileBusy.value=true
 try{
  if(requested===assetProfile.value){assetProfileSelection.value=assetProfile.value;return}
  if(requested==='hd')await verifyHdAssetProfile(controller.signal)
  if(request!==assetProfileRequest||controller.signal.aborted)return
  if(mode.value==='game')await switchPausedGameAssetProfile(requested,request,controller.signal)
  else commitAssetProfile(requested)
 }catch(error){
  if(request===assetProfileRequest&&!controller.signal.aborted){
   assetProfileSelection.value=assetProfile.value
   assetProfileNotice.value=error instanceof Error?error.message:String(error)
  }
 }finally{
  if(request===assetProfileRequest){assetProfileBusy.value=false;assetProfileAbort=undefined}
 }
}
function commitAssetProfile(profile:AssetProfile){
 assetProfile.value=profile
 assetProfileSelection.value=profile
 try{localStorage.setItem('star-cat-monopoly:asset-profile',profile)}catch{}
}
function parseCharacterIndex(value: unknown): CharacterIndexItem[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { characters?: unknown }).characters)) throw new Error('角色索引结构错误')
  const items = (value as { characters: unknown[] }).characters
  if (items.length !== 12) throw new Error('角色索引必须包含12名角色')
  return items.map((value, index) => {
    const item = value as Partial<CharacterIndexItem>
    if (item.id !== index + 1 || typeof item.name !== 'string' || typeof item.manifestUrl !== 'string') throw new Error(`角色${index + 1}索引错误`)
    return { id: item.id, name: item.name, manifestUrl: item.manifestUrl }
  })
}
async function loadIndex() {
  indexState.value = 'loading'; indexError.value = ''
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/characters/index.json`)
    if (!response.ok) throw new Error(`角色索引加载失败（HTTP ${response.status}）`)
    characters.value = parseCharacterIndex(await response.json())
    indexState.value = 'ready'
  } catch (reason) {
    indexError.value = reason instanceof Error ? reason.message : String(reason)
    indexState.value = 'error'
  }
}
function toggleCharacter(id: number) {
  audio.unlock(); audio.effect('sn_1')
  const index = selected.value.indexOf(id)
  if (index >= 0) selected.value.splice(index, 1)
  else {
    if (selected.value.length === 4) selected.value.shift()
    selected.value.push(id)
  }
}
function seed(): number {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return value[0]!
}
function cleanupGame() {
  ownedUiAssets?.release();ownedUiAssets=undefined
  audio.setPaused(true)
  controllerReady.value=false
  generation += 1
  abort?.abort(); abort = undefined
  observer?.disconnect(); observer = undefined
  gameController?.dispose(); gameController = undefined
  scene?.destroy(); scene = undefined
  sceneActivityAssets=undefined
}
async function fetchInteractionManifest(signal: AbortSignal): Promise<InteractionAssetsManifest> {
  const url = 'assets/interactions/manifest.json'
  const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { signal })
  if (!response.ok) throw new Error(`交互素材清单加载失败：${url}（HTTP ${response.status}）`)
  return parseInteractionAssets(await response.json())
}
async function fetchActivityManifest(signal: AbortSignal): Promise<ActivityManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}assets/activities/manifest.json`, { signal })
  if (!response.ok) throw new Error(`活动素材清单加载失败（HTTP ${response.status}）`)
  return parseActivityAssets(await response.json())
}
async function fetchManifest(item: CharacterIndexItem, signal: AbortSignal): Promise<AssetManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}${item.manifestUrl}`, { signal })
  if (!response.ok) throw new Error(`角色素材清单加载失败：${item.manifestUrl}（HTTP ${response.status}）`)
  return parseAssetManifest(await response.json())
}
async function fetchReactionManifest(item: CharacterIndexItem, signal: AbortSignal): Promise<ReactionManifest> {
  const url = reactionManifestUrl(item.id)
  const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { signal })
  if (!response.ok) throw new Error(`角色反馈素材清单加载失败：${url}（HTTP ${response.status}）`)
  return parseReactionManifest(await response.json())
}
function failRuntimeAsset(error: Error, visual?: InteractionVisualPlan) {
  if (loadState.value === 'error') return
  const state = gameController?.state ?? game.value
  if (state) pending.value = {
    state,
    lineup: state.players.map(player => player.name).join(' · '),
    assetProfile: assetProfile.value,
    ...(visual === undefined ? {} : { visual }),
  }
  loadError.value = error.message
  loadState.value = 'error'
  cleanupGame()
}
async function playVisual(state: GameState, visual: InteractionVisualPlan): Promise<void> {
  const token = visualRecovery.begin(visual)
  for (const effect of visual.effects) {
    const position = effect.position ?? (effect.cellId === undefined
      ? state.players.find(player => player.id === effect.playerId)?.position
      : getCardRecord(effect.cellId)?.position)
    if (position) scene?.playEffect(effect.clipId, position)
  }
  try {
    await Promise.all(visual.reactions.map(reaction => scene?.playReaction(reaction.playerId, reaction.name)))
    visualRecovery.complete(token)
    if (pending.value?.visual === visual) pending.value = { state: pending.value.state, lineup: pending.value.lineup, assetProfile:pending.value.assetProfile }
  } catch (error) {
    const failedVisual = visualRecovery.fail(token)
    if (failedVisual) failRuntimeAsset(error instanceof Error ? error : new Error(String(error)), failedVisual)
    throw error
  }
}
function failInteractionAsset(error: Error) { failRuntimeAsset(error, latestNoticeVisual) }
function failHandAsset(error: Error, cardId: number) {
  const state = gameController?.state ?? game.value
  failRuntimeAsset(error, state === undefined ? undefined : visualForHandAssetFailure(state, cardId, latestNoticeVisual))
}
async function prepareGameScene(state:GameState,target:HTMLElement,signal:AbortSignal,profile:AssetProfile,staged=false):Promise<PreparedGame> {
  let prepared:PreparedGame|undefined
    const [entries, loadedInteractionAssets, loadedActivityAssets] = await Promise.all([Promise.all(state.players.map(async player => {
      const item = characters.value.find(character => character.id === player.characterId)
      if(!item)throw new Error('角色索引尚未准备，请返回选人重试索引后读取')
      const [manifest, reactions] = await Promise.all([fetchManifest(item, signal), fetchReactionManifest(item, signal)])
      return { playerId: player.id, characterId: player.characterId, manifest, reactions }
    })), fetchInteractionManifest(signal), fetchActivityManifest(signal)])
    const mapArtwork=profile==='hd'?await loadHdMapArtwork(entries[0]!.manifest.map,signal):undefined
    const mapRegions=mapArtwork?.regions??[]
    const textureResolutions=Object.fromEntries(mapRegions.map(region=>[region.url,region.pixelDensity]))
    const displayInteractions=mapAssetProfile(loadedInteractionAssets,profile)
    const displayActivities=mapAssetProfile(loadedActivityAssets,profile)
    const ui=await prepareGameUiAssets(state,displayInteractions,signal,undefined,profile)
    try{
    const loaded = await createMapScene(target, map, entries[0]!.manifest, {
      signal,
      assetProfile:profile,
      playerManifests: entries,
      mapRegions,
      mapBase:mapArtwork?.baseMap,
      textureResolutions,
      onFrame: () => {},
      onManualCamera: () => { following.value = false },
      onTargetCell: position => gameController?.chooseCard({ kind: 'cell', position }),
      onAssetError: error=>{if(!staged||prepared?.committed)failRuntimeAsset(error)},
      requiredTextureUrls:[...entries.flatMap(entry=>{
        const godId=state.world.statuses[entry.playerId]?.godId
        const god=entry.reactions.godOverlays.find(g=>g.godId===godId)
        return god?[god.url]:[]
      })],
    })
  prepared={loaded,interactions:displayInteractions,activities:displayActivities,ui,assetProfile:profile}
  return prepared
  }catch(error){ui.release();throw error}
}
async function loadPendingGame(prepared?:PreparedGame) {
  if (!pending.value) return
  const current = ++generation
  abort?.abort(); observer?.disconnect(); gameController?.dispose(); scene?.destroy()
  gameController = undefined; scene = undefined
  ownedUiAssets?.release();ownedUiAssets=undefined
  abort = new AbortController()
  const signal = abort.signal
  loadState.value = 'loading'; loadError.value = ''; following.value = true
  try {
    const resources=prepared??await prepareGameScene(pending.value.state,host.value!,signal,pending.value.assetProfile)
    const {loaded,interactions:loadedInteractionAssets,activities:loadedActivityAssets}=resources
    if (current !== generation) {loaded.destroy();resources.ui.release();resources.stagingHost?.remove();return}
    resources.committed=true
    assetProfile.value=resources.assetProfile
    assetProfileSelection.value=resources.assetProfile
    sceneActivityAssets=loadedActivityAssets
    ownedUiAssets=resources.ui;preparedImages.value=resources.ui.urls
    if(resources.stagingHost){host.value!.replaceChildren(...resources.stagingHost.childNodes);resources.stagingHost.remove();loaded.resize(host.value!.clientWidth,host.value!.clientHeight)}
    scene = loaded
    interactionAssets.value = loadedInteractionAssets
    activityAssets.value = loadedActivityAssets
    const initial = pending.value.state
    audio.restoreTracks(backgroundMusic,sceneTrack(initial))
    game.value = initial
    scene.setPlayers(buildPlayerPoses(initial))
    scene.setCompanies(initial.players)
    scene.setProperties(initial.properties)
    scene.setWorld(buildWorldVisual(initial))
    scene.setTargeting(initial.interaction?.kind === 'target-choice')
    scene.showMarkers(true)
    scene.setSpeed(speed.value)
    scene.follow(initial.players[initial.activePlayerIndex]!.position)
    let previous = initial
    const updateActivity = (state: GameState) => {
      const interaction = state.interaction
      if(interaction?.kind==='portal' && interaction.stage==='choice' && portalDecorations.value.length===0) {
        try { portalDecorations.value=scene?.getPortalDecorations() ?? [] }
        catch(error){failRuntimeAsset(error instanceof Error?error:new Error(String(error)));return}
      } else if(interaction?.kind!=='portal')portalDecorations.value=[]
      const cameraTarget=activityCameraTarget(state)
      if(cameraTarget)scene?.follow(cameraTarget)
      if(interaction?.kind==='portal' && interaction.stage==='flight' && interaction.flight) {
        const flight=interaction.flight
        const player=state.players.find(item=>item.id===interaction.playerId)!
        const clip=sceneActivityAssets?.clips.find(item=>item.id===`fly-${player.characterId}-${flight.heading}`)
        if(!clip){failRuntimeAsset(new Error('缺少魔法门飞行原图'));return}
        void scene?.setActivity(clip,1,{column:flight.x/56,row:flight.y/40},{scale:flight.scale/100,depth:flight.depth})
          .then(()=>gameController?.readyActivity(clip.id)).catch(error=>{if(!signal.aborted)failRuntimeAsset(error instanceof Error?error:new Error(String(error)))})
        return
      }
      const visual = interaction && 'presentation' in interaction ? interaction.presentation : undefined
      const onMap = visual && ['fog', 'car2','car1'].includes(visual.clipId)
      const clip = onMap ? sceneActivityAssets?.clips.find(item => item.id === visual.clipId) : null
      if (onMap && !clip) { failRuntimeAsset(new Error(`缺少活动动画：${visual.clipId}`)); return }
      if (clip && visual) {
        const sourcePosition = visual.cellId === undefined ? undefined : getCardRecord(visual.cellId)?.position
        void scene?.setActivity(clip, visual.frame, visual.clipId === 'fog' ? sourcePosition : undefined)
          .then(() => gameController?.readyActivity(clip.id)).catch(error => { if (!signal.aborted) failRuntimeAsset(error instanceof Error ? error : new Error(String(error))) })
      } else void scene?.setActivity(null)
    }
    const controllerOptions: GameControllerOptions = {
      awaitActivityAssets: true,
      onTransition: transition => scene?.transitionPlayer(transition),
      onState: state => {
        audio.setScene(sceneTrack(state))
        if (state.bankruptcyReceipts.length > previous.bankruptcyReceipts.length) audio.effect('sn_10')
        const oldClip=previous.interaction && 'presentation' in previous.interaction?previous.interaction.presentation?.clipId:undefined
        const newClip=state.interaction && 'presentation' in state.interaction?state.interaction.presentation?.clipId:undefined
        if (newClip!==oldClip && (newClip==='car1'||newClip==='car2')) audio.effect('sn_8')
        if (state.outcome) {audio.stop(); if(!previous.outcome && state.outcome.kind==='victory')audio.effect('sn_9')}
        if (previous.phase === 'awaiting-roll' && state.phase === 'moving') {
          const player = state.players[state.activePlayerIndex]!
          history.value.push(`${player.name} ${player.controller === 'ai' ? 'AI ' : ''}掷出 ${state.lastRoll}`)
        }
        if (previous.phase === 'moving' && state.phase === 'landed') {
          const player = state.players[state.activePlayerIndex]!
          history.value.push(`${player.name} 到达 ${player.position.column},${player.position.row}`)
        }
        if (previous.lastPropertyEvent !== state.lastPropertyEvent && state.lastPropertyEvent) {
          const event = state.lastPropertyEvent
          const parcel = map.parcels.find(item => item.id === event.parcelId)!
          const actor = state.players.find(item => item.id === event.playerId)!
          const action = ({ purchased: '购买', upgraded: '升级', 'upgrade-failed': '升级失败', 'rent-paid': '支付租金', declined: '放弃', 'insufficient-cash': '现金不足', 'max-level': '已满级' })[event.kind]
          history.value.push(`${actor.name} ${action} ${parcel.streetName} #${parcel.id} · ${event.amount} · 现金 ${actor.cash} / 存款 ${actor.deposit}`)
        }
        const activeChanged = previous.activePlayerIndex !== state.activePlayerIndex
        const propertiesChanged = previous.properties !== state.properties
        const worldChanged = previous.world !== state.world || worldVisualKey(previous)!==worldVisualKey(state)
        if (previous.interaction?.kind === 'notice' && state.interaction?.kind !== 'notice') latestNoticeVisual = undefined
        previous = state
        game.value = state
        scene?.setPlayers(buildPlayerPoses(state))
        if (propertiesChanged) scene?.setProperties(state.properties)
        if (worldChanged) scene?.setWorld(buildWorldVisual(state))
        scene?.setTargeting(!paused.value && state.interaction?.kind === 'target-choice')
        if (following.value && activeChanged) scene?.follow(state.players[state.activePlayerIndex]!.position)
        updateActivity(state)
      },
      onInteractionEvent: event => {
        const sound=soundForEvent(event);if(sound)audio.effect(sound)
        const state = gameController?.state ?? game.value
        const actor = state?.players.find(player => player.id === event.playerId)
        const detail = event.reason ?? event.worldEvent?.kind ?? event.shopAction ?? event.luckEvent?.description ?? event.kind
        history.value.push(`${actor?.name ?? `玩家${event.playerId}`} · ${detail}${event.receipt ? ` · ${activityChanges(event.receipt)}` : event.amount === undefined ? '' : ` · ${event.amount}`}`)
        if (!state) return
        const visual = interactionVisualPlan(event)
        latestNoticeVisual = visual
        void playVisual(state, visual).catch(() => {})
      },
    }
    const replay = pending.value.visual
    if (replay) latestNoticeVisual = replay
    if(replay && paused.value) {
      scene.setPaused(true);loadState.value='ready'
      await new Promise<void>((resolve,reject)=>{
        const cancel=()=>{continuePausedReplay=undefined;reject(new DOMException('Aborted','AbortError'))}
        signal.addEventListener('abort',cancel,{once:true})
        continuePausedReplay=()=>{signal.removeEventListener('abort',cancel);continuePausedReplay=undefined;resolve()}
      })
      if(current!==generation)return
    }
    gameController = await restoreControllerAfterVisual(
      initial,
      controllerOptions,
      replay === undefined ? undefined : () => playVisual(initial, replay),
      speed.value,
      paused.value,
    )
    if (current !== generation) return
    controllerReady.value=true
    scene.setPaused(paused.value)
    updateActivity(gameController.state)
    observer = new ResizeObserver(([entry]) => { if (entry) scene?.resize(entry.contentRect.width, entry.contentRect.height) })
    observer.observe(host.value!)
    audio.setPaused(paused.value);loadState.value = 'ready'
  } catch (reason) {
    if (current !== generation || signal.aborted) return
    loadError.value = reason instanceof Error ? reason.message : String(reason)
    loadState.value = 'error'
  }
}
async function switchPausedGameAssetProfile(target:AssetProfile,request:number,signal:AbortSignal):Promise<void>{
  if(!canSwitchAssetProfile.value||!gameController||!scene||!host.value||!game.value)
    throw new Error('请在暂停后的稳定回合边界切换素材画质')
  const controller=gameController
  const currentState=controller.state
  const stateFingerprint=JSON.stringify(currentState)
  const camera:MapCameraState=scene.getCameraState()
  const currentSpeed=speed.value
  const currentPaused=paused.value
  const targetHost=document.createElement('div')
  targetHost.style.cssText=`position:fixed;left:-20000px;top:0;width:${host.value.clientWidth}px;height:${host.value.clientHeight}px;pointer-events:none`
  document.body.append(targetHost)
  let prepared:PreparedGame|undefined
  let committed=false
  try{
    prepared=await prepareGameScene(currentState,targetHost,signal,target,true)
    prepared.stagingHost=targetHost
    const candidate=prepared.loaded
    candidate.setPlayers(buildPlayerPoses(currentState))
    candidate.setCompanies(currentState.players)
    candidate.setProperties(currentState.properties)
    candidate.setWorld(buildWorldVisual(currentState))
    candidate.setTargeting(false)
    candidate.showMarkers(true)
    candidate.setSpeed(currentSpeed)
    candidate.setPaused(currentPaused)
    candidate.restoreCameraState(camera)
    signal.throwIfAborted()
    const liveCamera=scene?.getCameraState()
    if(request!==assetProfileRequest||controller!==gameController||controller.state!==currentState||
       JSON.stringify(controller.state)!==stateFingerprint||!paused.value||speed.value!==currentSpeed||
       !canSaveGame(controller.state)||!liveCamera||JSON.stringify(liveCamera)!==JSON.stringify(camera))
      throw new DOMException('The paused game changed while preparing the artwork profile','AbortError')

    const previousScene=scene
    const previousUi=ownedUiAssets
    const oldCanvas=host.value.firstChild
    host.value.replaceChildren(...targetHost.childNodes)
    targetHost.remove()
    candidate.resize(host.value.clientWidth,host.value.clientHeight)
    candidate.restoreCameraState(camera)
    scene=candidate
    sceneActivityAssets=prepared.activities
    interactionAssets.value=prepared.interactions
    activityAssets.value=prepared.activities
    ownedUiAssets=prepared.ui
    preparedImages.value=prepared.ui.urls
    portalDecorations.value=[]
    following.value=camera.following
    assetProfile.value=prepared.assetProfile
    assetProfileSelection.value=prepared.assetProfile
    try{localStorage.setItem('star-cat-monopoly:asset-profile',prepared.assetProfile)}catch{}
    prepared.committed=true
    committed=true
    await nextTick()
    previousScene.destroy()
    previousUi?.release()
    if(oldCanvas?.parentNode)oldCanvas.parentNode.removeChild(oldCanvas)
  }catch(error){
    if(!committed){
      prepared?.loaded.destroy()
      prepared?.ui.release()
      targetHost.remove()
    }
    throw error
  }
}
async function startGame() {
  if (selected.value.length === 0 || assetProfileBusy.value) return
  cleanupGame()
  audio.startMatch()
  backgroundMusic=`backmusic${Date.now()%5+1}`
  audio.unlock();audio.setPaused(false);audio.effect('sn_2')
  const now = new Date()
  matchCreatedAt=now.toISOString()
  const state = createGame([...selected.value], seed(), now.getDay(), {
    year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(),
  })
  pending.value = { state, lineup: state.players.map(player => player.name).join(' · '), assetProfile:assetProfile.value }
  latestNoticeVisual = undefined
  history.value = []
  speed.value = 1
  paused.value = false
  mode.value = 'game'
  await nextTick()
  await loadPendingGame()
}
function carnivalInput(input:import('./features/game/carnival').CarnivalInput){gameController?.setCarnivalInput(input)}
function placeWager(id:number){gameController?.placeWager(id)}
function confirmWagers(){gameController?.confirmWagers()}
function roll() { gameController?.roll() }
function decideProperty(choice: 'accept' | 'decline') { gameController?.decideProperty(choice) }
function acknowledgeProperty() { gameController?.acknowledgeProperty() }
function beginCard(index: number) { if(gameController?.beginCard(index))audio.effect('sn_7') }
function confirmInteraction() { gameController?.confirmCard() }
function cancelInteraction() { gameController?.cancelInteraction() }
function chooseInteraction(choice: import('./features/game/direct-cards').DirectCardChoice) { gameController?.chooseCard(choice) }
function acknowledgeInteraction() { gameController?.acknowledgeInteraction() }
function buyCard(slot: number) { gameController?.buyCard(slot) }
function sellCard(index: number) { gameController?.sellCard(index) }
function leaveShop() { gameController?.leaveShop() }
function requestCredit() { gameController?.requestCredit() }
function bankOperation(operation: import('./features/game/bank-operations').BankOperation, amount: number) { gameController?.bankOperation(operation, amount) }
function leaveBank() { gameController?.leaveBank() }
function acknowledgeMonthly() { gameController?.acknowledgeMonthly() }
function tradeStock(side: 'buy' | 'sell', companyId: number, shares: number) { gameController?.tradeStock(side, companyId, shares) }
function leaveStock() { gameController?.leaveStock() }
function subscribeCompany(shares: number) { gameController?.subscribeCompany(shares) }
function leaveCompany() { gameController?.leaveCompany() }
function exchangeTickets(quantity: number) { gameController?.exchangeTickets(quantity) }
function leaveExchange() { gameController?.leaveExchange() }
function readyActivity(clipId: string) { gameController?.readyActivity(clipId) }
function skipActivity() { gameController?.skipActivityPresentation() }
function choosePortal(destination: number) { gameController?.choosePortal(destination) }
function chooseCourtTarget(playerId: number) { gameController?.chooseCourtTarget(playerId) }
function chooseCourtCase(caseId: number) { gameController?.chooseCourtCase(caseId) }
function togglePause() {
  if(assetProfileBusy.value)return
  if(continuePausedReplay && scene) {
    paused.value=false;audio.setPaused(false);scene.setPaused(false);continuePausedReplay();return
  }
  if (!gameController || !scene) return
  paused.value = !paused.value
  audio.setPaused(paused.value)
  gameController.setPaused(paused.value)
  scene.setPaused(paused.value)
  scene.setTargeting(!paused.value && game.value?.interaction?.kind === 'target-choice')
}
function changeSpeed(value: number) {
  if(assetProfileBusy.value)return
  speed.value = value
  gameController?.setSpeed(value)
  scene?.setSpeed(value)
}
function followCurrent() {
  if(assetProfileBusy.value)return
  if (!game.value) return
  following.value = true
  scene?.follow(game.value.players[game.value.activePlayerIndex]!.position)
}
function overview() { if(assetProfileBusy.value)return;following.value = false; scene?.overview() }
async function toggleFullscreen() {
  if(assetProfileBusy.value)return
  fullscreenError.value = ''
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await stage.value?.requestFullscreen()
  } catch { fullscreenError.value = '当前浏览器未能进入全屏。' }
}
function returnToSelection() {
  if (document.fullscreenElement === stage.value) void document.exitFullscreen()
  fullscreenError.value = ''
  cleanupGame()
  audio.stop();audio.setPaused(false);audio.setTracks('startmusic1',null)
  pending.value = undefined
  latestNoticeVisual = undefined
  game.value = undefined
  interactionAssets.value = undefined
  activityAssets.value = undefined
  portalDecorations.value=[]
  loadState.value = 'idle'
  mode.value = 'selection'
}
function pauseForSaves(value:boolean){gameController?.setPaused(value);scene?.setPaused(value);audio.setPaused(value)}
async function openSaves(){
 if(savesOpen.value||assetProfileBusy.value)return
 pauseBeforeSaves=paused.value;savesOpen.value=true;paused.value=true;pauseForSaves(true)
 savesMessage.value='';savesError.value='';retrySave=undefined;retryableSave.value=false
 await refreshSaveSlots()
}
function closeSaves(){
 savesEpoch++;saveAbort?.abort();saveAbort=undefined;saveClient.cancel()
 savesOpen.value=false;savesBusy.value=false;retrySave=undefined;retryableSave.value=false
 paused.value=pauseBeforeSaves;pauseForSaves(paused.value)
}
async function refreshSaveSlots(){
 if(savesBusy.value)return
 const epoch=++savesEpoch;savesBusy.value=true;savesError.value='';savesMessage.value='';retrySave=undefined;retryableSave.value=false
 try{const slots=await saveClient.list();if(epoch===savesEpoch)saveSlots.value=slots}
 catch(error){if(epoch===savesEpoch)savesError.value=error instanceof Error?error.message:String(error)}
 finally{if(epoch===savesEpoch)savesBusy.value=false}
}
async function saveToSlot(slot:number){
 if(savesBusy.value||!saveAllowed.value||!gameController)return
 const row=saveSlots.value.find(s=>s.slot===slot);if(!row)return
 try{retrySave={slot,revision:row.revision,requestId:crypto.randomUUID(),snapshot:createSnapshot(gameController.state,[...selected.value],{speed:speed.value===2?2:1,paused:pauseBeforeSaves},matchCreatedAt,new Date().toISOString())}}
 catch(error){savesError.value=error instanceof Error?error.message:String(error);return}
 await submitRetrySave()
}
async function submitRetrySave(){
 if(savesBusy.value||!retrySave)return
 const request=retrySave,epoch=++savesEpoch;savesBusy.value=true;savesError.value='';savesMessage.value='';retryableSave.value=false
 try{
  const record=await saveClient.save(request.slot,request.revision,request.requestId,request.snapshot)
  if(epoch!==savesEpoch)return
  const g=record.snapshot.state
  saveSlots.value=saveSlots.value.map(row=>row.slot===record.slot?{slot:record.slot,revision:record.revision,savedAt:record.snapshot.savedAt,summary:{round:g.round,date:`${g.world.year}-${g.world.month}-${g.world.day}`,players:g.players.map(p=>p.name)}}:row)
  savesMessage.value=`槽位${record.slot}保存成功 · 修订${record.revision}`;retrySave=undefined
 }catch(error){if(epoch===savesEpoch){savesError.value=error instanceof Error?error.message:String(error);retryableSave.value=!(error instanceof SaveClientError&&error.status===409)}}
 finally{if(epoch===savesEpoch)savesBusy.value=false}
}
async function loadFromSlot(slot:number){
 if(savesBusy.value)return
 const epoch=++savesEpoch;savesBusy.value=true;savesError.value='';savesMessage.value='';retrySave=undefined;retryableSave.value=false
 const controller=new AbortController();saveAbort=controller
 try{
  const record=await saveClient.read(slot)
  if(epoch!==savesEpoch)return
  await commitPreparedSave(async()=>{
   const stagingHost=document.createElement('div');stagingHost.style.cssText=`position:fixed;left:-20000px;top:0;width:${host.value?.clientWidth??900}px;height:${host.value?.clientHeight??600}px;pointer-events:none`
   document.body.append(stagingHost)
   try{const prepared=await prepareGameScene(record.snapshot.state,stagingHost,controller.signal,assetProfile.value,true);prepared.stagingHost=stagingHost;return prepared}
   catch(error){stagingHost.remove();throw error}
  },async prepared=>{
   if(epoch!==savesEpoch||controller.signal.aborted)throw new DOMException('Cancelled','AbortError')
   // All snapshot and required image validation has succeeded; adopt the candidate.
   selected.value=[...record.snapshot.selection];matchCreatedAt=record.snapshot.createdAt
   speed.value=record.snapshot.settings.speed;pauseBeforeSaves=record.snapshot.settings.paused;paused.value=true
   pending.value={state:record.snapshot.state,lineup:record.snapshot.state.players.map(p=>p.name).join(' · '),assetProfile:prepared.assetProfile}
   latestNoticeVisual=undefined;history.value=[];audio.startMatch();mode.value='game'
   await nextTick();await loadPendingGame(prepared)
   if(loadState.value!=='ready')throw new Error(loadError.value)
  },prepared=>{prepared.loaded.destroy();prepared.ui.release();prepared.stagingHost?.remove()})
  if(epoch===savesEpoch){savesMessage.value=`槽位${slot}读取成功`;savesOpen.value=false;paused.value=pauseBeforeSaves;pauseForSaves(paused.value)}
 }catch(error){if(epoch===savesEpoch)savesError.value=`${error instanceof Error?error.message:String(error)}；当前对局保留`}
 finally{if(epoch===savesEpoch){savesBusy.value=false;saveAbort=undefined}}
}
function fullscreenChanged() { fullscreen.value = document.fullscreenElement === stage.value }
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && document.fullscreenElement === stage.value) {
    void document.exitFullscreen().catch(() => { fullscreenError.value = '当前浏览器未能退出全屏。' })
    return
  }
  if(savesOpen.value||assetProfileBusy.value)return
  if (mode.value !== 'game' || event.defaultPrevented) return
  if(game.value?.interaction?.kind==='carnival')return
  const target = event.target as HTMLElement | null
  if (target?.matches('input, select, textarea, button, [contenteditable=true]')) return
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key) && gameController?.skipActivityPresentation()) { event.preventDefault(); return }
  if (event.key === 'ArrowUp' && gameController?.roll()) event.preventDefault()
  if (event.key === 'ArrowLeft' && (gameController?.decideProperty('accept') || gameController?.confirmCard() || gameController?.acknowledgeInteraction() || gameController?.acknowledgeProperty())) event.preventDefault()
  if (event.key === 'ArrowRight' && (gameController?.decideProperty('decline') || gameController?.cancelInteraction())) event.preventDefault()
}
onMounted(() => {
  document.addEventListener('fullscreenchange', fullscreenChanged)
  document.addEventListener('keydown', keydown)
  if(assetProfile.value==='hd'){
    const request=++assetProfileRequest
    const controller=new AbortController();assetProfileAbort=controller
    assetProfileBusy.value=true
    void verifyHdAssetProfile(controller.signal).catch(error=>{
      if(request===assetProfileRequest&&!controller.signal.aborted){
        assetProfile.value='original';assetProfileSelection.value='original';assetProfileNotice.value=error instanceof Error?error.message:String(error)
        try{localStorage.setItem('star-cat-monopoly:asset-profile','original')}catch{}
      }
    }).finally(()=>{if(request===assetProfileRequest){assetProfileBusy.value=false;assetProfileAbort=undefined}})
  }
  void loadIndex()
})
onBeforeUnmount(() => {
  assetProfileRequest++;assetProfileAbort?.abort();assetProfileAbort=undefined
  saveAbort?.abort();saveClient.cancel()
  audio.destroy()
  cleanupGame()
  document.removeEventListener('fullscreenchange', fullscreenChanged)
  document.removeEventListener('keydown', keydown)
})
</script>

<template>
  <SceneInspector v-if="mode === 'inspection'" @back="mode = 'selection'" />
  <main v-else-if="mode === 'selection'" :inert="savesOpen" class="selection-shell">
    <header><div><span class="eyebrow">原素材 · 独立现代回合</span><h1>星猫大富翁</h1></div><div class="selection-actions"><label>素材画质 <select aria-label="素材画质" :disabled="!canSwitchAssetProfile" :value="assetProfileSelection" @change="setAssetProfile"><option value="original">原版素材</option><option value="hd">高清素材</option></select></label><span v-if="assetProfileBusy" data-testid="asset-profile-busy" role="status">{{ assetProfileBusyLabel }}</span><button @click="openSaves">读取存档</button><button @click="mode = 'inspection'">场景检查</button></div></header>
    <p v-if="assetProfileNotice" class="asset-profile-error" role="alert">{{ assetProfileNotice }}；当前已保留原版素材模式。</p>
    <section class="selection-card">
      <div class="selection-title"><div><h2>选择参赛角色</h2><p>按选择顺序加入 1–4 名人类玩家，不足四人由 AI 随机补位；第五次选择会滚出最早选择。</p></div><strong data-testid="human-count">{{ humanSummary }}</strong></div>
      <div v-if="indexState === 'loading'" class="selection-state">正在读取12名原版角色…</div>
      <div v-else-if="indexState === 'error'" role="alert" class="selection-state"><p>{{ indexError }}</p><button @click="loadIndex">重试角色索引</button></div>
      <div v-else class="characters" data-testid="character-grid">
        <button v-for="item in characters" :key="item.id" :data-testid="`character-${item.id}`" :aria-pressed="selected.includes(item.id)" @click="toggleCharacter(item.id)">
          <span class="portrait"><img :src="thumbnail(item)" alt="" loading="eager"><b v-if="selected.includes(item.id)">{{ selected.indexOf(item.id) + 1 }}</b></span>
          <span>{{ item.name }}</span>
        </button>
      </div>
      <div class="selection-footer">
        <div><small>已选顺序</small><p data-testid="selected-order">{{ selectedCharacters.length ? selectedCharacters.map(item => item.name).join(' → ') : '请至少选择一名角色' }}</p></div>
        <button class="start" :disabled="selected.length === 0 || indexState !== 'ready' || assetProfileBusy" @click="startGame">开始对局</button>
      </div>
    </section>
    <p class="scope">现代对局：17种可达卡、特殊格、卡片屋、信用与世界状态。</p>
  </main>
  <main v-else :inert="savesOpen && !fullscreen" class="game-shell">
    <Teleport :to="fullscreenToolbar ?? 'body'" :disabled="!fullscreen || !fullscreenToolbar">
    <div class="audio-controls" aria-label="声音设置">
      <button data-testid="open-saves" :disabled="assetProfileBusy" @click="openSaves">手动存读档</button>
      <button @click="audio.unlock();audio.retry()">开启声音</button>
      <label>素材画质 <select aria-label="对局素材画质" :disabled="!canSwitchAssetProfile" :value="assetProfileSelection" @change="setAssetProfile"><option value="original">原版素材</option><option value="hd">高清素材</option></select></label>
      <label>音乐 <input aria-label="音乐音量" type="range" min="0" max="1" step="0.1" v-model.number="musicVolume" @input="audio.setVolumes(musicVolume,effectsVolume)"></label>
      <label>音效 <input aria-label="音效音量" type="range" min="0" max="1" step="0.1" v-model.number="effectsVolume" @input="audio.setVolumes(musicVolume,effectsVolume)"></label>
      <label><input type="checkbox" v-model="muted" @change="audio.setMuted(muted)">静音</label>
      <span v-if="audioError" role="status">{{ audioError }} <button @click="audio.unlock();audio.retry()">重试声音</button></span>
      <span v-if="assetProfileBusy" data-testid="asset-profile-busy" role="status">{{ assetProfileBusyLabel }}</span>
      <button v-if="fullscreen" @click="toggleFullscreen">退出全屏</button>
    </div>
    </Teleport>
    <p v-if="assetProfileNotice" class="asset-profile-error" role="alert">{{ assetProfileNotice }}；当前画质与对局均已保留。</p>
    <header><div><span class="eyebrow">原版地图与角色</span><h1>星猫大富翁 · 现代对局</h1></div><span role="status">{{ loadState === 'ready' ? '对局已载入' : loadState === 'error' ? '加载失败' : '正在载入本局角色与交互素材…' }}</span></header>
    <section ref="stage" class="game-stage">
      <div ref="fullscreenToolbar" v-show="fullscreen" class="fullscreen-toolbar" :inert="savesOpen" />
      <div class="stage-content" :inert="assetProfileBusy || (savesOpen && fullscreen)">
      <div class="board-area"><div ref="host" class="canvas-host" /></div>
      <div v-if="game && paused && !controllerReady && loadState === 'ready'" class="overlay">
        <div><p>反馈素材已准备，继续对局后恢复。</p><button @click="togglePause">继续对局</button></div>
      </div>
      <GamePanel v-if="game && interactionAssets && controllerReady && loadState === 'ready'" :game="game" :paused="paused" :speed="speed" :history="history" :card-assets="interactionAssets.cards" :prepared-images="preparedImages" :asset-profile="assetProfile" @control="(id,control)=>gameController?.requestControl(id,control)" @roll="roll" @pause="togglePause" @speed="changeSpeed" @overview="overview" @follow="followCurrent" @fullscreen="toggleFullscreen" @restart="returnToSelection" @begin-card="beginCard" @asset-error="failHandAsset" />
      <PropertyPanel v-if="game && loadState === 'ready'" :game="game" :paused="paused" @decide="decideProperty" @acknowledge="acknowledgeProperty" />
      <InteractionPanel v-if="game && interactionAssets && controllerReady && loadState === 'ready'" :game="game" :paused="paused" :card-assets="interactionAssets.cards" :luck-assets="interactionAssets.luck" :activity-assets="activityAssets" :portal-decorations="portalDecorations" :asset-profile="assetProfile" @confirm="confirmInteraction" @cancel="cancelInteraction" @choose="chooseInteraction" @acknowledge="acknowledgeInteraction" @buy="buyCard" @sell="sellCard" @leave-shop="leaveShop" @request-credit="requestCredit" @bank-operation="bankOperation" @leave-bank="leaveBank" @acknowledge-monthly="acknowledgeMonthly" @trade-stock="tradeStock" @leave-stock="leaveStock" @subscribe-company="subscribeCompany" @leave-company="leaveCompany" @exchange-tickets="exchangeTickets" @leave-exchange="leaveExchange" @activity-ready="readyActivity" @skip-activity="skipActivity" @carnival-input="carnivalInput" @place-wager="placeWager" @confirm-wagers="confirmWagers" @choose-portal="choosePortal" @court-target="chooseCourtTarget" @court-case="chooseCourtCase" @asset-error="failInteractionAsset" />
      <EndgamePanel v-if="game && loadState==='ready' && controllerReady" :game="game" :paused="paused" :prepared-images="preparedImages" :asset-profile="assetProfile" @acknowledge="gameController?.acknowledgeBankruptcy()" @restart="startGame" @selection="returnToSelection" @asset-error="failRuntimeAsset" />
      <p v-if="fullscreenError" class="fullscreen-error" role="alert">{{ fullscreenError }}</p>
      <div v-if="loadState !== 'ready'" class="overlay">
        <div v-if="loadState === 'loading'"><p>正在载入地图、本局角色动作与完整交互素材…</p><p data-testid="pending-lineup">{{ pending?.lineup }}</p></div>
        <div v-else role="alert"><p>{{ loadError }}</p><p data-testid="pending-lineup">{{ pending?.lineup }}</p><div class="error-actions"><button @click="loadPendingGame()">重试载入</button><button @click="returnToSelection">返回选人</button></div></div>
      </div>
      <div v-if="assetProfileBusy&&mode==='game'" class="profile-switch-overlay" role="status">
        <div><p>{{ assetProfileBusyLabel }}</p><small>正在准备候选素材；可从上方画质菜单取消。</small></div>
      </div>
      </div>
    </section>
  </main>
  <Teleport :to="stage ?? 'body'" :disabled="!fullscreen">
  <SavePanel v-if="savesOpen" :slots="saveSlots" :can-save="saveAllowed" :busy="savesBusy" :error="savesError" :message="savesMessage" :has-game="!!game" :retryable="retryableSave" @save="saveToSlot" @load="loadFromSlot" @refresh="refreshSaveSlots" @retry="submitRetrySave" @close="closeSaves" />
  </Teleport>
</template>

<style scoped>
.audio-controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;color:#d6e8eb;font:13px system-ui}.audio-controls label{display:flex;align-items:center;gap:5px}.audio-controls input[type=range]{width:90px}
button,select{font:inherit;background:#294b58;color:#edf6f3;border:1px solid #55717a;border-radius:8px;padding:8px 12px;cursor:pointer}button:hover,select:hover{background:#376271}button:disabled{opacity:.42;cursor:default}button:focus-visible,select:focus-visible{outline:2px solid #ffe18a;outline-offset:3px}.eyebrow{font-size:11px;color:#a9c3c8;letter-spacing:.13em}
.selection-shell,.game-shell{min-height:100dvh;background:radial-gradient(circle at 50% 0,#28505f,#132a35 55%);color:#ebf4f2;font:14px/1.5 system-ui,"PingFang SC",sans-serif;padding:20px 28px}.selection-shell header,.game-shell header{width:min(1260px,100%);margin:0 auto 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}.selection-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.selection-actions label{display:flex;align-items:center;gap:6px;color:#c4d5da}h1{margin:2px 0;font-size:24px}.asset-profile-error{width:min(1260px,100%);margin:0 auto 12px;color:#ffe18a}.selection-card{width:min(1120px,100%);margin:5vh auto 0;background:#183542e8;border:1px solid #466775;border-radius:18px;padding:24px;box-shadow:0 24px 70px #07151d88}.selection-title{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.selection-title h2{margin:0;font-size:25px}.selection-title p{margin:5px 0 18px;color:#abc1c5}.selection-title strong{white-space:nowrap;color:#ffe18a}.characters{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.characters button{padding:10px;display:flex;flex-direction:column;gap:6px;align-items:center;background:#20424f}.characters button[aria-pressed=true]{background:#40594f;border-color:#ffe18a;box-shadow:0 0 0 1px #ffe18a}.portrait{position:relative;width:72px;height:82px;display:grid;place-items:center;background:#68cef4;border-radius:11px;overflow:hidden}.portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:auto}.portrait b{position:absolute;top:5px;right:5px;z-index:1;width:22px;height:22px;display:grid;place-items:center;background:#ffe18a;color:#273733;border-radius:50%}.selection-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:22px}.selection-footer small{color:#9cb4b9}.selection-footer p{margin:2px 0;font-size:16px}.start{background:#ffe18a;color:#263d3b;border-color:#ffe18a;font-weight:800;padding:11px 24px}.selection-state{min-height:380px;display:grid;place-items:center;text-align:center}.scope{text-align:center;color:#91aab0;font-size:12px;margin:18px auto 0}
.game-shell{display:flex;flex-direction:column}.game-stage{position:relative;width:min(1400px,100%);height:calc(100dvh - 104px);min-height:570px;margin:0 auto;display:flex;overflow:hidden;background:#66ccff;border:1px solid #486a75;border-radius:12px;box-shadow:0 12px 45px #0006}.canvas-host{flex:1;min-width:0;height:100%;cursor:grab}.canvas-host:active{cursor:grabbing}.canvas-host :deep(canvas){display:block;width:100%;height:100%}.overlay{position:absolute;inset:0;z-index:3;display:grid;place-items:center;background:#17323df2;text-align:center;padding:28px}.overlay p{max-width:720px;overflow-wrap:anywhere}.error-actions{display:flex;justify-content:center;gap:10px}.exit-fullscreen{position:absolute;right:334px;top:14px;z-index:4}.fullscreen-error{position:absolute;z-index:4;left:16px;top:16px;margin:0;padding:9px 12px;border:1px solid #ffb19a;border-radius:8px;background:#5b2925;color:#fff}.game-stage:fullscreen{width:100vw;height:100vh;max-width:none;border:0;border-radius:0}
.profile-switch-overlay{position:absolute;inset:0;z-index:8;display:grid;place-items:center;background:#132f39b8;color:#eff7f5;text-align:center;pointer-events:all}.profile-switch-overlay p{margin:0 0 6px;font-size:18px;font-weight:700}.profile-switch-overlay small{color:#c4d8dc}
.insolvent{position:absolute;z-index:3;left:18px;bottom:18px;width:min(470px,calc(100% - 370px));padding:18px;border:1px solid #ffb19a;border-radius:12px;background:#572d2be8;color:#fff}.insolvent h2{margin:0 0 8px}.insolvent p{margin:0 0 12px}
.game-shell{height:100dvh;min-height:0;padding:16px 24px;gap:10px}.game-shell header{width:100%;margin:0 auto;flex-shrink:0}.game-shell>.audio-controls{flex-shrink:0}.audio-controls{font-size:14px}.game-stage{--game-sidebar-width:340px;width:100%;height:auto;min-height:0;flex:1;display:flex;flex-direction:column;background:#173744}.stage-content{position:relative;display:flex;flex:1;min-height:0;width:100%;container-type:size}.board-area{flex:1;min-width:0;height:100%;display:grid;place-items:center;container-type:size;background:radial-gradient(ellipse at center,#285968,#173744)}.canvas-host{flex:none;width:min(100cqw,calc(100cqh * 4 / 3));height:auto;aspect-ratio:4/3;min-height:0}.fullscreen-toolbar{flex-shrink:0;padding:10px 16px;background:#183744;border-bottom:1px solid #4f6c76}.game-stage:fullscreen{height:100dvh;background:#173744}.game-stage:fullscreen .fullscreen-toolbar .audio-controls{width:100%;justify-content:center}.game-stage:fullscreen .stage-content{min-height:0}.asset-profile-error{flex-shrink:0;margin-bottom:0}@media(min-width:1600px){.game-stage{--game-sidebar-width:360px}}
@media(max-width:900px){.game-stage{--game-sidebar-width:0px}.characters{grid-template-columns:repeat(4,1fr)}.game-stage{height:calc(100dvh - 90px);flex-direction:column}.canvas-host{min-height:58vh}.insolvent{left:12px;right:12px;bottom:42vh;width:auto;max-height:45vh;overflow:auto;box-sizing:border-box}.exit-fullscreen{right:14px}.game-shell{height:auto;min-height:100dvh;padding:12px}.game-shell header{margin-bottom:8px}.stage-content{flex-direction:column}.board-area{min-height:58vh}.canvas-host{min-height:0}}
@media(max-width:600px){.selection-shell{padding:14px}.selection-card{padding:15px;margin-top:2vh}.characters{grid-template-columns:repeat(3,1fr);gap:7px}.portrait{width:60px;height:66px}.selection-title,.selection-footer{align-items:stretch;flex-direction:column}}
</style>
