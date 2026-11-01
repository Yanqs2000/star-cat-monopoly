import{Application,Assets,Texture,Sprite,Rectangle}from'pixi.js'
import mapIndex from'../../data/aniu-map-rig.json'
import carnivalIndex from'../../data/aniu-carnival.json'
import{Character25Player}from'./characters-25'
import type{Character25Rig}from'./characters-25-types'

/** Reproducible raster exports from the same rig used in the actual game. */
export async function createAniuMaterialRenderer(){
 const app=new Application();await app.init({width:800,height:600,resolution:1,backgroundAlpha:0,antialias:true,preference:'webgl',autoStart:false})
 const textures=new Map<string,Texture>()
 await Promise.all([...mapIndex.runtimeImages,...carnivalIndex.runtimeImages].map(async p=>textures.set(p.url,await Assets.load<Texture>('/modern/'+p.url))))
 const map=new Character25Player(mapIndex.characters[0]as unknown as Character25Rig,textures,false,false)
 const carnival=new Character25Player(carnivalIndex.characters[0]as unknown as Character25Rig,textures,false,false)
 const championRig=structuredClone(carnivalIndex.characters[0])as unknown as Character25Rig
 for(const a of championRig.facings['down-right'].actors)for(const arm of a.arms){
  const root=a.joints[arm.root]!;a.joints[arm.end]=[root[0]+(arm.name==='left'?-1.5:1.5),-14]
 }
 const champion=new Character25Player(championRig,textures,false,false)
 app.stage.addChild(map.view,carnival.view,champion.view)
 const spritesOnly=(player:Character25Player)=>{for(const c of player.view.children)if(!(c instanceof Sprite))c.visible=false}
 const raster=(player:Character25Player,frame:Rectangle,resolution=4)=>{spritesOnly(player);return app.renderer.extract.base64({target:player.view,frame,resolution,format:'png'})}
 return{
  async carnival(pose:1|2|3,frame=0){
   carnival.clearWorldPosition();carnival.setPose(pose===1?'down-right':pose===2?'down-left':'up-right',pose!==1);carnival.setReaction(pose===1?'neutral':null)
   if(pose!==1){carnival.setWorldPosition(0,0);carnival.setWorldPosition((pose===2?-1:1)*frame*2,0)}
   carnival.update(0);return raster(carnival,new Rectangle(-70,-118,140,132))
  },
  async champion(){champion.setPose('down-right',false);champion.setReaction('neutral');champion.update(0);return raster(champion,new Rectangle(-65,-120,130,130))},
  async thumbnail(){map.setPose('down-right',false);map.setReaction('neutral');map.update(0);return raster(map,new Rectangle(-42,-96,84,104),6)},
  async svg(source:string,width:number,height:number){
   const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}))
   try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d')!.drawImage(image,0,0,width,height);return canvas.toDataURL('image/png')}
   finally{URL.revokeObjectURL(url)}
  },
  destroy(){map.destroy();carnival.destroy();champion.destroy();app.destroy()}
 }
}
