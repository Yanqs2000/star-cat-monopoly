function card_pg()
{
   var _loc3_;
   var _loc2_;
   var _loc4_;
   if(tenor_id == 0)
   {
      _loc3_ = pd[pid][5];
      if(_loc3_ > 0)
      {
         tenor_id = 1;
      }
      else
      {
         show2_pg("很抱歉哦~~~~","你目前可没被神灵附体");
         tenor_id = 9;
      }
   }
   else if(tenor_id == 1)
   {
      timez = 0;
      show_id = 0;
      tenor_id = 2;
      _loc2_ = _root.game.attachMovie("fog","fog",100);
      _loc2_._x = ppid._x;
      _loc2_._y = ppid._y;
      _loc2_.swapDepths(30000 + 3000 * _loc2_._y / YL + 30 * _loc2_._x / XL + 17);
   }
   else if(tenor_id == 2)
   {
      timez++;
      if(timez == 10)
      {
         ppid.npcz.gotoAndStop(1);
         tenor_id = 3;
         timez = 0;
      }
   }
   else if(tenor_id == 3)
   {
      _loc3_ = pd[pid][5];
      _root.setnpc(_loc3_);
      _loc4_ = _root.balkdate[_loc3_][0];
      show2_pg("欢送成功~~~",_loc4_ + "离你而去");
      show_id = 0;
      tenor_id = 4;
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         pd[pid][5] = 0;
         pd[pid][6] = 0;
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      sortcard();
      show_id = 0;
      gotoAndPlay(100);
      onEnterFrame = null;
   }
}
gotoAndStop(90);
