function card_pg()
{
   var _loc2_;
   if(tenor_id == 0)
   {
      _loc2_ = attachMovie("show_card5","show_card5",50000);
      _loc2_._x = 400;
      _loc2_._y = 300;
      tenor_id = 1;
      show_id = 0;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         sortcard();
         _root.dice_id = yesno_id;
         show_id = 0;
         gotoAndPlay(100);
         onEnterFrame = null;
      }
   }
}
gotoAndStop(90);
