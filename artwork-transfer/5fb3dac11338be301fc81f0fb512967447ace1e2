import { createApp, defineComponent, h, ref } from 'vue'
import EndgamePanel from '../../src/modern/features/game/EndgamePanel.vue'
import { createGameController } from '../../src/modern/features/game/controller'
import { getCardCell } from '../../src/modern/features/game/direct-cards'
import { settleBankruptcy } from '../../src/modern/features/game/lifecycle'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { createGame } from '../../src/modern/features/game/setup'
import { type CarnivalInput, beginCarnival } from '../../src/modern/features/game/carnival'
import { beginLudo } from '../../src/modern/features/game/ludo'
import { getLuckEvent } from '../../src/modern/features/game/events'
import { parseActivityAssets } from '../../src/modern/features/game/activity-assets'
import { mapAssetProfile } from '../../src/modern/features/assets/profiles'
import '../../src/modern/styles/original-ui.css'

const query = new URLSearchParams(location.search), scenario = query.get('scenario') ?? 'monthly'
let game = createGame([1, 2, 3, 4], 0, 1)
game.phase = 'interaction'
if (scenario === 'monthly') { game.finance.monthlyQuoteIndex = 6; game.interaction = { kind: 'monthly-settlement', playerId: 1,
  entries: Array.from({ length: 20 }, (_, index) => ({ kind: 'deposit-interest', playerId: index % 4 + 1, depositDelta: 13294 })),
} }
else if (scenario === 'carnival') game.interaction = { kind: 'carnival', playerId: 1, game: beginCarnival(1, 1).game }
else if (scenario === 'ludo') game.interaction = { kind: 'ludo', playerId: 1, game: beginLudo(100, 1).game }
else if (scenario === 'fortune' || scenario === 'wealth') {
  game.world.markers = { [getCardCell(game.players[0]!.position)!.id]: scenario === 'wealth' ? 2 : 4 }; game.phase = 'landed'; game.continuation = 'handle-landing'; const controller = createGameController(game); game = structuredClone(controller.state); controller.dispose()
}
else if (scenario === 'bankruptcy') { game.players[0]!.cash = 0; game.players[0]!.deposit = -300; game = settleBankruptcy(game, 1); game.phase = 'interaction'; game.interaction = { kind: 'bankruptcy', playerId: 1, receipt: game.bankruptcyReceipts[0]! } }
else if (scenario === 'card') game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: { kind: 'card', message: 'received', cardId: 22 } }
else { const luckEvent = getLuckEvent(19); game.interaction = { kind: 'notice', playerId: 1, resume: 'end-turn', notice: { kind: 'luck', message: luckEvent.description, amount: luckEvent.amount, luckEvent } } }
const profile = query.get('profile') === 'original' ? 'original' : 'hd'
const assets = mapAssetProfile(parseActivityAssets(await (await fetch('/assets/activities/manifest.json')).json()), profile)
createApp(defineComponent({ setup() {
  const ready = ref(false), acknowledged = ref(false), error = ref(''), pointer = ref(400)
  return () => h('main', { class: 'original-ui' }, [
    h('header', { class: 'fixture-toolbar' }, [h('h1', '已记录界面问题回放夹具'), h('output', { 'data-testid': 'ready' }, ready.value ? 'ready' : 'loading'),
      h('output', { 'data-testid': 'acknowledged' }, String(acknowledged.value)), h('output', { 'data-testid': 'pointer' }, pointer.value), h('span', { role: 'alert' }, error.value)]),
    h('div', { class: 'board-surface' }, [scenario === 'bankruptcy' ? h(EndgamePanel, { game, paused: false, assetProfile: profile, onAcknowledge: () => { acknowledged.value = true } }) : h(InteractionPanel, { game, paused: false, cardAssets: [], activityAssets: assets, assetProfile: profile,
      onActivityReady: () => { ready.value = true }, onAcknowledgeMonthly: () => { acknowledged.value = true }, onAcknowledge: () => { acknowledged.value = true },
      onAssetError: (cause: Error) => { error.value = cause.message }, onCarnivalInput: (input: CarnivalInput) => { if (input.kind === 'pointer') pointer.value = input.x },
    })]), h('footer', '手牌区域边界：活动画面必须完整显示在上方'),
  ])
} })).mount('#app')
const style = document.createElement('style')
style.textContent = 'html,body,#app{margin:0;height:100%;font:14px system-ui}*{box-sizing:border-box}main{height:100dvh;display:flex;flex-direction:column;background:#c5eaff}.fixture-toolbar{height:80px;flex:none;padding:8px}h1{font-size:16px;margin:0}output{margin-right:12px}.board-surface{flex:1;min-height:0;position:relative;container-type:size;background:#88ccec}main>footer{height:180px;flex:none;padding:20px;background:#50b4f2}'
document.head.append(style)
