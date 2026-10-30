import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import rigData from '../../data/juanmao-24.json'
import type { Facing } from './assets'
import { juanmao24DurationMs, juanmao24Joint, sampleJuanmao24, sampleJuanmao24Grounded, type Juanmao24Action, type Juanmao24Point } from './juanmao-24-motion'

type Part = { url: string; width: number; height: number; pivot: number[]; axis?: number[] }
type RigFacing = { joints: Record<string, number[]>; parts: Record<string, Part> }
const RIG = rigData as { density: number; mapAnchor: number[]; facings: Record<Facing, RigFacing> }
export const JUANMAO_24_TEXTURE_URLS = [...new Set(Object.values(RIG.facings).flatMap(facing => Object.entries(facing.parts).filter(([name]) => name!=='head-eyes'&&!/(?:Thigh|Shin|UpperArm)$/.test(name)).map(([,part]) => part.url)))]
export const JUANMAO_24_DENSITY = RIG.density
const point = (values: number[]): Juanmao24Point => ({ x: values[0]!, y: values[1]! })

/** Candidate art, deliberately isolated to character 1. Business/source manifests stay intact. */
export class Juanmao24Player {
  readonly view = new Container()
  private facing: Facing = 'down-right'
  private moving = false
  private elapsedMs = 0
  private reaction: Exclude<Juanmao24Action, 'walk'> | null = null
  private parts = new Map<string, Sprite>()
  private props = new Graphics()
  private bridges = new Graphics()
  private currentFacing: Facing | null = null
  private locomotion: { position: Juanmao24Point; direction: Juanmao24Point; distance: number } | null = null

  constructor(private readonly textures: Map<string, Texture>, mapPlacement=false) {
    if(mapPlacement)this.view.position.set(RIG.mapAnchor[0]!,RIG.mapAnchor[1]!)
    this.view.addChild(this.bridges,this.props)
    this.update(0)
  }
  setPose(facing: Facing, moving: boolean): void {
    if (this.facing !== facing || this.moving !== moving) {
      this.elapsedMs = 0
      if(this.locomotion)this.locomotion.distance=0
    }
    this.facing = facing
    this.moving = moving
  }
  setReaction(name: Exclude<Juanmao24Action, 'walk'> | null): void {
    this.reaction = name
    this.elapsedMs = 0
  }
  clearWorldPosition(): void { this.locomotion=null;this.update(0) }
  /** Call after the actor's final map position is assigned. Re-samples immediately in the same render frame. */
  setWorldPosition(x: number,y: number): void {
    if (!Number.isFinite(x)||!Number.isFinite(y)) return
    if(!this.locomotion) {
      const dx=this.facing.includes('right')?56:-56,dy=this.facing.startsWith('down')?40:-40
      this.locomotion={position:{x,y},direction:{x:dx,y:dy},distance:0}
    } else {
      const dx=x-this.locomotion.position.x,dy=y-this.locomotion.position.y,distance=Math.hypot(dx,dy)
      if(this.moving && this.reaction===null && distance>0.000001) {
        this.locomotion.distance=distance>80?0:this.locomotion.distance+distance
        this.locomotion.direction={x:dx/distance,y:dy/distance}
      }
      this.locomotion.position={x,y}
    }
    this.update(0)
  }
  get action(): Juanmao24Action { return this.reaction ?? (this.moving ? 'walk' : 'neutral') }
  get gaitDistance(): number | null { return this.locomotion?.distance ?? null }
  get finished(): boolean { return this.action !== 'walk' && this.elapsedMs >= juanmao24DurationMs(this.action, this.facing) }
  private buildFacing(): void {
    if (this.currentFacing === this.facing) return
    for (const sprite of this.parts.values()) sprite.destroy()
    this.parts.clear()
    const definition = RIG.facings[this.facing]
    // Far limbs, torso, near limbs, then head: the giant head naturally occludes shoulders.
    const near = this.facing === 'down-right' || this.facing === 'up-left' ? 'left' : 'right'
    const far = near === 'left' ? 'right' : 'left'
    const order = [`${far}Foot`, `${near}Foot`, `${far}Forearm`, 'body', `${near}Forearm`, 'head']
    for (const name of order) {
      const part = definition.parts[name]
      if (!part) continue
      const texture = this.textures.get(part.url)
      if (!texture) throw new Error(`卷毛24缺少分层贴图 ${part.url}`)
      const sprite = new Sprite(texture)
      sprite.label = name
      sprite.anchor.set(part.pivot[0]! * RIG.density / part.width, part.pivot[1]! * RIG.density / part.height)
      this.parts.set(name, sprite)
      this.view.addChild(sprite)
    }
    this.view.addChild(this.props)
    this.currentFacing = this.facing
  }
  update(deltaMs: number): void {
    this.elapsedMs += Math.max(0, deltaMs)
    this.buildFacing()
    const definition = RIG.facings[this.facing]
    const pose = this.action==='walk' && this.locomotion
      ? sampleJuanmao24Grounded(this.locomotion.distance,this.facing,this.locomotion.direction)
      : sampleJuanmao24(this.action, this.facing, this.elapsedMs)
    this.bridges.clear()
    const gray = Math.round(240 - pose.soot * 211)
    const boneColor = gray * 0x010101
    const bridge = (a: Juanmao24Point,b: Juanmao24Point,width: number): void => {
      this.bridges.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width,color:boneColor,cap:'round'})
      this.bridges.moveTo(a.x-0.35,a.y).lineTo(b.x-0.35,b.y).stroke({width:width*0.55,color:Math.min(255,gray+10)*0x010101,cap:'round'})
    }
    const spine = point(definition.joints.spine!)
    const transformed = (name: string): Juanmao24Point => {
      const p = point(definition.joints[name]!), dx = p.x - spine.x, dy = p.y - spine.y
      return { x: spine.x + dx * Math.cos(pose.bodyRotation) - dy * Math.sin(pose.bodyRotation), y: spine.y + pose.bodyY + dx * Math.sin(pose.bodyRotation) + dy * Math.cos(pose.bodyRotation) }
    }
    const place = (name: string, position: Juanmao24Point, rotation = 0, stretch = 1, expression?: string): void => {
      const sprite = this.parts.get(name)!
      const part = definition.parts[expression ? `${name}-${expression}` : name] ?? definition.parts[name]!
      sprite.texture = this.textures.get(part.url)!
      sprite.anchor.set(part.pivot[0]! * RIG.density / part.width, part.pivot[1]! * RIG.density / part.height)
      sprite.width = part.width / RIG.density * stretch
      sprite.height = part.height / RIG.density * stretch
      sprite.position.set(position.x, position.y)
      sprite.rotation = rotation
      const gray = Math.round(255 - pose.soot * 223)
      sprite.tint = gray * 0x010101
    }
    const bone = (name: string, a: Juanmao24Point, b: Juanmao24Point): void => {
      const part = definition.parts[name]!, axis = part.axis!
      const sourceLength = Math.hypot(axis[0]!, axis[1]!)
      const length = Math.hypot(b.x-a.x, b.y-a.y)
      place(name, a, Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(axis[1]!,axis[0]!), length/sourceLength)
    }
    for (const side of ['left', 'right'] as const) {
      const foot = point(definition.joints[`${side}Ankle`]!), offset = pose[`${side}Foot`]
      const target = { x: foot.x + offset.x, y: foot.y + offset.y }
      const hip = transformed(`${side}Hip`)
      const thigh = definition.parts[`${side}Thigh`]!.axis!, shin = definition.parts[`${side}Shin`]!.axis!
      const knee = juanmao24Joint(hip,target,Math.hypot(...thigh),Math.hypot(...shin),side === 'left' ? 1 : -1)
      bridge(hip,knee,5.8);bridge(knee,target,5.1)
      place(`${side}Foot`,target)
      const shoulder = transformed(`${side}Shoulder`), handBase = transformed(`${side}Hand`), handOffset = pose[`${side}Hand`]
      const hand = { x: handBase.x + handOffset.x, y: handBase.y + handOffset.y }
      const upper = definition.parts[`${side}UpperArm`]!.axis!, forearm = definition.parts[`${side}Forearm`]!.axis!
      const elbow = juanmao24Joint(shoulder,hand,Math.hypot(...upper),Math.hypot(...forearm),side === 'left' ? 1 : -1)
      bridge(shoulder,elbow,4.8);bridge(elbow,hand,4.8)
      bone(`${side}Forearm`,elbow,hand)
    }
    place('body',{ x: spine.x, y: spine.y+pose.bodyY },pose.bodyRotation)
    const head = transformed('neck')
    const expression=pose.expression==='hurt'&&pose.soot>.3?'hurt':pose.expression==='happy'||pose.expression==='sad'?pose.expression:undefined
    place('head',head,pose.bodyRotation+pose.headRotation,1,expression)
    if(expression==='hurt')this.parts.get('head')!.tint=0xffffff
    this.props.clear()
    if (pose.readyProp) {
      const hand = transformed('rightHand')
      this.props.roundRect(hand.x-6,hand.y-7,10,10,1.5).fill(0xf7f8fa).stroke({ width:0.4,color:0x8a929c })
      this.props.circle(hand.x-1,hand.y-2,1.8).fill(0xe63332)
    }
  }
  destroy(): void { this.view.destroy({ children: true }) }
}
