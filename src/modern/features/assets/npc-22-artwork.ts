import type { WorldClip, WorldFrame } from '../map/world-assets'
import { Container, Sprite, Texture } from 'pixi.js'
import artwork from '../../data/npc-22.json'

export interface Npc22OuterFrame {
 x: number; y: number; shadowX: number; shadowY: number; shadowScaleX: number; shadowScaleY: number
}
export interface Npc22Motion {
 id: string; sourceSymbol: number; outerFps: number; outerTrack: Npc22OuterFrame[]
}
export interface Npc22Sample {
 frame: WorldFrame; x: number; y: number
 shadow: { x: number; y: number; scaleX: number; scaleY: number }
}

export function npc22MotionFor(clip: WorldClip): Npc22Motion | undefined {
 // The original profile must keep using the original renderer and registered source frames.
 if (!clip.frames[0]?.url.startsWith('hd-characters/npc-22/')) return
 return (artwork.motion as Npc22Motion[]).find(item => item.id === clip.id && item.sourceSymbol === clip.sourceSymbol)
}

/** The HD candidate preserves two source tracks without baking their combined period. */
export function sampleNpc22Motion(motion: Npc22Motion, clip: WorldClip, elapsedMs: number): Npc22Sample {
 if (motion.id !== clip.id || motion.sourceSymbol !== clip.sourceSymbol || !motion.outerTrack.length) {
  throw new Error('NPC动画来源不匹配')
 }
 const elapsed = Math.max(0, elapsedMs)
 const frame = clip.frames[Math.floor(elapsed * clip.fps / 1000 + 1e-8) % clip.frames.length]!
 const clock = elapsed * motion.outerFps / 1000
 const tick = Math.floor(clock + 1e-8)
 const a = motion.outerTrack[tick % motion.outerTrack.length]!
 const b = motion.outerTrack[(tick + 1) % motion.outerTrack.length]!
 const fraction = Math.max(0, clock - tick)
 const mix = (key: keyof Npc22OuterFrame) => a[key] + (b[key] - a[key]) * fraction
 return {
  frame, x: frame.offsetX + mix('x'), y: frame.offsetY + mix('y'),
  shadow: { x: mix('shadowX'), y: mix('shadowY'), scaleX: mix('shadowScaleX'), scaleY: mix('shadowScaleY') },
 }
}

let shadowTexture: Texture | undefined
function softShadowTexture(): Texture {
 if (shadowTexture) return shadowTexture
 const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128
 const context = canvas.getContext('2d')!
 const gradient = context.createRadialGradient(64,64,0,64,64,64)
 gradient.addColorStop(0,'rgba(0,0,0,.58)')
 gradient.addColorStop(.35,'rgba(0,0,0,.38)')
 gradient.addColorStop(.72,'rgba(0,0,0,.10)')
 gradient.addColorStop(1,'rgba(0,0,0,0)')
 context.fillStyle = gradient; context.fillRect(0,0,128,128)
 shadowTexture = Texture.from(canvas)
 return shadowTexture
}

export interface Npc22View {
 view: Container; body: Sprite; shadow: Container
 update(elapsedMs: number): void
}

export function createNpc22View(clip: WorldClip, textures: ReadonlyMap<string,Texture>, motion: Npc22Motion): Npc22View {
 const view = new Container(), shadow = new Container(), body = new Sprite()
 const gradient = new Sprite(softShadowTexture())
 gradient.anchor.set(.5); gradient.width = 50.5; gradient.height = 50.5
 gradient.position.set(-.25,-.25); shadow.addChild(gradient); view.addChild(shadow,body)
 const update = (elapsedMs: number) => {
  const sample = sampleNpc22Motion(motion,clip,elapsedMs)
  const texture = textures.get(sample.frame.url)
  if (!texture) throw new Error(`NPC高清姿态尚未解码：${sample.frame.url}`)
  body.texture = texture; body.position.set(sample.x,sample.y)
  shadow.position.set(sample.shadow.x,sample.shadow.y)
  shadow.scale.set(sample.shadow.scaleX,sample.shadow.scaleY)
 }
 update(0)
 return { view, body, shadow, update }
}
