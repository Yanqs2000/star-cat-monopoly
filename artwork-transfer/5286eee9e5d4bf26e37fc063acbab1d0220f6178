gotoAndStop(4);
var probeStage = 0;
this.onEnterFrame = function() {
 if(probeStage == 0 && typeof(price_pg) == "function") {probeStage = 1;gotoAndStop(5);return;}
 if(probeStage == 1 && typeof(delplayer) == "function") {
  delete this.onEnterFrame;
  XL=56;YL=40;pid=1;znum=4;pnum=4;playerdate=[0];moneydate=[0];housedate=[0];pcarddate=[];stockdate=[0];builddate=[0];
  game=createEmptyMovieClip("game",4000);
  for(var i=1;i<=4;i++) {
   playerdate[i]=["p"+i, i==1?0:1, 1,0,0,0,0,i,0,0,0,0,-1];
   moneydate[i]=[0,100,200,30,40,50,60];housedate[i]=[0,[1]];pcarddate[i-1]=[5,6];
   game.createEmptyMovieClip("player"+i,i);
  }
  moneydate[1][1]=0;moneydate[1][2]=-1;
  for(var s=1;s<=15;s++) {
   stockdate[s]=["s"+s,10,10,10,0,20,1,0,0,0,1000,[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],0,1,0,s];
   builddate[s]=[0,s,0,0,0,0,0,"s"+s,0,2000];
  }
  stockdate[1][18]=2;stockdate[1][19]=1;stockdate[1][11]=[3100,10];stockdate[1][12]=[100,10];stockdate[1][13]=[100,10];
  stockdate[2][11]=[77,10];stockdate[13][11]=[99,5];
  builddate[16]=[1,16,0,1,2,0,0,"parcel",0,0,0,0,"house"];
  game.createEmptyMovieClip("house",20).createEmptyMovieClip("land",1);
  delplayer();
  var lines=["clear:"+[playerdate[1][3],pnum,moneydate[1][1],moneydate[1][2],stockdate[1][19],builddate[1][9],stockdate[1][10],stockdate[1][11][0],stockdate[2][10],builddate[13][9],builddate[16][0],builddate[16][4],pcarddate[0][0]].join(",")];
  // Isolate original goback's seat/date control; finance/random handlers are observations stubs.
  month_sd_pg=function(){};week_sd_pg=function(){};day_sd_pg=function(){};asset_pg=function(){};jin_pg=function(){};
  map_say=createEmptyMovieClip("map_say",4200);supply_id=0;day_id=28;month_id=2;year_id=2028;week_id=1;
  for(var p=1;p<=4;p++){playerdate[p][3]=0;playerdate[p][1]=p==1?0:1;moneydate[p][1]=100;moneydate[p][2]=100;}
  playerdate[2][3]=9;playerdate[3][3]=9;pid=1;tenor_id=4;goback();lines.push("seats:"+pid);
  pid=4;tenor_id=4;goback();lines.push("leap:"+[pid,year_id,month_id,day_id,week_id].join(","));
  var legacy=[1,3];var invalid=legacy(0);lines.push("load-call:"+typeof(invalid));
  lines.push("price:"+price_pg());
  probeResult=lines.join(";");
  flash.external.ExternalInterface.addCallback("probeResult",this,function(){return probeResult;});
 }
};
