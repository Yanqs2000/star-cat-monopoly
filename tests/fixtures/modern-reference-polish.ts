import { createApp, defineComponent, h, ref } from 'vue'
import GameReferencePanel, { type ReferenceTab } from '../../src/modern/features/game/GameReferencePanel.vue'
import MapInfoPanel from '../../src/modern/features/game/MapInfoPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import { inspectMapCell } from '../../src/modern/features/game/queries'
import map from '../../src/modern/data/map.json'
import '../../src/modern/styles/original-ui.css'
const game = createGame([12, 2, 7, 4], 42)
game.properties[map.parcels[0]!.id] = { ownerId: 2, level: 3 }
game.finance.stocks[1]!.holdings[1] = { shares: 45, averageCost: 12 }
game.finance.stocks[1]!.holdings[2] = { shares: 70, averageCost: 10 }
const scenario = new URLSearchParams(location.search).get('tab') ?? 'assets'
createApp(defineComponent({ setup() {
  const tab = ref(scenario as ReferenceTab), closed = ref(false)
  return () => h('main', { class: 'original-ui' }, [h('button', { id: 'opener' }, '打开查询'), h('output', { 'data-testid': 'closed' }, String(closed.value)), closed.value ? null : scenario === 'map' ? h(MapInfoPanel, { info: inspectMapCell(game, map.parcels[0]!.buildingCell)!, onClose: () => { closed.value = true } }) : h(GameReferencePanel, { game, tab: tab.value, onTab: (value: ReferenceTab) => { tab.value = value }, onClose: () => { closed.value = true } })])
} })).mount('#app')
const style = document.createElement('style'); style.textContent = 'html,body,#app,main{margin:0;min-height:100%;font:14px system-ui}body{background:linear-gradient(145deg,#d9f5ff,#80c8ef)}main{height:100dvh;position:relative}*{box-sizing:border-box}'; document.head.append(style)
