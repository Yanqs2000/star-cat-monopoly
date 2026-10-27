import { createApp, h } from 'vue'
import PropertyPanel from '../../src/modern/features/game/PropertyPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import '../../src/modern/styles/original-ui.css'

const game = createGame([1, 2, 3, 4], 1)
game.phase = 'property-decision'; game.propertyOffer = { kind: 'rent', parcelId: 47, amount: 3800, ownerId: 2 }
game.properties[43] = { ownerId: 2, level: 2 }; game.properties[47] = { ownerId: 2, level: 0 }
createApp({ render: () => h(PropertyPanel, { game, paused: false, previewing: false }) }).mount('#fixture')
