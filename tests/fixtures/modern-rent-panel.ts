import { createApp, h, shallowRef, ref } from 'vue'
import PropertyPanel from '../../src/modern/features/game/PropertyPanel.vue'
import { createGameController } from '../../src/modern/features/game/controller'
import { createGame } from '../../src/modern/features/game/setup'
import '../../src/modern/styles/original-ui.css'

const game = createGame([1, 2, 3, 4], 1)
game.phase = 'property-decision'; game.propertyOffer = { kind: 'rent', parcelId: 47, amount: 3800, ownerId: 2 }
game.properties[43] = { ownerId: 2, level: 2 }; game.properties[47] = { ownerId: 2, level: 0 }
const state = shallowRef(game), previewing = ref(false)
const automatic = new URLSearchParams(location.search).has('auto')
const controller = automatic ? createGameController(game, { propertyPreviewDurationMs: 1500,
  onState: next => { state.value = next }, onPropertyPreview: preview => { previewing.value = preview !== null },
}) : undefined
createApp({ render: () => h('div', [
  h('output', { 'data-testid': 'rent-wallet' }, `${state.value.players[0]!.cash}/${state.value.players[1]!.deposit}`),
  h('output', { 'data-testid': 'rent-turn' }, `${state.value.phase}/${state.value.activePlayerIndex}`),
  h(PropertyPanel, { game: state.value, paused: false, previewing: previewing.value }),
]) }).mount('#fixture')
window.addEventListener('beforeunload', () => controller?.dispose())
