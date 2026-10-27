import { createApp, h, onMounted, onBeforeUnmount, ref } from 'vue'
import PropertyPanel from '../../src/modern/features/game/PropertyPanel.vue'
import EndgamePanel from '../../src/modern/features/game/EndgamePanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import { settleBankruptcy } from '../../src/modern/features/game/lifecycle'
import { createMapScene, type MapSceneHandle } from '../../src/modern/features/map/MapScene'
import { parseAssetManifest } from '../../src/modern/features/characters/assets'
import { parseReactionManifest } from '../../src/modern/features/characters/reactions'
import map from '../../src/modern/data/map.json'
import type { MapData } from '../../src/modern/features/map/types'
import '../../src/modern/styles/original-ui.css'

const scenario = new URLSearchParams(location.search).get('scenario') ?? 'purchase'
const assetProfile = new URLSearchParams(location.search).get('profile') === 'original' ? 'original' : 'hd'
let game = createGame([1, 2, 3, 4], 1)
game.phase = 'property-decision'
game.propertyOffer = { kind: 'purchase', parcelId: 83, amount: 1800, ownerId: null }
if (scenario === 'upgrade') {
  game.properties[47] = { ownerId: 1, level: 2 }
  game.propertyOffer = { kind: 'upgrade', parcelId: 47, amount: 2000, ownerId: 1 }
}
if (scenario === 'neutral') { game.properties[47] = { ownerId: null, level: 3 }; game.propertyOffer = { kind: 'purchase', parcelId: 47, amount: 2000, ownerId: null } }
if (scenario === 'rent') {
  game.properties[43] = { ownerId: 2, level: 2 }
  game.properties[47] = { ownerId: 2, level: 0 }
  game.propertyOffer = { kind: 'rent', parcelId: 47, amount: 3800, ownerId: 2 }
}
if (scenario === 'rent-many') { for(const id of [43,45,47])game.properties[id]={ownerId:2,level:0};game.propertyOffer={kind:'rent',parcelId:47,amount:2400,ownerId:2} }
if (scenario === 'victory') {
  game.phase = 'ended'; game.propertyOffer = null
  game.outcome = { kind: 'victory', winnerId: 1 }; game.eliminatedPlayerIds = [2, 3, 4]
  for (const player of game.players.slice(1)) { player.cash = 0; player.deposit = 0 }
}
if (scenario === 'defeat') { game=createGame([1],1);game.phase='ended';game.propertyOffer=null;game.outcome={kind:'defeat',winnerId:null};game.eliminatedPlayerIds=[1];game.players[0]!.cash=0;game.players[0]!.deposit=0 }
if (scenario === 'bankruptcy') {
  game.players[0]!.cash = 0; game.players[0]!.deposit = -300
  game.properties[47] = { ownerId: 1, level: 3 }
  game = settleBankruptcy(game, 1)
  game.phase = 'interaction'; game.propertyOffer = null
  game.interaction = { kind: 'bankruptcy', playerId: 1, receipt: game.bankruptcyReceipts[0]! }
}
createApp({ setup() {
  const host = ref<HTMLElement>(), ready = ref(false), error = ref('')
  let scene: MapSceneHandle | undefined
  const resize = () => scene?.resize(host.value!.clientWidth, host.value!.clientHeight)
  onMounted(async () => {
    try {
      const [manifest, reactions] = await Promise.all([
        fetch('/assets/manifest.json').then(r => r.json()).then(parseAssetManifest),
        fetch('/assets/characters/1/reactions/manifest.json').then(r => r.json()).then(parseReactionManifest),
      ])
      scene = await createMapScene(host.value!, map as MapData, manifest, {
        signal: new AbortController().signal, onFrame: () => {},
        playerManifests: [{ playerId: 1, characterId: 1, manifest, reactions }],
        onAssetError: err => { error.value = err.message },
      })
      resize(); scene.setProperties(game.properties); scene.setCompanies(game.players)
      scene.follow({ column: 25, row: 31 }); scene.setPaused(true)
      window.addEventListener('resize', resize); ready.value = true
    } catch (err) { error.value = String(err) }
  })
  onBeforeUnmount(() => { window.removeEventListener('resize', resize); scene?.destroy() })
  return () => h('main', { class: 'original-ui' }, [
    h('div', { class: 'fixture-label', 'data-testid': 'fixture-ready' }, `真实组件视觉夹具 · ${scenario} · ${ready.value ? '已准备' : '准备中'}`),
    error.value ? h('div', { id: 'fixture-error', role: 'alert' }, error.value) : null,
    h('section', { class: 'board-surface' }, [h('div', { ref: host, class: 'canvas-host' }),
      h(PropertyPanel, { game, paused: false, assetProfile, onAssetError: (err: Error) => { error.value = err.message } }),
      h(EndgamePanel, { game, paused: false, assetProfile, onAssetError: (err: Error) => { error.value = err.message } }),
    ]),
  ])
} }).mount('#app')
