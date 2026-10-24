gotoAndStop(4);
this.onEnterFrame=function(){
 if(typeof(asset_pg)=="function"){
 delete this.onEnterFrame;
 znum=4;pnum=4;pid=1;price_id=1;
 playerdate=[0,["one",0,2,0,0,0,0,1,0,0,0,0],["two",0,2,0,0,0,0,2,0,0,0,0],["three",0,2,0,0,0,0,3,0,0,0,0],["four",0,2,0,0,0,0,4,0,0,0,0]];
 moneydate=[0];for(var i=1;i<=4;i++)moneydate[i]=[0,100000,100000,200,0,0,0,0,0,0,0,0,0];
 builddate=[0,[0,16,1,1,0,0,3,"金星大道",1500,0,0,"","",6,32]];stockdate=[0];for(var i=1;i<=15;i++)stockdate[i]=[0,0,0,20,0,0,0,0,0,0,0];
 face={};for(var i=1;i<=4;i++){face["head"+i]={gotoAndStop:function(){},face:{gotoAndStop:function(){}}};face["bak"+i]={gotoAndStop:function(){}};}
 for(var i=1;i<=15;i++){stockdate[i][3]=20;for(var j=11;j<=16;j++)stockdate[i][j]=[0,0];}
 for(var i=1;i<=4;i++)stockdate[i][10+i]=[3000,10];
 flash.external.ExternalInterface.addCallback("assetProbe",this,function(){
  var out=[];asset_pg();out.push([moneydate[1][4],moneydate[1][12],playerdate[1][10]].join(","));
  moneydate[1][1]=1000;moneydate[1][2]=2000;moneydate[1][6]=500;moneydate[1][8]=700;
  builddate[1][0]=1;builddate[1][4]=2;builddate[1][8]=999999;
  asset_pg();out.push([moneydate[1][4],moneydate[1][12],playerdate[1][10],builddate[1][9]].join(","));
  moneydate[1][1]=-1;moneydate[1][2]=0;moneydate[1][6]=0;moneydate[1][8]=0;builddate[1][0]=0;
  stockdate[1][3]=0.75;stockdate[1][11]=[1,0];asset_pg();out.push([moneydate[1][4],moneydate[1][12]].join(","));
  return out.join(";");
 });stop();
 }
};