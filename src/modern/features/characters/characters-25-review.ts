import {Application,Assets,Texture,Container,Graphics,Sprite}from'pixi.js'
import index from '../../data/aniu-map-rig.json'
import materials from'../../data/characters-25.json'
import {Character25Player}from'./characters-25'
import type{Character25Rig}from'./characters-25-types'
import {FACINGS}from'./assets'
import {character25DurationMs,type Character25Action}from'./characters-25-motion'
import{createAniuMaterialRenderer}from'./aniu-material-render'

const rig=index.characters[0] as unknown as Character25Rig
const app=new Application()
await app.init({width:1200,height:520,resolution:1,antialias:true,background:'#dce6ed',preference:'webgl',autoStart:false})
document.querySelector('#stage')!.appendChild(app.canvas)
const textures=new Map<string,Texture>()
await Promise.all(index.runtimeImages.map(async p=>textures.set(p.url,await Assets.load<Texture>('/modern/'+p.url))))
const panels=FACINGS.map((facing,i)=>{
 const panel=new Container();panel.x=i*300;app.stage.addChild(panel)
 const world=new Container();world.position.set(150,450);world.scale.set(3.2);panel.addChild(world)
 const floor=new Graphics()
 for(let x=-400;x<=400;x+=7)floor.moveTo(x,-400).lineTo(x,400).stroke({width:.12,color:0x708693,alpha:.6})
 for(let y=-400;y<=400;y+=5)floor.moveTo(-400,y).lineTo(400,y).stroke({width:.12,color:0x708693,alpha:.6})
 const mask=new Graphics().rect(0,400,300,120).fill(0xffffff);panel.addChild(mask);floor.mask=mask;floor.visible=false;world.addChild(floor)
 const player=new Character25Player(rig,textures);world.addChild(player.view);return{world,floor,player,facing}
})
let action:Character25Action='walk',elapsed=0,assetElapsed=0,paused=false,natural=false,rate=1
const gallery=document.querySelector('#derived')!
gallery.innerHTML='<h2>头像、加载图与结算立绘</h2><div id="portraits" class="materials-grid"></div><h2>乘云飞行 · 四方向</h2><p>护目镜、蓝色头带和云尾随方向保留。原作每方向为一张飞行姿态，行进与缩放由游戏轨迹驱动。</p><div id="flights" class="materials-grid"></div><h2>游乐场 · 接物与跑动</h2><div id="carnival" class="materials-grid"></div><h2>附身标记</h2><div id="gods" class="materials-grid badges"></div>'
const picture=(host:string,label:string,url:string)=>{const card=document.createElement('figure');const image=new Image();image.src='/modern/'+url;image.alt=label;const caption=document.createElement('figcaption');caption.textContent=label;card.append(image,caption);document.querySelector(host)!.append(card)}
picture('#portraits','选择与加载',materials.thumbnailUrls['2'])
for(const[source,label]of[['assets/activities/face-2/1.png','操作栏头像'],['assets/activities/head-2/1.png','小地图头像'],['assets/monthly/champions/2.png','钱包、排名与结算立绘']])picture('#portraits',label!,materials.assets.find(a=>a.source===source)!.url)
for(let i=1;i<=4;i++)picture('#flights',['右下','左下','左上','右上'][i-1]!,materials.activityClips.find(c=>c.id==='fly-2-'+i)!.frames[0]!.url)
for(const[id,label]of[[2,'财神'],[3,'穷神'],[4,'福神'],[5,'衰神'],[10,'天使'],[11,'恶魔']]as const)picture('#gods',label,materials.assets.find(a=>a.source===`assets/characters/2/reactions/gods/${id}.png`)!.url)
const clips=['carnival-boy-2','carnival-walk-2-left','carnival-walk-2-right'].map(id=>materials.activityClips.find(c=>c.id===id)!)
const images=new Map<string,HTMLImageElement>()
await Promise.all([...new Set(clips.flatMap(c=>c.frames.map(f=>f.url)))].map(async url=>{const image=new Image();image.src='/modern/'+url;await image.decode();images.set(url,image)}))
const carnival=clips.map((clip,i)=>{
 const card=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');canvas.width=300;canvas.height=280;caption.textContent=['正面接物','向左跑动','向右跑动'][i]!
 card.append(canvas,caption);document.querySelector('#carnival')!.append(card);return{clip,canvas,direction:i===1?-1:i===2?1:0}
})
function drawMaterials(){for(const{clip,canvas,direction}of carnival){
 const c=canvas.getContext('2d')!,frame=clip.frames[direction===0?0:Math.floor(assetElapsed*clip.fps/1000)%clip.frames.length]!,image=images.get(frame.url)!
 c.fillStyle='#dce6ed';c.fillRect(0,0,300,280);c.strokeStyle='#8ea2af';c.lineWidth=.6
 const shift=direction*assetElapsed*.24*2.2%30
 for(let x=-30;x<330;x+=30){c.beginPath();c.moveTo(x-shift,250);c.lineTo(x-shift,280);c.stroke()}
 c.beginPath();c.moveTo(0,270);c.lineTo(300,270);c.stroke();c.drawImage(image,150+frame.offsetX*2.2,256+frame.offsetY*2.2,frame.width*2.2,frame.height*2.2)
}}
function reset(name:Character25Action){action=name;elapsed=0;natural=false
 for(const p of panels){p.world.position.set(150,450);p.floor.visible=false;p.player.view.position.set(0,0);p.player.setPose(p.facing,name==='walk');p.player.setReaction(name==='walk'?null:name);p.player.clearWorldPosition();p.player.update(0)}
 document.querySelector('#status')!.textContent=name+' · '+Math.round(character25DurationMs(2,name,'down-right'))+'ms'
}
function naturalAt(time:number){
 for(const p of panels){const steps=time/(16000/30),x=(p.facing.includes('right')?56:-56)*steps,y=(p.facing.startsWith('down')?40:-40)*steps
  p.player.view.position.set(x,y);p.world.position.set(150-x*3.2,450-y*3.2);p.player.setWorldPosition(x,y);p.floor.position.set(Math.round(x/7)*7,Math.round(y/5)*5)}
}
function beginNatural(){reset('walk');natural=true;for(const p of panels){p.floor.visible=true;p.player.setWorldPosition(0,0)}document.querySelector('#status')!.textContent='自然移动 · 实际地图速度'}
function sample(name:Character25Action,time:number){reset(name);paused=true;elapsed=time;for(const p of panels)p.player.update(time);app.render()}
document.querySelector<HTMLButtonElement>('#natural')!.onclick=()=>{beginNatural();paused=false}
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-action]'))b.onclick=()=>{reset(b.dataset.action as Character25Action);paused=false}
document.querySelector<HTMLButtonElement>('#pause')!.onclick=()=>{paused=!paused;document.querySelector('#pause')!.textContent=paused?'继续':'暂停'}
document.querySelector<HTMLSelectElement>('#speed')!.onchange=e=>{rate=Number((e.target as HTMLSelectElement).value)}
document.querySelector<HTMLInputElement>('#scrub')!.oninput=e=>sample(action,Number((e.target as HTMLInputElement).value)*character25DurationMs(2,action,'down-right')/1000)
let previous=performance.now()
function tick(now:number){const dt=Math.min(60,now-previous)*rate;previous=now
 if(!paused){elapsed+=dt;assetElapsed+=dt;for(const p of panels)p.player.update(dt);if(natural)naturalAt(elapsed);if(action!=='walk'&&elapsed>character25DurationMs(2,action,'down-right')+800)reset(action)}
 app.render();drawMaterials();requestAnimationFrame(tick)}
beginNatural();requestAnimationFrame(tick)
const api={ready:true,sample,reset,beginNatural(){beginNatural();paused=true},sampleNatural(time:number){paused=true;const dt=Math.max(0,time-elapsed);for(const p of panels)p.player.update(dt);elapsed=time;naturalAt(time);app.render()},
 createMaterialRenderer:createAniuMaterialRenderer,
 async extract(name:Character25Action,time:number){sample(name,time);return Promise.all(panels.map(p=>app.renderer.extract.base64({target:p.player.view,resolution:6,format:'png'})))},
 feet(){return panels.map(p=>({facing:p.facing,feet:p.player.view.children.filter(c=>c instanceof Sprite&&/Foot$/.test(c.label)).map(c=>({name:c.label,x:p.player.view.x+c.x,y:p.player.view.y+c.y}))}))},
 parts(){return panels.map(p=>({facing:p.facing,parts:p.player.view.children.filter(c=>c instanceof Sprite).map(c=>({name:c.label,x:c.x,y:c.y,rotation:c.rotation,visible:c.visible}))}))},
 get elapsed(){return elapsed},get action(){return action}}
;(window as unknown as{character25Review:typeof api}).character25Review=api
