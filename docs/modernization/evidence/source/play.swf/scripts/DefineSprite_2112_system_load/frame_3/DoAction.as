stop();
_root.gotoAndStop(15);
_root.delPart();
onEnterFrame = function()
{
   if(tenor_id == 0)
   {
      timez++;
      if(timez >= 10)
      {
         if(_parent.startmenu)
         {
            _parent.startmenu.gotoAndPlay(159);
            _parent.new_id = 2;
         }
         timez = 0;
         tenor_id++;
      }
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez % 3 == 0)
      {
         _root.SaveToGame(ch_id,Tid);
         Tid++;
         if(Tid >= 15)
         {
            Tid = 0;
            timez = 0;
            tenor_id++;
         }
      }
   }
   else if(tenor_id == 2)
   {
      timez++;
      if(timez >= 10)
      {
         timez = 0;
         tenor_id = 0;
         _root.new_id = 1;
         _root.system_id = 0;
         _root.gotoAndStop(8);
         onEnterFrame = null;
         this.removeMovieClip();
      }
   }
};
