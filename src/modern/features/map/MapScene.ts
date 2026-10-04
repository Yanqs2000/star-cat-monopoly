import { Application, Container, Graphics, ImageSource, Point, Sprite, Text, Texture, type Ticker } from 'pixi.js'
import { WalkPreview } from '../characters/WalkPreview'
import type { AssetManifest, Facing } from '../characters/assets'
import { ReactionPlayer, type GodId, type ReactionManifest, type ReactionName } from '../characters/reactions'
import type { PlayerTransition } from '../game/controller'
import { getCardRecord } from '../game/direct-cards'
import type { Direction, PlayerState } from '../game/types'
import type { WorldState } from '../game/world-cards'
import type { PropertyLedger } from '../game/property'
import { gridToScene } from './coordinates'
import { parsePropertyAssets } from './property-assets'
import { companyPlacement, parseCompanyAssets, type CompanyAssetsManifest } from './company-assets'
import { pickTargetAfterPointer } from './target-selection'
import type { GridPoint, MapData } from './types'
import { parseWorldAssets, type WorldAssetsManifest, type WorldClip } from './world-assets'
import { decodeBitmap } from './bitmap-loader'
import { ReactionVisibility } from '../game/game-visuals'
import type { ActivityClip, NativeOverlay } from '../game/activity-assets'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'

export interface PlayerPose extends Pick<PlayerState, 'characterId' | 'position' | 'direction'> {
  eliminated?: boolean
  playerId: number
  moving: boolean
  active: boolean
  visible: boolean
  godId: number | null
}

export interface MapSceneHandle {
  focus(point: GridPoint): void
  follow(point: GridPoint): void
  showMarkers(visible: boolean): void
  setFacing(facing: Facing): void
  setPlaying(playing: boolean): void
  setPlayers(players: PlayerPose[]): void
  setCompanies(players: PlayerState[]): void
  setProperties(properties: PropertyLedger): void
  setWorld(world: WorldState): void
  setTargeting(targeting: boolean): void
  playReaction(playerId: number, reaction: ReactionName): Promise<void>
  playEffect(clipId: 'rocket' | 'explosion' | 'card-gain' | 'ticket-gain', position: GridPoint): void
  setActivity(clip: ActivityClip | null, frame?: number, position?: GridPoint, transform?: {scale: number;depth: number}): Promise<void>
  getPortalDecorations(): NativeOverlay[]
  transitionPlayer(transition: PlayerTransition | null): void
  setPaused(paused: boolean): void
  setSpeed(speed: number): void
  overview(): void
  getCameraState(): MapCameraState
  restoreCameraState(state: MapCameraState): void
  resize(width: number, height: number): void
  destroy(): void
}

export interface MapCameraState { x:number; y:number; scale:number; following:boolean }

export interface MapSceneOptions {
  signal: AbortSignal
  onFrame: (frame: number) => void
  assetProfile?: AssetProfile
  playerManifests?: { playerId: number; characterId: number; manifest: AssetManifest; reactions: ReactionManifest }[]
  onManualCamera?: () => void
  onTargetCell?: (position: GridPoint) => void
  onAssetError?: (error: Error) => void
  requiredTextureUrls?: string[]
}

const FACING_BY_DIRECTION: Record<Direction, Facing> = {
  1: 'down-right', 2: 'down-left', 3: 'up-left', 4: 'up-right',
}

interface WorldAnimation {
  view: Container
  sprite: Sprite
  clip: WorldClip
  elapsedMs: number
}

interface EffectAnimation extends WorldAnimation {
  holdMs: number
}

function worldFrameAt(clip: WorldClip, elapsedMs: number) {
  const frameDuration = 1000 / clip.fps
  const raw = Math.floor(Math.max(0, elapsedMs) / frameDuration)
  const index = clip.loop ? raw % clip.frames.length : Math.min(raw, clip.frames.length - 1)
  return clip.frames[index]!
}

export async function createMapScene(host: HTMLElement, map: MapData, manifest: AssetManifest,
  options: MapSceneOptions): Promise<MapSceneHandle> {
  const app = new Application()
  const assetProfile = options.assetProfile ?? 'original'
  const textures = new Map<string, Texture>()
  const textureUrls = new Map<Texture,string>()
  const bitmaps: ImageBitmap[] = []
  const inflightTextures = new Map<string, Promise<void>>()
  const controller = new AbortController()
  let initialized = false
  let destroyed = false
  const abort = () => controller.abort()
  options.signal.addEventListener('abort', abort, { once: true })
  if (options.signal.aborted) abort()
  const release = () => {
    if (destroyed) return
    destroyed = true
    options.signal.removeEventListener('abort', abort)
    controller.abort()
    if (initialized) app.destroy({ removeView: true }, { children: true })
    for (const texture of textures.values()) texture.destroy(true)
    for (const bitmap of bitmaps) bitmap.close()
  }
  const loadTexture = (url: string): Promise<void> => {
    if (textures.has(url)) return Promise.resolve()
    const existing = inflightTextures.get(url)
    if (existing) return existing
    const loading = (async () => {
      const selectedUrl = profileAssetUrl(url, assetProfile)
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}${selectedUrl}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const bitmap = await decodeBitmap(await response.blob(), controller.signal)
        bitmaps.push(bitmap)
        const resolution = assetProfile === 'hd' ? 2 : 1
        const texture=new Texture({ source: new ImageSource({ resource: bitmap, resolution, alphaMode: 'premultiplied-alpha', scaleMode: 'linear' }) })
        textures.set(url,texture);textureUrls.set(texture,selectedUrl)
      } catch (error) {
        throw new Error(`素材加载失败：${selectedUrl}（${error instanceof Error ? error.message : String(error)}）`)
      } finally {
        inflightTextures.delete(url)
      }
    })()
    inflightTextures.set(url, loading)
    return loading
  }
  try {
    await app.init({ width: 800, height: 600, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true, antialias: true, background: '#66ccff', preference: 'webgl', autoStart: false, sharedTicker: false })
    initialized = true
    const manifests = options.playerManifests?.map(item => item.manifest) ?? [manifest]
    const propertyManifest = options.playerManifests ? await (async () => {
      const url = 'assets/properties/manifest.json'
      const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`素材加载失败：${url}（HTTP ${response.status}）`)
      return parsePropertyAssets(await response.json())
    })() : undefined
    const worldManifest = options.playerManifests ? await (async (): Promise<WorldAssetsManifest> => {
      const url = 'assets/world/manifest.json'
      const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`素材加载失败：${url}（HTTP ${response.status}）`)
      return parseWorldAssets(await response.json())
    })() : undefined
    const companyManifest = options.playerManifests ? await (async (): Promise<CompanyAssetsManifest> => {
      const url = 'assets/companies/manifest.json'
      const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`素材加载失败：${url}（HTTP ${response.status}）`)
      return parseCompanyAssets(await response.json())
    })() : undefined
    const urls = [...new Set([manifest.map.url, ...(options.requiredTextureUrls ?? []), ...manifests.flatMap(item => item.clips.flatMap(clip => clip.frames.map(frame => frame.url))),
      ...(propertyManifest?.sellSigns.map(item => item.url) ?? []), ...(propertyManifest?.houses.map(item => item.url) ?? []),
      ...(worldManifest?.clips.flatMap(clip => clip.frames.map(frame => frame.url)) ?? []),
      ...(worldManifest?.neutralHouses.map(frame => frame.url) ?? []),
      ...(companyManifest?.companies.map(item => item.url) ?? [])])]
    const results = await Promise.allSettled(urls.map(loadTexture))
    const failure = results.find(result => result.status === 'rejected')
    if (failure?.status === 'rejected') throw failure.reason
    controller.signal.throwIfAborted()

    const viewport = new Container()
    const world = new Container()
    const markers = new Container()
    const entities = new Container()
    entities.sortableChildren = true
    const background = new Sprite(textures.get(manifest.map.url)!)
    background.position.set(manifest.map.offsetX, manifest.map.offsetY)
    world.addChild(background, markers, entities)
    for (const parcel of map.parcels) {
      const road = gridToScene(parcel.roadCell)
      const building = gridToScene(parcel.buildingCell)
      const line = new Graphics().moveTo(road.x + 28, road.y + 20).lineTo(building.x + 28, building.y + 20).stroke({ color: '#215261', alpha: 0.55, width: 1 })
      line.circle(road.x + 28, road.y + 20, 6).fill({ color: '#ffe28a' }).stroke({ color: '#334b56', width: 1 })
      const label = new Text({ text: String(parcel.id), style: { fontSize: 10, fill: '#132c36', fontFamily: 'system-ui', fontWeight: 'bold' } })
      label.position.set(road.x + 37, road.y + 11)
      markers.addChild(line, label)
    }

    const inspectionWalker = options.playerManifests ? undefined : new WalkPreview(manifest.clips, textures)
    if (inspectionWalker) entities.addChild(inspectionWalker.view)
    const properties = propertyManifest ? map.parcels.map(parcel => {
      const view = new Container()
      const position = gridToScene(parcel.buildingCell)
      view.position.set(position.x, position.y)
      view.zIndex = parcel.buildingCell.row * 100 + parcel.buildingCell.column
      const image = new Sprite()
      const badge = new Text({ text: '', style: { fontSize: 12, fontFamily: 'system-ui', fontWeight: 'bold', fill: '#fff', stroke: { color: '#12303b', width: 3 } } })
      badge.position.set(8, -17)
      view.addChild(image, badge)
      entities.addChild(view)
      return { parcel, image, badge }
    }) : []
    const companyViews = companyManifest ? Array.from({ length: 4 }, () => {
      const view = new Container()
      const image = new Sprite()
      view.addChild(image)
      entities.addChild(view)
      return { view, image }
    }) : []
    const actors = (options.playerManifests ?? []).map(({ playerId, manifest: playerManifest, reactions }) => {
      const view = new Container()
      const active = new Graphics().circle(28, 20, 18).fill({ color: '#ffe18a', alpha: 0.28 }).stroke({ color: '#ffe18a', width: 2 })
      const walker = new WalkPreview(playerManifest.clips, textures)
      const initialReaction = reactions.clips.find(clip => clip.facing === 'down-right' && clip.name === 'neutral')!
      const reaction = new ReactionPlayer(initialReaction)
      const reactionSprite = new Sprite()
      const godSprite = new Sprite()
      reactionSprite.visible = false
      godSprite.visible = false
      view.addChild(active, walker.view, reactionSprite, godSprite)
      entities.addChild(view)
      return { playerId, view, active, walker, reactions, reaction, reactionSprite, godSprite, facing: 'down-right' as Facing, reacting: false, godId: null as number | null, visibility: new ReactionVisibility(true) }
    })
    const worldAnimations = new Map<number, WorldAnimation>()
    const effects = new Set<EffectAnimation>()
    viewport.addChild(world)
    const activitySprite = new Sprite()
    const activityViewport = new Container()
    activityViewport.addChild(activitySprite)
    viewport.addChild(activityViewport)
    activitySprite.visible = false
    let activityId: string | undefined
    let activityGeneration = 0
    const setActivity = async (clip: ActivityClip | null, frame = 1, position?: GridPoint, transform?: {scale: number;depth: number}) => {
      if (!clip) {
        activityId = undefined; activityGeneration += 1; activitySprite.visible = false
        return
      }
      if (activityId !== clip.id) { activityId = clip.id; activityGeneration += 1 }
      const token = activityGeneration
      // Share textures for this scene only; the normal scene disposal owns them.
      let cursor = 0
      await Promise.all(Array.from({ length: Math.min(6, clip.frames.length) }, async () => {
        while (cursor < clip.frames.length) await loadTexture(clip.frames[cursor++]!.url)
      }))
      if (destroyed || token !== activityGeneration) return
      const source = clip.frames[frame - 1]!
      activitySprite.texture = textures.get(source.url)!
      const scale=transform?.scale ?? 1
      activitySprite.scale.set(scale)
      if (position) {
        if (activitySprite.parent !== entities) entities.addChild(activitySprite)
        const point = gridToScene(position)
        activitySprite.position.set(point.x + source.offsetX*scale, point.y + source.offsetY*scale)
        activitySprite.zIndex = transform?.depth ?? position.row * 100 + position.column + 1
      } else {
        if (activitySprite.parent !== activityViewport) activityViewport.addChild(activitySprite)
        activitySprite.position.set(source.offsetX, source.offsetY)
      }
      activitySprite.visible = true
    }
    app.stage.addChild(viewport)

    let viewportScale = 1
    let following = false
    let paused = false
    let speed = 1
    let movement: (PlayerTransition & { elapsedMs: number }) | undefined
    const placeCamera = (target: { x: number; y: number }) => {
      world.scale.set(1)
      world.position.set(400 - target.x - 28, 320 - target.y - 20)
    }
    const resize = (width: number, height: number) => {
      if (destroyed || width <= 0 || height <= 0) return
      app.renderer.resize(width, height)
      viewportScale = Math.min(width / 800, height / 600)
      viewport.scale.set(viewportScale)
      viewport.position.set((width - 800 * viewportScale) / 2, (height - 600 * viewportScale) / 2)
    }
    const focus = (point: GridPoint) => {
      const target = gridToScene(point)
      inspectionWalker?.view.position.set(target.x, target.y)
      following = false
      placeCamera(target)
    }
    const follow = (point: GridPoint) => {
      following = true
      placeCamera(gridToScene(point))
    }
    const getCameraState = ():MapCameraState => ({x:world.position.x,y:world.position.y,scale:world.scale.x,following})
    const restoreCameraState = (state:MapCameraState) => {
      following=state.following
      world.position.set(state.x,state.y)
      world.scale.set(state.scale)
    }
    const setPlayers = (poses: PlayerPose[]) => {
      poses.forEach((pose) => {
        const actor = actors.find(item => item.playerId === pose.playerId)
        if (!actor) return
        const target = gridToScene(pose.position)
        actor.view.position.set(target.x, target.y)
        actor.view.zIndex = pose.position.row * 100 + pose.position.column
        actor.active.visible = pose.active
        const wasDesired = actor.visibility.desiredVisible
        actor.visibility.setDesired(pose.visible)
        if (pose.visible && !wasDesired && actor.visibility.reaction === 'hurt') {
          actor.visibility.clear()
          actor.reacting = false
          actor.reactionSprite.visible = false
        }
        actor.facing = FACING_BY_DIRECTION[pose.direction]
        if (pose.eliminated) {
          actor.visibility.clear();actor.reacting=false;actor.reactionSprite.visible=false
          actor.walker.view.visible=false;actor.view.visible=false;actor.godId=null;actor.godSprite.visible=false
          return
        }
        actor.walker.setPose(actor.facing, pose.moving)
        if (pose.moving) {
          actor.visibility.clear()
          actor.reacting = false
          actor.reactionSprite.visible = false
        }
        actor.walker.view.visible = !actor.reacting
        actor.view.visible = actor.visibility.visible
        const god = actor.reactions.godOverlays.find(item => item.godId === pose.godId as GodId)
        actor.godId = pose.godId
        actor.godSprite.visible = god !== undefined && textures.has(god.url)
        if (god) {
          void loadTexture(god.url).then(() => {
            if (destroyed || actor.godId !== god.godId) return
            actor.godSprite.texture = textures.get(god.url)!
            actor.godSprite.position.set(god.offsetX, god.offsetY)
            actor.godSprite.visible = true
          }).catch(error => { if (!destroyed) options.onAssetError?.(error as Error) })
        }
      })
    }
    const setCompanies = (players: PlayerState[]) => {
      if (!companyManifest) return
      for (const [index, player] of players.entries()) {
        const target = companyViews[index]
        if (!target) continue
        const placement = companyPlacement(companyManifest, player.characterId, player.hometown)
        target.view.position.set(placement.x, placement.y)
        target.view.zIndex = placement.y / 40 * 100 + placement.x / 56
        target.image.texture = textures.get(placement.url)!
        target.image.position.set(placement.offsetX, placement.offsetY)
      }
    }
    const setProperties = (ledger: PropertyLedger) => {
      if (!propertyManifest) return
      for (const { parcel, image, badge } of properties) {
        const state = ledger[parcel.id]!
        const asset = state.ownerId === null
          ? state.level === 0
            ? propertyManifest.sellSigns.find(item => item.facing === parcel.facing)!
            : worldManifest!.neutralHouses.find(item => item.facing === parcel.facing && item.level === state.level)!
          : propertyManifest.houses.find(item => item.ownerId === state.ownerId && item.facing === parcel.facing && item.level === state.level)!
        image.texture = textures.get(asset.url)!
        image.position.set(asset.offsetX, asset.offsetY)
        badge.text = state.ownerId === null ? (state.level === 0 ? '' : `中立 · ${state.level}级`) : `P${state.ownerId} · ${state.level}级`
      }
    }
    const getPortalDecorations = (): NativeOverlay[] => {
      return [...properties.map(item=>({image:item.image,view:item.image.parent!,symbol:3401})),
        ...companyViews.map(item=>({image:item.image,view:item.view,symbol:0}))].map(({image,view,symbol})=> {
          const url=textureUrls.get(image.texture)
          if(!url)throw new Error('小地图图层缺少原素材纹理')
          const clip:ActivityClip={id:`mini-${url.replace(/\W/g,'-')}`,sourceSymbol:symbol,fps:30,frames:[{
            sourceFrame:1,url,width:image.texture.width,height:image.texture.height,offsetX:image.x,offsetY:image.y,fields:[],
          }]}
          return {clip,frame:1,x:170+view.x*.25,y:90+view.y*.25,scale:.25,depth:30000+view.zIndex*30}
        })
    }
    const setWorld = (state: WorldState) => {
      if (!worldManifest) return
      const desired = new Set(Object.keys(state.markers).map(Number))
      for (const [cellId, animation] of worldAnimations) {
        if (desired.has(cellId)) continue
        entities.removeChild(animation.view)
        animation.view.destroy({ children: true })
        worldAnimations.delete(cellId)
      }
      for (const [cellIdText, npcId] of Object.entries(state.markers)) {
        const cellId = Number(cellIdText)
        const record = getCardRecord(cellId)
        if (!record) continue
        const facing = typeof record.facing === 'number' && record.facing >= 1 && record.facing <= 4 ? record.facing : 1
        const clipId = npcId === 6 ? `barrier-${facing}` : npcId === 7 ? 'mine' : `npc-${npcId}`
        const clip = worldManifest.clips.find(item => item.id === clipId)
        if (!clip) continue
        const existing = worldAnimations.get(cellId)
        if (existing?.clip.id === clipId) continue
        if (existing) {
          entities.removeChild(existing.view)
          existing.view.destroy({ children: true })
          worldAnimations.delete(cellId)
        }
        const view = new Container()
        const sprite = new Sprite()
        const position = gridToScene(record.position)
        view.position.set(position.x, position.y)
        view.zIndex = record.position.row * 100 + record.position.column
        view.addChild(sprite)
        entities.addChild(view)
        const animation = { view, sprite, clip, elapsedMs: 0 }
        worldAnimations.set(cellId, animation)
        const frame = worldFrameAt(clip, 0)
        sprite.texture = textures.get(frame.url)!
        sprite.position.set(frame.offsetX, frame.offsetY)
      }
    }
    const playReaction = (playerId: number, name: ReactionName): Promise<void> => {
      const actor = actors.find(item => item.playerId === playerId)
      if (!actor) return Promise.resolve()
      const clip = actor.reactions.clips.find(item => item.facing === actor.facing && item.name === name)
      if (!clip) return Promise.resolve()
      const token = actor.visibility.begin(name)
      actor.view.visible = actor.visibility.visible
      return Promise.all(clip.frames.map(frame => loadTexture(frame.url))).then(() => {
        if (destroyed || !actor.visibility.isCurrent(token)) return
        actor.reaction.reset(clip)
        actor.visibility.loaded()
        actor.reacting = true
        actor.walker.view.visible = false
        actor.reactionSprite.visible = true
        actor.view.visible = actor.visibility.visible
        const frame = actor.reaction.currentFrame
        actor.reactionSprite.texture = textures.get(frame.url)!
        actor.reactionSprite.position.set(frame.offsetX, frame.offsetY)
      }).catch(error => {
        if (destroyed || !actor.visibility.isCurrent(token)) return
        actor.visibility.clear()
        actor.reacting = false
        actor.reactionSprite.visible = false
        actor.walker.view.visible = true
        actor.view.visible = actor.visibility.visible
        throw error
      })
    }
    const playEffect = (clipId: 'rocket' | 'explosion' | 'card-gain' | 'ticket-gain', position: GridPoint) => {
      const clip = worldManifest?.clips.find(item => item.id === clipId)
      if (!clip) return
      const view = new Container()
      const sprite = new Sprite()
      const point = gridToScene(position)
      view.position.set(point.x, point.y)
      view.zIndex = position.row * 100 + position.column + 1
      view.addChild(sprite)
      entities.addChild(view)
      const animation: EffectAnimation = { view, sprite, clip, elapsedMs: 0, holdMs: 250 }
      const frame = worldFrameAt(clip, 0)
      sprite.texture = textures.get(frame.url)!
      sprite.position.set(frame.offsetX, frame.offsetY)
      effects.add(animation)
    }
    let previousFrame = -1
    const tick = (ticker: Ticker) => {
      const deltaMs = paused ? 0 : ticker.deltaMS * speed
      if (inspectionWalker) {
        const frame = inspectionWalker.update(deltaMs)
        if (frame !== previousFrame) { previousFrame = frame; options.onFrame(frame) }
      }
      for (const actor of actors) actor.walker.update(deltaMs)
      for (const actor of actors) {
        if (!actor.reacting) continue
        const frame = actor.reaction.advance(deltaMs)
        actor.reactionSprite.texture = textures.get(frame.url)!
        actor.reactionSprite.position.set(frame.offsetX, frame.offsetY)
        if (actor.reaction.finished && actor.visibility.advanceHiddenHurtFinished(deltaMs, 1000 / actor.reaction.clip.fps)) {
          actor.reacting = false
          actor.reactionSprite.visible = false
          actor.walker.view.visible = true
          actor.view.visible = actor.visibility.visible
        }
      }
      for (const animation of worldAnimations.values()) {
        animation.elapsedMs += deltaMs
        const frame = worldFrameAt(animation.clip, animation.elapsedMs)
        animation.sprite.texture = textures.get(frame.url)!
        animation.sprite.position.set(frame.offsetX, frame.offsetY)
      }
      for (const animation of effects) {
        animation.elapsedMs += deltaMs
        const frame = worldFrameAt(animation.clip, animation.elapsedMs)
        animation.sprite.texture = textures.get(frame.url)!
        animation.sprite.position.set(frame.offsetX, frame.offsetY)
        const durationMs = animation.clip.frames.length * 1000 / animation.clip.fps
        if (animation.elapsedMs >= durationMs + animation.holdMs) {
          entities.removeChild(animation.view)
          animation.view.destroy({ children: true })
          effects.delete(animation)
        }
      }
      if (!movement || paused) return
      movement.elapsedMs = Math.min(movement.durationMs, movement.elapsedMs + deltaMs)
      const progress = movement.durationMs === 0 ? 1 : movement.elapsedMs / movement.durationMs
      const from = gridToScene(movement.from)
      const to = gridToScene(movement.to)
      const x = from.x + (to.x - from.x) * progress
      const y = from.y + (to.y - from.y) * progress
      const actor = actors[movement.playerIndex]
      if (actor) {
        actor.view.position.set(x, y)
        actor.view.zIndex = (movement.from.row + (movement.to.row - movement.from.row) * progress) * 100 + movement.from.column + (movement.to.column - movement.from.column) * progress
      }
      if (following) placeCamera({ x, y })
      if (progress === 1) movement = undefined
    }
    app.ticker.add(tick)

    const canvas = app.canvas
    canvas.setAttribute('aria-label', '现代地图场景')
    canvas.style.touchAction = 'none'
    let targeting = false
    let drag: { x: number; y: number; startX: number; startY: number; id: number; cameraMoved: boolean } | undefined
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      drag = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, id: event.pointerId, cameraMoved: false }
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return
      if (!drag.cameraMoved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) {
        drag.cameraMoved = true
        following = false
        options.onManualCamera?.()
      }
      if (!drag.cameraMoved) return
      world.x += (event.clientX - drag.x) / viewportScale
      world.y += (event.clientY - drag.y) / viewportScale
      drag.x = event.clientX; drag.y = event.clientY
    }
    const up = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return
      const start = { x: drag.startX, y: drag.startY }
      const cameraMoved = drag.cameraMoved
      drag = undefined
      if (!targeting || cameraMoved) return
      const bounds = canvas.getBoundingClientRect()
      const screen = new Point(
        (event.clientX - bounds.left) * app.screen.width / bounds.width,
        (event.clientY - bounds.top) * app.screen.height / bounds.height,
      )
      const local = world.toLocal(screen)
      const target = pickTargetAfterPointer(start, { x: event.clientX, y: event.clientY }, local)
      if (target) options.onTargetCell?.(target)
    }
    const cancelPointer = () => { drag = undefined }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', cancelPointer)
    host.replaceChildren(canvas)
    resize(host.clientWidth, host.clientHeight)
    focus(map.parcels[0]!.roadCell)
    app.start()

    return {
      focus, follow, resize, getCameraState, restoreCameraState, setPlayers, setCompanies, setProperties, setWorld, playReaction, playEffect, setActivity, getPortalDecorations,
      setTargeting: value => { targeting = value; canvas.style.cursor = value ? 'crosshair' : 'grab' },
      transitionPlayer: next => { movement = next ? { ...next, elapsedMs: 0 } : undefined },
      setPaused: value => { paused = value },
      setSpeed: value => { speed = value },
      setFacing: facing => inspectionWalker?.setFacing(facing),
      setPlaying: playing => inspectionWalker?.setPlaying(playing),
      showMarkers: visible => { markers.visible = visible },
      overview: () => {
        following = false
        options.onManualCamera?.()
        const scale = Math.min(760 / manifest.map.width, 560 / manifest.map.height)
        world.scale.set(scale)
        world.position.set(400 - (manifest.map.offsetX + manifest.map.width / 2) * scale, 300 - (manifest.map.offsetY + manifest.map.height / 2) * scale)
      },
      destroy: () => {
        canvas.removeEventListener('pointerdown', down)
        canvas.removeEventListener('pointermove', move)
        canvas.removeEventListener('pointerup', up)
        canvas.removeEventListener('pointercancel', cancelPointer)
        app.ticker.remove(tick)
        release()
      },
    }
  } catch (error) { release(); throw error }
}
