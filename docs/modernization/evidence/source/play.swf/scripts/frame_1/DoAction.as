fscommand("allowscale",false);
stop();
onEnterFrame = function()
{
   var _loc4_ = _root.getBytesLoaded();
   var _loc2_ = _root.getBytesTotal();
   var _loc3_ = int(_loc4_ / _loc2_ * 100);
   loading.say = "正在载入……" + _loc3_;
   loading.loading.gotoAndStop(_loc3_);
   if(_loc4_ == _loc2_)
   {
      onEnterFrame = null;
      gotoAndPlay(3);
   }
};
