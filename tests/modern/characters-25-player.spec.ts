import{it,expect}from'vitest'
import{Texture,Sprite}from'pixi.js'
import * as implementation from '../../src/modern/features/characters/characters-25'
import type{Character25Rig}from '../../src/modern/features/characters/characters-25-types'
import actualRig from'../../src/modern/data/aniu-map-rig.json'

function rig(id=2):Character25Rig{
 const actor={id:'a',joints:{spine:[0,-12]as const,neck:[0,-18]as const},parts:{body:{url:'body.png',width:60,height:60,pivot:[5,5]as const},head:{url:'head.png',width:120,height:120,pivot:[10,15]as const}},body:'body',head:'head',legs:[],arms:[],appendages:[],order:['body','head','head-expression']}
 const facing={actors:[actor],shadow:{x:0,y:0,width:25,height:10}}
 return{id,name:'fixture',anatomy:'floating',density:6,mapAnchor:[28,20],stridePx:20,motionScale:.7,sourceSwfSha256:'0'.repeat(64),facings:{'down-right':facing,'down-left':facing,'up-left':facing,'up-right':facing}}
}
const module=implementation as unknown as{Character25Player:new(rig:Character25Rig,textures:Map<string,Texture>,map?:boolean)=>{
 view:{x:number,y:number,children:unknown[],visible:boolean};action:string;finished:boolean;gaitDistance:number|null;
 setPose:(facing:string,moving:boolean)=>void;setReaction:(name:string|null)=>void;setWorldPosition:(x:number,y:number)=>void;
 update:(delta:number)=>void;destroy:()=>void
}}

it('uses its own source clock and actual native texture dimensions at the map anchor',()=>{
 expect(typeof module.Character25Player).toBe('function')
 const p=new module.Character25Player(rig(8),new Map([['head.png',Texture.WHITE],['body.png',Texture.WHITE]]),true)
 expect([p.view.x,p.view.y]).toEqual([28,20]);expect(p.action).toBe('neutral')
 const head=p.view.children.find(c=>c instanceof Sprite&&c.label==='a/head')as Sprite
 expect(head.width).toBeCloseTo(20);expect(head.height).toBeCloseTo(20)
 p.setReaction('hurt');p.update(1099);expect(p.finished).toBe(false);p.update(1);expect(p.finished).toBe(true)
 p.destroy()
})
it('stops motion at zero delta and updates gait from actual map displacement',()=>{
 expect(typeof module.Character25Player).toBe('function')
 const p=new module.Character25Player(rig(),new Map([['head.png',Texture.WHITE],['body.png',Texture.WHITE]]))
 p.setPose('down-right',true);p.setWorldPosition(0,0);p.setWorldPosition(5.6,4)
 expect(p.gaitDistance).toBeCloseTo(Math.hypot(5.6,4))
 const before=p.view.children.filter(c=>c instanceof Sprite).map(c=>[c.x,c.y,c.rotation,c.alpha])
 p.update(0);expect(p.view.children.filter(c=>c instanceof Sprite).map(c=>[c.x,c.y,c.rotation,c.alpha])).toEqual(before)
 p.setPose('up-left',false);p.setReaction(null);p.update(0);expect(p.action).toBe('neutral');p.destroy()
})
it('keeps real A-Niu foot positions continuous at start, stop and a facing change',()=>{
 const rig=actualRig.characters[0]as unknown as Character25Rig
 const textures=new Map(actualRig.runtimeImages.map(p=>[p.url,Texture.WHITE]))
 const p=new implementation.Character25Player(rig,textures)
 const feet=()=>p.view.children.filter(c=>c instanceof Sprite&&/Foot$/.test(c.label)).map(c=>[c.label,c.x,c.y])
 p.setWorldPosition(0,0);const standing=feet();p.setPose('down-right',true);p.update(0)
 expect(feet()).toEqual(standing)
 for(let i=1;i<=15;i++){p.update(16);p.setWorldPosition(i*1.1,i*.8)}
 const beforeStop=feet();p.setPose('down-right',false);p.update(0);expect(feet()).toEqual(beforeStop)
 p.setPose('down-left',false);p.update(0);expect(feet()).toEqual(beforeStop)
 p.update(250)
 for(const leg of rig.facings['down-left'].actors[0]!.legs){const f=feet().find(p=>p[0]==='main/'+leg.tip)!;const rest=rig.facings['down-left'].actors[0]!.joints[leg.end]!;expect(f[1]).toBeCloseTo(rest[0],7);expect(f[2]).toBeCloseTo(rest[1],7)}
 p.destroy()
})
it('does not turn the final subpixel root correction at a stopped cell into a foot teleport',()=>{
 const rig=actualRig.characters[0]as unknown as Character25Rig,p=new implementation.Character25Player(rig,new Map(actualRig.runtimeImages.map(p=>[p.url,Texture.WHITE])))
 p.setWorldPosition(0,0);p.setPose('down-right',true);p.update(100);p.setWorldPosition(20,14)
 const world=(x:number,y:number)=>p.view.children.filter(c=>c instanceof Sprite&&/Foot$/.test(c.label)).map(c=>[c.x+x,c.y+y])
 p.setPose('down-right',false);p.update(0);const before=world(20,14);p.setWorldPosition(20.4,14.3)
 world(20.4,14.3).forEach((v,i)=>{expect(v[0]).toBeCloseTo(before[i]![0]!,8);expect(v[1]).toBeCloseTo(before[i]![1]!,8)})
 p.destroy()
})
it('holds the settled pose while the next dice animation has not moved the real root yet',()=>{
 const rig=actualRig.characters[0]as unknown as Character25Rig,p=new implementation.Character25Player(rig,new Map(actualRig.runtimeImages.map(p=>[p.url,Texture.WHITE])))
 p.setWorldPosition(0,0);p.setPose('down-right',true)
 for(let i=1;i<=12;i++){p.update(16);p.setWorldPosition(i*1.1,i*.8)}
 p.setPose('down-right',false);p.update(400)
 const pose=()=>p.view.children.filter(c=>c instanceof Sprite&&c.visible).map(c=>[c.label,c.x,c.y,c.rotation])
 const before=pose();p.setPose('down-right',true);p.update(300)
 expect(pose()).toEqual(before);p.destroy()
})
