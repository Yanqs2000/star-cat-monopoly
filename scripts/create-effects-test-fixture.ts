import{writeFile}from'node:fs/promises'
import{createGame}from'../src/modern/features/game/setup'
import{createSnapshot}from'../src/modern/features/saves/snapshot'
const game=createGame([1],1);game.players[0]!.position={column:34,row:8};game.players[0]!.direction=1;game.forcedDice[1]=1;game.world.markers={221:7};const stamp='2026-10-28T12:00:00.000Z'
const snapshot=createSnapshot(game,[1],{speed:1,paused:false},stamp,stamp)
await writeFile(new URL('../tests/fixtures/effects-mine-snapshot.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n')

for(const kind of ['self','public'] as const){
 const game=createGame([1,2,3,4],153)
 game.inventories[1]=[9]
 game.players[0]!.position=kind==='self'?{column:24,row:32}:{column:6,row:32}
 game.players[1]!.position={column:24,row:32}
 game.players[2]!.position=kind==='public'?{column:24,row:32}:{column:10,row:10}
 const snapshot=createSnapshot(game,[1,2,3,4],{speed:1,paused:false},stamp,stamp)
 await writeFile(new URL(`../tests/fixtures/effects-missile-${kind}-snapshot.json`,import.meta.url),JSON.stringify(snapshot,null,2)+'\n')
}

{
 const game=createGame([1],1)
 game.activePlayerIndex=1
 game.players[1]!.position={column:34,row:8};game.players[1]!.direction=1
 game.forcedDice[2]=1;game.world.markers={221:1}
 const snapshot=createSnapshot(game,[1],{speed:1,paused:false},stamp,stamp)
 await writeFile(new URL('../tests/fixtures/effects-ai-fog-snapshot.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n')
}
