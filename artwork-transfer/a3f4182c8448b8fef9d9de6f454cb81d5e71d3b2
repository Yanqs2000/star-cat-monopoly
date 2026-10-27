import { Application, Container, Graphics, ImageSource, Sprite, Text, Texture, type Ticker } from 'pixi.js'
import { WalkPreview } from '../characters/WalkPreview'
import type { AssetManifest, Facing } from '../characters/assets'
import { gridToScene } from './coordinates'
import type { GridPoint, MapData } from './types'

export interface MapSceneHandle {
  focus(point: GridPoint): void
  showMarkers(visible: boolean): void
  setFacing(facing: Facing): void
  setPlaying(playing: boolean): void
  overview(): void
  resize(width: number, height: number): void
  destroy(): void
}

export async function createMapScene(host: HTMLElement, map: MapData, manifest: AssetManifest,
  options: { signal: AbortSignal; onFrame: (frame: number) => void }): Promise<MapSceneHandle> {
  const app = new Application()
  const textures = new Map<string, Texture>()
  const bitmaps: ImageBitmap[] = []
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
  try {
    await app.init({ width: 800, height: 600, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true, antialias: true, background: '#66ccff', preference: 'webgl', autoStart: false, sharedTicker: false })
    initialized = true
    const urls = [...new Set([manifest.map.url, ...manifest.clips.flatMap(clip => clip.frames.map(frame => frame.url))])]
    const results = await Promise.allSettled(urls.map(async url => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}${url}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const bitmap = await createImageBitmap(await response.blob(), { premultiplyAlpha: 'premultiply' })
        bitmaps.push(bitmap)
        controller.signal.throwIfAborted()
        textures.set(url, new Texture({ source: new ImageSource({ resource: bitmap, alphaMode: 'premultiplied-alpha', scaleMode: 'linear' }) }))
      } catch (error) {
        throw new Error(`素材加载失败：${url}（${error instanceof Error ? error.message : String(error)}）`)
      }
    }))
    const failure = results.find(result => result.status === 'rejected')
    if (failure?.status === 'rejected') throw failure.reason
    controller.signal.throwIfAborted()
    const viewport = new Container()
    const world = new Container()
    const markers = new Container()
    const background = new Sprite(textures.get(manifest.map.url)!)
    background.position.set(manifest.map.offsetX, manifest.map.offsetY)
    world.addChild(background)
    world.addChild(markers)
    for (const parcel of map.parcels) {
      const road = gridToScene(parcel.roadCell)
      const building = gridToScene(parcel.buildingCell)
      // Original characters use a 56×40 registration cell; markers show its centre.
      const line = new Graphics().moveTo(road.x + 28, road.y + 20).lineTo(building.x + 28, building.y + 20).stroke({ color: '#215261', alpha: 0.55, width: 1 })
      line.circle(road.x + 28, road.y + 20, 6).fill({ color: '#ffe28a' }).stroke({ color: '#334b56', width: 1 })
      const label = new Text({ text: String(parcel.id), style: { fontSize: 10, fill: '#132c36', fontFamily: 'system-ui', fontWeight: 'bold' } })
      label.position.set(road.x + 37, road.y + 11)
      markers.addChild(line, label)
    }
    const walker = new WalkPreview(manifest.clips, textures)
    world.addChild(walker.view)
    viewport.addChild(world)
    app.stage.addChild(viewport)
    let viewportScale = 1
    const resize = (width: number, height: number) => {
      if (destroyed || width <= 0 || height <= 0) return
      app.renderer.resize(width, height)
      viewportScale = Math.min(width / 800, height / 600)
      viewport.scale.set(viewportScale)
      viewport.position.set((width - 800 * viewportScale) / 2, (height - 600 * viewportScale) / 2)
    }
    const focus = (point: GridPoint) => {
      const target = gridToScene(point)
      walker.view.position.set(target.x, target.y)
      world.scale.set(1)
      world.position.set(400 - target.x - 28, 320 - target.y - 20)
    }
    let previousFrame = -1
    const tick = (ticker: Ticker) => {
      const frame = walker.update(ticker.deltaMS)
      if (frame !== previousFrame) { previousFrame = frame; options.onFrame(frame) }
    }
    app.ticker.add(tick)
    const canvas = app.canvas
    canvas.setAttribute('aria-label', '现代地图场景')
    canvas.style.touchAction = 'none'
    let drag: { x: number; y: number; id: number } | undefined
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      drag = { x: event.clientX, y: event.clientY, id: event.pointerId }
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return
      world.x += (event.clientX - drag.x) / viewportScale
      world.y += (event.clientY - drag.y) / viewportScale
      drag.x = event.clientX; drag.y = event.clientY
    }
    const up = () => { drag = undefined }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    host.replaceChildren(canvas)
    resize(host.clientWidth, host.clientHeight)
    focus(map.parcels[0]!.roadCell)
    app.start()
    return {
      focus, resize,
      setFacing: facing => walker.setFacing(facing),
      setPlaying: playing => walker.setPlaying(playing),
      showMarkers: visible => { markers.visible = visible },
      overview: () => {
        const scale = Math.min(760 / manifest.map.width, 560 / manifest.map.height)
        world.scale.set(scale)
        world.position.set(400 - (manifest.map.offsetX + manifest.map.width / 2) * scale, 300 - (manifest.map.offsetY + manifest.map.height / 2) * scale)
      },
      destroy: () => {
        canvas.removeEventListener('pointerdown', down)
        canvas.removeEventListener('pointermove', move)
        canvas.removeEventListener('pointerup', up)
        canvas.removeEventListener('pointercancel', up)
        app.ticker.remove(tick)
        release()
      },
    }
  } catch (error) { release(); throw error }
}
