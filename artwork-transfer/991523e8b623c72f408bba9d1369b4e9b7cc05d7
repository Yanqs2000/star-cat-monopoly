function card_pg()
{
   var _loc8_;
   var _loc6_;
   var _loc3_;
   var _loc7_;
   var _loc2_;
   var _loc11_;
   var _loc15_;
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
         var _loc1_ = _loc8_[0];
         var _loc2_ = bd[_loc1_];
         var _loc5_ = _loc2_[1];
         var _loc4_ = _loc2_[3];
         var _loc7_;
         var _loc6_;
         var _loc3_;
         if(_loc5_ != 16)
         {
            show2_pg("找不到房子~~~~","请瞄准地基按下鼠标！");
            tenor_id = 1;
            yesno_id = 1;
         }
         else
         {
            if(_loc4_ % 2 == 0)
            {
               _loc7_ = bd[_loc1_ - 1];
               _loc6_ = _loc7_[4];
               if(_loc6_ > 0)
               {
                  boomh = _loc1_ - 1;
               }
            }
            else
            {
               _loc3_ = _loc2_[4];
               if(_loc3_ > 0)
               {
                  boomh = _loc1_;
               }
            }
            if(boomh == -1)
            {
               show2_pg("很遗憾~~~~","这里可没房子可拆！");
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
            tenor_id = 4;
            show_id = 0;
         }
         else
         {
            tenor_id = 8;
            show_id = 1;
            yesno_id = 0;
         }
      }
   }
   else if(tenor_id == 4)
   {
      _loc6_ = bd[boomh];
      mnd[_loc6_[0]][10]--;
      _loc3_ = _root.game[_loc6_[12]];
      _loc7_ = _root.game.attachMovie("house_mov","house_mov",100);
      _loc7_._x = _loc3_._x;
      _loc7_._y = _loc3_._y;
      _loc7_.swapDepths(30000 + 3000 * _loc7_._y / YL + 30 * _loc7_._x / XL + 16);
      _loc7_.land.gotoAndStop(playerdate[_loc6_[0]][7]);
      _loc2_ = _loc6_[6];
      _loc11_ = _loc2_ <= 2 ? _loc2_ : _loc2_ - 2;
      _loc7_.gotoAndStop((_loc11_ - 1) * 10 + _loc6_[4] + 1);
      _loc7_.house.gotoAndPlay(2);
      _loc6_[4] = 0;
      _loc3_.gotoAndStop((_loc2_ - 1) * 10 + _loc6_[4] + 1);
      _loc3_._visible = false;
      tenor_id = 5;
      show_id = 0;
      _root.show_id = 0;
   }
   else if(tenor_id == 5)
   {
      if(_root.show_id == 2)
      {
         _loc6_ = bd[boomh];
         _loc7_ = _root.game.house_mov;
         _loc7_.gotoAndStop(1);
         _loc7_.house.gotoAndPlay(18);
         _root.show_id = 0;
      }
      else if(_root.show_id == 1)
      {
         _loc7_ = _root.game.house_mov;
         _loc7_.swapDepths(100);
         _loc7_.removeMovieClip();
         _loc6_ = bd[boomh];
         _loc8_ = _root.game[_loc6_[12]];
         _loc8_._visible = true;
         _root.show_id = 0;
         tenor_id = 6;
      }
   }
   else if(tenor_id == 6)
   {
      attachMovie("show","show",60000);
      show._x = 400;
      show._y = 300;
      show.show_say1 = "拆房报告";
      _loc6_ = bd[boomh];
      _loc15_ = _loc6_[7] + "某房屋被夷为平地";
      _loc14_ = "业主" + pd[_loc6_[0]][0];
      _loc12_ = "对该行为表示愤慨";
      show.show_say2 = _loc15_ + "\n" + "\n" + _loc14_ + "\n" + _loc12_;
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
var boomh = -1;
gotoAndStop(90);
