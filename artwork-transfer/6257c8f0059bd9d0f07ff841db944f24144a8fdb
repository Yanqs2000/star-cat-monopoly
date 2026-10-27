import { createApp, h } from 'vue'
import mapJson from '../../src/modern/data/map.json'
import { parseAssetManifest } from '../../src/modern/features/characters/assets'
import { parseReactionManifest } from '../../src/modern/features/characters/reactions'
import { parseInteractionAssets } from '../../src/modern/features/game/interaction-assets'
import { createGame } from '../../src/modern/features/game/setup'
import HandPanel from '../../src/modern/features/game/HandPanel.vue'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { getLuckEvent } from '../../src/modern/features/game/events'
import { createMapScene } from '../../src/modern/features/map/MapScene'
import type { MapData } from '../../src/modern/features/map/types'
import { gridToScene } from '../../src/modern/features/map/coordinates'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
import { mapAssetProfile } from '../../src/modern/features/assets/profiles'
import NativeActivity from '../../src/modern/features/game/NativeActivity.vue'

const profile = new URLSearchParams(location.search).get('profile') === 'original' ? 'original' : 'hd'
const eventId = Number(new URLSearchParams(location.search).get('event') ?? 0)
const propertyMode = new URLSearchParams(location.search).has('properties')
const propertyOwner = Number(new URLSearchParams(location.search).get('owner') ?? 1)
const propertyColors = new URLSearchParams(location.search).has('colors')
const activityId = new URLSearchParams(location.search).get('activity')
const interactionId = new URLSearchParams(location.search).get('interaction')
const state = createGame([1, 2, 3, 4], 1327, 1)
state.inventories[state.players[0]!.id] = [1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33]
const result = document.querySelector<HTMLElement>('#result')!
try {
  const [manifest, reactions, interactions] = await Promise.all([
    fetch('/assets/manifest.json').then(response => response.json()).then(parseAssetManifest),
    fetch('/assets/characters/1/reactions/manifest.json').then(response => response.json()).then(parseReactionManifest),
    fetch('/assets/interactions/manifest.json').then(response => response.json()).then(parseInteractionAssets),
  ])
  if (interactionId === 'lottery' || interactionId === 'court-case') {
    const activities = mapAssetProfile(parseActivityAssets(await fetch('/assets/activities/manifest.json').then(response => response.json())), profile)
    state.phase = 'interaction'
    state.interaction = interactionId === 'lottery'
      ? { kind: 'ticket-exchange', playerId: 1, mode: 'buy' }
      : { kind: 'court', playerId: 1, stage: 'case', targetId: 2 }
    document.querySelector<HTMLElement>('#board')!.style.display = 'none'
    createApp({ render: () => h(InteractionPanel, {
      game: state, paused: false, cardAssets: interactions.cards, luckAssets: interactions.luck,
      activityAssets: activities, assetProfile: profile,
      onActivityReady: () => { result.textContent = `实际交互已载入 ${interactionId}` },
      onCourtCase: (id: number) => { result.textContent = `选择罪名 ${id}` },
      onExchangeTickets: (quantity: number) => { result.textContent = `兑换奖券 ${quantity}` },
      onAssetError: (error: Error) => { result.textContent = error.message },
    }) }).mount('#cards')
  } else if (activityId) {
    const activities = mapAssetProfile(parseActivityAssets(await fetch('/assets/activities/manifest.json').then(response => response.json())), profile)
    const clip = activities.clips.find(clip => clip.id === activityId)
    if (!clip) throw new Error(`未知活动：${activityId}`)
    document.querySelector<HTMLElement>('#board')!.style.display = 'none'
    createApp({ render: () => h(NativeActivity, { clip,
      onReady: () => { result.textContent = `实际静态活动已载入 ${activityId}` },
      onAssetError: (error: Error) => { result.textContent = error.message },
    }) }).mount('#cards')
  } else if (eventId) {
    const event = getLuckEvent(eventId)
    state.phase = 'interaction'
    state.interaction = { kind: 'notice', playerId: state.players[0]!.id, resume: 'await-roll',
      notice: { kind: 'luck', message: event.description, amount: event.amount, luckEvent: event } }
    document.querySelector<HTMLElement>('#board')!.style.display = 'none'
    createApp({ render: () => h(InteractionPanel, {
      game: state, paused: false, cardAssets: interactions.cards, luckAssets: interactions.luck, assetProfile: profile,
      onAcknowledge: () => { result.textContent = `确认事件 ${eventId}` },
      onAssetError: (error: Error) => { result.textContent = error.message },
    }) }).mount('#cards')
    result.textContent = '实际事件组件已载入'
  } else {
  const scene = await createMapScene(document.querySelector<HTMLElement>('#board')!, mapJson as MapData, manifest, {
    signal: new AbortController().signal, onFrame: () => {}, assetProfile: profile,
    playerManifests: [{ playerId: state.players[0]!.id, characterId: 1, manifest, reactions }],
    onAssetError: error => { result.textContent = error.message },
  })
  scene.setCompanies(state.players)
  scene.resize(800, 600)
  scene.restoreCameraState({ x: 400 - 1988, y: 300 - 251, scale: 1, following: false })
  if (propertyMode) {
    const levels = [0, 1, 2, 3, 4, 5] as const
    const focus = gridToScene((mapJson as MapData).parcels[0]!.buildingCell)
    scene.restoreCameraState({ x: 250 - focus.x * 1.5, y: 320 - focus.y * 1.5, scale: 1.5, following: false })
    const showLevel = (level: typeof levels[number]) => {
      for (const [index, parcel] of (mapJson as MapData).parcels.entries()) {
        state.properties[parcel.id] = { ...state.properties[parcel.id]!, ownerId: propertyColors ? index % 4 + 1 : propertyOwner, level }
      }
      scene.setProperties(state.properties)
      result.textContent = `${propertyColors ? '四种颜色' : `房屋 ${propertyOwner}`} · ${level}级`
    }
    const openMiniMap = async () => {
      const activities = mapAssetProfile(parseActivityAssets(await fetch('/assets/activities/manifest.json').then(response => response.json())), profile)
      state.phase = 'interaction'
      state.interaction = { kind: 'portal', playerId: 1, stage: 'choice' }
      controls.unmount()
      createApp({ render: () => h(InteractionPanel, { game: state, paused: false, activityAssets: activities,
        cardAssets: interactions.cards, luckAssets: interactions.luck,
        assetProfile: profile, portalDecorations: scene.getPortalDecorations(),
        onActivityReady: () => { result.textContent = '实际小地图已载入' },
        onChoosePortal: (destination: number) => { result.textContent = `选择魔法门 ${destination}` },
        onAssetError: (error: Error) => { result.textContent = error.message },
      }) }).mount('#cards')
    }
    const controls = createApp({ render: () => h('div', [h('p', '实际地产图层：切换等级检查房屋占位与落地点'),
      ...levels.map(level => h('button', { 'data-testid': `house-level-${level}`, onClick: () => showLevel(level) }, `${level}级`)),
      h('button', { 'data-testid': 'open-minimap', onClick: openMiniMap }, '检查实际小地图')]) })
    controls.mount('#cards')
    showLevel(1)
  } else {
  createApp({ render: () => h(HandPanel, {
    game: state, paused: false, cardAssets: interactions.cards, assetProfile: profile,
    onAssetError: (error: Error) => { result.textContent = error.message },
    onBeginCard: (index: number) => { result.textContent = `选择卡片 ${state.inventories[state.players[0]!.id]![index]}` },
  }) }).mount('#cards')
  result.textContent = '实际组件已载入'
  }
  window.addEventListener('beforeunload', () => scene.destroy())
  }
} catch (error) { result.textContent = String(error) }
