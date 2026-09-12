_root.face.kao = this.getDepth();
var cloud_arr = [200,400,600,800,1000,1200];
var i = 0;
while(i < 6)
{
   var r = i % 2 != 0 ? 2 : 1;
   var tmp1 = attachMovie("cloud" + r,"cloud" + i,100);
   tmp1.swapDepths(10000000 + i * 100 + 1);
   tmp1._x = 300 + random(2000);
   tmp1._y = cloud_arr[i] + random(200);
   i++;
}
onEnterFrame = function()
{
   var _loc3_ = 0;
   var _loc2_;
   while(_loc3_ < 6)
   {
      _loc2_ = this["cloud" + _loc3_];
      _loc2_._x = _loc2_._x - 1;
      if(_loc2_._x < -300)
      {
         _loc2_._x = 2200 + random(500);
         _loc2_._y = cloud_arr[_loc3_] + random(200);
      }
      _loc3_ = _loc3_ + 1;
   }
};
mask.swapDepths(8000100);
var club_arr = [[18,2],[19,17],[27,19],[13,23],[21,25],[27,35]];
var star_arr = [[13,7],[22,14],[16,20],[24,22],[18,28],[22,40]];
var XL = _root.XL;
var YL = _root.YL;
var i = 0;
while(i < 6)
{
   var x = club_arr[i][0];
   var y = club_arr[i][1];
   var tmp4 = attachMovie("catclub","catclub" + x + "_" + y,100);
   tmp4._x = x * XL;
   tmp4._y = y * YL;
   tmp4.swapDepths(10000 + 1000 * tmp4._y + 10 * tmp4._x + 9);
   i++;
}
var i = 0;
while(i < 6)
{
   var x = star_arr[i][0];
   var y = star_arr[i][1];
   var tmp5 = attachMovie("catstar","catstar" + i,100);
   tmp5._x = x * XL;
   tmp5._y = y * YL;
   tmp5.swapDepths(10000 + 1000 * tmp5._y + 10 * tmp5._x + 9);
   i++;
}
magic_arr = [[30,5],[34,27],[10,37],[6,15]];
var i = 0;
while(i < 4)
{
   var x = magic_arr[i][0];
   var y = magic_arr[i][1];
   var tmp6 = attachMovie("magic_cloud","magic_cloud" + i,100);
   tmp6._x = x * XL;
   tmp6._y = y * YL;
   tmp6.swapDepths(10000 + 1000 * tmp6._y + 10 * tmp6._x + 15);
   tmp6.fly.gotoAndStop(i + 1);
   i++;
}
stop();
