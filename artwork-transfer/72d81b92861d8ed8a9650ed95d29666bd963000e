function card_pg()
{
   var _loc4_;
   var _loc2_;
   var _loc3_;
   if(tenor_id == 0)
   {
      yesno_id = -1;
      _loc4_ = mnd[pid][7];
      _loc2_ = attachMovie("counter","counter",50000);
      _loc2_._x = 400;
      _loc2_._y = 300;
      _loc2_.counter_say1 = _loc4_;
      _loc2_.counter_say2 = 0;
      tenor_id = 1;
      show_id = 0;
   }
   else if(tenor_id == 1)
   {
      if(yesno_id >= 0)
      {
         _loc3_ = mnd[pid];
         _loc3_[1] += yesno_id;
         _loc3_[6] += yesno_id;
         _loc3_[7] -= yesno_id;
         _root.changemd_pg();
         gotoAndPlay(100);
         onEnterFrame = null;
      }
   }
}
gotoAndStop(90);
