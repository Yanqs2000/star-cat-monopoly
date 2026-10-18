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

const profile = new URLSearchParams(location.search).get('profile') === 'original' ? 'original' : 'hd'
const eventId = Number(new URLSearchParams(location.search).get('event') ?? 0)
const state = createGame([1, 2, 3, 4], 1327, 1)
state.inventories[state.players[0]!.id] = [1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33]
const result = document.querySelector<HTMLElement>('#result')!
try {
  const [manifest, reactions, interactions] = await Promise.all([
    fetch('/assets/manifest.json').then(response => response.json()).then(parseAssetManifest),
    fetch('/assets/characters/1/reactions/manifest.json').then(response => response.json()).then(parseReactionManifest),
    fetch('/assets/interactions/manifest.json').then(response => response.json()).then(parseInteractionAssets),
  ])
  if (eventId) {
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
  createApp({ render: () => h(HandPanel, {
    game: state, paused: false, cardAssets: interactions.cards, assetProfile: profile,
    onAssetError: (error: Error) => { result.textContent = error.message },
    onBeginCard: (index: number) => { result.textContent = `选择卡片 ${state.inventories[state.players[0]!.id]![index]}` },
  }) }).mount('#cards')
  result.textContent = '实际组件已载入'
  window.addEventListener('beforeunload', () => scene.destroy())
  }
} catch (error) { result.textContent = String(error) }
