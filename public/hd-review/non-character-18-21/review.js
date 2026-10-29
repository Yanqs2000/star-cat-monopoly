window.continuousReady=(async()=>{
 const [config,index,data]=await Promise.all([ContinuousRenderer.init(),fetch('runtime-index.json').then(r=>r.json()),fetch('review-data.json').then(r=>r.json())])
 let active=0;const pending=[],images=new Map();
 const load=url=>{
  if(!images.has(url))images.set(url,(async()=>{
   if(active>=6)await new Promise(resolve=>pending.push(resolve));active++;
   try{
    const response=await fetch('/modern/'+url);if(!response.ok)throw new Error('Image fetch: '+url+'; HTTP '+response.status);
    return await createImageBitmap(await response.blob());
   }
   finally{active--;pending.shift()?.()}
  })());return images.get(url)
 }
 const sources=new Map(data.sourceClips.map(c=>[c.id,c])),hd=new Map(index.activityClips.map(c=>[c.id,c]))
 await Promise.all([...sources.values()].flatMap(c=>c.frames.map(f=>load(f.url))))
 await Promise.all(Object.values(data.faces).flatMap(f=>[load(f.frame.url),load(f.hd)]))
 const resolved=new Map();for(const [url,promise]of images)resolved.set(url,await promise)
 const titles={'ludo-dice':'18 · 三骰滚动与落定','show2':'19 · 通用提示框','show-npc4':'19 · 明细提示框','car1':'21 · 警用飞碟','car2':'21 · 救护飞碟'},rows=[]
 for(const [id,title]of Object.entries(titles)){
  const article=document.createElement('article');article.id='item-'+id;article.innerHTML='<h2>'+title+'</h2><p class="frame-label"></p><div class="pair"><div class="view"><span>原版</span><canvas></canvas></div><div class="view"><span>高清</span><canvas></canvas></div></div>';document.getElementById('clips').append(article)
  const [before,after]=article.querySelectorAll('canvas'),source=sources.get(id);for(const canvas of [before,after]){canvas.width=(id.startsWith('car')?800:source.frames[0].width)*2;canvas.height=(id.startsWith('car')?410:source.frames[0].height)*2;canvas.style.width=canvas.width/2+'px'}
  rows.push({id,source,before,after,label:article.querySelector('p'),temp:document.createElement('canvas')})
 }
 const sourceFace=(name,f)=>{const i=Number(name.slice(2));return i===1?2:i===2?4:i===3?f>=17?3:1:i===4?f>=18?5:1:i===6?f>=19?4:1:1}
 function drawDice(ctx,clip,sourceFrame,sampled,modern){
  const base=clip.frames[sampled],origin=clip.frames[0];ctx.save();ctx.translate(-origin.offsetX,-origin.offsetY)
  for(const p of base.placements||[]){
   const name='ludo-'+(Number(p.name.slice(2))<4?'face':'shadow')+'-'+sourceFace(p.name,sourceFrame),face=data.faces[name],f=face.frame;
   ctx.save();ctx.translate(p.x,p.y);ctx.transform(...p.matrix,0,0);ctx.drawImage(resolved.get(modern?face.hd:f.url),f.offsetX,f.offsetY,f.width,f.height);ctx.restore()
  }ctx.restore()
 }
 function text(ctx,id,frame,source){
  if(!id.startsWith('show'))return;ctx.save();ctx.fillStyle='#122844';ctx.textBaseline='top'
  for(const field of frame.fields){const value=field.variable.endsWith('1')?'原版提示 · 高清重制':field.variable.endsWith('2')?'时序、文字位置与操作保持一致':field.variable.endsWith('3')?'奖券':'100';ctx.save();ctx.transform(...field.matrix,field.x-source.offsetX,field.y-source.offsetY);ctx.font=field.fontSize+'px "Songti SC",serif';ctx.textAlign=field.align===2?'center':'left';ctx.fillText(value,field.align===2?field.width/2:0,0,field.width);ctx.restore()}ctx.restore()
 }
 function render(ms){
  ms=Math.max(0,ms)
  for(const row of rows){
   const c=row.source,duration=c.frames.length/30*1000,time=ms%(duration+650),f=Math.min(c.frames.length-1,Math.floor(time*30/1000)),frame=c.frames[f],sample=Math.min(hd.get(row.id).frames.length-1,Math.floor(time*hd.get(row.id).fps/1000))
   for(const [canvas,modern]of [[row.before,false],[row.after,true]]){
    const ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,canvas.width/2,canvas.height/2)
    if(time>=duration)continue
    if(row.id==='ludo-dice'){drawDice(ctx,modern?hd.get(row.id):c,f+1,modern?sample:f,modern);continue}
    if(modern){ContinuousRenderer.draw(row.id,time,row.temp);const cfg=config.clips[row.id];ctx.drawImage(row.temp,row.id.startsWith('car')?cfg.offsetX:0,row.id.startsWith('car')?cfg.offsetY:0,cfg.width,cfg.height)}
    else ctx.drawImage(resolved.get(frame.url),row.id.startsWith('car')?frame.offsetX:0,row.id.startsWith('car')?frame.offsetY:0,frame.width,frame.height)
    text(ctx,row.id,frame,c.frames[0])
   }
   row.label.textContent=(duration/1000).toFixed(3)+' 秒 · 原帧 '+(f+1)+' / 高清显示采样 '+(sample+1)+(row.id.startsWith('show')?' · 原版静态保持':'')
  }
 }
 let elapsed=0,playing=true,last=performance.now(),speed=1
 const pause=document.getElementById('pause'),slider=document.getElementById('scrub')
 pause.onclick=()=>{playing=!playing;pause.textContent=playing?'暂停':'继续';last=performance.now()}
 document.getElementById('restart').onclick=()=>{elapsed=0;last=performance.now();render(elapsed)}
 document.getElementById('speed').onchange=e=>speed=Number(e.target.value)
 document.getElementById('background').onchange=e=>document.body.className=e.target.value
 slider.oninput=()=>{playing=false;pause.textContent='继续';elapsed=Number(slider.value)*4;render(elapsed)}
 window.reviewControl={seek(ms){playing=false;pause.textContent='继续';elapsed=ms;render(ms)},play(){playing=true;pause.textContent='暂停';last=performance.now()},get elapsed(){return elapsed}}
 function tick(now){if(playing)elapsed+=Math.max(0,now-last)*speed;last=now;render(elapsed);document.getElementById('clock').textContent=(elapsed/1000).toFixed(2)+' s';if(playing)slider.value=elapsed%4000/4;requestAnimationFrame(tick)}
 render(0);requestAnimationFrame(tick);return{config,index,data}
})()
