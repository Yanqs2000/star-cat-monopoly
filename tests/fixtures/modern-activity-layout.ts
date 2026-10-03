import { createApp, defineComponent, h, ref } from 'vue'
import { createGame } from '../../src/modern/features/game/setup'
import InteractionPanel from '../../src/modern/features/game/InteractionPanel.vue'
import { parseActivityAssets, type ActivityManifest } from '../../src/modern/features/game/activity-assets'
const scenario = new URLSearchParams(location.search).get('scenario') ?? 'court-target'
const game = createGame([1, 2, 3, 4], 1, 1)
game.phase = 'interaction'; game.world.markers = {}
game.interaction = scenario === 'portal' ? { kind: 'portal', playerId: 1, stage: 'choice' }
  : scenario === 'court-case' ? { kind: 'court', playerId: 1, stage: 'case', targetId: 2 }
  : { kind: 'court', playerId: 1, stage: 'target' }
const assets = parseActivityAssets(await (await fetch('/assets/activities/manifest.json')).json())
const Fixture = defineComponent({ setup() {
  const chosen = ref<number>(), ready = ref(false)
  return () => h('main', [h('h1', '原组件缩放热点测试夹具'), h('output', { 'data-testid': 'layout-choice' }, chosen.value ?? 'none'),
    h('p', { 'data-testid': 'layout-ready' }, ready.value ? '原素材已准备' : '等待原素材'),
    h('section', { id: 'layout-stage' }, [h(InteractionPanel, {
      game, paused: false, cardAssets: [], activityAssets: assets as ActivityManifest,
      onCourtTarget: (id: number) => { chosen.value = id }, onCourtCase: (id: number) => { chosen.value = id },
      onChoosePortal: (id: number) => { chosen.value = id }, onActivityReady: () => { ready.value = true },
    })]),
  ])
} })
const style = document.createElement('style')
style.textContent = 'body{margin:0;background:#173c49;color:white;font:14px system-ui}main{padding:0 28px}#layout-stage{position:relative;width:100%;height:750px;background:#65c7fd}'
document.head.append(style); createApp(Fixture).mount('#app')
