import * as THREE from 'three'
import { makeLabelSprite } from './textures'
import { TILE_TOP, tileXZ } from './layout3d'

const SPHERE = new THREE.SphereGeometry(1, 16, 12)
const CONE = new THREE.ConeGeometry(1, 1, 10)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 10)

/** 一只 Q 版低多边形猫：圆身 + 大圆头 + 三角耳 + 尾巴 */
function createCat(color: string, light: string): THREE.Group {
  const g = new THREE.Group()
  const fur = new THREE.MeshStandardMaterial({ color, roughness: 0.72 })
  const belly = new THREE.MeshStandardMaterial({ color: light, roughness: 0.8 })
  const ink = new THREE.MeshStandardMaterial({ color: 0x2b2140, roughness: 0.5 })
  const pink = new THREE.MeshStandardMaterial({ color: 0xff8fa3, roughness: 0.6 })

  // 身体
  const body = new THREE.Mesh(SPHERE, fur)
  body.scale.set(0.17, 0.16, 0.17)
  body.position.y = 0.16
  body.castShadow = true
  g.add(body)

  // 肚皮
  const tummy = new THREE.Mesh(SPHERE, belly)
  tummy.scale.set(0.11, 0.1, 0.1)
  tummy.position.set(0, 0.14, 0.07)
  g.add(tummy)

  // 头
  const head = new THREE.Mesh(SPHERE, fur)
  head.scale.set(0.19, 0.18, 0.19)
  head.position.y = 0.4
  head.castShadow = true
  g.add(head)

  // 耳朵
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(CONE, fur)
    ear.scale.set(0.075, 0.14, 0.075)
    ear.position.set(side * 0.11, 0.55, 0)
    ear.rotation.z = side * 0.28
    ear.castShadow = true
    g.add(ear)

    const inner = new THREE.Mesh(CONE, pink)
    inner.scale.set(0.04, 0.08, 0.04)
    inner.position.set(side * 0.11, 0.55, 0.035)
    inner.rotation.z = side * 0.28
    g.add(inner)

    // 眼睛
    const eye = new THREE.Mesh(SPHERE, ink)
    eye.scale.setScalar(0.033)
    eye.position.set(side * 0.075, 0.42, 0.16)
    g.add(eye)

    const shine = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: 0xffffff }))
    shine.scale.setScalar(0.013)
    shine.position.set(side * 0.085, 0.435, 0.185)
    g.add(shine)
  }

  // 口鼻
  const muzzle = new THREE.Mesh(SPHERE, belly)
  muzzle.scale.set(0.075, 0.055, 0.05)
  muzzle.position.set(0, 0.37, 0.16)
  g.add(muzzle)

  const nose = new THREE.Mesh(SPHERE, pink)
  nose.scale.setScalar(0.018)
  nose.position.set(0, 0.385, 0.205)
  g.add(nose)

  // 尾巴
  const tail = new THREE.Mesh(CYL, fur)
  tail.scale.set(0.03, 0.2, 0.03)
  tail.position.set(0, 0.2, -0.16)
  tail.rotation.x = -0.7
  tail.castShadow = true
  g.add(tail)

  return g
}

/**
 * 棋子的位置与跳跃动画。
 *
 * 关键规则：**只有相邻格才做动画，非相邻一律瞬移**。
 * 因为进监狱、卡片传送这类位移不会发出逐格事件，直接插值会让棋子斜穿棋盘。
 */
export class TokenMesh {
  readonly group = new THREE.Group()
  readonly name: string

  private readonly target = new THREE.Vector3()
  private readonly from = new THREE.Vector3()
  private readonly current = new THREE.Vector3()
  private readonly label: THREE.Sprite
  private hopStart = 0
  private hopDur = 150
  private hopping = false
  private prevTargetAt = 0
  private readonly halo: THREE.Mesh
  private active = false

  constructor(name: string, color: string, light: string) {
    this.name = name
    this.group.add(createCat(color, light))

    this.label = makeLabelSprite(name, { color: '#ffffff', bg: color, size: 52, scale: 0.9 })
    this.label.position.set(0, 0.86, 0)
    this.group.add(this.label)

    // 脚下光圈（轮到谁谁亮）
    this.halo = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }),
    )
    this.halo.rotation.x = -Math.PI / 2
    this.halo.position.y = 0.012
    this.group.add(this.halo)

    this.current.set(0, 0, 0)
    this.target.set(0, 0, 0)
    this.from.set(0, 0, 0)
  }

  /** 移动到目标格；adjacent=false 时直接瞬移 */
  setTarget(tileId: number, adjacent: boolean, offset: { x: number; z: number }, now: number) {
    const { x, z } = tileXZ(tileId)
    this.target.set(x + offset.x, TILE_TOP, z + offset.z)

    const idle = now - this.prevTargetAt
    this.prevTargetAt = now

    if (!adjacent) {
      this.snapTo(now)
      return
    }

    // 跳跃时长跟随事件节奏：相邻格每 ~155ms 来一次，跟随它才不会越走越滞后
    this.hopDur = THREE.MathUtils.clamp(idle * 0.95, 26, 150)
    this.from.copy(this.current)
    this.hopStart = now
    this.hopping = true
  }

  /** 立刻落到目标位置 */
  snapTo(now: number) {
    this.current.copy(this.target)
    this.hopping = false
    this.group.position.copy(this.current)
    this.prevTargetAt = now
  }

  setOut(out: boolean) {
    this.group.visible = !out
  }

  setActive(active: boolean) {
    this.active = active
  }

  /** 当前渲染位置（金钱飘字要挂在这里） */
  get worldPosition(): THREE.Vector3 {
    return this.current
  }

  update(now: number, elapsed: number) {
    if (this.hopping) {
      const u = Math.min(1, (now - this.hopStart) / this.hopDur)
      // 轻微过冲，和 2D 版的 cubic-bezier(.34,1.56,.64,1) 手感一致
      const e = easeOutBack(u)
      this.current.lerpVectors(this.from, this.target, e)
      this.current.y = TILE_TOP + Math.sin(Math.PI * u) * 0.26
      if (u >= 1) {
        this.current.copy(this.target)
        this.hopping = false
      }
      this.group.position.copy(this.current)
    }

    // 待机时轻微呼吸
    const bob = this.hopping ? 0 : Math.sin(elapsed * 2.2 + this.current.x) * 0.012
    this.group.position.y = this.current.y + bob

    const haloOpacity = this.active ? 0.28 + Math.sin(elapsed * 3) * 0.12 : 0
    ;(this.halo.material as THREE.MeshBasicMaterial).opacity = haloOpacity
  }
}

function easeOutBack(u: number): number {
  const c1 = 1.2
  const c3 = c1 + 1
  return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2
}
