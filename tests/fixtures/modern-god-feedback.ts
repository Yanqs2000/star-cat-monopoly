import mapJson from '../../src/modern/data/map.json'
import { parseAssetManifest } from '../../src/modern/features/characters/assets'
import { parseReactionManifest } from '../../src/modern/features/characters/reactions'
import { createGameController, type GameController } from '../../src/modern/features/game/controller'
import { buildPlayerPoses, interactionVisualPlan } from '../../src/modern/features/game/game-visuals'
import { createGame } from '../../src/modern/features/game/setup'
import { createMapScene } from '../../src/modern/features/map/MapScene'
import type { MapData } from '../../src/modern/features/map/types'

const query = new URLSearchParams(location.search)
const godId = query.get('god') === '3' ? 3 : 5
const cards = query.get('empty') === '1' ? [] : [5, 6, 7]
const game = createGame([1, 7, 12, 5], 1, 3, { year: 2026, month: 10, day: 7 })
game.activePlayerIndex = 2
game.players[2]!.position = { column: 16, row: 16 }
game.players[2]!.direction = 2
game.players[2]!.controller = 'ai'
game.players[2]!.cash = godId === 3 ? 0 : 95800
game.inventories[3] = cards
game.world.markers = { 53: godId }
game.phase = 'landed'
game.continuation = 'handle-landing'
const button = document.querySelector<HTMLButtonElement>('#encounter')!
const result = document.querySelector<HTMLElement>('#result')!
let controller: GameController | undefined

try {
  const [manifest, reactions] = await Promise.all([
    fetch('/assets/characters/12/manifest.json').then(response => response.json()).then(parseAssetManifest),
    fetch('/assets/characters/12/reactions/manifest.json').then(response => response.json()).then(parseReactionManifest),
  ])
  const scene = await createMapScene(document.querySelector<HTMLElement>('#scene')!, mapJson as MapData, manifest, {
    signal: new AbortController().signal, onFrame: () => {},
    playerManifests: [{ playerId: 3, characterId: 12, manifest, reactions }],
    onAssetError: error => { result.textContent = error.message },
  })
  scene.resize(960, 600)
  scene.setPlayers(buildPlayerPoses(game).filter(player => player.playerId === 3))
  scene.setWorld(game.world)
  scene.follow(game.players[2]!.position)
  result.textContent = '原素材已载入'
  button.disabled = false
  button.textContent = godId === 3 ? '触发穷神（现金0）' : `触发衰神（${cards.length}张手牌）`
  button.onclick = () => {
    button.disabled = true
    controller = createGameController(game, {
      onState: state => { scene.setPlayers(buildPlayerPoses(state).filter(player => player.playerId === 3)); scene.setWorld(state.world) },
      onInteractionEvent: event => {
        const plan = interactionVisualPlan(event)
        result.textContent = JSON.stringify({ npcId: event.worldEvent?.npcId, plan })
        void Promise.all(plan.reactions.map(reaction => scene.playReaction(reaction.playerId, reaction.name)))
          .then(() => { result.textContent += ' · 原表情已播放' })
          .catch(error => { result.textContent = String(error) })
      },
    })
    controller.setPaused(true)
  }
  document.querySelector<HTMLButtonElement>('#freeze')!.onclick = () => scene.setPaused(true)
  window.addEventListener('beforeunload', () => { controller?.dispose(); scene.destroy() })
} catch (error) { result.textContent = String(error) }
