import { describe, expect, it } from 'vitest'
import { sampleJuanmao24, sampleJuanmao24Grounded, juanmao24DurationMs } from '../../src/modern/features/characters/juanmao-24-motion'

describe('卷毛24连续关节运动', () => {
  it('800ms闭环有独立抬脚和足部支撑段，不以立绘平移代替步态', () => {
    const a = sampleJuanmao24('walk', 'down-right', 0)
    const b = sampleJuanmao24('walk', 'down-right', 100)
    const loop = sampleJuanmao24('walk', 'down-right', 800)
    expect(a.leftFoot.lift).toBe(0)
    expect(a.rightFoot.lift).toBe(0)
    expect(b.leftFoot.lift).toBe(0)
    expect(b.rightFoot.lift).toBeGreaterThan(2)
    expect(a.leftFoot.x).not.toBe(b.leftFoot.x)
    expect(loop).toEqual(a)
    expect(b.leftHand.x).not.toBe(a.leftHand.x)
  })
  it('60Hz采样连续并在原8个步姿之间产生运动，头角仍只有刚体变换', () => {
    const frames = Array.from({ length: 48 }, (_, index) => sampleJuanmao24('walk', 'up-left', index * 1000 / 60))
    expect(new Set(frames.map(frame => frame.leftFoot.x.toFixed(5))).size).toBeGreaterThan(30)
    for (let i = 1; i < frames.length; i++) {
      expect(Math.abs(frames[i]!.leftFoot.x - frames[i-1]!.leftFoot.x)).toBeLessThan(3)
      expect(Math.abs(frames[i]!.headRotation - frames[i-1]!.headRotation)).toBeLessThan(0.03)
    }
  })
  it('支撑足离地时轨迹速度连续，避免关节在保持帧边界突然停顿', () => {
    const before = sampleJuanmao24('walk','down-right',399).leftFoot
    const contact = sampleJuanmao24('walk','down-right',400).leftFoot
    const after = sampleJuanmao24('walk','down-right',401).leftFoot
    expect(Math.abs((after.x-contact.x)-(contact.x-before.x))).toBeLessThan(0.002)
    expect(after.lift).toBeLessThan(0.001)
  })
  it('四向反馈保留源动作时长与末帧，neutral/ready为静态', () => {
    expect(juanmao24DurationMs('walk', 'down-right')).toBe(800)
    expect(juanmao24DurationMs('happy', 'down-right')).toBe(1900)
    expect(juanmao24DurationMs('sad', 'down-left')).toBeCloseTo(2466.6666667)
    expect(juanmao24DurationMs('sad', 'up-left')).toBeCloseTo(2433.3333333)
    expect(juanmao24DurationMs('hurt', 'up-right')).toBe(2000)
    expect(juanmao24DurationMs('cheer', 'down-left')).toBeCloseTo(2266.6666667)
    expect(sampleJuanmao24('neutral', 'down-right', 0)).toEqual(sampleJuanmao24('neutral', 'down-right', 5000))
    expect(sampleJuanmao24('ready', 'down-left', 0)).toEqual(sampleJuanmao24('ready', 'down-left', 5000))
    expect(sampleJuanmao24('sad', 'up-left', 4000)).toEqual(sampleJuanmao24('sad', 'up-left', 5000))
  })
})

describe('卷毛24实际分层消费者', () => {
  it('足部与手部分别移动，头角使用固定同一张身份贴图', async () => {
    const { Texture, Sprite } = await import('pixi.js')
    const { Juanmao24Player, JUANMAO_24_TEXTURE_URLS } = await import('../../src/modern/features/characters/juanmao-24')
    const textures = new Map(JUANMAO_24_TEXTURE_URLS.map(url => [url, new Texture({ source: Texture.EMPTY.source })]))
    const player = new Juanmao24Player(textures)
    const find = (suffix: string) => player.view.children.find(child => child instanceof Sprite && child.texture === textures.get(`hd-characters/juanmao-24/down-right-${suffix}.png`)) as InstanceType<typeof Sprite>
    const foot = find('rightFoot'), hand = find('leftForearm'), head = find('head')
    expect(foot).toBeDefined(); expect(hand).toBeDefined(); expect(head).toBeDefined()
    const headTexture = head.texture, footStart = foot.position.clone(), handStart = hand.position.clone()
    player.setPose('down-right', true); player.update(100)
    expect(foot.position.y).not.toBe(footStart.y)
    expect(hand.position.x).not.toBe(handStart.x)
    expect(head.texture).toBe(headTexture)
    player.setReaction('happy'); player.update(600)
    expect(head.texture).toBe(textures.get('hd-characters/juanmao-24/down-right-head-happy.png'))
    player.setReaction(null); player.setPose('down-right',false); player.update(0)
    expect(head.texture).toBe(headTexture)
    player.destroy()
    for (const texture of textures.values()) texture.destroy()
  })
})

describe('卷毛24贴图加载边界', () => {
  it('只预载实际显示的身份、手套与鞋，原姿态遮挡下不可用的肢体切片不进入运行时解码', async () => {
    const { Texture, Sprite } = await import('pixi.js')
    const { Juanmao24Player, JUANMAO_24_TEXTURE_URLS } = await import('../../src/modern/features/characters/juanmao-24')
    const textures = new Map(JUANMAO_24_TEXTURE_URLS.map(url => [url, new Texture({ source: Texture.EMPTY.source })]))
    const player = new Juanmao24Player(textures), seen = new Set<InstanceType<typeof Texture>>()
    for (const facing of ['down-right','down-left','up-left','up-right'] as const) for (const action of ['neutral','happy','sad','hurt'] as const) {
      player.setPose(facing,false); player.setReaction(action); player.update(800)
      for(const child of player.view.children)if(child instanceof Sprite && child.visible)seen.add(child.texture)
    }
    expect([...textures.entries()].filter(([,texture])=>!seen.has(texture)).map(([url])=>url)).toEqual([])
    player.destroy(); for(const texture of textures.values())texture.destroy()
  })
})


describe('Juanmao24 authored singed-wool reaction', () => {
  it('uses fixed native soot heads and white eyes for all facings, with no approximate forehead dots', async () => {
    const { Texture, Sprite } = await import('pixi.js')
    const { Juanmao24Player, JUANMAO_24_TEXTURE_URLS } = await import('../../src/modern/features/characters/juanmao-24')
    const textures = new Map(JUANMAO_24_TEXTURE_URLS.map(url => [url,new Texture({source:Texture.EMPTY.source})]))
    const player = new Juanmao24Player(textures)
    for(const facing of ['down-right','down-left','up-left','up-right'] as const){
      const url='hd-characters/juanmao-24/'+facing+'-head-hurt.png'
      expect(JUANMAO_24_TEXTURE_URLS).toContain(url)
      player.setPose(facing,false);player.setReaction('hurt');player.update(800)
      const head=player.view.children.find(child=>child instanceof Sprite && child.label==='head') as InstanceType<typeof Sprite>
      expect(head.texture).toBe(textures.get(url));expect(head.tint).toBe(0xffffff)
      player.setReaction('neutral');player.update(0)
      expect(head.texture).toBe(textures.get('hd-characters/juanmao-24/'+facing+'-head.png'))
    }
    player.destroy();for(const texture of textures.values())texture.destroy()
  })
})

describe('卷毛24真实场景位移与足接地', () => {
  it('地图实例保持原SWF格内足部/阴影锚点，独立审阅仍以脚底为原点', async()=>{
    const {Texture}=await import('pixi.js')
    const {Juanmao24Player,JUANMAO_24_TEXTURE_URLS}=await import('../../src/modern/features/characters/juanmao-24')
    const textures=new Map(JUANMAO_24_TEXTURE_URLS.map(url=>[url,new Texture({source:Texture.EMPTY.source})]))
    const player=new Juanmao24Player(textures,true),review=new Juanmao24Player(textures)
    expect([player.view.x,player.view.y]).toEqual([28,20])
    expect([review.view.x,review.view.y]).toEqual([0,0])
    player.setPose('up-left',true);player.setWorldPosition(56,40);player.update(16.7)
    expect([player.view.x,player.view.y]).toEqual([28,20])
    player.destroy();review.destroy();for(const texture of textures.values())texture.destroy()
  })
  it('以原场景56×40方向前进时，同一支撑段足部世界位置不漂移', () => {
    const length=Math.hypot(56,40), direction={x:56/length,y:40/length}
    const start=sampleJuanmao24Grounded(2,'down-right',direction).leftFoot
    for(const distance of [3,5,7,10]) {
      const foot=sampleJuanmao24Grounded(distance,'down-right',direction).leftFoot
      const drift=Math.hypot(direction.x*(distance-2)+foot.x-start.x,direction.y*(distance-2)+foot.y-start.y)
      expect(drift).toBeLessThan(0.000001)
      expect(foot.lift).toBe(0)
    }
  })
})
