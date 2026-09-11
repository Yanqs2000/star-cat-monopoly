import * as THREE from 'three'
import { TILE_TOP } from './layout3d'

/** 共享几何体，避免每栋房子都新建 */
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CONE4 = new THREE.ConeGeometry(1, 1, 4)
const CONE8 = new THREE.ConeGeometry(1, 1, 8)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 12)

const WIN_MAT = new THREE.MeshStandardMaterial({
  color: 0xfff6d8,
  emissive: 0xffe08a,
  emissiveIntensity: 0.55,
  roughness: 0.4,
})
const DOOR_MAT = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 })

function roofMaterial(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true })
}

function wallMaterial(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
}

function box(
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(BOX, material)
  mesh.scale.set(w, h, d)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * 程序化卡通建筑：等级越高，房子越大越高。
 * 全部用基础几何体拼，没有外部模型。
 */
export function createBuilding(level: number, color: string): THREE.Group {
  const g = new THREE.Group()
  const wall = wallMaterial(color)
  const roof = roofMaterial(darken(color, 0.42))

  if (level <= 1) {
    // 小木屋
    const body = box(wall, 0.46, 0.24, 0.46, 0, TILE_TOP + 0.12, 0)
    g.add(body)
    const top = new THREE.Mesh(CONE4, roof)
    top.scale.set(0.42, 0.2, 0.42)
    top.position.set(0, TILE_TOP + 0.34, 0)
    top.rotation.y = Math.PI / 4
    top.castShadow = true
    g.add(top)
    const door = box(DOOR_MAT, 0.12, 0.16, 0.03, 0, TILE_TOP + 0.08, 0.235)
    g.add(door)
    return g
  }

  if (level === 2) {
    // 两层大屋
    const body = box(wall, 0.6, 0.44, 0.6, 0, TILE_TOP + 0.22, 0)
    g.add(body)
    const top = new THREE.Mesh(CONE4, roof)
    top.scale.set(0.54, 0.26, 0.54)
    top.position.set(0, TILE_TOP + 0.57, 0)
    top.rotation.y = Math.PI / 4
    top.castShadow = true
    g.add(top)
    // 窗
    for (const [x, z] of [
      [0, 0.31],
      [0.31, 0],
      [-0.31, 0],
    ] as const) {
      const win = box(WIN_MAT, x === 0 ? 0.16 : 0.03, 0.14, x === 0 ? 0.03 : 0.16, x, TILE_TOP + 0.3, z)
      g.add(win)
    }
    const door = box(DOOR_MAT, 0.16, 0.2, 0.03, 0, TILE_TOP + 0.1, 0.31)
    g.add(door)
    // 烟囱
    const chimney = box(wall, 0.1, 0.18, 0.1, 0.2, TILE_TOP + 0.62, -0.16)
    g.add(chimney)
    return g
  }

  // 3 级：星塔
  const base = box(wall, 0.5, 0.3, 0.5, 0, TILE_TOP + 0.15, 0)
  g.add(base)
  const tower = new THREE.Mesh(CYL, wall)
  tower.scale.set(0.17, 0.62, 0.17)
  tower.position.set(0, TILE_TOP + 0.61, 0)
  tower.castShadow = true
  tower.receiveShadow = true
  g.add(tower)

  const cap = new THREE.Mesh(CONE8, roof)
  cap.scale.set(0.24, 0.2, 0.24)
  cap.position.set(0, TILE_TOP + 1.02, 0)
  cap.castShadow = true
  g.add(cap)

  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.1, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffd43b,
      emissive: 0xffc300,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    }),
  )
  star.position.set(0, TILE_TOP + 1.2, 0)
  star.userData.spin = true
  g.add(star)

  return g
}

/** 把颜色压暗，用来做屋顶 */
function darken(hex: string, amount: number): string {
  const c = new THREE.Color(hex)
  c.multiplyScalar(1 - amount)
  return `#${c.getHexString()}`
}
