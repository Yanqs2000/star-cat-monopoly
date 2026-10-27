function card_pg()
{
   var _loc22_;
   var _loc16_;
   var _loc21_;
   var _loc20_;
   var _loc14_;
   var _loc17_;
   var _loc13_;
   var _loc2_;
   var _loc11_;
   var _loc3_;
   var _loc19_;
   var _loc18_;
   var _loc15_;
   var _loc8_;
   var _loc4_;
   var _loc7_;
   var _loc10_;
   var _loc6_;
   var _loc5_;
   var _loc12_;
   var _loc9_;
   if(tenor_id == 0)
   {
      dz = md[ppid._y / YL][ppid._x / XL];
      bdz = bd[dz];
      _loc22_ = bdz[1];
      if(_loc22_ == 16)
      {
         _loc16_ = bdz[2];
         _loc21_ = bdz[3];
         _loc20_ = bdz[7];
         _loc14_ = dz - _loc21_ + 1;
         _loc17_ = _loc14_ + 16;
         _loc13_ = 1;
         _loc2_ = _loc14_;
         while(_loc2_ < _loc17_)
         {
            _loc11_ = bd[_loc2_];
            if(_loc11_[2] != _loc16_)
            {
               break;
            }
            if(_loc11_[3] % 2 == 1)
            {
               dz_arr[_loc13_] = _loc2_;
               _loc13_ = _loc13_ + 1;
            }
            _loc2_ = _loc2_ + 1;
         }
         dz_arr[0] = _loc20_;
         tenor_id = 1;
      }
      else
      {
         show2_pg("对不起哦~~~","无法降级公共设施");
         tenor_id = 8;
      }
   }
   else if(tenor_id == 1)
   {
      _loc3_ = bdz[6];
      _loc19_ = "mc_npc11";
      _loc18_ = _root.game.attachMovie(_loc19_,_loc19_,100);
      _loc18_._x = ppid._x + wd[_loc3_][0];
      _loc18_._y = ppid._y + wd[_loc3_][1];
      _loc18_.swapDepths(30000 + _loc18_._y * 3000 / YL + _loc18_._x * 30 / XL + 9);
      tenor_id = 2;
      _root.show_id = 0;
   }
   else if(tenor_id == 2)
   {
      if(_root.show_id == 1)
      {
         _loc15_ = dz_arr.length;
         _loc2_ = 1;
         while(_loc2_ < _loc15_)
         {
            _loc8_ = dz_arr[_loc2_];
            _loc11_ = bd[_loc8_];
            _loc4_ = _loc11_[0];
            _loc7_ = _loc11_[4];
            if(_loc7_ == 1 && _loc4_ != 0)
            {
               mnd[_loc4_][10]--;
            }
            _loc10_ = _loc11_[12];
            _loc6_ = _root.game[_loc10_];
            _loc5_ = _root.game.attachMovie("house_mov","house_mov" + _loc2_,100 + _loc2_);
            _loc5_._x = _loc6_._x;
            _loc5_._y = _loc6_._y;
            _loc5_.swapDepths(30000 + 3000 * _loc5_._y / YL + 30 * _loc5_._x / XL + 16);
            _loc12_ = _loc11_[0] <= 0 ? 7 : _loc11_[0];
            _loc5_.land.gotoAndStop(_loc12_);
            _loc3_ = _loc11_[6];
            _loc9_ = _loc3_ <= 2 ? _loc3_ : _loc3_ - 2;
            _loc5_.gotoAndStop((_loc9_ - 1) * 10 + _loc7_ + 1);
            _loc5_.house.gotoAndPlay(2);
            if(_loc11_[4] > 0)
            {
               _loc11_[4] = _loc11_[4] - 1;
            }
            _loc7_ = _loc11_[4];
            _loc6_.gotoAndStop((_loc3_ - 1) * 10 + _loc7_ + 1);
            _loc6_._visible = false;
            _loc2_ = _loc2_ + 1;
         }
         tenor_id = 3;
         show_id = 0;
         _root.show_id = 9;
      }
   }
   else if(tenor_id == 3)
   {
      if(_root.show_id == 2)
      {
         _loc15_ = dz_arr.length;
         _loc2_ = 1;
         while(_loc2_ < _loc15_)
         {
            _loc8_ = dz_arr[_loc2_];
            _loc11_ = bd[_loc8_];
            _loc5_ = _root.game["house_mov" + _loc2_];
            _loc7_ = _loc11_[4];
            _loc3_ = _loc11_[6];
            _loc9_ = _loc3_ <= 2 ? _loc3_ : _loc3_ - 2;
            _loc5_.gotoAndStop((_loc9_ - 1) * 10 + _loc7_ + 1);
            _loc5_.house.gotoAndPlay(18);
            _loc2_ = _loc2_ + 1;
         }
         _root.show_id = 8;
      }
      else if(_root.show_id == 1)
      {
         _loc15_ = dz_arr.length;
         _loc2_ = 1;
         while(_loc2_ < _loc15_)
         {
            _loc8_ = dz_arr[_loc2_];
            _loc11_ = bd[_loc8_];
            _loc5_ = _root.game["house_mov" + _loc2_];
            _loc5_.swapDepths(100);
            _loc5_.removeMovieClip();
            _loc10_ = _loc11_[12];
            _loc6_ = _root.game[_loc10_];
            _loc6_._visible = true;
            _loc2_ = _loc2_ + 1;
         }
         _root.show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      sortcard();
      show2_pg("恶魔诅咒~~~",dz_arr[0] + "，全线降级！");
      show_id = 0;
      tenor_id = 8;
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
var dz;
var bdz;
var dz_arr = new Array();
var wd = _root.waydate1;
gotoAndStop(90);
