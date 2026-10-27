function card_pg()
{
   var _loc8_;
   var _loc10_;
   var _loc16_;
   var _loc14_;
   var _loc12_;
   if(tenor_id == 0)
   {
      _root.mouseh._visible = false;
      _loc8_ = attachMovie("moused","moused",12345);
      _loc8_._x = _xmouse;
      _loc8_._y = _ymouse;
      _loc8_.gotoAndStop(id);
      startDrag(moused,1,-300,-300,1600,1000);
      onMouseDown = function()
      {
         boomw = getpoint();
         var _loc8_ = boomw;
         var _loc13_ = _loc8_[0];
         var _loc7_ = _loc8_[1];
         var _loc6_ = _loc8_[2];
         var _loc12_ = bd[_loc13_];
         var _loc9_ = _loc12_[3];
         var _loc11_ = int(ppid._x / XL);
         var _loc10_ = int(ppid._y / YL);
         var _loc2_;
         var _loc3_;
         var _loc5_;
         var _loc4_;
         if(_loc9_ % 2 == 0)
         {
            show2_pg("找不到人~~~~","请瞄准落脚处按下鼠标");
            tenor_id = 1;
            yesno_id = 1;
         }
         else if(_loc11_ == _loc7_ && _loc10_ == _loc6_)
         {
            show2_pg("很遗憾~~~~","不能对自己使用查税卡");
            tenor_id = 1;
            yesno_id = 1;
         }
         else
         {
            _loc2_ = 1;
            while(_loc2_ <= znum)
            {
               if(_loc2_ != pid)
               {
                  _loc3_ = _root.game["player" + _loc2_];
                  _loc5_ = int(_loc3_._x / XL);
                  _loc4_ = int(_loc3_._y / YL);
                  if(_loc5_ == _loc7_ && _loc4_ == _loc6_)
                  {
                     boomp = _loc2_;
                     break;
                  }
               }
               _loc2_ = _loc2_ + 1;
            }
            if(boomp == -1)
            {
               show2_pg("很失败~~~~","请瞄准其他玩家");
               tenor_id = 1;
               yesno_id = 1;
            }
            else
            {
               tenor_id = 1;
               sortcard();
               show_id = 1;
               yesno_id = 0;
            }
         }
      };
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         delete onMouseDown;
         moused.stopDrag();
         moused.removeMovieClip();
         _root.mouseh._visible = true;
         _root.mouseh.startDrag(true,-300,-300,1600,1200);
         if(yesno_id == 0)
         {
            tenor_id = 6;
            show_id = 0;
         }
         else
         {
            tenor_id = 8;
            yesno_id = 0;
            show_id = 1;
         }
      }
   }
   else if(tenor_id == 6)
   {
      pay = int(mnd[boomp][1] / 10);
      mnd[boomp][1] -= pay;
      mnd[pid][1] += pay;
      attachMovie("show","show",60000);
      show._x = 400;
      show._y = 300;
      show.show_say1 = "查税报告";
      _loc10_ = pd[boomp][0];
      _loc16_ = _loc10_ + "被迫捐出10%现金";
      _loc14_ = "共计" + pay + "元";
      _loc12_ = _loc10_ + "对该行为表示愤慨";
      show.show_say2 = _loc16_ + "\n" + _loc14_ + "\n" + "\n" + _loc12_;
      tenor_id = 8;
      show_id = 0;
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
      show_id = 0;
      gotoAndPlay(100);
      onEnterFrame = null;
   }
}
var boomw = [0,0,0];
var boomp = -1;
gotoAndStop(90);
