import{chromium}from'@playwright/test';import{spawn}from'node:child_process';import{once}from'node:events';import{writeFile}from'node:fs/promises';
const out='public/hd-review/non-character-18-21',browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const ffmpeg=spawn('/opt/homebrew/bin/ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',out+'/comparison.mp4']);let stderr='';ffmpeg.stderr.on('data',b=>stderr+=b);const finished=once(ffmpeg,'close');
try{const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(process.env.CONTINUOUS_REVIEW_URL||'http://127.0.0.1:64867/hd-review/non-character-18-21/');await page.evaluate(()=>continuousReady);
 for(let frame=0;frame<240;frame++){
  const png=await page.evaluate(ms=>{
   reviewControl.seek(ms);const canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1000;const ctx=canvas.getContext('2d');ctx.fillStyle='#142b39';ctx.fillRect(0,0,1440,1000);ctx.fillStyle='#edf7ff';ctx.font='bold 27px system-ui';ctx.fillText('18 / 19 / 21 · 原版与高清动画对照',28,40);ctx.font='15px system-ui';ctx.fillStyle='#b6d3e4';ctx.fillText('20 已按用户确认后移；19 保留原版静态停留；此视频为受控素材回放',28,69);
   for(const[id,title,i]of[['ludo-dice','18 三骰滚动',0],['show2','19 提示框',1],['car1','21 警用飞碟',2],['car2','21 救护飞碟',3]]){
    const x=20+i%2*710,y=94+Math.floor(i/2)*444;ctx.fillStyle='#284655';ctx.fillRect(x,y,690,424);ctx.fillStyle='#e8f6ff';ctx.font='bold 21px system-ui';ctx.fillText(title,x+14,y+29);const views=document.querySelectorAll('#item-'+id+' canvas');
    for(let j=0;j<2;j++){const left=x+10+j*338,top=y+66,w=324,h=340,source=views[j],scale=Math.min(w/source.width,h/source.height);ctx.fillStyle='#9bb7c5';ctx.fillRect(left,top,w,h);ctx.fillStyle='#e4f2ff';ctx.font='14px system-ui';ctx.fillText(j?(id==='show2'?'高清 · 静态保持':'高清 · 60Hz显示采样'):'原版',left,y+55);ctx.drawImage(source,left+(w-source.width*scale)/2,top+(h-source.height*scale)/2,source.width*scale,source.height*scale)}
   }ctx.font='14px system-ui';ctx.fillStyle='#b6d3e4';ctx.fillText('固定母版 + 连续运动；点数、停留时间与游戏业务保持原语义 · '+(ms/1000).toFixed(2)+' s',28,989);return canvas.toDataURL('image/png')
  },frame*1000/60);const buffer=Buffer.from(png.split(',')[1],'base64');if(!ffmpeg.stdin.write(buffer))await once(ffmpeg.stdin,'drain');if(frame===70)await writeFile(out+'/comparison-poster.png',buffer)
 }ffmpeg.stdin.end();const[code]=await finished;if(code!==0)throw Error(stderr);console.log('comparison.mp4:240frames /60fps /4seconds')
}finally{await browser.close();if(ffmpeg.exitCode===null)ffmpeg.kill()}
