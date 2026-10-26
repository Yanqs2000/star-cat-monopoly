import map from '../../src/modern/data/map.json'
import { createMapScene } from '../../src/modern/features/map/MapScene'
import { parseAssetManifest } from '../../src/modern/features/characters/assets'
import { parseReactionManifest } from '../../src/modern/features/characters/reactions'
import { loadHdMapArtwork } from '../../src/modern/features/assets/hd-map-art'
import { createGame } from '../../src/modern/features/game/setup'
import { gridToScene } from '../../src/modern/features/map/coordinates'
import type { MapData } from '../../src/modern/features/map/types'

const profile = new URLSearchParams(location.search).get('profile') === 'original' ? 'original' : 'hd'
const state = createGame([1, 2, 3, 4], 16)
const abort = new AbortController()
const status = document.querySelector<HTMLElement>('#status')!
const picker = document.querySelector<HTMLSelectElement>('#parcel')!
try {
  const [manifest, reactions] = await Promise.all([
    fetch('/assets/manifest.json').then(r => r.json()).then(parseAssetManifest),
    fetch('/assets/characters/1/reactions/manifest.json').then(r => r.json()).then(parseReactionManifest),
  ])
  const artwork = profile === 'hd' ? await loadHdMapArtwork(manifest.map, abort.signal) : undefined
  const scene = await createMapScene(document.querySelector<HTMLElement>('#board')!, map as MapData, manifest, {
    signal: abort.signal, onFrame: () => {}, assetProfile: profile,
    mapBase: artwork?.baseMap, mapRegions: artwork?.regions,
    textureResolutions: Object.fromEntries(artwork?.regions.map(region => [region.url, region.pixelDensity]) ?? []),
    playerManifests: [{ playerId: 1, characterId: 1, manifest, reactions }],
    onAssetError: error => { status.textContent = error.message },
  })
  for (const parcel of map.parcels) {
    state.properties[parcel.id] = { ownerId: 4, level: 0 }
    const option = new Option(`#${parcel.id} · ${parcel.streetName} · 朝向${parcel.facing}`, String(parcel.id))
    picker.add(option)
  }
  scene.setProperties(state.properties); scene.setCompanies(state.players); scene.showMarkers(false)
  scene.setPaused(true)
  const resize = () => scene.resize(document.querySelector<HTMLElement>('#board')!.clientWidth, document.querySelector<HTMLElement>('#board')!.clientHeight)
  resize(); window.addEventListener('resize', resize)
  function focus() {
    const parcel = map.parcels.find(p => p.id === Number(picker.value))!
    const point = gridToScene(parcel.buildingCell)
    scene.restoreCameraState({ x: 400 - (point.x + 28) * 2, y: 300 - (point.y + 20) * 2, scale: 2, following: false })
    status.textContent = `全部56块已购 · 地块 ${parcel.id} · 朝向 ${parcel.facing} · ${profile}`
  }
  picker.onchange = focus
  document.querySelector<HTMLButtonElement>('#previous')!.onclick = () => { picker.selectedIndex = (picker.selectedIndex + 55) % 56; focus() }
  document.querySelector<HTMLButtonElement>('#next')!.onclick = () => { picker.selectedIndex = (picker.selectedIndex + 1) % 56; focus() }
  document.querySelector<HTMLButtonElement>('#overview')!.onclick = () => scene.overview()
  document.querySelector<HTMLSelectElement>('#level')!.onchange = event => {
    const level = Number((event.target as HTMLSelectElement).value) as 0 | 1 | 5
    for (const parcel of map.parcels) state.properties[parcel.id]!.level = level
    scene.setProperties(state.properties); focus()
  }
  ;(window as unknown as { cornerFixture: object }).cornerFixture = { scene, state, focus }
  focus()
  window.addEventListener('beforeunload', () => { abort.abort(); scene.destroy() })
} catch (error) { status.textContent = String(error) }
