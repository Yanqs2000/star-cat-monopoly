function card_pg()
{
   if(tenor_id == 0)
   {
      _root.stop_id = 1;
      sortcard();
      show2_pg("注意~~~","停留卡已经起效");
      tenor_id = 1;
      show_id = 0;
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
