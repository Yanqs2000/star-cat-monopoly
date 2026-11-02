export interface ContactPoint25{x:number;y:number}
export interface ContactDefinition25{key:string;rest:ContactPoint25;phase:number}
export interface ContactSnapshot25 extends ContactPoint25{key:string;lift:number;support:boolean;contactId:number}
interface Foot{ground:ContactPoint25;lift:number;support:boolean;contactId:number}
interface Swing{key:string;from:ContactPoint25;to:ContactPoint25;fromLift:number;progress:number;length:number;height:number;mode:'walk'|'settle';direction:ContactPoint25}
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*t*(10+t*(-15+6*t))}
const distance=(a:ContactPoint25,b:ContactPoint25)=>Math.hypot(a.x-b.x,a.y-b.y)

/** Stateful two-foot contact controller for A-Niu; the source rules remain30Hz. */
export class Character25Contacts{
 private definitions:ContactDefinition25[]
 private feet=new Map<string,Foot>()
 private root:ContactPoint25={x:0,y:0}
 private moving=false
 private firstStep=true
 private nextIndex=0
 private swing:Swing|undefined
 private idleElapsed=0
 private serial=0
 private travelled=0
 private resume:{swing:Swing|undefined;firstStep:boolean;nextIndex:number;support:Map<string,boolean>}|undefined
 constructor(definitions:ContactDefinition25[],private readonly stride:number){
  if(definitions.length!==2||stride<=0)throw Error('阿牛接地控制需要两只脚及有效步长')
  this.definitions=definitions;this.reset(0,0,definitions)
 }
 get distance(){return this.travelled}
 reset(x:number,y:number,definitions=this.definitions){
  this.root={x,y};this.definitions=definitions;this.travelled=0;this.moving=false;this.firstStep=true;this.swing=undefined;this.resume=undefined;this.idleElapsed=0
  this.nextIndex=Math.max(0,definitions.findIndex(d=>d.phase>=.25));this.feet.clear()
  for(const d of definitions)this.feet.set(d.key,{ground:{x:x+d.rest.x,y:y+d.rest.y},lift:0,support:true,contactId:++this.serial})
 }
 setRest(definitions:ContactDefinition25[]){this.definitions=definitions;if(!this.moving){this.swing=undefined;this.resume=undefined;this.beginSettle()}}
 adjustStoppedRoot(x:number,y:number){this.root={x,y};this.moving=false;this.swing=undefined;this.resume=undefined;this.beginSettle()}
 setMoving(moving:boolean){
  if(this.moving===moving)return
  if(!moving){
   this.resume={swing:this.swing?{...this.swing}:undefined,firstStep:this.firstStep,nextIndex:this.nextIndex,support:new Map([...this.feet].map(([k,f])=>[k,f.support]))}
   this.moving=false;this.idleElapsed=0;this.swing=undefined;this.beginSettle();return
  }
  this.moving=true
  if(this.resume&&this.idleElapsed===0){
   this.swing=this.resume.swing;this.firstStep=this.resume.firstStep;this.nextIndex=this.resume.nextIndex
   for(const[k,support]of this.resume.support)this.feet.get(k)!.support=support
  }else{
   const airborne=this.definitions.findIndex(d=>this.feet.get(d.key)!.lift>1e-6)
   this.nextIndex=airborne>=0?airborne:Math.max(0,this.definitions.findIndex(d=>d.phase>=.25));this.firstStep=true;this.swing=undefined
  }
  this.resume=undefined
 }
 private goal(d:ContactDefinition25){return{x:this.root.x+d.rest.x,y:this.root.y+d.rest.y}}
 private beginSettle(){
  if(this.swing?.mode==='settle')return
  const candidates=this.definitions.filter(d=>{const f=this.feet.get(d.key)!;return f.lift>1e-6||distance(f.ground,this.goal(d))>1e-6})
  candidates.sort((a,b)=>this.feet.get(b.key)!.lift-this.feet.get(a.key)!.lift||distance(this.feet.get(b.key)!.ground,this.goal(b))-distance(this.feet.get(a.key)!.ground,this.goal(a)))
  const d=candidates[0];if(!d){this.swing=undefined;for(const f of this.feet.values())if(!f.support&&f.lift<1e-6){f.support=true;f.contactId=++this.serial}return}
  const f=this.feet.get(d.key)!;f.support=false
  this.swing={key:d.key,from:{...f.ground},to:this.goal(d),fromLift:f.lift,progress:0,length:90,height:Math.min(1.8,Math.max(.8,distance(f.ground,this.goal(d))*.3)),mode:'settle',direction:{x:0,y:0}}
 }
 private sampleSwing(){
  const s=this.swing!;const f=this.feet.get(s.key)!,p=Math.min(1,s.progress/s.length),w=smooth(p)
  f.ground={x:s.from.x+(s.to.x-s.from.x)*w,y:s.from.y+(s.to.y-s.from.y)*w}
  f.lift=s.fromLift*(1-w)+Math.sin(Math.PI*p)**2*s.height
  if(p>=1){f.ground={...s.to};f.lift=0;f.support=true;f.contactId=++this.serial;this.swing=undefined;return true}
  return false
 }
 moveTo(x:number,y:number){
  const dx=x-this.root.x,dy=y-this.root.y,total=Math.hypot(dx,dy)
  if(total<1e-9)return
  if(!this.moving){this.reset(x,y);return}
  const unit={x:dx/total,y:dy/total};this.travelled+=total
  if(this.swing?.mode==='walk'&&unit.x*this.swing.direction.x+unit.y*this.swing.direction.y<.9){
   const s=this.swing,f=this.feet.get(s.key)!,d=this.definitions.find(d=>d.key===s.key)!,remaining=Math.max(1e-6,s.length-s.progress)
   this.swing={...s,from:{...f.ground},fromLift:f.lift,to:{x:this.root.x+unit.x*(remaining+this.stride/4)+d.rest.x,y:this.root.y+unit.y*(remaining+this.stride/4)+d.rest.y},progress:0,length:remaining,direction:unit}
  }
  let left=total
  while(left>1e-8){
   if(!this.swing){
    const d=this.definitions[this.nextIndex]!,f=this.feet.get(d.key)!,length=this.firstStep?this.stride/4:this.stride/2
    f.support=false;this.swing={key:d.key,from:{...f.ground},fromLift:f.lift,to:{x:this.root.x+unit.x*(length+this.stride/4)+d.rest.x,y:this.root.y+unit.y*(length+this.stride/4)+d.rest.y},progress:0,length,height:Math.min(3.2,this.stride*.14),mode:'walk',direction:unit}
   }
   const amount=Math.min(left,this.swing.length-this.swing.progress)
   this.root={x:this.root.x+unit.x*amount,y:this.root.y+unit.y*amount};this.swing.progress+=amount;left-=amount
   if(this.sampleSwing()){this.firstStep=false;this.nextIndex=(this.nextIndex+1)%this.definitions.length}
  }
  this.root={x,y}
 }
 advanceIdle(deltaMs:number){
  if(this.moving||deltaMs<=0)return
  this.idleElapsed+=deltaMs;this.resume=undefined;let left=deltaMs
  while(left>0){
   if(!this.swing)this.beginSettle()
   if(!this.swing)break
   const amount=Math.min(left,this.swing.length-this.swing.progress);this.swing.progress+=amount;left-=amount
   if(!this.sampleSwing())break
  }
 }
 snapshot():ContactSnapshot25[]{return this.definitions.map(d=>{const f=this.feet.get(d.key)!;return{key:d.key,x:f.ground.x,y:f.ground.y-f.lift,lift:f.lift,support:f.support,contactId:f.contactId}})}
}

/** Independent biped controllers sharing the paired characters' world root. */
export class Character25PairContacts{
 private pairs:{id:string;contacts:Character25Contacts}[]
 constructor(private definitions:ContactDefinition25[],stride:number){
  const ids=[...new Set(definitions.map(d=>d.key.split('/')[0]!))]
  if(ids.length!==2)throw Error('双人接地控制需要两个独立角色')
  this.pairs=ids.map(id=>({id,contacts:new Character25Contacts(this.forActor(id,definitions),stride)}))
 }
 private forActor(id:string,definitions:ContactDefinition25[]){return definitions.filter(d=>d.key.startsWith(id+'/'))}
 get distance(){return this.pairs[0]!.contacts.distance}
 reset(x:number,y:number,definitions=this.definitions){this.definitions=definitions;for(const p of this.pairs)p.contacts.reset(x,y,this.forActor(p.id,definitions))}
 setRest(definitions:ContactDefinition25[]){this.definitions=definitions;for(const p of this.pairs)p.contacts.setRest(this.forActor(p.id,definitions))}
 adjustStoppedRoot(x:number,y:number){for(const p of this.pairs)p.contacts.adjustStoppedRoot(x,y)}
 setMoving(moving:boolean){for(const p of this.pairs)p.contacts.setMoving(moving)}
 moveTo(x:number,y:number){for(const p of this.pairs)p.contacts.moveTo(x,y)}
 advanceIdle(deltaMs:number){for(const p of this.pairs)p.contacts.advanceIdle(deltaMs)}
 snapshot(){return this.pairs.flatMap(p=>p.contacts.snapshot())}
}

/** The centaur's left/right fore-hind pairs share one body and alternate diagonals. */
export class Character25CentaurContacts{
 private sides:{name:string;contacts:Character25Contacts}[]
 constructor(private definitions:ContactDefinition25[],stride:number){
  if(definitions.length!==4)throw Error('半人马接地控制需要四只马蹄')
  this.sides=['left','right'].map(name=>({name,contacts:new Character25Contacts(this.forSide(name,definitions),stride)}))
 }
 private forSide(name:string,definitions:ContactDefinition25[]){return definitions.filter(d=>d.key.includes('/'+name))}
 get distance(){return this.sides[0]!.contacts.distance}
 reset(x:number,y:number,definitions=this.definitions){this.definitions=definitions;for(const s of this.sides)s.contacts.reset(x,y,this.forSide(s.name,definitions))}
 setRest(definitions:ContactDefinition25[]){this.definitions=definitions;for(const s of this.sides)s.contacts.setRest(this.forSide(s.name,definitions))}
 adjustStoppedRoot(x:number,y:number){for(const s of this.sides)s.contacts.adjustStoppedRoot(x,y)}
 setMoving(moving:boolean){for(const s of this.sides)s.contacts.setMoving(moving)}
 moveTo(x:number,y:number){for(const s of this.sides)s.contacts.moveTo(x,y)}
 advanceIdle(deltaMs:number){for(const s of this.sides)s.contacts.advanceIdle(deltaMs)}
 snapshot(){return this.sides.flatMap(s=>s.contacts.snapshot())}
}
