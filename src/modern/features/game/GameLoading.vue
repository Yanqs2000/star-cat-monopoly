<script setup lang="ts">
import { computed } from 'vue'
import characterIndex from '../../../../public/modern/assets/characters/index.json'
import { profileAssetUrl, type AssetProfile } from '../assets/profiles'
import{character25ThumbnailUrl}from'../characters/characters-25-registry'
import type { AnimationProgress } from './animation-preload'
const props=defineProps<{progress:AnimationProgress;stage:string;players:{characterId:number;name:string}[];profile:AssetProfile}>()
const percent=computed(()=>props.progress.total?Math.floor(props.progress.completed/props.progress.total*100):0)
const portrait=(id:number)=>import.meta.env.BASE_URL+(character25ThumbnailUrl(id,props.profile)??profileAssetUrl(characterIndex.characters.find(character=>character.id===id)!.manifestUrl.replace(/manifest\.json$/, 'walk/down-right/1.png'),props.profile))
</script>
<template>
 <section class="loading-card" aria-label="准备本局游戏">
  <span class="loading-eyebrow">明日天空城 · 即将出发</span><h2>准备好，一起出发</h2>
  <div class="loading-players"><figure v-for="player in players" :key="player.characterId"><img :src="portrait(player.characterId)" alt=""><figcaption>{{player.name}}</figcaption></figure></div>
  <div class="loading-status"><strong>{{stage}}</strong><b>{{percent}}%</b></div>
  <progress aria-label="开局素材加载进度" :max="progress.total||1" :value="progress.completed" />
  <p>{{progress.total?`已准备 ${progress.completed} / ${progress.total} 张动画画面`:'正在读取本局素材清单…'}}</p>
  <small>正在一次准备场景与本局角色动画，完成后自动进入棋盘。</small>
 </section>
</template>
<style scoped>
.loading-card{box-sizing:border-box;width:min(560px,100%);padding:28px 32px;border:3px solid #f8fdff;border-radius:24px;background:radial-gradient(ellipse at 50% 38%,#fff9d9aa,transparent 55%),linear-gradient(#effaff,#c6e6ff);box-shadow:0 0 0 2px #399ce9,0 16px 50px #164b8155;color:#194f7b;text-align:left;font:14px/1.5 system-ui,"PingFang SC",sans-serif}.loading-eyebrow{color:#5085ab;font-size:11px;letter-spacing:.1em}.loading-card h2{font-size:27px;margin:4px 0 20px;color:#1467b2}.loading-players{display:flex;justify-content:space-around;gap:12px;padding:15px 10px 20px;border-radius:16px;background:#ffffff70;border:1px solid #b8d9ef;margin-bottom:22px}.loading-players figure{margin:0;text-align:center;min-width:0}.loading-players img{width:64px;height:78px;object-fit:contain;filter:drop-shadow(0 5px 3px #69a6cf44)}.loading-players figcaption{font-size:12px;font-weight:700}.loading-status{display:flex;justify-content:space-between;gap:12px;font-size:13px}.loading-status b{font-size:20px;color:#1678bc;font-variant-numeric:tabular-nums}progress{width:100%;height:15px;margin:8px 0 0;border:1px solid #99c6e7;border-radius:20px;overflow:hidden;background:#b6d9f1;accent-color:#238fda}progress::-webkit-progress-bar{background:#b6d9f1}progress::-webkit-progress-value{background:linear-gradient(90deg,#287dcc,#57bdff)}.loading-card p{font-size:12px;color:#3f7299;margin:7px 0 15px}.loading-card small{font-size:11px;color:#5a83a2}@media(max-width:480px){.loading-card{padding:20px 16px}.loading-card h2{font-size:23px}.loading-players{gap:6px;padding:10px 4px}.loading-players img{width:48px;height:64px}.loading-players figcaption{font-size:10px}.loading-status{font-size:12px}}
</style>
