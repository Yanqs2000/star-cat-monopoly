// Controlled AVM1 primitive probe. Only scratch root frame 1 is replaced.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const mode = process.argv[2] ?? 'flight'
if (!['flight','heads','ludo','carnival'].includes(mode)) throw Error('Unknown original activity probe')
const scratch = resolve(root, `.analysis-cache/3c-original-activities-${mode}`)
const source = resolve(root, 'public/original/play.swf')
const probe = resolve(scratch, 'activities-probe.swf')
const sha = value => createHash('sha256').update(value).digest('hex')
const original = readFileSync(source)
const originalHash = sha(original)
const manifest = JSON.parse(readFileSync(resolve(root, 'public/original/manifest.json'), 'utf8'))
if (manifest.files.find(file => file.name === 'play.swf')?.sha256 !== originalHash) throw Error('Original SWF hash mismatch')

mkdirSync(resolve(scratch, 'import/frame_1'), { recursive: true })
const flightHarness = `gotoAndStop(4);
this.onEnterFrame = function() {
 if(typeof(end_pg17)=="function") {
  delete this.onEnterFrame;
  XL=56;YL=40;pid=1;yesno_id=1;tenor_id=0;
  stationdate=[0,[2,4,31,7],[1,3,32,28],[2,4,9,35],[1,3,8,14]];
  playerdate=[0,["probe",0,2,0,0,0,0,1]];
  game=createEmptyMovieClip("game",4000);
  ppid=game.createEmptyMovieClip("player1",1);ppid._x=31*XL;ppid._y=7*YL;
  game1=createEmptyMovieClip("game1",4001);
  showmap_pg=function(){};
  probeLines=[];
  Gametoxy=function() {
   var f=game.fly;
   probeLines.push([f._x,f._y,f._xscale,station.sf_id,station.timez,ppid._x,ppid._y,ppid._visible].join(","));
  };
  attachMovie("station","station",60000);
  flash.external.ExternalInterface.addCallback("activityStart",this,function(){
   station.ch_id=2;station.gotoAndStop(3);return true;
  });
  flash.external.ExternalInterface.addCallback("activityProbe",this,function(){return probeLines.join(";");});
  flash.external.ExternalInterface.addCallback("activityDone",this,function(){return tenor_id==3;});
 }
};
`
const headHarness = `gotoAndStop(4);
this.onEnterFrame = function() {
 if(typeof(showmap_pg)=="function") {
  delete this.onEnterFrame;
  XL=56;YL=40;pid=1;znum=4;pnum=1;builddate=[];
  playerdate=[0,["one",0,2,0,0,0,0,1],["two",0,2,0,0,0,0,2],["three",0,2,0,0,0,0,3],["four",0,2,0,0,0,0,4]];
  game=createEmptyMovieClip("game",4000);
  var coords=[[6,32],[19,1],[21,41],[31,7]];
  for(var i=1;i<=4;i++) {
   var actor=game.createEmptyMovieClip("player"+i,i);
   actor._x=coords[i-1][0]*XL;actor._y=coords[i-1][1]*YL;
  }
  var older=createEmptyMovieClip("older",5000);
  showmap_pg(170,90);
  headEvents=[];
  for(var i=1;i<=4;i++) {
   var h=game1["head"+i];h.t=0;h.tenor_id=0;h.probeId=i;h.sourceFn=h.onEnterFrame;
   h.onEnterFrame=function(){this.sourceFn();_root.headEvents.push(this.probeId);};
  }
  older.onEnterFrame=function(){_root.headEvents.push(0);};
  flash.external.ExternalInterface.addCallback("activityStart",this,function(){return true;});
  flash.external.ExternalInterface.addCallback("activityProbe",this,function(){return headEvents.slice(0,50).join(",");});
  flash.external.ExternalInterface.addCallback("activityDone",this,function(){return headEvents.length>=50;});
 }
};
`
const ludoHarness = `gotoAndStop(4);
this.onEnterFrame=function(){
 if(typeof(end_pg17)=="function") {
 delete this.onEnterFrame;pid=1;tenor_id=0;
 setGameHide=function(){};setGameShow=function(){};
 mouseh=createEmptyMovieClip("mouseh",100);music=new Sound();
 playerdate=[0,["probe",0,2,0,0,0,0,1]];moneydate=[0,[0,0,0,9]];
 probeLines=[];probeDone=false;
 var cases=[[0,111,3,0,0],[9,0,8,0,0],[105,0,8,0,7],[105,111,3,0,7]];probeCase=0;
 startCase=function(){
  moneydate[1][3]=cases[probeCase][0];
  attachMovie("ludoz","ludoz",60000);probeStage=0;
 };
 startCase();
 this.onEnterFrame=function(){
  if(probeStage==0 && ludoz.ludodate.length>0) {
   var b=ludoz;probeLines.push([probeCase,"entry",moneydate[1][3],b.pay].join(","));
   b.ludodate[0][0][3]=1;b.pay=cases[probeCase][4];b.num1=cases[probeCase][1];b.num2=cases[probeCase][2];b.num3=cases[probeCase][3];b.tenor_id=1;b.yesno_id=1;b.gotoAndPlay(3);probeStage=1;
  } else if(probeStage==1 && ludoz.tenor_id==2){
   probeLines.push([probeCase,"settled",moneydate[1][3],ludoz.pay,ludoz.payz].join(","));
   ludoz.removeMovieClip();probeCase++;
   if(probeCase<cases.length)startCase();
   else {
    delete this.onEnterFrame;
    var parent=createEmptyMovieClip("diceParent",61000);parent.attachMovie("ludo_tz3","dice",1);
    parent.onEnterFrame=function(){
     var d=this.dice;var f=d._currentframe;
     if(f==1||f==10||f==17||f==18||f==19||f==40)probeLines.push(["dice",f,d.r1,d.r2,d.r3,d.tz1._currentframe,d.tz2._currentframe,d.tz3._currentframe,d.tz4._currentframe,d.tz6._currentframe,this.num1,this.num2,this.num3].join(","));
     if(f==40){probeDone=true;delete this.onEnterFrame;}
    };
   }
  }
 };
 flash.external.ExternalInterface.addCallback("activityStart",this,function(){return true;});
 flash.external.ExternalInterface.addCallback("activityProbe",this,function(){return probeLines.join(";");});
 flash.external.ExternalInterface.addCallback("activityDone",this,function(){return probeDone;});
 }
};
`
writeFileSync(resolve(scratch, 'import/frame_1/DoAction.as'), mode === 'flight' ? flightHarness : mode === 'heads' ? headHarness : mode === 'ludo' ? ludoHarness : readFileSync(resolve(root,'scripts/original-carnival-probe.as'),'utf8'))
execFileSync('/opt/homebrew/opt/openjdk/bin/java', ['-jar',
  '/Users/yanqs/Documents/GitHub/vibe_coding/chat/star-cat-monopoly/.analysis-tools/ffdec-26.2.1/ffdec.jar',
  '-importScript', source, probe, resolve(scratch, 'import')], { stdio: 'inherit' })

function frameActions(raw, target) {
  const body = raw.toString('ascii', 0, 3) === 'CWS' ? inflateSync(raw.subarray(8)) : raw.subarray(8)
  let offset = Math.ceil((5 + 4 * (body[0] >> 3)) / 8) + 4
  let frame = 1
  const actions = []
  while (offset < body.length) {
    const header = body.readUInt16LE(offset); offset += 2
    const type = header >> 6
    let size = header & 63
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4 }
    if (type === 12 && frame === target) actions.push(body.subarray(offset, offset + size))
    if (type === 1) frame++
    offset += size
  }
  return Buffer.concat(actions)
}
const originalFrame4 = frameActions(original, 4)
const probeBytes = readFileSync(probe)
if (!originalFrame4.equals(frameActions(probeBytes, 4))) throw Error('Original frame 4 bytecode changed')

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] })
try {
  const page = await browser.newPage()
  await page.route('**/__activities-probe.swf', route => route.fulfill({ path: probe, contentType: 'application/x-shockwave-flash' }))
  await page.goto(process.env.ORIGINAL_PREVIEW_URL ?? 'http://127.0.0.1:4173/')
  await page.getByText('原版已载入', { exact: true }).waitFor()
  await page.evaluate(() => document.querySelector('ruffle-player').ruffle().load({
    url: '/__activities-probe.swf', autoplay: 'on', unmuteOverlay: 'hidden', allowScriptAccess: true,
  }))
  await page.waitForFunction(() => {
    try { return typeof document.querySelector('ruffle-player').ruffle().callExternalInterface('activityProbe') === 'string' }
    catch { return false }
  }, null, { timeout: 15000 })
  await page.evaluate(() => document.querySelector('ruffle-player').ruffle().callExternalInterface('activityStart'))
  await page.waitForFunction(() => document.querySelector('ruffle-player').ruffle().callExternalInterface('activityDone'), null, { timeout: 15000 })
  const encoded = await page.evaluate(() => document.querySelector('ruffle-player').ruffle().callExternalInterface('activityProbe'))
  const samples = mode === 'heads' ? encoded.split(',').map(Number) : encoded.split(';').filter(Boolean).map(line => line.split(',').map(value => value === 'true' ? true : value === 'false' ? false : value === '' ? null : Number.isNaN(Number(value)) ? value : Number(value)))
  if (sha(readFileSync(source)) !== originalHash) throw Error('Original SWF changed')
  const result = { method: mode==='carnival' ? 'Original carnie/boy/bb timeline: native bounding-box hitTest, interval generation and frame handler order with observation wrappers' : mode==='ludo' ? 'Original ludoz entry and frame3 settlement with controlled parent dice values; original ludo_tz3 timeline observed separately' : mode === 'heads' ? 'Original showmap_pg head handlers wrapped only to observe the first ten native frame traversal orders' : 'Original station2542 frame3 flight handler, root-frame1 controlled east-to-south harness in Ruffle',
    limitation: 'Controlled original symbol execution, not a natural original gameplay route',
    sourceSha256: originalHash, probeSha256: sha(probeBytes), frame4ActionSha256: sha(originalFrame4),
    samples }
  writeFileSync(resolve(root, `docs/modernization/evidence/${['ludo','carnival'].includes(mode)?mode:'portal-'+mode}-runtime.json`), `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify({ count: samples.length, first: samples[0], last: samples.at(-1), sourceSha256: originalHash }))
} finally { await browser.close() }
