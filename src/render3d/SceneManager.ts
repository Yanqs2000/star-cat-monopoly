import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { boardCorners, ISLAND_RADIUS } from './layout3d'

/** 渲染健康状态，暴露到 window.__scm3d 供自动化验证使用 */
export interface SceneHealth {
  ok: boolean
  software: boolean
  frame: number
  reason: string
  webgl: string
  rebuildCount: number
}

export type FrameUpdater = (dt: number, elapsed: number) => void

/** 默认机位：方位角 45°（相机在 +x/+z，即棋盘右下方向），仰角 33° */
const DEFAULT_AZIMUTH = Math.PI / 4
const DEFAULT_ELEVATION = (33 * Math.PI) / 180

export class SceneManager {
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly controls: OrbitControls
  readonly health: SceneHealth = {
    ok: false,
    software: false,
    frame: 0,
    reason: '',
    webgl: '',
    rebuildCount: 0,
  }

  private readonly container: HTMLElement
  private readonly clock = new THREE.Clock()
  private readonly updaters: FrameUpdater[] = []
  private readonly resizeObserver: ResizeObserver
  private raf = 0
  private disposed = false
  private baseDistance = 24
  private readonly defaultDir: THREE.Vector3

  constructor(container: HTMLElement) {
    this.container = container

    const width = Math.max(1, container.clientWidth)
    const height = Math.max(1, container.clientHeight)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // 背景透明，让页面的 CSS 天空透上来
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.32
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    container.appendChild(this.renderer.domElement)

    this.detectRenderer()

    this.renderer.setPixelRatio(this.health.software ? 1 : Math.min(2, window.devicePixelRatio || 1))
    if (this.health.software) {
      // 软件渲染下关掉阴影，保证测试环境能出图
      this.renderer.shadowMap.enabled = false
    }
    this.renderer.setSize(width, height, false)

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 400)
    this.defaultDir = new THREE.Vector3(
      Math.cos(DEFAULT_ELEVATION) * Math.sin(DEFAULT_AZIMUTH),
      Math.sin(DEFAULT_ELEVATION),
      Math.cos(DEFAULT_ELEVATION) * Math.cos(DEFAULT_AZIMUTH),
    ).normalize()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 0.35, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.09
    this.controls.enablePan = false
    this.controls.rotateSpeed = 0.55
    this.controls.zoomSpeed = 0.9
    // 永远俯视：极角限制在 30°~83°，配合 target 在棋盘上方，相机不可能钻到棋盘下面
    this.controls.minPolarAngle = Math.PI / 6
    this.controls.maxPolarAngle = Math.PI / 2 - 0.12

    // 先摆一个初始机位，否则首次取景时相机还在原点，方向会算歪
    this.camera.position.copy(this.controls.target).addScaledVector(this.defaultDir, 26)

    this.addLights()
    this.frameCamera(false)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)

    const canvas = this.renderer.domElement
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)

    this.health.ok = true
    this.health.webgl = this.renderer.capabilities.isWebGL2 ? 'webgl2' : 'webgl1'
    ;(window as unknown as { __scm3d?: SceneHealth }).__scm3d = this.health

    this.loop()
  }

  private onContextLost = (e: Event) => {
    e.preventDefault()
    this.health.ok = false
    this.health.reason = 'context-lost'
  }

  private onContextRestored = () => {
    this.health.ok = true
    this.health.reason = ''
  }

  /** 探测是不是软件渲染（无头环境 / 老显卡） */
  private detectRenderer() {
    try {
      const gl = this.renderer.getContext()
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''
      this.health.software = /swiftshader|llvmpipe|software/i.test(name)
    } catch {
      this.health.software = false
    }
  }

  private addLights() {
    // 天光：天空蓝 / 草地绿
    const hemi = new THREE.HemisphereLight(0xdfefff, 0x7fae6a, 1.05)
    this.scene.add(hemi)

    // 主光：带阴影，放在默认相机方位附近，让可见面被照亮、阴影朝画面外投
    const key = new THREE.DirectionalLight(0xfff4dd, 2.1)
    key.position.set(10, 15, 8)
    key.castShadow = !this.health.software
    key.shadow.mapSize.set(2048, 2048)
    const cam = key.shadow.camera
    cam.left = -12
    cam.right = 12
    cam.top = 12
    cam.bottom = -12
    cam.near = 2
    cam.far = 46
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.03
    this.scene.add(key)
    this.scene.add(key.target)

    // 补光：从另一侧压低对比，避免阴影死黑
    const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55)
    fill.position.set(-9, 6, -8)
    this.scene.add(fill)
  }

  /** 数值法求「刚好框住棋盘」的相机距离 */
  private solveFitDistance(): number {
    const target = this.controls.target
    const pts: THREE.Vector3[] = []
    for (const c of boardCorners()) {
      pts.push(new THREE.Vector3(c.x, 0, c.z))
      pts.push(new THREE.Vector3(c.x, 1.1, c.z))
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * ISLAND_RADIUS, 0, Math.sin(a) * ISLAND_RADIUS))
    }

    const cam = this.camera
    const keep = cam.position.clone()
    let lo = 3
    let hi = 160
    for (let iter = 0; iter < 26; iter++) {
      const mid = (lo + hi) / 2
      cam.position.copy(target).addScaledVector(this.defaultDir, mid)
      cam.lookAt(target)
      cam.updateMatrixWorld(true)
      let worst = 0
      for (const p of pts) {
        const v = p.clone().project(cam)
        if (v.z > 1) {
          worst = 2
          break
        }
        worst = Math.max(worst, Math.abs(v.x), Math.abs(v.y))
      }
      if (worst <= 0.93) hi = mid
      else lo = mid
    }
    cam.position.copy(keep)
    return hi
  }

  /** 按当前视口重新取景；保留用户已经缩放的倍率 */
  frameCamera(preserveZoom = false) {
    const prevDistance = this.camera.position.distanceTo(this.controls.target)
    const prevFit = this.baseDistance
    this.baseDistance = this.solveFitDistance()

    const k = preserveZoom && prevFit > 0 ? prevDistance / prevFit : 1
    const distance = THREE.MathUtils.clamp(this.baseDistance * k, this.baseDistance * 0.32, this.baseDistance * 1.5)

    this.controls.minDistance = this.baseDistance * 0.32
    this.controls.maxDistance = this.baseDistance * 1.5

    // preserveZoom=true 时沿当前视线方向摆位（保留用户转到的方位角）；
    // 首次取景则用设计好的默认斜俯视方向
    const dir =
      preserveZoom && prevDistance > 0.001
        ? this.camera.position.clone().sub(this.controls.target).normalize()
        : this.defaultDir.clone()
    this.camera.position.copy(this.controls.target).addScaledVector(dir, distance)
    this.camera.lookAt(this.controls.target)
    this.controls.update()
  }

  resize() {
    if (this.disposed) return
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
    this.frameCamera(true)
  }

  onFrame(fn: FrameUpdater) {
    this.updaters.push(fn)
  }

  /** 把世界坐标投影到归一化设备坐标（-1..1），调试/自动化验证用 */
  projectToScreen(x: number, y: number, z: number): { x: number; y: number; z: number } {
    const v = new THREE.Vector3(x, y, z).project(this.camera)
    return { x: v.x, y: v.y, z: v.z }
  }

  /** 立刻渲染一帧（用于挂载后把贴图上传的卡顿提前消化掉） */
  renderOnce() {
    this.renderer.render(this.scene, this.camera)
  }

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(0.05, this.clock.getDelta())
    const elapsed = this.clock.elapsedTime
    for (const fn of this.updaters) fn(dt, elapsed)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    this.health.frame++
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.resizeObserver.disconnect()
    const canvas = this.renderer.domElement
    canvas.removeEventListener('webglcontextlost', this.onContextLost)
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored)

    this.controls.dispose()
    this.scene.traverse((obj) => {
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
    this.scene.clear()
    this.renderer.dispose()
    canvas.remove()
  }
}
