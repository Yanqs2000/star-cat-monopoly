import{Container,Graphics,Matrix,Sprite,type Texture}from'pixi.js'
import type{Facing}from'./assets'
import{character25DurationMs,type Character25Action}from'./characters-25-motion'
import{sampleCharacter25Rig}from'./characters-25-pose'
import type{Character25Rig,Part25}from'./characters-25-types'
import{Character25Contacts,Character25PairContacts,type ContactDefinition25}from'./characters-25-contacts'

/** Data-driven actors: paired children, footed creatures and floating bodies. */
export class Character25Player{
 readonly view=new Container()
 readonly characterId:number
 private facing:Facing='down-right'
 private moving=false
 private elapsedMs=0
 private reaction:Exclude<Character25Action,'walk'>|null=null
 private currentFacing:Facing|null=null
 private parts=new Map<string,Sprite>()
 private shadow=new Graphics()
 private prop=new Graphics()
 private locomotion:{position:{x:number;y:number};direction:{x:number;y:number};distance:number}|null=null
 private contacts:Character25Contacts|Character25PairContacts|undefined
 private virtualRoot={x:0,y:0}
 private bodyDistance=0
 private floatingElapsed=0
 private velocity=0
 private lastDeltaMs=1000/60
 private walking=false
 private weight=0
 private blend={from:0,target:0,elapsed:120}

 constructor(private readonly rig:Character25Rig,private readonly textures:Map<string,Texture>,mapPlacement=false,private readonly contactMotion=true){
  this.characterId=rig.id
  if(contactMotion&&[2,5,11].includes(rig.id)&&rig.anatomy==='biped'&&this.definitions().length===2)this.contacts=new Character25Contacts(this.definitions(),rig.stridePx)
  if(contactMotion&&rig.id===3&&rig.anatomy==='paired'&&this.definitions().length===4)this.contacts=new Character25PairContacts(this.definitions(),rig.stridePx)
  if(contactMotion&&rig.id===4&&rig.anatomy==='crab'&&this.definitions().length===2)this.contacts=new Character25Contacts(this.definitions(),rig.stridePx)
  if(mapPlacement)this.view.position.set(...rig.mapAnchor)
  this.view.addChild(this.shadow,this.prop);this.update(0)
 }
 private get floatingMotion(){return this.contactMotion&&this.rig.anatomy==='floating'}
 get action():Character25Action{return this.reaction??(this.moving?'walk':'neutral')}
 get gaitDistance():number|null{return this.contacts?.distance??this.locomotion?.distance??null}
 get footContacts(){
  if(!this.contacts)return[]
  const root=this.locomotion?.position??this.virtualRoot
  return this.contacts.snapshot().map(f=>({...f,x:f.x-root.x,y:f.y-root.y,support:f.support&&(this.action==='walk'||this.action==='neutral')}))
 }
 get finished():boolean{return this.action!=='walk'&&this.elapsedMs>=character25DurationMs(this.rig.id,this.action,this.facing)}
 setPose(facing:Facing,moving:boolean):void{
  if(this.facing!==facing||this.moving!==moving){this.elapsedMs=0;if(this.locomotion&&!this.contacts&&!this.floatingMotion)this.locomotion.distance=0}
  const changed=this.facing!==facing
  this.facing=facing;this.moving=moving
  if(changed)this.contacts?.setRest(this.definitions())
  this.syncWalking()
 }
 private definitions():ContactDefinition25[]{return this.rig.facings[this.facing].actors.flatMap(a=>a.legs.map(l=>({key:a.id+'/'+l.end,rest:{x:a.joints[l.end]![0],y:a.joints[l.end]![1]},phase:l.phase})))}
 private syncWalking(){
  const moving=this.moving&&this.reaction===null
  if(this.walking!==moving){this.walking=moving;this.blend={from:this.weight,target:moving&&this.weight>0?1:0,elapsed:0};this.contacts?.setMoving(moving)}
 }
 private activateBody(){if(this.blend.target!==1)this.blend={from:this.weight,target:1,elapsed:0}}
 setReaction(name:Exclude<Character25Action,'walk'>|null):void{this.reaction=name;this.elapsedMs=0;this.syncWalking()}
 clearWorldPosition():void{
  this.locomotion=null;this.virtualRoot={x:0,y:0};this.bodyDistance=0;this.floatingElapsed=0;this.velocity=0;this.weight=0;this.blend={from:0,target:this.walking?1:0,elapsed:0}
  this.contacts?.reset(0,0,this.definitions());this.contacts?.setMoving(this.walking);this.update(0)
 }
 setWorldPosition(x:number,y:number,initialDirection?:{x:number;y:number}):void{
  if(!Number.isFinite(x)||!Number.isFinite(y))return
  if(!this.locomotion){this.locomotion={position:{x,y},direction:initialDirection?{...initialDirection}:{x:this.facing.includes('right')?56:-56,y:this.facing.startsWith('down')?40:-40},distance:0};this.contacts?.reset(x,y,this.definitions());this.contacts?.setMoving(this.walking)}
  else{
   const dx=x-this.locomotion.position.x,dy=y-this.locomotion.position.y,d=Math.hypot(dx,dy)
   if(this.moving&&this.reaction===null&&d>1e-6){this.locomotion.distance=d>80?0:this.locomotion.distance+d;this.locomotion.direction={x:dx/d,y:dy/d}}
   if(this.contacts&&d>1e-6){
    if(this.walking&&d<=80){this.activateBody();this.contacts.moveTo(x,y);this.bodyDistance+=d;this.velocity=d/Math.max(1,this.lastDeltaMs)}
    else if(!this.walking&&d<=this.rig.stridePx/2)this.contacts.adjustStoppedRoot(x,y)
    else{this.contacts.reset(x,y,this.definitions());this.contacts.setMoving(this.walking)}
   }
   if(this.floatingMotion&&d>1e-6){
    if(this.walking&&d<=80)this.activateBody()
    else if(d>80){this.floatingElapsed=0;this.weight=0;this.blend={from:0,target:0,elapsed:0}}
   }
   this.locomotion.position={x,y}
  }
  this.update(0)
 }
 private buildFacing():void{
  if(this.currentFacing===this.facing)return
  for(const sprite of this.parts.values())sprite.destroy()
  this.parts.clear()
  const facing=this.rig.facings[this.facing]
  this.shadow.clear()
  // A ground shadow stays on the floor while hovering bodies and hands move.
  for(let i=8;i>=1;i--)this.shadow.ellipse(facing.shadow.x,facing.shadow.y,facing.shadow.width*i/16,facing.shadow.height*i/16).fill({color:0x11151c,alpha:.035})
  for(const actor of facing.actors)for(const name of actor.order){
   const part=actor.parts[name]??(name===actor.head+'-expression'?actor.parts[actor.head]:undefined)
   if(!part)continue
   const texture=this.textures.get(part.url)
   if(!texture)throw new Error(`角色${this.rig.id}缺少分层贴图:${part.url}`)
   const sprite=new Sprite(texture);sprite.label=actor.id+'/'+name;this.parts.set(sprite.label,sprite);this.view.addChild(sprite)
  }
  this.view.addChild(this.prop);this.currentFacing=this.facing
 }
 private register(sprite:Sprite,part:Part25):void{
  const texture=this.textures.get(part.url)
  if(!texture)throw new Error(`角色${this.rig.id}贴图未加载:${part.url}`)
  sprite.texture=texture
  sprite.anchor.set(part.pivot[0]*this.rig.density/part.width,part.pivot[1]*this.rig.density/part.height)
 }
 update(deltaMs:number):void{
  const dt=Math.max(0,deltaMs);this.elapsedMs+=dt
  if(dt>0)this.lastDeltaMs=dt
  if(this.contacts||this.floatingMotion){
   if(!this.locomotion&&this.walking&&dt>0)this.activateBody()
   this.blend.elapsed=Math.min(120,this.blend.elapsed+dt);const t=this.blend.elapsed/120,s=t*t*(3-2*t);this.weight=this.blend.from+(this.blend.target-this.blend.from)*s
   if(this.floatingMotion&&this.weight>0)this.floatingElapsed+=dt
   if(this.contacts&&!this.locomotion&&this.walking&&dt>0){const direction={x:this.facing.includes('right')?56:-56,y:this.facing.startsWith('down')?40:-40},length=Math.hypot(direction.x,direction.y),d=dt/character25DurationMs(this.rig.id,'walk',this.facing)*this.rig.stridePx
    this.virtualRoot={x:this.virtualRoot.x+direction.x/length*d,y:this.virtualRoot.y+direction.y/length*d};this.contacts.moveTo(this.virtualRoot.x,this.virtualRoot.y);this.bodyDistance+=d;this.velocity=d/dt}
   if(!this.walking&&this.contacts){this.contacts.advanceIdle(dt);this.bodyDistance+=this.velocity*dt*this.weight}
  }
  this.buildFacing()
  const direction=this.locomotion?.direction??{x:this.facing.includes('right')?56:-56,y:this.facing.startsWith('down')?40:-40}
  const root=this.locomotion?.position??this.virtualRoot
  const motion=this.contacts?{distance:this.bodyDistance,direction,motionWeight:this.weight,feet:Object.fromEntries(this.contacts.snapshot().map(f=>[f.key,[f.x-root.x,f.y-root.y]as const]))}:this.floatingMotion?{distance:this.floatingElapsed/character25DurationMs(this.rig.id,'walk',this.facing)*this.rig.stridePx,direction,motionWeight:this.weight}:this.action==='walk'&&this.locomotion?{distance:this.locomotion.distance,direction}:undefined
  const states=sampleCharacter25Rig(this.rig,this.facing,this.action,this.elapsedMs,motion)
  for(const sprite of this.parts.values())sprite.visible=false
  for(const state of states){
   const sprite=this.parts.get(state.key)
   if(!sprite)throw new Error(`角色${this.rig.id}未登记分件:${state.key}`)
   this.register(sprite,state.part)
   const sx=state.part.width/this.rig.density/sprite.texture.width,sy=state.part.height/this.rig.density/sprite.texture.height
   sprite.setFromMatrix(new Matrix(state.a*sx,state.b*sx,state.c*sy,state.d*sy,state.tx,state.ty))
   sprite.alpha=state.alpha;sprite.tint=state.tint;sprite.visible=state.alpha>0
  }
  this.prop.clear()
  if(this.action==='ready'){
   const facing=this.rig.facings[this.facing],actor=facing.readyActorId===null?undefined:facing.readyActorId?facing.actors.find(a=>a.id===facing.readyActorId):facing.actors[0]
   const arm=actor?.arms.find(a=>a.name.startsWith('right'))??(this.rig.id===6&&this.facing==='up-right'?actor?.arms.find(a=>a.name.startsWith('left')):undefined)
   const flipper=actor?.appendages.find(p=>p.readyProp)
   const part=arm?.lower??flipper?.part
   const state=part&&actor?states.find(p=>p.key===actor.id+'/'+part):undefined
   if(state){const axis=state.part.axis!,x=state.a*axis[0]+state.c*axis[1]+state.tx,y=state.b*axis[0]+state.d*axis[1]+state.ty
    this.prop.roundRect(x-5,y-7,10,10,1.5).fill(0xf7f8fa).stroke({width:.4,color:0x8a929c});this.prop.circle(x,y-2,1.8).fill(0xe63332)}
  }
 }
 destroy():void{this.view.destroy({children:true})}
}
