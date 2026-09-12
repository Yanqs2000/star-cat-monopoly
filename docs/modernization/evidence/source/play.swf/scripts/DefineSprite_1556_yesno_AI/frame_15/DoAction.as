onEnterFrame = function()
{
   if(Key.isDown(1) || Key.isDown(38) || Key.isDown(40) || Key.isDown(37) || Key.isDown(39))
   {
      gotoAndPlay(40);
      delete onEnterFrame;
   }
};
