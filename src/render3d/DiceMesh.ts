import * as THREE from 'three'
import { makeCanvas } from './textures'

const SIZE = 0.42
const PIP = '#2b2140'
const FACE = '#fffdf7'

/** 画一个骰子面 */
function drawFace(value: number): HTMLCanvasElement {
  const S = 128
  const { canvas, ctx } = makeCanvas(S)
  ctx.fillStyle = FACE
  ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = 'rgba(43,33,64,.28)'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, S - 8, S - 8)

  // 3×3 网格里的点位
  const layout: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  }
  const cells = layout[value] ?? [4]
  const step = S / 3
  ctx.fillStyle = PIP
  for (const c of cells) {
    const cx = (c % 3) * step + step / 2
    const cy = Math.floor(c / 3) * step + step / 2
    ctx.beginPath()
    ctx.arc(cx, cy, S * 0.075, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

/** 每面朝向对应的法线（BoxGeometry 的材质顺序：+x, -x, +y, -y, +z, -z） */
const FACE_NORMALS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
]
/** 让 value 点朝上时，需要把哪个法线转到 +y */
const FACE_FOR_VALUE = [0, 2, 4, 0, 5, 1, 3] // index 1..6 → 材质序号

export class DiceMesh {
  readonly group = new THREE.Group()
  private readonly die: THREE.Mesh
  private readonly material: THREE.MeshStandardMaterial[]
  private rolling = false
  private rollStart = 0
  private rollDur = 720
  private spin = new THREE.Vector3()
  private readonly restQuat = new THREE.Quaternion()

  constructor() {
    this.material = []
    const textures = [1, 2, 3, 4, 5, 6].map((v) => {
      const tex = new THREE.CanvasTexture(drawFace(v))
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      return tex
    })
    // 顺序对应 +x,-x,+y,-y,+z,-z；把 1 放在 +y，6 放在 -y，其余成对
    const order = [3, 4, 1, 6, 2, 5]
    for (let i = 0; i < 6; i++) {
      const m = new THREE.MeshStandardMaterial({
        map: textures[order[i]! - 1]!,
        roughness: 0.42,
        metalness: 0,
      })
      this.material.push(m)
    }

    this.die = new THREE.Mesh(new THREE.BoxGeometry(SIZE, SIZE, SIZE), this.material)
    this.die.castShadow = true
    this.die.receiveShadow = true
    this.group.add(this.die)

    this.group.visible = false
  }

  setVisible(v: boolean) {
    this.group.visible = v
  }

  /** 掷骰：翻滚到指定点数 */
  roll(value: number, speed: number) {
    this.group.visible = true
    if (speed === 0) {
      this.settle(value)
      return
    }
    this.rolling = true
    this.rollStart = performance.now()
    this.rollDur = 720 / Math.max(0.5, speed)
    this.spin.set(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 22,
    )
    this.pendingValue = value
  }

  private pendingValue = 1

  /** 直接摆成目标点数朝上 */
  private settle(value: number) {
    const faceIndex = FACE_FOR_VALUE[value] ?? 2
    const normal = FACE_NORMALS[faceIndex] ?? new THREE.Vector3(0, 1, 0)
    this.restQuat.setFromUnitVectors(normal, new THREE.Vector3(0, 1, 0))
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2)
    this.die.quaternion.copy(yaw).multiply(this.restQuat)
    this.rolling = false
  }

  update(now: number) {
    if (!this.rolling) return
    const u = Math.min(1, (now - this.rollStart) / this.rollDur)
    const decay = 1 - u
    const t = (now - this.rollStart) / 1000
    this.die.rotation.set(
      this.spin.x * t * decay,
      this.spin.y * t * decay,
      this.spin.z * t * decay,
    )
    // 翻滚时轻微弹跳
    this.die.position.y = Math.abs(Math.sin(u * Math.PI * 3)) * 0.5 * (1 - u)

    if (u >= 1) {
      this.die.position.y = 0
      this.settle(this.pendingValue)
    }
  }

  dispose() {
    this.die.geometry.dispose()
    for (const m of this.material) {
      m.map?.dispose()
      m.dispose()
    }
  }
}
