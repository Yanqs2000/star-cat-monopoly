import {it,expect}from'vitest'
import{Texture,Sprite}from'pixi.js'
import{sampleCharacter25Rig}from'../../src/modern/features/characters/characters-25-pose'
import{Character25Player}from'../../src/modern/features/characters/characters-25'
import type{Character25Rig}from'../../src/modern/features/characters/characters-25-types'
const facings=['down-right','down-left','up-left','up-right']as const
const actor=(readyProp:boolean)=>({id:'main',head:'head',body:'body',joints:{spine:[0,-5],neck:[0,-20],rightFinRoot:[4,-7]},parts:{head:{url:'head',width:30,height:30,pivot:[15,25]},body:{url:'body',width:12,height:14,pivot:[6,7]},rightFin:{url:'fin',width:8,height:12,pivot:[2,2],axis:[0,8]}},legs:[],arms:[],appendages:[{part:'rightFin',joint:'rightFinRoot',kind:'flipper',poseHand:'rightHand',readyProp,amplitude:0}],order:['body','rightFin','head']})
const rig={id:10,name:'阿杰整片鳍臂',anatomy:'floating',density:1,mapAnchor:[28,20],stridePx:96,motionScale:1,sourceSwfSha256:'0'.repeat(64),facings:Object.fromEntries(facings.map(f=>[f,{actors:[actor(f!=='up-left')],shadow:{x:0,y:0,width:30,height:8}}]))}as unknown as Character25Rig

it('poses a whole short flipper around its shoulder without splitting or stretching its surface',()=>{
 const neutral=sampleCharacter25Rig(rig,'down-right','neutral',0).find(p=>p.key==='main/rightFin')!
 const ready=sampleCharacter25Rig(rig,'down-right','ready',0).find(p=>p.key==='main/rightFin')!
 expect(Math.abs(ready.b-neutral.b)).toBeGreaterThan(.1)
 for(const action of['walk','neutral','ready','happy','sad','hurt','cheer']as const)for(let time=0;time<=1500;time+=37){
  const state=sampleCharacter25Rig(rig,'down-right',action,time),fin=state.find(p=>p.key==='main/rightFin')!,body=state.find(p=>p.key==='main/body')!
  expect(Math.hypot(fin.a,fin.b)).toBeCloseTo(1,10);expect(Math.hypot(fin.c,fin.d)).toBeCloseTo(1,10)
  expect(Math.hypot(fin.tx-body.tx,fin.ty-body.ty)).toBeCloseTo(Math.sqrt(20),10)
 }
})
it('anchors a ready die to the declared flipper tip and keeps occluded views empty',()=>{
 const player=new Character25Player(rig,new Map(['head','body','fin'].map(url=>[url,Texture.WHITE])))
 player.setReaction('ready');player.update(0)
 expect(player.view.children.filter(c=>c instanceof Sprite&&c.visible).map(c=>c.label)).toEqual(['main/body','main/rightFin','main/head'])
 expect(player.view.children.at(-1)!.getLocalBounds().width).toBeGreaterThan(8)
 player.setPose('up-left',false);player.update(0);expect(player.view.children.at(-1)!.getLocalBounds().width).toBe(0);player.destroy()
})
it('registers a reference flipper at its authored rest angle and keeps its tip attachment aligned',()=>{
 const turned=structuredClone(rig)
 for(const view of Object.values(turned.facings)){const part=view.actors[0]!.appendages[0]as any;part.restAngle=Math.PI/2;delete part.poseHand}
 const state=sampleCharacter25Rig(turned,'down-right','neutral',0).find(p=>p.key==='main/rightFin')!
 expect(state.a).toBeCloseTo(0,10);expect(state.b).toBeCloseTo(1,10)
 const player=new Character25Player(turned,new Map(['head','body','fin'].map(url=>[url,Texture.WHITE])))
 player.setReaction('ready');player.update(0);const bounds=player.view.children.at(-1)!.getLocalBounds()
 expect(bounds.x+bounds.width/2).toBeCloseTo(-4,8);expect(bounds.y+bounds.height/2).toBeCloseTo(-9,8);player.destroy()
})
