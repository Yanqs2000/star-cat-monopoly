function card_pg()
{
   var _loc7_;
   var _loc6_;
   var _loc11_;
   var _loc4_;
   var _loc10_;
   var _loc9_;
   var _loc8_;
   var _loc3_;
   var _loc5_;
   var _loc1_;
   var _loc2_;
   if(tenor_id == 0)
   {
      _loc7_ = md[ppid._y / YL][ppid._x / XL];
      _loc6_ = bd[_loc7_];
      _loc11_ = _loc6_[1];
      if(_loc11_ == 16)
      {
         _loc4_ = _loc6_[2];
         _loc10_ = _loc6_[3];
         _loc9_ = _loc6_[7];
         _loc8_ = Number(_loc6_[8]);
         pay = Number(int(_loc8_ * 1.2 / 10) * 10);
         _loc3_ = _loc7_ - _loc10_ + 1;
         _loc5_ = _loc3_ + 16;
         _loc1_ = _loc3_;
         while(_loc1_ < _loc5_)
         {
            _loc2_ = bd[_loc1_];
            if(_loc2_[2] != _loc4_)
            {
               break;
            }
            _loc2_[8] = pay;
            _loc1_ = _loc1_ + 1;
         }
         sortcard();
         show2_pg("升级成功~~~",_loc9_ + "物价上升");
      }
      else
      {
         show2_pg("对不起哦~~~","无法改变公共设施地价");
      }
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         show_id = 0;
         gotoAndPlay(100);
         onEnterFrame = null;
      }
   }
}
gotoAndStop(90);
