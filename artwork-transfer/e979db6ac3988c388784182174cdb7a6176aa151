function card_pg()
{
   var _loc4_;
   var _loc2_;
   var _loc3_;
   var _loc5_;
   var _loc11_;
   var _loc10_;
   var _loc9_;
   var _loc7_;
   var _loc8_;
   var _loc6_;
   if(tenor_id == 0)
   {
      _loc4_ = 100000;
      _loc2_ = 0;
      while(_loc2_ < godl)
      {
         _loc3_ = god_arr[_loc2_];
         _loc5_ = _root.game["npc" + _loc3_];
         jx = ppid._x - _loc5_._x;
         jy = ppid._y - _loc5_._y;
         jl = Math.sqrt(jx * jx + jy * jy);
         if(jl < _loc4_)
         {
            _loc4_ = jl;
            c_id = _loc3_;
         }
         _loc2_ = _loc2_ + 1;
      }
      nnn = _root.game["npc" + c_id];
      jx = Math.abs(ppid._x - nnn._x);
      jy = Math.abs(ppid._y - nnn._y);
      if(jx <= 352 && jy <= 280)
      {
         _loc11_ = int(nnn._x / XL);
         _loc10_ = int(nnn._y / YL);
         _loc9_ = md[_loc10_][_loc11_];
         _loc7_ = bd[_loc9_];
         _loc7_[10] = 0;
         _loc7_[11] = "";
         tenor_id = 1;
      }
      else
      {
         show2_pg("很抱歉哦~~~~","附近看不到神灵");
         tenor_id = 8;
      }
   }
   else if(tenor_id == 1)
   {
      nnn = _root.game["npc" + c_id];
      jx = nnn._x - ppid._x;
      jy = nnn._y - ppid._y;
      jl = Math.sqrt(jx * jx + jy * jy);
      _loc8_ = - Math.atan2(jx,jy);
      stepx = step * Math.sin(_loc8_);
      stepy = (- step) * Math.cos(_loc8_);
      nnn.swapDepths(11000000 + c_id);
      tenor_id = 2;
   }
   else if(tenor_id == 2)
   {
      jx = nnn._x - ppid._x;
      jy = nnn._y - ppid._y;
      jl = Math.sqrt(jx * jx + jy * jy);
      if(jl > 2 * step)
      {
         nnn._x += stepx;
         nnn._y += stepy;
      }
      else
      {
         nnn._x = ppid._x;
         nnn._y = ppid._y;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      _loc5_ = _root.game.attachMovie("fog","fog",100);
      _loc5_._x = ppid._x;
      _loc5_._y = ppid._y;
      _loc5_.swapDepths(30000 + 3000 * _loc5_._y / YL + 30 * _loc5_._x / XL + 17);
      timez = 0;
      show_id = 0;
      tenor_id = 4;
      _root.show_id = 0;
   }
   else if(tenor_id == 4)
   {
      timez++;
      if(timez == 10)
      {
         nnn.swapDepths(110);
         nnn.removeMovieClip();
         _loc6_ = pd[pid][5];
         if(_loc6_ > 0)
         {
            _root.setnpc(_loc6_);
         }
         ppid.npcz.gotoAndStop(c_id);
         timez = 0;
         tenor_id = 5;
      }
   }
   else if(tenor_id == 5)
   {
      if(_root.show_id == 1)
      {
         show2_pg("哎呀呀不得了~~~","被" + _root.balkdate[c_id][0] + "附身了！");
         _root.show_id = 0;
         show_id = 0;
         tenor_id = 6;
      }
   }
   else if(tenor_id == 6)
   {
      if(show_id == 1)
      {
         _root.brow_pg(1);
         _root.mood_pg(11);
         show_id = 0;
         _root.show_id = 0;
         tenor_id = 7;
      }
   }
   else if(tenor_id == 7)
   {
      if(_root.show_id == 1)
      {
         pd[pid][5] = c_id;
         pd[pid][6] = 7;
         sortcard();
         _root.show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 8)
   {
      if(show_id == 1)
      {
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      gotoAndPlay(100);
      onEnterFrame = null;
   }
}
var god_arr = [2,3,4,5,10,11];
var godl = god_arr.length;
var c_id = 0;
var jx;
var jy;
var jl;
var r16;
var stepx;
var stepy;
var step = 10;
var nnn;
gotoAndStop(90);
