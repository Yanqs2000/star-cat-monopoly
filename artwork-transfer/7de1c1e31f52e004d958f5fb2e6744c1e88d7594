import { describe, expect, it } from 'vitest'
import { AudioSession, sceneTrack, soundForEvent, type AudioPort } from '../../src/modern/features/game/audio'
import { beginCarnival } from '../../src/modern/features/game/carnival'
import { beginLudo } from '../../src/modern/features/game/ludo'
import { randomInt } from '../../src/modern/features/game/random'
import { createGame } from '../../src/modern/features/game/setup'
class Port implements AudioPort {
 src='';volume=1;loop=false;currentTime=0;paused=true;fail=false;plays=0
 listeners:Record<string,()=>void>={}
 play(){this.plays++;this.paused=false;return this.fail?Promise.reject(new Error('404')):Promise.resolve()}
 pause(){this.paused=true} load(){} addEventListener(name:string,f:()=>void){this.listeners[name]=f}
}
describe('原声音播放和规则隔离',()=>{
 it('重新开局停止上一局未播放完的胜利音效和背景',()=>{
  const ports:Port[]=[];const audio=new AudioSession(()=>{const p=new Port();ports.push(p);return p})
  audio.setTracks('backmusic1',null);audio.unlock();audio.effect('sn_9');audio.startMatch()
  expect(ports.every(p=>p.paused)).toBe(true);audio.destroy()
 })
 it('跨曲后的素材恢复保留当前背景曲，不回到开局曲重播',()=>{
  const ports:Port[]=[];const audio=new AudioSession(()=>{const p=new Port();ports.push(p);return p})
  audio.startMatch();audio.restoreTracks('backmusic5',null);audio.unlock()
  ports[0]!.listeners.ended!();expect(ports[1]!.src).toContain('backmusic1.mp3')
  audio.setPaused(true);audio.restoreTracks('backmusic5',null);audio.setPaused(false)
  expect(ports).toHaveLength(2);expect(ports[1]!.src).toContain('backmusic1.mp3');audio.destroy()
 })
 it('循环衔接背景，小游戏压低背景20%，退出恢复；相同状态不会重启',()=>{
  const ports:Port[]=[];const audio=new AudioSession(()=>{const p=new Port();ports.push(p);return p})
  audio.setTracks('backmusic5',null);expect(ports).toHaveLength(0);audio.unlock()
  expect(ports[0]!.src).toContain('backmusic5.mp3');expect(ports[0]!.plays).toBe(1)
  audio.setTracks('backmusic5','gamemusic');expect(ports[0]!.volume).toBe(.2);expect(ports[1]!.loop).toBe(true)
  audio.setTracks('backmusic5','gamemusic');expect(ports[0]!.plays).toBe(1)
  audio.setTracks('backmusic5',null);expect(ports[1]!.paused).toBe(true);expect(ports[0]!.volume).toBe(1)
  ports[0]!.listeners.ended!();expect(ports.at(-1)!.src).toContain('backmusic1.mp3');audio.destroy()
 })
 it('暂停保持播放位置，恢复不新建播放器；静音不停止业务',()=>{
  const ports:Port[]=[];const audio=new AudioSession(()=>{const p=new Port();ports.push(p);return p})
  audio.setTracks('backmusic1',null);audio.unlock();ports[0]!.currentTime=12
  audio.setPaused(true);expect(ports[0]!.paused).toBe(true);audio.setPaused(false)
  expect(ports).toHaveLength(1);expect(ports[0]!.currentTime).toBe(12)
  audio.setMuted(true);expect(ports[0]!.volume).toBe(0);audio.destroy();expect(ports[0]!.paused).toBe(true)
 })
 it('音效失败只提示，重试不会补播失败的已消费音效',async()=>{
  const ports:Port[]=[];const errors:string[]=[];const audio=new AudioSession(()=>{const p=new Port();ports.push(p);return p},e=>{if(e)errors.push(e)})
  audio.unlock();audio.effect('sn_4');ports[0]!.listeners.error!();audio.retry()
  expect(ports).toHaveLength(1);expect(ports[0]!.plays).toBe(1);expect(errors).toHaveLength(1);audio.destroy()
 })
 it('保存原小游戏已经消耗的音乐value，而非再抽样',()=>{
  const draw=randomInt(123,3)
  expect(beginCarnival(12,123)).toMatchObject({rngState:draw.nextState,game:{musicIndex:draw.value}})
  expect(beginLudo(200,123)).toMatchObject({rngState:draw.nextState,game:{musicIndex:draw.value}})
 })
 it('月份和小游戏用对应原曲，事件声按原callsound，不给神灵添加新音效',()=>{
  const game=createGame([1],1);game.interaction={kind:'monthly-settlement',playerId:1,entries:[]}
  expect(sceneTrack(game)).toBe('monthmusic')
  game.interaction={kind:'carnival',playerId:1,game:beginCarnival(1,123).game}
  expect(sceneTrack(game)).toBe(['gamemusic','startmusic1','startmusic2'][game.interaction.game.musicIndex])
  expect(soundForEvent({kind:'luck',playerId:1,amount:-1})).toBe('sn_6')
  expect(soundForEvent({kind:'tickets',playerId:1,amount:10})).toBe('sn_4')
  expect(soundForEvent({kind:'world',playerId:1,worldEvent:{kind:'god-encountered',npcId:5,playerId:1,affectedCellIds:[],affectedPlayerIds:[1],cardIds:[]}})).toBeNull()
 })
})
