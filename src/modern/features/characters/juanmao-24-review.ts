import { Application, Assets, Texture, Container, Graphics, Sprite } from 'pixi.js'
import { Juanmao24Player, JUANMAO_24_TEXTURE_URLS } from './juanmao-24'
import { FACINGS } from './assets'
import { juanmao24DurationMs, type Juanmao24Action } from './juanmao-24-motion'

const app = new Application()
await app.init({ width: 1200, height: 560, resolution: 1, antialias: true, background: '#313941', preference: 'webgl', autoStart: false })
document.querySelector('#stage')!.appendChild(app.canvas)
const textures = new Map<string, Texture>()
await Promise.all(JUANMAO_24_TEXTURE_URLS.map(async url => { textures.set(url,await Assets.load<Texture>(`/modern/${url}`)) }))
const panels = FACINGS.map((facing,index)=>{
  const panel=new Container();panel.x=index*300;app.stage.addChild(panel)
  const world=new Container();world.position.set(150,460);world.scale.set(3.2);panel.addChild(world)
  const floor=new Graphics()
  for(let x=-400;x<=400;x+=7)floor.moveTo(x,-400).lineTo(x,400).stroke({width:0.15,color:0x8193a1,alpha:0.55})
  for(let y=-400;y<=400;y+=5)floor.moveTo(-400,y).lineTo(400,y).stroke({width:0.15,color:0x8193a1,alpha:0.55})
  floor.visible=false;world.addChild(floor)
  const floorMask=new Graphics().rect(0,435,300,125).fill(0xffffff);panel.addChild(floorMask);floor.mask=floorMask
  const player=new Juanmao24Player(textures);player.setPose(facing,true);world.addChild(player.view)
  return {panel,world,floor,player}
})
const players=panels.map(panel=>panel.player)
let natural=false
const setNaturalPosition=(time: number):void=>{
  panels.forEach(({world,player},index)=>{
    const facing=FACINGS[index]!,steps=time/(16000/30)
    const x=(facing.includes('right')?56:-56)*steps,y=(facing.startsWith('down')?40:-40)*steps
    player.view.position.set(x,y);world.position.set(150-x*3.2,460-y*3.2)
    player.setWorldPosition(x,y)
  })
}
const beginNatural=():void=>{
  natural=true;elapsed=0;action='walk'
  panels.forEach(({world,floor,player},index)=>{world.position.set(150,460);floor.visible=true;player.clearWorldPosition();player.setReaction(null);player.setPose(FACINGS[index]!,true);player.view.position.set(0,0);player.setWorldPosition(0,0)})
  label.textContent='自然移动 · 原对局步速 · 位移适配快步'
}
let paused = false, elapsed = 0, action: Juanmao24Action = 'walk'
const label = document.querySelector('#status')!
const reset = (name: Juanmao24Action): void => {
  action = name; elapsed = 0;natural=false
  panels.forEach(({world,floor,player})=>{world.position.set(150,460);floor.visible=false;player.view.position.set(0,0);player.clearWorldPosition()})
  players.forEach((player,index)=>{player.setPose(FACINGS[index]!,name==='walk');player.setReaction(name==='walk'?null:name);player.update(0)})
  label.textContent = `${name} · ${Math.round(juanmao24DurationMs(name,'down-right'))}ms · candidate`
}
document.querySelector<HTMLButtonElement>('#natural')!.onclick=()=>{beginNatural();paused=false}
for (const element of document.querySelectorAll<HTMLButtonElement>('[data-action]')) element.onclick = ()=>reset(element.dataset.action as Juanmao24Action)
document.querySelector<HTMLButtonElement>('#pause')!.onclick=()=>{paused=!paused;document.querySelector('#pause')!.textContent=paused?'继续':'暂停'}
document.querySelector<HTMLInputElement>('#scrub')!.oninput=event=>{if(natural)reset('walk');paused=true;elapsed=Number((event.target as HTMLInputElement).value)*juanmao24DurationMs(action,'down-right')/1000;players.forEach((player,index)=>{player.setPose(FACINGS[index]!,action==='walk');player.setReaction(action==='walk'?null:action);player.update(elapsed)});app.renderer.render(app.stage)}
let previous = performance.now()
function tick(now: number): void {
  const delta = Math.min(60,now-previous); previous=now
  if(!paused){elapsed+=delta;players.forEach(player=>player.update(delta));if(natural)setNaturalPosition(elapsed);if(action!=='walk'&&elapsed>juanmao24DurationMs(action,'down-right')+800)reset(action)}
  app.renderer.render(app.stage)
  requestAnimationFrame(tick)
}
reset('walk');requestAnimationFrame(tick)
const api = {
  reset,
  sample(name: Juanmao24Action,time: number): void {reset(name);paused=true;elapsed=time;players.forEach(player=>player.update(time));app.renderer.render(app.stage)},
  beginNatural():void{beginNatural();paused=true},
  sampleNatural(time: number):void{paused=true;elapsed=time;setNaturalPosition(time);app.renderer.render(app.stage)},
  footWorldPositions(){return panels.map(({player},index)=>({facing:FACINGS[index],feet:['left','right'].map(side=>{const texture=textures.get(`hd-characters/juanmao-24/${FACINGS[index]}-${side}Foot.png`);const foot=player.view.children.find(child=>child instanceof Sprite && child.texture===texture)!;return {side,x:player.view.x+foot.x,y:player.view.y+foot.y}})}))},
  get elapsed(): number {return elapsed},
  get action(): string {return action},
  get ready(): boolean {return true},
  bounds(){return players.map(player=>{const b=player.view.getBounds();return{x:b.minX,y:b.minY,right:b.maxX,bottom:b.maxY}})},
}
;(window as unknown as {juanmao24Review: typeof api}).juanmao24Review=api
