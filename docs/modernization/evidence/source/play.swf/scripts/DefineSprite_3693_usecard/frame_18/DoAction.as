function card_pg()
{
   var _loc25_;
   var _loc21_;
   var _loc24_;
   var _loc23_;
   var _loc19_;
   var _loc22_;
   var _loc18_;
   var _loc4_;
   var _loc15_;
   var _loc5_;
   var _loc6_;
   var _loc3_;
   var _loc20_;
   var _loc12_;
   var _loc9_;
   var _loc17_;
   var _loc2_;
   var _loc7_;
   var _loc11_;
   var _loc14_;
   var _loc10_;
   var _loc8_;
   var _loc16_;
   var _loc13_;
   if(tenor_id == 0)
   {
      dz = md[ppid._y / YL][ppid._x / XL];
      bdz = bd[dz];
      _loc25_ = bdz[1];
      if(_loc25_ == 16)
      {
         _loc21_ = bdz[2];
         _loc24_ = bdz[3];
         _loc23_ = bdz[7];
         _loc19_ = dz - _loc24_ + 1;
         _loc22_ = _loc19_ + 16;
         _loc18_ = 1;
         _loc4_ = _loc19_;
         while(_loc4_ < _loc22_)
         {
            _loc15_ = bd[_loc4_];
            if(_loc15_[2] != _loc21_)
            {
               break;
            }
            if(_loc15_[3] % 2 == 1)
            {
               dz_arr[_loc18_] = _loc4_;
               _loc18_ = _loc18_ + 1;
            }
            _loc4_ = _loc4_ + 1;
         }
         dz_arr[0] = _loc23_;
         tenor_id = 1;
      }
      else
      {
         show2_pg("对不起哦~~~","无法升级公共设施");
         tenor_id = 8;
      }
   }
   else if(tenor_id == 1)
   {
      _loc5_ = bdz[6];
      _loc6_ = "mc_npc10";
      _loc3_ = _root.game.attachMovie(_loc6_,_loc6_,100);
      _loc3_._x = ppid._x + wd[_loc5_][0];
      _loc3_._y = ppid._y + wd[_loc5_][1];
      _loc3_.swapDepths(30000 + _loc3_._y * 3000 / YL + _loc3_._x * 30 / XL + 9);
      tenor_id = 2;
      _root.show_id = 0;
   }
   else if(tenor_id == 2)
   {
      if(_root.show_id == 1)
      {
         _loc20_ = dz_arr.length;
         _loc4_ = 1;
         while(_loc4_ < _loc20_)
         {
            _loc12_ = dz_arr[_loc4_];
            _loc15_ = bd[_loc12_];
            if(_loc15_[12] == "")
            {
               _loc3_ = _root.game[bd[_loc12_ + 1][12]];
               _loc9_ = _loc3_._x;
               _loc17_ = _loc3_._y;
               _loc3_.swapDepths(100);
               _loc3_.removeMovieClip();
               _loc5_ = _loc15_[6];
               _root.house_num = _root.house_num + 1;
               _loc6_ = "house" + _root.house_num;
               _loc2_ = _root.game.attachMovie("house",_loc6_,100 + _root.house_num);
               _loc2_._x = _loc9_;
               _loc2_._y = _loc17_;
               _loc2_.swapDepths(30000 + _loc2_._y * 3000 / YL + _loc2_._x * 30 / XL + 0);
               _loc2_.land.gotoAndStop(7);
               _loc2_.gotoAndStop((_loc5_ - 1) * 10 + 1);
               _loc15_[12] = _loc6_;
            }
            _loc7_ = _loc15_[0];
            _loc11_ = _loc15_[4];
            if(_loc11_ == 0 && _loc7_ != 0)
            {
               mnd[_loc7_][10]++;
            }
            _loc14_ = _loc15_[12];
            _loc10_ = _root.game[_loc14_];
            _loc8_ = _root.game.attachMovie("house_mov","house_mov" + _loc4_,100 + _loc4_);
            _loc8_._x = _loc10_._x;
            _loc8_._y = _loc10_._y;
            _loc8_.swapDepths(30000 + 3000 * _loc8_._y / YL + 30 * _loc8_._x / XL + 16);
            _loc16_ = _loc15_[0] <= 0 ? 7 : _loc15_[0];
            _loc8_.land.gotoAndStop(_loc16_);
            _loc5_ = _loc15_[6];
            _loc13_ = _loc5_ <= 2 ? _loc5_ : _loc5_ - 2;
            _loc8_.gotoAndStop((_loc13_ - 1) * 10 + _loc11_ + 1);
            _loc8_.house.gotoAndPlay(2);
            if(_loc15_[4] < 5)
            {
               _loc15_[4] = _loc15_[4] + 1;
            }
            _loc11_ = _loc15_[4];
            _loc10_.gotoAndStop((_loc5_ - 1) * 10 + _loc11_ + 1);
            _loc10_._visible = false;
            _loc4_ = _loc4_ + 1;
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
         _loc20_ = dz_arr.length;
         _loc4_ = 1;
         while(_loc4_ < _loc20_)
         {
            _loc12_ = dz_arr[_loc4_];
            _loc15_ = bd[_loc12_];
            _loc8_ = _root.game["house_mov" + _loc4_];
            _loc11_ = _loc15_[4];
            _loc5_ = _loc15_[6];
            _loc13_ = _loc5_ <= 2 ? _loc5_ : _loc5_ - 2;
            _loc8_.gotoAndStop((_loc13_ - 1) * 10 + _loc11_ + 1);
            _loc8_.house.gotoAndPlay(18);
            _loc4_ = _loc4_ + 1;
         }
         _root.show_id = 8;
      }
      else if(_root.show_id == 1)
      {
         _loc20_ = dz_arr.length;
         _loc4_ = 1;
         while(_loc4_ < _loc20_)
         {
            _loc12_ = dz_arr[_loc4_];
            _loc15_ = bd[_loc12_];
            _loc8_ = _root.game["house_mov" + _loc4_];
            _loc8_.swapDepths(100);
            _loc8_.removeMovieClip();
            _loc14_ = _loc15_[12];
            _loc10_ = _root.game[_loc14_];
            _loc10_._visible = true;
            _loc4_ = _loc4_ + 1;
         }
         _root.show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      sortcard();
      show2_pg("天使祝福~~~",dz_arr[0] + "，全线升级！");
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
