/* Fixed masters and source motion. Original-profile assets are not modified. */
window.ContinuousRenderer=(()=>{
 let config;const textures=new Map(),silhouettes=new Map();
 const clamp=x=>Math.max(0,Math.min(1,x));
 const mix=(a,b,t)=>a+(b-a)*t;
 function track(c,f){
  const i=Math.min(c.track.length-1,Math.floor(f)),a=c.track[i],b=c.track[Math.min(i+1,c.track.length-1)],t=f-i,q={};
  for(const k of ['x','y','w','h','angle','door'])q[k]=mix(a[k],b[k],t);
  q.flare=a.flare;q.hatch=a.hatch&&b.hatch?a.hatch.map((x,i)=>mix(x,b.hatch[i],t)):a.hatch;return q;
 }
 function picture(ctx,key,x,y,w,h,angle=0,door=0){
  const radians=angle*Math.PI/180,co=Math.cos(radians),si=Math.sin(radians);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const [u,v]of silhouettes.get(key)){const px=u*w,py=v*h,rx=px*co-py*si,ry=px*si+py*co;x0=Math.min(x0,rx);x1=Math.max(x1,rx);y0=Math.min(y0,ry);y1=Math.max(y1,ry)}
  ctx.save();ctx.translate(x,y);ctx.scale(w/(x1-x0),h/(y1-y0));ctx.translate(-(x0+x1)/2,-(y0+y1)/2);ctx.rotate(radians);
  const image=textures.get(key),r=[.37,.78,.13,.18],px=(r[0]-.5)*w,py=(r[1]-.5)*h,pw=r[2]*w,ph=r[3]*h,dx=-door*w*.115;
  if(door>.005){
   ctx.fillStyle=key==='police'?'#112c65':'#365878';ctx.beginPath();ctx.roundRect(px,py,pw,ph,2);ctx.fill();
   ctx.save();ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);ctx.roundRect(px,py,pw,ph,2);ctx.clip('evenodd');ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();
   ctx.save();ctx.beginPath();ctx.roundRect(px+dx,py,pw,ph,2);ctx.clip();ctx.drawImage(image,-w/2+dx,-h/2,w,h);ctx.restore();
  }else ctx.drawImage(image,-w/2,-h/2,w,h);
  ctx.restore();
 }
 function flare(ctx,f,t){
  if(!f)return;ctx.save();const [a,b,c,d,x,y]=f.matrix;ctx.transform(a,b,c,d,x,y);ctx.globalAlpha=f.alpha*(.75+.25*Math.cos(t*14));
  const g=ctx.createRadialGradient(34.5,47,4,34.5,47,44);g.addColorStop(0,'rgba(255,248,110,0)');g.addColorStop(.45,'#fff5a3');g.addColorStop(.7,'#ffd500');g.addColorStop(1,'rgba(255,196,0,0)');
  ctx.fillStyle=g;ctx.beginPath();for(let i=0;i<26;i++){const a=Math.PI+i*Math.PI/25,r=i%2?23:37,x=34.5+Math.cos(a)*r,y=54+Math.sin(a)*r;(i?ctx.lineTo(x,y):ctx.moveTo(x,y))}ctx.lineTo(54,60);ctx.quadraticCurveTo(34,30,15,60);ctx.closePath();ctx.fill();ctx.restore();
 }
 function vehicle(ctx,id,t,c){
  const q=track(c,Math.min(c.sourceFrames-1,t*30)),key=id==='car1'?'police':'ambulance';
  flare(ctx,q.flare,t);
  picture(ctx,key,q.x,q.y,q.w,q.h,q.angle,id==='car1'?q.door:0);
  if(id==='car2'&&q.hatch&&q.door>.02){
   const [x,y,w,h]=q.hatch,g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#e7f8ff');g.addColorStop(1,'#9eb8ca');
   ctx.save();ctx.fillStyle=g;ctx.strokeStyle='#557688';ctx.lineWidth=.7;ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(5,w/3,h/3));ctx.fill();ctx.stroke();ctx.restore();
  }
  // A deterministic beacon glow preserves one fixed vehicle identity.
  const bx=q.x+(id==='car1'?0:-q.w*.23),by=q.y-q.h*.4;
  ctx.save();ctx.globalCompositeOperation='screen';const pulse=.18+.16*Math.sin(t*12),g=ctx.createRadialGradient(bx,by,0,bx,by,q.w*.14);
  g.addColorStop(0,id==='car1'?'rgba(255,50,20,'+pulse+')':'rgba(255,225,40,'+pulse+')');g.addColorStop(1,'rgba(255,240,80,0)');ctx.fillStyle=g;ctx.fillRect(bx-q.w*.14,by-q.w*.14,q.w*.28,q.w*.28);ctx.restore();
 }
 function panel(ctx,id,c){
  ctx.drawImage(textures.get('panel'),-198,-123,396,243);
  const y=id==='show2'?-40:-45,h=id==='show2'?100:140;
  ctx.fillStyle='#d4ebff';ctx.strokeStyle='#a5c9ee';ctx.lineWidth=.65;ctx.beginPath();ctx.roundRect(-170,y,340,h,7);ctx.fill();ctx.stroke();
 }
 function draw(id,timeMs,canvas,density){
  const c=config.clips[id];density=density||c.density;canvas.width=c.width*density;canvas.height=c.height*density;
  const ctx=canvas.getContext('2d');ctx.setTransform(density,0,0,density,-c.offsetX*density,-c.offsetY*density);ctx.imageSmoothingQuality='high';
  if(timeMs<0||timeMs>=c.sourceFrames/30*1000)return;
  if(id.startsWith('car'))vehicle(ctx,id,timeMs/1000,c);else panel(ctx,id,c);
 }
 async function init(){
  config=await fetch('motion-config.json').then(r=>r.json());
  await Promise.all(Object.entries(config.masters).map(async([key,item])=>{
   const im=new Image();im.src=item.url;await im.decode();const [x,y,w,h]=item.rect,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(im,x,y,w,h,0,0,w,h);textures.set(key,canvas);
   const rgba=ctx.getImageData(0,0,w,h).data,points=[];
   for(let row=0;row<h;row+=2){let left=w,right=-1;for(let col=0;col<w;col++)if(rgba[(row*w+col)*4+3]>64){left=Math.min(left,col);right=Math.max(right,col)}if(right>=left){points.push([left/w-.5,row/h-.5],[(right+1)/w-.5,row/h-.5])}}
   silhouettes.set(key,points);
  }));return config;
 }
 return {init,draw,get config(){return config}};
})();
