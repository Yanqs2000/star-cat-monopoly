const names={2:'财神',3:'穷神',4:'福神',5:'衰神',9:'恶犬',10:'天使',11:'恶魔',12:'交警',13:'流氓',14:'小偷',15:'乞丐',23:'失物招领'};
const base='../characters-22-23/';
const [original,npc,activities]=await Promise.all([fetch('./original.json'),fetch(base+'npc-22-runtime.json'),fetch(base+'npc-23-runtime.json')].map(async p=>(await p).json()));
const images=new Map(),motions=new Map(npc.motion.map(m=>[m.id,m])),allFrames=[...original.world,...original.activities,...npc.worldClips,...activities.activityClips].flatMap(c=>c.frames);
const urls=[...new Set(allFrames.map(f=>f.url))];let cursor=0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<urls.length){const url=urls[cursor++],im=new Image();im.src='../../modern/'+url;await im.decode();images.set(url,im)}}));
const visible=new Set(),cards=[];
const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target)),{rootMargin:'150px'});
for(const clip of npc.worldClips){
 const id=Number(clip.id.slice(4)),card=document.createElement('article');card.className='card';card.dataset.npc=String(id);
 card.innerHTML='<div class="caption"><b>'+names[id]+'</b><span class="small">'+clip.id+'</span></div><div class="labels"><span>原版导出</span><span>高清</span></div><canvas width="840" height="420"></canvas>';
 document.querySelector('#npcs').append(card);observer.observe(card);
 cards.push({card,clip,before:original.world.find(c=>c.id===clip.id),canvas:card.querySelector('canvas')});
}
for(const clip of activities.activityClips){
 const before=original.activities.find(c=>c.id===clip.id),card=document.createElement('article');card.className='card';
 const id=Number(clip.id.split('-').at(-1));
 card.innerHTML='<div class="caption"><b>'+names[id]+'</b></div><div class="labels"><span>原版</span><span>高清</span></div><div class="pair"></div>';
 for(const c of [before,clip]){const im=new Image();im.src='../../modern/'+c.frames[0].url;im.alt=names[id];card.querySelector('.pair').append(im)}
 document.querySelector(clip.id.startsWith('mini')?'#icons':'#traits').append(card);
}
let elapsed=0,paused=false,speed=1,last,intervals=[];
function draw(all=false){
 for(const {card,clip,before,canvas}of cards){
  if(!all&&!visible.has(card))continue;
  const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,840,420);
  const a=before.frames[Math.floor(elapsed*before.fps/1000)%before.frames.length],b=clip.frames[Math.floor(elapsed*clip.fps/1000)%clip.frames.length];
  for(const [i,f]of [a,b].entries()){
   ctx.save();ctx.beginPath();ctx.rect(i*420,0,420,420);ctx.clip();ctx.translate(i*420,0);ctx.scale(2,2);ctx.translate(75,130);
   let dx=0,dy=0;
   if(i===1){
    const m=motions.get(clip.id),q=elapsed*m.outerFps/1000,j=Math.floor(q),p=m.outerTrack[j%m.outerTrack.length],n=m.outerTrack[(j+1)%m.outerTrack.length],t=q-j,mix=k=>p[k]+(n[k]-p[k])*t;
    ctx.save();ctx.translate(mix('shadowX'),mix('shadowY'));ctx.scale(mix('shadowScaleX'),mix('shadowScaleY'));
    const g=ctx.createRadialGradient(0,0,0,0,0,25.25);g.addColorStop(0,'#0009');g.addColorStop(.35,'#0006');g.addColorStop(.72,'#0002');g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(-25.25,-25.25,50.5,50.5);ctx.restore();
    dx=mix('x');dy=mix('y');
   }
   ctx.drawImage(images.get(f.url),f.offsetX+dx,f.offsetY+dy,f.width,f.height);ctx.restore();
  }
 }
 document.querySelector('#time').textContent=(elapsed/1000).toFixed(2)+'s';
 document.querySelector('#clock').value=elapsed%36000;
}
document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'播放':'暂停'};
document.querySelector('#speed').onchange=e=>{speed=+e.target.value};
document.querySelector('#clock').oninput=e=>{elapsed=+e.target.value;paused=true;document.querySelector('#pause').textContent='播放';draw(true)};
function tick(now){if(last!==undefined){if(intervals.length<240)intervals.push(now-last);if(!paused)elapsed+=(now-last)*speed}last=now;draw();requestAnimationFrame(tick)}
document.querySelector('#status').textContent='素材已就绪';draw(true);requestAnimationFrame(tick);
window.CharacterArtworkReview={ready:true,data:{original,npc,activities},cards,images,intervals,setTime(value){elapsed=value;paused=true;draw(true)},get elapsed(){return elapsed}};
