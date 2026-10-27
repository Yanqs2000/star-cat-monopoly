import { Container, Sprite, type Texture } from 'pixi.js'
import { frameAtElapsed, type Facing, type WalkClip } from './assets'

export class WalkPreview {
  readonly view = new Container()
  private readonly sprite = new Sprite()
  private clip: WalkClip
  private elapsedMs = 0
  private playing = true

  constructor(private readonly clips: WalkClip[], private readonly textures: Map<string, Texture>) {
    this.clip = clips[0]!
    this.view.addChild(this.sprite)
    this.update(0)
  }
  setFacing(facing: Facing): void {
    this.clip = this.clips.find(clip => clip.facing === facing)!
    this.elapsedMs = 0
    this.update(0)
  }
  setPlaying(playing: boolean): void { this.playing = playing }
  update(deltaMs: number): number {
    if (this.playing) this.elapsedMs += deltaMs
    const frame = frameAtElapsed(this.clip, this.elapsedMs)
    this.sprite.texture = this.textures.get(frame.url)!
    this.sprite.position.set(frame.offsetX, frame.offsetY)
    return frame.sourceFrame
  }
}
