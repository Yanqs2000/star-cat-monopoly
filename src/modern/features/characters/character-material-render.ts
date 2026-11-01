import {Application,Assets,Texture,Sprite,Rectangle} from 'pixi.js'
import {Character25Player} from './characters-25'
import type {Character25Rig} from './characters-25-types'

export interface MaterialRigIndex{characters:Character25Rig[];runtimeImages:{url:string}[]}

/** Offline exports use the same articulated player, with native clocks. */
export async function createCharacterMaterialRenderer(mapIndex:MaterialRigIndex,carnivalIndex:MaterialRigIndex){
 const app=new Application();await app.init({width:800,height:600,resolution:1,backgroundAlpha:0,antialias:true,preference:'webgl',autoStart:false})
 const textures=new Map<string,Texture>()
 await Promise.all([...mapIndex.runtimeImages,...carnivalIndex.runtimeImages].map(async p=>textures.set(p.url,await Assets.load<Texture>('/modern/'+p.url))))
 const map=new Character25Player(mapIndex.characters[0]!,textures,false,false)
 const carnival=new Character25Player(carnivalIndex.characters[0]!,textures,false,false)
 const championRig=structuredClone(mapIndex.characters[0]!.id===6?mapIndex.characters[0]!:carnivalIndex.characters[0]!)
 const source=mapIndex.characters[0]!.facings['down-right'].actors[0]!
 for(const actor of championRig.facings['down-right'].actors){
  const happy=source.parts['head-happy']
  if(happy){const factor=actor.parts[actor.head]!.width/happy.width;actor.parts[actor.head]={...happy,width:happy.width*factor,height:happy.height*factor,pivot:[happy.pivot[0]*factor,happy.pivot[1]*factor]}}
  for(const arm of actor.arms){const root=actor.joints[arm.root]!;actor.joints[arm.end]=[root[0]+(arm.name==='left'?-6:6),root[1]+4]}
 }
 const champion=new Character25Player(championRig,textures,false,false)
 app.stage.addChild(map.view,carnival.view,champion.view)
 const raster=(player:Character25Player,frame:Rectangle,resolution=4)=>{
  for(const child of player.view.children)if(!(child instanceof Sprite))child.visible=false
  return app.renderer.extract.base64({target:player.view,frame,resolution,format:'png'})
 }
 return{
  async carnival(pose:1|2|3,frame=0){
   carnival.clearWorldPosition();carnival.setPose(pose===1?'down-right':pose===2?'down-left':'up-right',pose!==1);carnival.setReaction(pose===1?'neutral':null)
   if(pose!==1){carnival.setWorldPosition(0,0);for(let sample=1;sample<=frame;sample++)carnival.setWorldPosition((pose===2?-1:1)*sample*2,0)}
   carnival.update(0);return raster(carnival,new Rectangle(-70,-125,140,140))
  },
  async champion(){champion.setPose('down-right',false);champion.setReaction('neutral');champion.update(0);return raster(champion,new Rectangle(-70,-130,140,145))},
  async thumbnail(){map.setPose('down-right',false);map.setReaction('neutral');map.update(0);return raster(map,new Rectangle(-50,-110,100,120),6)},
  destroy(){map.destroy();carnival.destroy();champion.destroy();app.destroy()}
 }
}
