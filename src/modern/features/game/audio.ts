import type { GameState } from './types'
import type { InteractionEvent } from './interaction-types'
export interface AudioPort {
  src:string;volume:number;loop:boolean;currentTime:number
  play():Promise<void>;pause():void;load():void;addEventListener(name:string,callback:()=>void):void
}
export const SCENE_MUSIC=['gamemusic','startmusic1','startmusic2'] as const
export function sceneTrack(state:GameState):string|null {
 const i=state.interaction
 if(i?.kind==='monthly-settlement')return 'monthmusic'
 if(i?.kind==='ludo'||i?.kind==='carnival')return SCENE_MUSIC[i.game.musicIndex ?? 0] ?? 'gamemusic'
 return null
}
export function soundForEvent(event:InteractionEvent):string|null {
 if(event.kind==='card-draw'||event.kind==='tickets')return 'sn_4'
 if(event.kind==='luck')return (event.amount ?? 0)<0?'sn_6':'sn_5'
 if(event.receipt?.kind==='carnival')return 'sn_5'
 if(event.receipt?.kind==='ludo')return (event.receipt.ticketDelta ?? 0)>0?'sn_5':(event.receipt.ticketDelta ?? 0)<0?'sn_6':null
 return null
}
/** Playback has no access to RNG or commands. One-shot failures are never replayed. */
export class AudioSession {
 private background:string|null=null
 private scene:string|null=null
 private bg:AudioPort|null=null
 private foreground:AudioPort|null=null
 private effects=new Set<AudioPort>()
 private failed=new WeakSet<AudioPort>()
 private unlocked=false
 private paused=false
 private muted=false
 private destroyed=false
 private matchLoaded=false
 private musicVolume=1
 private effectVolume=1
 constructor(private factory:()=>AudioPort=()=>new Audio(),private onError:(message:string|null)=>void=()=>{}){}
 private play(port:AudioPort){
  if(this.paused||!this.unlocked||this.destroyed)return
  void port.play().catch(()=>this.fail(port))
 }
 private fail(port:AudioPort){
  if(this.destroyed||this.failed.has(port)||port!==this.bg&&port!==this.foreground&&!this.effects.has(port))return
  this.failed.add(port);port.pause();this.effects.delete(port)
  this.onError(`声音加载失败：${port.src}。可以静音继续或重试音乐。`)
 }
 private create(name:string,loop:boolean){
  const port=this.factory();port.src=`${import.meta.env.BASE_URL}assets/audio/${name}.mp3`;port.loop=loop
  port.addEventListener('error',()=>this.fail(port));return port
 }
 private refreshVolume(){
  const music=this.muted?0:this.musicVolume
  if(this.bg)this.bg.volume=music*(this.scene?0.2:1)
  if(this.foreground)this.foreground.volume=music
  for(const port of this.effects)port.volume=this.muted?0:this.effectVolume
 }
 setTracks(background:string|null,scene:string|null){
  if(this.destroyed)return
  const changedBg=background!==this.background,changedScene=scene!==this.scene
  this.background=background;this.scene=scene
  if(changedBg){this.bg?.pause();this.bg=null}
  if(changedScene){this.foreground?.pause();this.foreground=null}
  if(this.unlocked){
   if(background&&!this.bg){
    const port=this.create(background,!/^backmusic[1-5]$/.test(background));this.bg=port
    port.addEventListener('ended',()=>{if(this.bg===port&&/^backmusic[1-5]$/.test(background))this.setTracks(`backmusic${Number(background.at(-1))%5+1}`,this.scene)})
    this.play(port)
   }
   if(scene&&!this.foreground){this.foreground=this.create(scene,true);this.play(this.foreground)}
  }
  this.refreshVolume()
 }
 setScene(scene:string|null){this.setTracks(this.background,scene)}
 startMatch(){this.stop()}
 restoreTracks(background:string,scene:string|null){
  if(this.matchLoaded)this.setScene(scene)
  else{this.setTracks(background,scene);this.matchLoaded=true}
 }
 unlock(){if(this.destroyed)return;this.unlocked=true;this.setTracks(this.background,this.scene)}
 effect(name:string){
  if(!this.unlocked||this.paused||this.destroyed)return
  const port=this.create(name,false);this.effects.add(port);port.volume=this.muted?0:this.effectVolume
  port.addEventListener('ended',()=>this.effects.delete(port));this.play(port)
 }
 setPaused(value:boolean){
  if(this.paused===value)return;this.paused=value
  for(const port of [this.bg,this.foreground,...this.effects])if(port){if(value)port.pause();else if(!this.failed.has(port))this.play(port)}
 }
 setMuted(value:boolean){this.muted=value;this.refreshVolume()}
 setVolumes(music:number,effects:number){this.musicVolume=Math.max(0,Math.min(1,music));this.effectVolume=Math.max(0,Math.min(1,effects));this.refreshVolume()}
 retry(){
  this.onError(null)
  for(const port of [this.bg,this.foreground])if(port&&this.failed.has(port)){this.failed.delete(port);port.load();this.play(port)}
 }
 stop(){for(const port of [this.bg,this.foreground,...this.effects])port?.pause();this.bg=null;this.foreground=null;this.background=null;this.scene=null;this.effects.clear();this.matchLoaded=false}
 destroy(){this.stop();this.destroyed=true}
}
