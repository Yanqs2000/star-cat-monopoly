function card_pg()
{
   var _loc8_;
   var _loc11_;
   var _loc12_;
   var _loc10_;
   var _loc19_;
   var _loc16_;
   var _loc14_;
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
         var _loc14_ = _loc8_[0];
         var _loc7_ = _loc8_[1];
         var _loc6_ = _loc8_[2];
         var _loc13_ = bd[_loc14_];
         var _loc9_ = _loc13_[3];
         var _loc11_ = int(ppid._x / XL);
         var _loc10_ = int(ppid._y / YL);
         var _loc2_;
         var _loc3_;
         var _loc5_;
         var _loc4_;
         var _loc15_;
         var _loc12_;
         if(_loc9_ % 2 == 0)
         {
            show2_pg("找不到人~~~~","请瞄准落脚处按下鼠标");
            tenor_id = 1;
            yesno_id = 1;
         }
         else if(_loc11_ == _loc7_ && _loc10_ == _loc6_)
         {
            show2_pg("很遗憾~~~~","不能对自己使用均贫卡");
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
               _loc15_ = int(mnd[boomp][1]);
               _loc12_ = int(mnd[pid][1]);
               if(_loc12_ >= _loc15_)
               {
                  show2_pg("很抱歉~~~~","对方的现金不如你，无法使用");
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
      pay = int(mnd[boomp][1]);
      _loc11_ = int(mnd[pid][1]);
      _loc12_ = pay - _loc11_;
      mnd[boomp][1] = _loc11_;
      attachMovie("show","show",60000);
      show._x = 400;
      show._y = 300;
      show.show_say1 = "均贫卡奏效";
      _loc10_ = pd[boomp][0];
      _loc19_ = _loc10_ + "的现金与你相等了";
      _loc16_ = "共计减少了" + _loc12_ + "元";
      _loc14_ = _loc10_ + "对此表示极度愤慨";
      show.show_say2 = _loc19_ + "\n" + _loc16_ + "\n" + "\n" + _loc14_;
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
