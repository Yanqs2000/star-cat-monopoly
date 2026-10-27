stop();
onEnterFrame = function()
{
   timez++;
   if(timez % 3 == 0)
   {
      _root.GameToSave(ch_id,Tid);
      Tid++;
      if(Tid >= 15)
      {
         timez = 0;
         Tid = 0;
         gotoAndStop(4);
         onEnterFrame = null;
      }
   }
};
