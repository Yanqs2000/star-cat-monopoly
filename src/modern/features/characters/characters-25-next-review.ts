import {Application,Assets,Container,Graphics,Sprite,type Texture} from 'pixi.js'
import {Character25Player} from './characters-25'
import {character25DurationMs,type Character25Action} from './characters-25-motion'
import type {Character25Rig} from './characters-25-types'
import type {Facing} from './assets'
import {createCharacterMaterialRenderer,type MaterialRigIndex} from './character-material-render'

const cid=Number(new URLSearchParams(location.search).get('role')??(location.pathname.includes('/last-three/')?5:location.pathname.includes('/trio/')?3:location.pathname.includes('/ajie-nini/')?10:11))
if(![3,4,5,7,8,9,11,6,10,12].includes(cid))throw Error('本页支持当前人物制作批次')
const reviewScale=cid===3?2.5:3.2
const variant=new URLSearchParams(location.search).get('variant')==='carnival'?'-carnival':''
const index=await(await fetch(`../role-${String(cid).padStart(2,'0')}${variant}-rig.json`)).json()as {
 characters:Character25Rig[];runtimeImages:{url:string}[]
}
const rig=index.characters[0]!,facings:Facing[]=['down-right','down-left','up-left','up-right']
document.querySelector('#name')!.textContent=rig.name
document.querySelector<HTMLImageElement>('#source')!.src=`../source-references/role-${String(cid).padStart(2,'0')}-source.png`
const app=new Application();await app.init({width:1280,height:560,resolution:1,background:'#d9e3e8',antialias:true,autoStart:false})
document.querySelector('#stage')!.appendChild(app.canvas)
const textures=new Map<string,Texture>()
await Promise.all(index.runtimeImages.map(async p=>textures.set(p.url,await Assets.load<Texture>('/modern/'+p.url))))
const panels=facings.map((facing,i)=>{
 const world=new Container(),floor=new Graphics(),player=new Character25Player(rig,textures)
 const mask=new Graphics().rect(i*320,0,320,560).fill(0xffffff);app.stage.addChild(mask);world.mask=mask
 world.position.set(i*320+160,470);world.scale.set(reviewScale)
 for(let n=-40;n<=40;n++)floor.moveTo(n*7-140,-100).lineTo(n*7+140,100).moveTo(n*7-140,100).lineTo(n*7+140,-100)
 floor.stroke({width:.2,color:0x8299a5,alpha:.5});world.addChild(floor,player.view);app.stage.addChild(world)
 return{world,floor,player,facing}
})
const animatedMaterials:{image:HTMLImageElement;frames:{url:string}[];fps:number}[]=[]
let materialElapsed=0
if([3,4,5,7,11,6,10,12].includes(cid)&&!new URLSearchParams(location.search).has('export')){
 const complete=await(await fetch(`../role-${String(cid).padStart(2,'0')}-complete.json`)).json()as {
  thumbnailUrls:Record<string,string>;assets:{source:string;url:string}[];activityClips:{id:string;fps?:number;frames:{url:string}[]}[]
 }
 const section=document.querySelector('#derived')!,heading=document.createElement('h2'),grid=document.createElement('div')
 heading.textContent='头像、活动与结算素材';grid.className='materials-grid';section.append(heading,grid)
 const figure=(label:string,url:string)=>{const f=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src='/modern/'+url;img.alt=label;caption.textContent=label;f.append(img,caption);grid.append(f);return img}
 figure('选择与加载',complete.thumbnailUrls[String(cid)]!)
 for(const [source,label]of [[`assets/activities/face-${cid}/1.png`,'操作栏头像'],[`assets/activities/head-${cid}/1.png`,'小地图头像'],[`assets/monthly/champions/${cid}.png`,'钱包、排名与结算']]as const){const asset=complete.assets.find(a=>a.source===source)!;figure(label,asset.url)}
 for(let direction=1;direction<=4;direction++){const clip=complete.activityClips.find(c=>c.id===`fly-${cid}-${direction}`)!;figure('乘云 · 方向'+direction,clip.frames[0]!.url)}
 const boy=complete.activityClips.find(c=>c.id===`carnival-boy-${cid}`)!
 boy.frames.forEach((f,i)=>figure('游乐场 · 姿态'+(i+1),f.url))
 for(const [direction,label]of [['left','左移'],['right','右移']]){const clip=complete.activityClips.find(c=>c.id===`carnival-walk-${cid}-${direction}`)!;animatedMaterials.push({image:figure('游乐场 · '+label,clip.frames[0]!.url),frames:clip.frames,fps:clip.fps??30})}
 for(const [god,label]of [[2,'财神'],[3,'穷神'],[4,'福神'],[5,'衰神'],[10,'天使'],[11,'恶魔']]as const)figure('附身 · '+label,complete.assets.find(a=>a.source===`assets/characters/${cid}/reactions/gods/${god}.png`)!.url)
}
let action:Character25Action='walk',elapsed=0,natural=true,paused=false,rate=1
function reset(name:Character25Action,naturalMovement=false){
 action=name;elapsed=0;natural=naturalMovement
 for(const p of panels){p.player.setPose(p.facing,name==='walk');p.player.setReaction(name==='walk'?null:name);p.player.clearWorldPosition();p.player.view.position.set(0,0);p.world.position.set(panels.indexOf(p)*320+160,470);p.floor.visible=natural;if(natural)p.player.setWorldPosition(0,0)}
 document.querySelector('#status')!.textContent=`${name} · ${Math.round(character25DurationMs(cid,name,'down-right'))}ms`
 app.render()
}
function advance(dt:number){
 elapsed+=dt
 for(const p of panels){
  p.player.update(dt)
  if(natural){
   const steps=elapsed/(16000/30),x=(p.facing.includes('right')?56:-56)*steps,y=(p.facing.startsWith('down')?40:-40)*steps
   p.player.setWorldPosition(x,y);p.player.view.position.set(x,y);p.world.position.set(panels.indexOf(p)*320+160-x*reviewScale,470-y*reviewScale)
   p.floor.position.set(Math.round(x/7)*7,Math.round(y/5)*5)
  }
 }
 app.render()
}
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-action]'))b.onclick=()=>{reset(b.dataset.action as Character25Action);paused=false}
document.querySelector<HTMLButtonElement>('#natural')!.onclick=()=>{reset('walk',true);paused=false}
document.querySelector<HTMLButtonElement>('#pause')!.onclick=()=>{paused=!paused}
document.querySelector<HTMLSelectElement>('#speed')!.onchange=e=>{rate=Number((e.target as HTMLSelectElement).value)}
document.querySelector<HTMLInputElement>('#scrub')!.oninput=e=>{
 reset(action);paused=true;advance(Number((e.target as HTMLInputElement).value)*character25DurationMs(cid,action,'down-right')/1000)
}
let last=performance.now()
function tick(now:number){const dt=Math.min(60,now-last)*rate;last=now;if(!paused){advance(dt);materialElapsed+=dt;for(const m of animatedMaterials){const url='/modern/'+m.frames[Math.floor(materialElapsed*m.fps/1000)%m.frames.length]!.url;if(m.image.getAttribute('src')!==url)m.image.src=url}if(action!=='walk'&&elapsed>character25DurationMs(cid,action,'down-right')+800)reset(action)}requestAnimationFrame(tick)}
const api={ready:true,rig,
 async createMaterialRenderer(){
  const load=async(suffix:string)=>(await(await fetch(`../role-${String(cid).padStart(2,'0')}${suffix}-rig.json`)).json())as MaterialRigIndex
  return createCharacterMaterialRenderer(await load(''),await load('-carnival'))
 },
 sample(name:Character25Action,time:number){paused=true;reset(name);advance(time)},
 sampleNatural(time:number){paused=true;reset('walk',true);for(let t=0;t<time;t+=1000/60)advance(Math.min(1000/60,time-t))},
 parts(){return panels.map(p=>({facing:p.facing,parts:p.player.view.children.filter(c=>c instanceof Sprite&&c.visible).map(c=>({name:c.label,x:c.x,y:c.y,rotation:c.rotation,width:c.width,height:c.height})),contacts:p.player.footContacts}))},
 async raster(name:Character25Action,time:number){this.sample(name,time);return app.renderer.extract.base64({target:app.stage,resolution:1,format:'png'})}
}
;(window as unknown as{characterNextReview:typeof api}).characterNextReview=api
reset('walk',true);requestAnimationFrame(tick)
