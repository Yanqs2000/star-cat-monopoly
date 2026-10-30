import {writeFile}from'node:fs/promises'
import rules from'../src/modern/data/rules.json'
import{createGame}from'../src/modern/features/game/setup'
import{createSnapshot}from'../src/modern/features/saves/snapshot'
import{getCardRecord}from'../src/modern/features/game/direct-cards'
import{roll,step}from'../src/modern/features/game/turns'
import type{Direction}from'../src/modern/features/game/types'
for(const scenario of ['world','npc9','npc12','npc13','npc14','npc15','lost23']){
 const g=createGame([1,2,3,4],1,1),target=getCardRecord(scenario==='lost23'?159:221)!.position
 const entry=([[1,1],[-1,1],[-1,-1],[1,-1]]as const).map(([dx,dy],i)=>({position:{column:target.column-dx,row:target.row-dy},direction:(i+1)as Direction})).find(p=>rules.roadCells.some(c=>c.coordinate.column===p.position.column&&c.coordinate.row===p.position.row))!
 g.players[0]!.position=entry.position;g.players[0]!.direction=entry.direction;g.forcedDice[1]=1
 if(scenario!=='world')g.world.markers=scenario==='lost23'?{}:{221:Number(scenario.slice(3))}
 const arrival=step(roll(g,1));if(JSON.stringify(arrival.players[0]!.position)!==JSON.stringify(target))throw Error('invalid fixture predecessor')
 const stamp='2026-10-30T00:00:00.000Z',snapshot=createSnapshot(g,[1,2,3,4],{speed:1,paused:false},stamp,stamp)
 await writeFile(new URL('../tests/fixtures/character-22-24-'+scenario+'.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n')
}
