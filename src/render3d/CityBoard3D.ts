import * as THREE from 'three'
import { GROUPS, TILE_DEFS } from '@/core/config/board'
import { getCharacter } from '@/core/config/characters'
import { fmtMoney } from '@/core/engine/GameEngine'
import type { GameState } from '@/core/types'
import { createBuilding } from './BuildingMesh'
import { DiceMesh } from './DiceMesh'
import type { SceneManager } from './SceneManager'
import { TokenMesh } from './TokenMesh'
import {
  ISLAND_RADIUS,
  SLAB_HEIGHT,
  TILE_TOP,
  isAdjacent,
  slotOffset,
  tileTextRotation,
  tileXZ,
} from './layout3d'
import { drawPlazaFace, drawTileFace, makeLabelSprite, toTexture } from './textures'

const TILE_PAD = 0.82
const ROAD_OUTER = 11.6
const ROAD_INNER = 8.4

interface TileView {
  slab: THREE.Mesh
  ownerPlate: THREE.Mesh
  face: THREE.Mesh
  building: THREE.Group | null
  buildingLevel: number
  barrier: THREE.Group | null
  owner: number | null
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

/**
 * 星猫乐园的 3D 棋盘：草地浮岛 + 环形马路 + 40 块地 + 中央广场。
 *
 * 所有「会变的东西」（拥有者、建筑、路障、高亮）都是独立物件，
 * 地块贴图只画一次——买地/盖房不会触发贴图重传。
 */
export class CityBoard3D {
  readonly root = new THREE.Group()

  private readonly views: TileView[] = []
  private readonly tokens = new Map<number, TokenMesh>()
  private readonly dice = new DiceMesh()
  private readonly highlight: THREE.Mesh
  private readonly plaza: THREE.Group
  private readonly monopolyLabels: THREE.Sprite[] = []
  private readonly floaters = new Map<number, THREE.Sprite>()
  private lastVisual: number[] = []
  private lastTurn = -1
  private disposed = false

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly sceneManager: SceneManager,
  ) {
    this.buildGround()
    this.buildRoad()
    this.buildTiles()
    this.highlight = this.buildHighlight()
    this.plaza = this.buildPlaza()

    this.dice.group.position.set(0, TILE_TOP + 0.3, 2.6)
    this.root.add(this.dice.group)

    sceneManager.scene.add(this.root)
    sceneManager.onFrame((dt, elapsed) => this.update(dt, elapsed))
    // 挂载后先渲一帧，把贴图上传的卡顿提前到进游戏之前
    sceneManager.renderOnce()
  }

  /* ============================================================
     静态场景
     ============================================================ */

  private buildGround() {
    const grass = new THREE.Mesh(
      new THREE.CircleGeometry(ISLAND_RADIUS, 64),
      new THREE.MeshStandardMaterial({ color: 0x86c86b, roughness: 0.95 }),
    )
    grass.rotation.x = -Math.PI / 2
    grass.receiveShadow = true
    this.root.add(grass)

    // 浮岛厚度：向下收窄的岩层，让地图看起来是「一块地」而不是一张纸
    const rock = new THREE.Mesh(
      new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS * 0.62, 1.7, 40, 1),
      new THREE.MeshStandardMaterial({ color: 0x6b5a86, roughness: 1, flatShading: true }),
    )
    rock.position.y = -0.86
    this.root.add(rock)

    // 岛缘的浅色描边
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(ISLAND_RADIUS - 0.22, ISLAND_RADIUS, 64),
      new THREE.MeshStandardMaterial({ color: 0xa8dd8a, roughness: 0.9 }),
    )
    rim.rotation.x = -Math.PI / 2
    rim.position.y = 0.004
    this.root.add(rim)
  }

  private buildRoad() {
    const outer = roundedRectShape(ROAD_OUTER, ROAD_OUTER, 1.5)
    const inner = roundedRectShape(ROAD_INNER, ROAD_INNER, 1.1)
    outer.holes.push(inner)

    const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: false })
    geo.rotateX(-Math.PI / 2)
    const road = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x6f7482, roughness: 0.95 }),
    )
    road.receiveShadow = true
    road.position.y = 0.02
    this.root.add(road)

    // 车道虚线：沿四条边撒小白块
    const dashGeo = new THREE.PlaneGeometry(0.1, 0.42)
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf6f3ea })
    const mid = (ROAD_OUTER + ROAD_INNER) / 4 // 环中线到中心的距离
    for (let i = -4; i <= 4; i++) {
      for (const [x, z, rot] of [
        [i * 1.1, mid, 0],
        [i * 1.1, -mid, 0],
        [mid, i * 1.1, Math.PI / 2],
        [-mid, i * 1.1, Math.PI / 2],
      ] as const) {
        if (Math.abs(i) > 3.2) continue
        const dash = new THREE.Mesh(dashGeo, dashMat)
        dash.rotation.set(-Math.PI / 2, 0, rot)
        dash.position.set(x, 0.075, z)
        this.root.add(dash)
      }
    }
  }

  private buildTiles() {
    const slabGeo = new THREE.BoxGeometry(1.04, SLAB_HEIGHT, 1.04)
    const slabMat = new THREE.MeshStandardMaterial({ color: 0xf0e7dc, roughness: 0.9 })

    for (const def of TILE_DEFS) {
      const { x, z } = tileXZ(def.id)

      const slab = new THREE.Mesh(slabGeo, slabMat)
      slab.position.set(x, SLAB_HEIGHT / 2, z)
      slab.receiveShadow = true
      slab.castShadow = true
      this.root.add(slab)

      // 拥有者色板（未拥有时隐藏）
      const ownerPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(TILE_PAD + 0.1, TILE_PAD + 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }),
      )
      ownerPlate.rotation.x = -Math.PI / 2
      ownerPlate.position.set(x, SLAB_HEIGHT + 0.006, z)
      ownerPlate.visible = false
      this.root.add(ownerPlate)

      // 顶面贴图
      const tex = toTexture(drawTileFace({ ...def, owner: null, level: 0, barrier: false }), this.renderer)
      const faceGeo = new THREE.PlaneGeometry(TILE_PAD, TILE_PAD)
      faceGeo.rotateX(-Math.PI / 2)
      faceGeo.rotateY(tileTextRotation(def.id))
      const face = new THREE.Mesh(
        faceGeo,
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82 }),
      )
      face.position.set(x, SLAB_HEIGHT + 0.012, z)
      this.root.add(face)

      this.views.push({
        slab,
        ownerPlate,
        face,
        building: null,
        buildingLevel: -1,
        barrier: null,
        owner: null,
      })
    }
  }

  private buildHighlight() {
    const ring = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshBasicMaterial({
        color: 0xffd43b,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.008
    ring.visible = false
    this.root.add(ring)
    return ring
  }

  private buildPlaza() {
    const g = new THREE.Group()

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(4.1, 4.1, 0.08, 48),
      new THREE.MeshStandardMaterial({ color: 0xe9e1f7, roughness: 0.9 }),
    )
    base.position.y = 0.04
    base.receiveShadow = true
    g.add(base)

    const topTex = toTexture(drawPlazaFace(), this.renderer)
    const top = new THREE.Mesh(
      new THREE.CircleGeometry(3.9, 48),
      new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.85 }),
    )
    top.rotation.x = -Math.PI / 2
    top.position.y = 0.086
    g.add(top)

    // 喷泉
    const stone = new THREE.MeshStandardMaterial({ color: 0xd9d2e8, roughness: 0.85 })
    const water = new THREE.MeshStandardMaterial({
      color: 0x74c0fc,
      roughness: 0.2,
      metalness: 0.1,
    })
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.22, 24), stone)
    pool.position.y = 0.2
    pool.castShadow = true
    g.add(pool)
    const water1 = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.04, 24), water)
    water1.position.y = 0.31
    g.add(water1)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.36, 16), stone)
    stem.position.y = 0.46
    stem.castShadow = true
    g.add(stem)
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.16, 20), stone)
    bowl.position.y = 0.68
    bowl.castShadow = true
    g.add(bowl)
    const water2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 20), water)
    water2.position.y = 0.76
    g.add(water2)

    // 环岛树
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3
      g.add(this.makeTree(Math.cos(a) * 2.7, Math.sin(a) * 2.7))
    }

    this.root.add(g)
    return g
  }

  private makeTree(x: number, z: number): THREE.Group {
    const t = new THREE.Group()
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 1 }),
    )
    trunk.position.y = 0.15
    trunk.castShadow = true
    t.add(trunk)

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x51cf66, roughness: 0.95, flatShading: true })
    for (const [dy, r] of [
      [0.42, 0.26],
      [0.6, 0.19],
    ] as const) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(r, 0.34, 8), leafMat)
      leaf.position.y = dy
      leaf.castShadow = true
      t.add(leaf)
    }
    t.position.set(x, 0.08, z)
    return t
  }

  /* ============================================================
     动态同步
     ============================================================ */

  /** 地块差异同步：只比 owner / level / barrier 三个字段 */
  syncTiles(state: GameState) {
    for (const tile of state.tiles) {
      const view = this.views[tile.id]
      if (!view) continue

      if (view.owner !== tile.owner) {
        view.owner = tile.owner
        if (tile.owner === null) {
          view.ownerPlate.visible = false
        } else {
          const color = getCharacter(state.players[tile.owner]!.characterId).color
          ;(view.ownerPlate.material as THREE.MeshStandardMaterial).color.set(color)
          view.ownerPlate.visible = true
        }
      }

      if (view.buildingLevel !== tile.level) {
        view.buildingLevel = tile.level
        if (view.building) {
          this.root.remove(view.building)
          disposeGroup(view.building)
          view.building = null
        }
        if (tile.level > 0 && tile.group) {
          const building = createBuilding(tile.level, GROUPS[tile.group]!.color)
          building.position.set(view.slab.position.x, 0, view.slab.position.z)
          this.root.add(building)
          view.building = building
        }
      }

      const wantsBarrier = tile.barrier
      if (wantsBarrier && !view.barrier) {
        view.barrier = makeBarrier()
        view.barrier.position.set(view.slab.position.x + 0.28, TILE_TOP, view.slab.position.z + 0.28)
        this.root.add(view.barrier)
      } else if (!wantsBarrier && view.barrier) {
        this.root.remove(view.barrier)
        disposeGroup(view.barrier)
        view.barrier = null
      }
    }

    this.syncMonopolyLegend(state)
    this.sceneManager.health.rebuildCount++
  }

  private syncMonopolyLegend(state: GameState) {
    while (this.monopolyLabels.length) {
      const s = this.monopolyLabels.pop()!
      this.plaza.remove(s)
      s.material.map?.dispose()
      s.material.dispose()
    }

    const lines: string[] = []
    const groups = new Map<string, number>()
    for (const tile of state.tiles) {
      if (tile.kind !== 'property' || tile.owner === null || !tile.group) continue
      const mates = state.tiles.filter((t) => t.group === tile.group)
      if (mates.every((t) => t.owner === tile.owner)) groups.set(tile.group, tile.owner)
    }
    for (const [group, ownerId] of groups) {
      lines.push(`${state.players[ownerId]!.name} 垄断 ${GROUPS[group]!.name}组`)
    }
    if (!lines.length) return

    lines.slice(0, 3).forEach((text, i) => {
      const sprite = makeLabelSprite(text, {
        color: '#ffffff',
        bg: 'rgba(124,58,237,.92)',
        size: 46,
        scale: 0.78,
      })
      sprite.position.set(0, 1.5 - i * 0.34, -3.3)
      this.plaza.add(sprite)
      this.monopolyLabels.push(sprite)
    })
  }

  /** 棋子同步 */
  syncTokens(state: GameState, visualPos: number[]) {
    const now = performance.now()

    // 玩家名单变了才重建棋子
    if (this.tokens.size !== state.players.length) {
      for (const [, t] of this.tokens) {
        this.root.remove(t.group)
        disposeGroup(t.group)
      }
      this.tokens.clear()
      this.lastVisual = []
    }

    for (const p of state.players) {
      if (!this.tokens.has(p.id)) {
        const character = getCharacter(p.characterId)
        const token = new TokenMesh(p.name, character.color, character.tint)
        this.root.add(token.group)
        this.tokens.set(p.id, token)
        const start = visualPos[p.id] ?? p.pos
        token.setTarget(start, false, { x: 0, z: 0 }, now)
      }
    }

    // 同格错位：先统计每格上的玩家
    const byPos = new Map<number, number[]>()
    state.players.forEach((p) => {
      const pos = visualPos[p.id] ?? p.pos
      const list = byPos.get(pos) ?? []
      list.push(p.id)
      byPos.set(pos, list)
    })

    state.players.forEach((p) => {
      const token = this.tokens.get(p.id)
      if (!token) return
      const pos = visualPos[p.id] ?? p.pos
      const prev = this.lastVisual[p.id]
      const slot = (byPos.get(pos) ?? []).indexOf(p.id)
      const off = slotOffset(slot)

      if (prev === undefined) {
        token.setTarget(pos, false, off, now)
      } else if (prev !== pos) {
        // 只有相邻格才走动画；传送/开局/出局一律瞬移
        token.setTarget(pos, isAdjacent(prev, pos), off, now)
      } else {
        token.setTarget(pos, false, off, now)
      }

      token.setOut(p.out)
      token.setActive(state.turn === p.id && state.phase !== 'over')
    })

    this.lastVisual = state.players.map((p) => visualPos[p.id] ?? p.pos)
  }

  /** 当前行动格的高亮 */
  syncTurnRing(state: GameState) {
    const pos = state.players[state.turn]?.pos ?? -1
    if (pos === this.lastTurn) return
    this.lastTurn = pos
    if (pos < 0 || state.phase === 'over') {
      this.highlight.visible = false
      return
    }
    const { x, z } = tileXZ(pos)
    this.highlight.position.set(x, 0.008, z)
    this.highlight.visible = true
  }

  /** 掷骰动画 */
  rollDice(value: number, speed: number) {
    this.dice.roll(value, speed)
  }

  /** 金钱飘字：用 3D 精灵挂在棋子头顶 */
  syncFloaters(list: { id: number; player: number; delta: number }[]) {
    const alive = new Set(list.map((f) => f.id))

    for (const [id, sprite] of this.floaters) {
      if (!alive.has(id)) {
        this.root.remove(sprite)
        sprite.material.map?.dispose()
        sprite.material.dispose()
        this.floaters.delete(id)
      }
    }

    for (const f of list) {
      if (this.floaters.has(f.id)) continue
      const token = this.tokens.get(f.player)
      if (!token) continue
      const sprite = makeLabelSprite(`${f.delta > 0 ? '+' : ''}${fmtMoney(Math.abs(f.delta))}`, {
        color: f.delta > 0 ? '#b2f2bb' : '#ffc9c9',
        size: 56,
        scale: 0.72,
      })
      sprite.position.copy(token.worldPosition).add(new THREE.Vector3(0, 0.95, 0))
      sprite.userData.life = 0
      this.root.add(sprite)
      this.floaters.set(f.id, sprite)
    }
  }

  /* ============================================================
     每帧
     ============================================================ */

  private update(dt: number, elapsed: number) {
    if (this.disposed) return
    const now = performance.now()

    for (const [, token] of this.tokens) token.update(now, elapsed)
    this.dice.update(now)

    // 高亮环呼吸
    if (this.highlight.visible) {
      const m = this.highlight.material as THREE.MeshBasicMaterial
      m.opacity = 0.34 + Math.sin(elapsed * 3.4) * 0.16
    }

    // 飘字上升淡出
    for (const [id, sprite] of this.floaters) {
      sprite.userData.life = (sprite.userData.life as number) + dt
      const life = sprite.userData.life as number
      sprite.position.y += dt * 0.85
      const mat = sprite.material
      mat.opacity = Math.max(0, 1 - life / 1.15)
      if (life > 1.15) {
        this.root.remove(sprite)
        mat.map?.dispose()
        mat.dispose()
        this.floaters.delete(id)
      }
    }

    // 星塔顶的星星自转
    this.root.traverse((obj) => {
      if (obj.userData.spin) obj.rotation.y += dt * 1.6
    })
  }

  dispose() {
    this.disposed = true
    this.dice.dispose()
    for (const [, t] of this.tokens) disposeGroup(t.group)
    this.tokens.clear()
    disposeGroup(this.root)
    this.sceneManager.scene.remove(this.root)
  }
}

function makeBarrier(): THREE.Group {
  const g = new THREE.Group()
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.3, 12),
    new THREE.MeshStandardMaterial({ color: 0xff8c42, roughness: 0.8 }),
  )
  cone.position.y = 0.15
  cone.castShadow = true
  g.add(cone)
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.115, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0xfff4e6, roughness: 0.8 }),
  )
  band.position.y = 0.17
  g.add(band)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.03, 0.26),
    new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.9 }),
  )
  base.position.y = 0.015
  g.add(base)
  return g
}

function disposeGroup(group: THREE.Object3D) {
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const material = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material
    const list = Array.isArray(material) ? material : material ? [material] : []
    for (const m of list) {
      const map = (m as unknown as { map?: THREE.Texture | null }).map
      if (map) map.dispose()
      m.dispose()
    }
  })
}
