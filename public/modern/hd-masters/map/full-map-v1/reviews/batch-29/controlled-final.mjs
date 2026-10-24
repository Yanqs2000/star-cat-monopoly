import {chromium} from '/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.worktrees/non-character-assets/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const OUT=process.cwd()+'/.analysis-cache/map-continuation-20261023-batch29';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const routes=[
{name:'south-bridge',points:[[25,37],[24,38],[23,39],[22,40],[21,41]]},
{name:'west-edge-turn',points:[[2,26],[1,27],[0,28],[1,29],[2,30]]},
{name:'east-edge-turn',points:[[38,12],[39,13],[40,14],[39,15],[38,16]]},
{name:'north-gate',points:[[17,3],[18,2],[19,1]]},
{name:'north-west-turn',points:[[14,6],[13,7],[12,8],[11,9],[10,10]]},
{name:'south-west-turn',points:[[6,34],[7,35],[8,36],[9,35],[10,34]]}
];
const logs=[];
for(const profile of ['hd','original']){
 const page=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:5198/modern.html');await page.setContent('<style>body{margin:0;background:#123}#board{width:1200px;height:900px}</style><div id="board"></div>');
 await page.evaluate(async profile=>{
 const [{createMapScene},{parseAssetManifest},{parseReactionManifest},{loadHdMapArtwork},map]=await Promise.all([import('/src/modern/features/map/MapScene.ts'),import('/src/modern/features/characters/assets.ts'),import('/src/modern/features/characters/reactions.ts'),import('/src/modern/features/assets/hd-map-art.ts'),import('/src/modern/data/map.json')]);
 const manifest=parseAssetManifest(await fetch('/assets/manifest.json').then(r=>r.json()));const reactions=parseReactionManifest(await fetch('/assets/characters/1/reactions/manifest.json').then(r=>r.json()));const controller=new AbortController();const art=profile==='hd'?await loadHdMapArtwork(manifest.map,controller.signal):undefined;
 window.review=await createMapScene(document.querySelector('#board'),map.default,manifest,{signal:controller.signal,onFrame:()=>{},assetProfile:profile,playerManifests:[{playerId:1,characterId:1,manifest,reactions}],mapBase:art?.baseMap,mapRegions:art?.regions,textureResolutions:Object.fromEntries((art?.regions??[]).map(r=>[r.url,r.pixelDensity])),onAssetError:e=>{throw e}});
 window.review.showMarkers(false);window.review.setSpeed(1);window.pose=(point,direction,moving)=>({playerId:1,characterId:1,position:{column:point[0],row:point[1]},direction,moving,active:true,visible:true,godId:null});
 },profile);
 for(const r of routes){
  const log={profile,name:r.name,points:r.points,frames:[]};let direction=1;
  await page.evaluate(({points})=>{const s=window.review;s.setPlayers([window.pose(points[0],1,false)]);s.follow({column:points[0][0],row:points[0][1]});},{points:r.points});await page.waitForTimeout(600);
  for(let i=1;i<r.points.length;i++){
   const from=r.points[i-1],to=r.points[i];const dx=to[0]-from[0],dy=to[1]-from[1];direction=dx>0?(dy>0?1:4):(dy>0?2:3);
   await page.evaluate(({from,to,direction})=>{const s=window.review;s.setPlayers([window.pose(from,direction,true)]);s.transitionPlayer({playerIndex:0,from:{column:from[0],row:from[1]},to:{column:to[0],row:to[1]},direction,durationMs:700});},{from,to,direction});
   await page.waitForTimeout(300);if(i===2||r.name==='north-gate'){const path=`${OUT}/${profile}-controlled-${r.name}-step${i}-moving.png`;await page.screenshot({path});log.frames.push({path,stage:'moving',from,to,direction});}
   await page.waitForTimeout(550);await page.evaluate(({to,direction})=>window.review.setPlayers([window.pose(to,direction,false)]),{to,direction});
   if(i===2||i===r.points.length-1){const path=`${OUT}/${profile}-controlled-${r.name}-step${i}-arrival.png`;await page.screenshot({path});log.frames.push({path,stage:'arrival',from,to,direction});}
  }
  logs.push(log);await fs.writeFile(`${OUT}/controlled-results.json`,JSON.stringify({routes:logs,errors},null,2));
 }
 await page.close();console.log(profile,errors);
}
await browser.close();
