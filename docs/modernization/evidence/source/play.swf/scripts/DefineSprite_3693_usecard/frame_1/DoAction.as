function show2_pg(a, b)
{
   show_id = 0;
   attachMovie("show2","show2",71230);
   show2._x = 400;
   show2._y = 300;
   show2.show_say1 = a;
   show2.show_say2 = b;
}
function getpoint()
{
   var _loc7_;
   var _loc6_;
   var _loc3_;
   var _loc2_;
   var _loc5_;
   var _loc10_;
   var _loc12_;
   var _loc11_;
   var _loc9_;
   var _loc4_;
   var _loc8_;
   var _loc13_;
   if(_xmouse > 0 && _xmouse < 800 && _ymouse > 0 && _ymouse < 600)
   {
      _loc7_ = _xmouse - _root.game._x;
      _loc6_ = _ymouse - _root.game._y;
      _loc3_ = int(_loc7_ / XL);
      _loc2_ = int(_loc6_ / YL);
      _loc5_ = md[_loc2_][_loc3_];
      _loc10_ = bd[_loc5_][1];
      if(_loc10_ == 0)
      {
         _loc12_ = _loc3_ * XL + XL / 2 - _loc7_;
         _loc11_ = _loc2_ * YL + YL / 2 - _loc6_;
         _loc9_ = (- Math.atan2(_loc12_,_loc11_)) / 0.017453292519943295;
         _loc4_ = int((_loc9_ + 225) / 90) + 1;
         if(_loc4_ == 5)
         {
            _loc4_ = 1;
         }
         _loc8_ = [0,[1,0],[0,-1],[-1,0],[0,1]];
         _loc2_ += _loc8_[_loc4_][0];
         _loc3_ += _loc8_[_loc4_][1];
         _loc5_ = md[_loc2_][_loc3_];
      }
      _loc13_ = [_loc5_,_loc3_,_loc2_];
      return _loc13_;
   }
   _loc13_ = [0,0,0];
   return _loc13_;
}
function sortcard()
{
   pcd0--;
   pcd[0]--;
   var _loc2_ = _root.yesno_id;
   while(_loc2_ <= pcd0)
   {
      pcd[_loc2_] = pcd[_loc2_ + 1];
      if(_loc2_ == pcd0)
      {
         pcd[_loc2_ + 1] = 0;
      }
      _loc2_ = _loc2_ + 1;
   }
}
var znum = _root.znum;
var pid = _root.pid;
var ppid = _root.game["player" + pid];
var pcd = _root.pcarddate[pid - 1];
var pcd0 = pcd[0];
var cd = _root.carddate;
var XL = _root.XL;
var YL = _root.YL;
var bd = _root.builddate;
var md = _root.mapdate;
var mnd = _root.moneydate;
var pd = _root.playerdate;
var hd = _root.housedate;
var id = pcd[_root.yesno_id];
var pg = 0;
var yesno_id = 0;
var goto_id = 2;
var tenor_id = 0;
var show_id = 0;
var timez = 0;
var pay = 0;
var price_id = _root.price_id;
var over_id = 0;
var cdid = cd[id][2];
if(cdid == 0)
{
   goto_id = 2;
}
else if(cdid == 1)
{
   goto_id = cd[id][3];
}
else
{
   goto_id = 3;
}
gotoAndPlay(goto_id);
