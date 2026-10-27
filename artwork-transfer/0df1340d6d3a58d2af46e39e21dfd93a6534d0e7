import {AudioSession} from '../../src/modern/features/game/audio'
const result=document.querySelector<HTMLElement>('#result')!,ports:HTMLAudioElement[]=[]
const audio=new AudioSession(()=>{const a=new Audio();a.controls=true;ports.push(a);document.querySelector('#ports')!.append(a);return a},message=>{if(message)result.textContent=message})
for(const [id,run] of Object.entries({play:()=>{audio.setTracks('backmusic5',null);audio.unlock()},scene:()=>audio.setScene('monthmusic'),leave:()=>audio.setScene(null),pause:()=>audio.setPaused(true),resume:()=>audio.setPaused(false),mute:()=>audio.setMuted(true),stop:()=>audio.stop()}))document.querySelector<HTMLButtonElement>('#'+id)!.onclick=run
const manifest=await(await fetch('/assets/audio/manifest.json')).json()
let decoded=0
for(const item of manifest.sounds){const a=new Audio();a.preload='metadata';a.src='/'+item.url;a.onloadedmetadata=()=>{decoded++;result.textContent=`原MP3解码 ${decoded}/19`};a.onerror=()=>result.textContent=`解码失败 ${item.id}`}
window.addEventListener('beforeunload',()=>audio.destroy())
