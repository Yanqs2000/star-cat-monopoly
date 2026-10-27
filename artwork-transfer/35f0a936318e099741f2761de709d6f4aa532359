gotoAndStop(4);
this.onEnterFrame=function(){
 if(typeof(end_pg17)=="function") {
 delete this.onEnterFrame;pid=1;tenor_id=0;
 setGameHide=function(){};setGameShow=function(){};
 mouseh=createEmptyMovieClip("mouseh",100);music=new Sound();
 playerdate=[0,["probe",0,2,0,0,0,0,1]];moneydate=[0,[0,0,0,0]];
 probeLines=[];probeDone=false;
 var actor=attachMovie("boy1","actor",62000);actor._x=400;actor._y=500;actor.gotoAndStop(1);
 var ball=attachMovie("bb1","ball",62001);ball._x=400;ball._y=480;ball.gotoAndStop(1);
 probeStage=0;probeFrame=0;probeStart=getTimer();
 attachMovie("carnie","carnie",60000);
 this.onEnterFrame=function(){
  probeFrame++;
  if(probeStage==0&&carnie.boy._x==400) {
   probeStart=getTimer();probeFrame=0;
   var a=actor.getBounds(this);var b=ball.getBounds(this);
   probeLines.push(["bounds",a.xMin,a.xMax,a.yMin,a.yMax,b.xMin,b.xMax,b.yMin,b.yMax].join(","));
   var xs=[453,463.45,463.5,463.55,472];
   for(var i=0;i<xs.length;i++){ball._x=xs[i];probeLines.push(["hit",xs[i],ball.hitTest(actor)].join(","));}
   actor.removeMovieClip();ball.removeMovieClip();
   var oldAttach=carnie.attachMovie;carnie.oldAttach=oldAttach;
   carnie.attachMovie=function(id,name,depth){
    _root.probeLines.push(["spawn",id,this.timez,_root.probeFrame,getTimer()-_root.probeStart].join(","));
    return this.oldAttach(id,name,depth);
   };
   carnie.boy.sourceFn=carnie.boy.onEnterFrame;
   carnie.boy.onEnterFrame=function(){this.sourceFn();if(getTimer()-_root.probeStart>5900 && getTimer()-_root.probeStart<6200)_root.probeLines.push(["frame","boy",_root.probeFrame].join(","));};
   probeStage=1;
  }
  for(var name in carnie) {
   var o=carnie[name];
   if(name.substr(0,2)=="bb"&&typeof(o)=="movieclip"&&o.sourceFn==undefined) {
    o.sourceFn=o.onEnterFrame;
    o.onEnterFrame=function(){this.sourceFn();if(getTimer()-_root.probeStart>5900 && getTimer()-_root.probeStart<6200)_root.probeLines.push(["frame",this._name,_root.probeFrame].join(","));};
   }
  }
  if(getTimer()-probeStart>=6300){clearInterval(carnie.ss1);clearInterval(carnie.ss3);clearInterval(carnie.ss5);clearInterval(carnie.sst);probeDone=true;delete this.onEnterFrame;}
 };
 flash.external.ExternalInterface.addCallback("activityStart",this,function(){return true;});
 flash.external.ExternalInterface.addCallback("activityProbe",this,function(){return probeLines.join(";");});
 flash.external.ExternalInterface.addCallback("activityDone",this,function(){return probeDone;});
 }
};
