function brow_pg(id, way)
{
   var _loc2_ = _root.playerdate[id];
   var _loc3_ = _loc2_[9] * 10 + way;
   _root.game["player" + id].gotoAndStop((_loc2_[2] - 1) * 30 + _loc3_);
   _root.face["head" + _loc2_[10]].face.gotoAndStop(_loc3_);
   _loc2_[11] = _loc3_;
}
function card_pg()
{
   var _loc17_;
   var _loc3_;
   var _loc18_;
   var _loc22_;
   var _loc5_;
   var _loc14_;
   var _loc9_;
   var _loc19_;
   var _loc33_;
   var _loc32_;
   var _loc31_;
   var _loc29_;
   var _loc27_;
   if(tenor_id == 0)
   {
      _root.mouseh._visible = false;
      _loc17_ = attachMovie("moused","moused",12345);
      _loc17_._x = _xmouse;
      _loc17_._y = _ymouse;
      _loc17_.gotoAndStop(id);
      startDrag(moused,1,-300,-300,1600,1000);
      onMouseDown = function()
      {
         boomw = getpoint();
         var _loc9_ = boomw;
         var _loc23_ = _loc9_[0];
         var _loc5_ = bd[_loc23_];
         var _loc22_ = _loc5_[1];
         var _loc19_;
         var _loc20_;
         var _loc3_;
         var _loc11_;
         var _loc6_;
         var _loc7_;
         var _loc10_;
         var _loc18_;
         var _loc17_;
         var _loc4_;
         var _loc2_;
         var _loc12_;
         var _loc16_;
         var _loc15_;
         var _loc14_;
         var _loc13_;
         var _loc8_;
         var _loc21_;
         if(_loc22_ == null || _loc22_ == 34)
         {
            show2_pg("很遗憾~~~~","发射失败！");
            tenor_id = 1;
            yesno_id = 1;
            show_id = 1;
         }
         else
         {
            _loc19_ = [[0,0],[1,1],[-1,1],[-1,-1],[1,-1]];
            _loc20_ = 0;
            _loc3_ = 0;
            while(_loc3_ < 5)
            {
               _loc11_ = _loc19_[_loc3_];
               _loc6_ = md[_loc9_[2] + _loc11_[1]][_loc9_[1] + _loc11_[0]];
               if(_loc6_ == null)
               {
                  _loc20_ = 1;
                  break;
               }
               _loc5_ = bd[_loc6_];
               _loc7_ = _loc5_[1];
               _loc10_ = _loc5_[3];
               if(_loc7_ == 16 && _loc10_ % 2 == 0)
               {
                  _loc18_ = bd[_loc6_ - 1];
                  _loc17_ = _loc18_[4];
                  if(_loc17_ > 0)
                  {
                     boomh[0]++;
                     boomh[boomh[0]] = _loc6_ - 1;
                  }
               }
               else if(_loc10_ == 2)
               {
                  _loc4_ = [13,14,15,18,19,22,31,32];
                  _loc2_ = 0;
                  while(_loc2_ < _loc4_.length)
                  {
                     if(_loc7_ == _loc4_[_loc2_])
                     {
                        boomz[0]++;
                        boomz[boomz[0]] = _loc5_[7];
                        break;
                     }
                     _loc2_ = _loc2_ + 1;
                  }
               }
               _loc3_ = _loc3_ + 1;
            }
            if(_loc20_ == 1)
            {
               show2_pg("很遗憾~~~~","发射失败！");
               tenor_id = 1;
               yesno_id = 1;
               show_id = 1;
            }
            else
            {
               _loc3_ = 1;
               while(_loc3_ <= znum)
               {
                  _loc12_ = _root.game["player" + _loc3_];
                  _loc16_ = int(_loc12_._x / XL);
                  _loc15_ = int(_loc12_._y / YL);
                  _loc14_ = Math.abs(_loc16_ - _loc9_[1]);
                  _loc13_ = Math.abs(_loc15_ - _loc9_[2]);
                  _loc8_ = pd[_loc3_][3];
                  if(_loc14_ == 1 && _loc13_ == 1 || _loc14_ == 0 && _loc13_ == 0)
                  {
                     if(_loc8_ != 2 && _loc8_ != 3 && _loc8_ != 9)
                     {
                        boomp[0]++;
                        boomp[boomp[0]] = _loc3_;
                     }
                  }
                  _loc3_ = _loc3_ + 1;
               }
               attachMovie("rocket","rocket",56000);
               _loc21_ = pd[pid][2];
               rocket._x = _loc19_[_loc21_][0] * XL + 352;
               rocket._y = _loc19_[_loc21_][1] * YL + 280;
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
         show_id = 0;
         if(yesno_id == 0)
         {
            tenor_id = 2;
         }
         else
         {
            tenor_id = 18;
            yesno_id = 0;
         }
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         rocket._x = boomw[1] * XL + _root.game._x;
         rocket._y = boomw[2] * YL + _root.game._y;
         show_id = 0;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         attachMovie("boom","boom",56000);
         boom._x = boomw[1] * XL + _root.game._x;
         boom._y = boomw[2] * YL + _root.game._y;
         if(boomp[0] > 0)
         {
            _loc3_ = 1;
            while(_loc3_ <= boomp[0])
            {
               brow_pg(boomp[_loc3_],10);
               _loc3_ = _loc3_ + 1;
            }
         }
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         if(boomh[0] > 0)
         {
            _loc3_ = 1;
            while(_loc3_ <= boomh[0])
            {
               _loc18_ = bd[boomh[_loc3_]];
               _loc22_ = _loc18_[0];
               if(_loc18_[4] == 1)
               {
                  mnd[_loc22_][10]--;
               }
               _loc5_ = _root.game[_loc18_[12]];
               _loc14_ = _root.game.attachMovie("house_mov","house_mov" + _loc3_,100 + _loc3_);
               _loc14_._x = _loc5_._x;
               _loc14_._y = _loc5_._y;
               _loc14_.swapDepths(30000 + 3000 * _loc14_._y / YL + 30 * _loc14_._x / XL + 16);
               _loc14_.land.gotoAndStop(playerdate[_loc18_[0]][7]);
               _loc9_ = _loc18_[6];
               _loc19_ = _loc9_ <= 2 ? _loc9_ : _loc9_ - 2;
               _loc14_.gotoAndStop((_loc19_ - 1) * 10 + _loc18_[4] + 1);
               _loc14_.house.gotoAndPlay(2);
               _loc18_[4] = _loc18_[4] - 1;
               _loc5_.prevFrame();
               _loc5_._visible = false;
               _loc3_ = _loc3_ + 1;
            }
            tenor_id = 5;
            show_id = 0;
            _root.show_id = 0;
         }
         else
         {
            tenor_id = 6;
            show_id = 3;
         }
      }
   }
   else if(tenor_id == 5)
   {
      if(_root.show_id == 2)
      {
         _loc3_ = 1;
         while(_loc3_ <= boomh[0])
         {
            _loc18_ = bd[boomh[_loc3_]];
            _loc14_ = _root.game["house_mov" + _loc3_];
            _loc14_.gotoAndStop(_loc14_._currentframe - 1);
            _loc14_.house.gotoAndPlay(18);
            _root.show_id = 0;
            _loc3_ = _loc3_ + 1;
         }
      }
      else if(_root.show_id == 1)
      {
         _loc3_ = 1;
         while(_loc3_ <= boomh[0])
         {
            _loc14_ = _root.game["house_mov" + _loc3_];
            _loc14_.swapDepths(100);
            _loc14_.removeMovieClip();
            _loc18_ = bd[boomh[_loc3_]];
            _loc17_ = _root.game[_loc18_[12]];
            _loc17_._visible = true;
            _loc3_ = _loc3_ + 1;
         }
         _root.show_id = 0;
         show_id = 3;
         tenor_id = 6;
      }
   }
   else if(tenor_id == 6)
   {
      if(show_id == 3)
      {
         attachMovie("show","show",60000);
         show._x = 400;
         show._y = 300;
         show.show_say1 = "飞弹命中报告";
         if(boomp[0] == 0 && boomh[0] == 0 && boomz[0] == 0)
         {
            show.show_say2 = "飞弹像烟花一样散落城区\r没有引起人们太大的注意\r\r也许下次您该先精确瞄准";
            tenor_id = 18;
            show_id = 0;
         }
         else
         {
            _loc33_ = boomh[0] <= 0 ? "飞弹在城市中引爆" : "飞弹命中了部分街道";
            _loc32_ = boomp[0] <= 0 ? "幸好没人受伤" : "有人受伤了";
            _loc31_ = boomz[0] <= 0 ? "大家好像不是很关心的样子" : "大家纷纷谴责这种行为";
            show.show_say2 = _loc33_ + "\n" + _loc32_ + "\n" + "\n" + _loc31_;
            show_id = 0;
         }
      }
      else if(show_id == 1)
      {
         if(boomp[0] > 0)
         {
            _root.game._x = 352 - boomw[1] * XL;
            _root.game._y = 280 - boomw[2] * YL;
            _root.Gametoxy();
            attachMovie("car2","car2",53005);
            tenor_id = 7;
            show_id = 0;
         }
         else if(boomz[0] > 0)
         {
            tenor_id = 8;
            show_id = 0;
         }
         else
         {
            tenor_id = 18;
            show_id = 1;
         }
      }
   }
   else if(tenor_id == 7)
   {
      if(show_id == 2)
      {
         _loc3_ = 1;
         while(_loc3_ <= boomp[0])
         {
            _loc29_ = _root.game["player" + boomp[_loc3_]];
            if(boomp[_loc3_] == pid)
            {
               _loc29_.swapDepths(30000 + _loc29_._y * 3000 / YL + _loc29_._x * 30 / XL + 8 - pid);
            }
            _loc29_._x = _root.hospitaldate[1] * XL;
            _loc29_._y = _root.hospitaldate[2] * YL;
            _loc27_ = pd[boomp[_loc3_]];
            _loc27_[2] = _root.hospitaldate[0];
            _loc27_[9] = 0;
            brow_pg(boomp[_loc3_],5);
            _loc27_[3] = 3;
            _loc27_[4] = 3;
            _loc29_._visible = false;
            _loc3_ = _loc3_ + 1;
         }
         show_id = 0;
      }
      else if(show_id == 1)
      {
         _loc29_ = _root.game["player" + boomp[1]];
         _root.game._x = 352 - _loc29_._x;
         _root.game._y = 280 - _loc29_._y;
         _root.Gametoxy();
         _root.mood_pg(5);
         show_id = -1;
         timez = 0;
      }
      else if(show_id == -1)
      {
         timez++;
         if(timez >= 40)
         {
            _loc29_ = _root.game["player" + pid];
            _root.game._x = 352 - _loc29_._x;
            _root.game._y = 280 - _loc29_._y;
            _root.Gametoxy();
            timez = 0;
            if(pd[pid][3] == 3)
            {
               _root.mood_pg(5);
               _root.brow_pg(5);
               yesno_id = 1;
            }
            else
            {
               _root.mood_pg(13);
               _root.brow_pg(3);
               yesno_id = 2;
            }
            show_id = -2;
         }
      }
      else if(show_id == -2)
      {
         timez++;
         if(timez >= 40)
         {
            show_id = 0;
            timez = 0;
            if(yesno_id == 1)
            {
               tenor_id = 19;
               over_id = 1;
            }
            else
            {
               tenor_id = 8;
            }
            yesno_id = 0;
         }
      }
   }
   else if(tenor_id == 8)
   {
      if(boomz[0] > 0)
      {
         attachMovie("show","show",60000);
         show._x = 400;
         show._y = 300;
         show.show_say1 = "无妄之灾~~~";
         show.show_say2 = "涉嫌破坏公共建筑\r被其他玩家告发\r\r拘留5天";
         tenor_id = 9;
         show_id = 0;
      }
      else
      {
         tenor_id = 19;
      }
   }
   else if(tenor_id == 9)
   {
      if(show_id == 1)
      {
         attachMovie("car1","car1",53005);
         show_id = 0;
         tenor_id = 10;
      }
   }
   else if(tenor_id == 10)
   {
      if(show_id == 2)
      {
         _loc29_ = _root.game["player" + pid];
         _loc29_.swapDepths(30000 + _loc29_._y * 3000 / YL + _loc29_._x * 30 / XL + 8 - pid);
         _loc29_._x = _root.jaildate[1] * XL;
         _loc29_._y = _root.jaildate[2] * YL;
         _loc27_ = pd[pid];
         _loc27_[2] = _root.jaildate[0];
         _loc27_[9] = 0;
         _root.brow_pg(5);
         _loc27_[3] = 2;
         _loc27_[4] = 5;
         _loc29_._visible = false;
         show_id = 0;
      }
      else if(show_id == 1)
      {
         _loc29_ = _root.game["player" + pid];
         _root.game._x = 352 - _loc29_._x;
         _root.game._y = 280 - _loc29_._y;
         _root.Gametoxy();
         _root.mood_pg(12);
         show_id = 0;
         tenor_id = 11;
      }
   }
   else if(tenor_id == 11)
   {
      if(_root.show_id == 1)
      {
         _root.show_id = 0;
         tenor_id = 19;
         over_id = 1;
      }
   }
   else if(tenor_id == 18)
   {
      if(show_id == 1)
      {
         show_id = 0;
         tenor_id = 19;
      }
   }
   else if(tenor_id == 19)
   {
      show_id = 0;
      gotoAndPlay(100);
      onEnterFrame = null;
   }
}
var boomw = [0,0,0];
var boomp = [0,0,0,0,0,0,0];
var boomh = [0,0,0,0,0,0];
var boomz = [0,"","","","",""];
gotoAndStop(90);
