function AI_build18()
{
   var _loc5_ = playerdate[pid][8];
   var _loc8_;
   if(_loc5_ > 2)
   {
      _loc8_ = moneydate[pid][8];
      if(_loc8_ == 0)
      {
         moneydate[pid][8] = 100000;
         moneydate[pid][1] += 100000;
      }
   }
   var _loc2_;
   var _loc4_;
   var _loc7_;
   var _loc1_;
   if(_loc5_ > 1)
   {
      _loc2_ = pcarddate[pid - 1];
      _loc4_ = _loc2_[0];
      _loc7_ = _loc2_[1];
      if(_loc7_ != 1 && _loc4_ < 24)
      {
         _loc1_ = _loc4_;
         while(_loc1_ > 0)
         {
            _loc2_[_loc1_ + 1] = _loc2_[_loc1_];
            _loc1_ = _loc1_ - 1;
         }
         _loc2_[1] = 1;
         _loc2_[0] = _loc2_[0] + 1;
         moneydate[pid][7] = 100000;
      }
   }
   var _loc6_;
   var _loc9_;
   var _loc3_;
   if(_loc5_ > 0)
   {
      _loc6_ = moneydate[pid][1];
      _loc9_ = moneydate[pid][2];
      _loc3_ = _loc6_ + _loc9_;
      if(_loc3_ > price_id * 300000)
      {
         moneydate[pid][1] = 100000 * price_id + random(30000);
         moneydate[pid][2] = _loc3_ - moneydate[pid][1];
      }
      else if(_loc3_ <= price_id * 300000 && _loc3_ > price_id * 200000)
      {
         moneydate[pid][1] = 80000 * price_id + random(20000);
         moneydate[pid][2] = _loc3_ - moneydate[pid][1];
      }
      else if(_loc3_ <= price_id * 200000 && _loc3_ > price_id * 100000)
      {
         moneydate[pid][1] = 50000 * price_id + random(20000);
         moneydate[pid][2] = _loc3_ - moneydate[pid][1];
      }
      else if(_loc3_ <= price_id * 100000 && _loc3_ > price_id * 40000)
      {
         moneydate[pid][1] = 30000 * price_id + random(10000);
         moneydate[pid][2] = _loc3_ - moneydate[pid][1];
      }
      else if(_loc3_ <= price_id * 40000)
      {
         moneydate[pid][1] = _loc3_;
         moneydate[pid][2] = 0;
      }
   }
   sport_id = 3;
}
function AI_build19()
{
   sport_id = 3;
}
function AI_build1919()
{
   var _loc4_ = moneydate[pid][12];
   var _loc2_ = moneydate[pid][1];
   var _loc3_ = moneydate[pid][2];
   var _loc5_ = _loc2_ + _loc3_;
   var _loc1_ = playerdate[pid][8];
   if(_loc1_ > 2)
   {
   }
   if(_loc1_ > 1)
   {
   }
   if(_loc1_ > 0)
   {
   }
   sport_id = 3;
}
function grelease()
{
   map_say.gotoAndStop(1);
}
function gpress()
{
   var _loc9_ = _xmouse;
   var _loc10_ = _ymouse;
   var _loc17_ = game._xmouse;
   var _loc18_ = game._ymouse;
   var _loc13_;
   var _loc12_;
   var _loc3_;
   var _loc5_;
   var _loc8_;
   var _loc26_;
   var _loc25_;
   var _loc20_;
   var _loc11_;
   var _loc19_;
   var _loc15_;
   var _loc2_;
   var _loc22_;
   var _loc24_;
   var _loc6_;
   var _loc4_;
   var _loc7_;
   var _loc1_;
   var _loc14_;
   var _loc21_;
   var _loc23_;
   var _loc16_;
   if(system_id == 0 && sport_id == 0 && begin_id == 1 && _loc10_ > 50 && _loc10_ < 600 && _loc9_ > 0 && _loc9_ < 750)
   {
      _loc13_ = int(_loc17_ / XL);
      _loc12_ = int(_loc18_ / YL);
      _loc3_ = mapdate[_loc12_][_loc13_];
      _loc5_ = 0;
      if(_loc10_ < 200 && _loc9_ < 500)
      {
         map_say.gotoAndStop(3);
      }
      else if(_loc10_ < 200 && _loc9_ >= 500)
      {
         map_say.gotoAndStop(4);
      }
      else if(_loc10_ >= 200 && _loc9_ >= 500)
      {
         map_say.gotoAndStop(5);
      }
      else
      {
         map_say.gotoAndStop(2);
      }
      map_say._x = _loc9_;
      map_say._y = _loc10_;
      _loc8_ = builddate[_loc3_][1];
      if(_loc8_ == 0)
      {
         _loc26_ = _loc13_ * XL + XL / 2 - _loc17_;
         _loc25_ = _loc12_ * YL + YL / 2 - _loc18_;
         _loc20_ = (- Math.atan2(_loc26_,_loc25_)) / 0.017453292519943295;
         _loc11_ = int((_loc20_ + 225) / 90) + 1;
         if(_loc11_ == 5)
         {
            _loc11_ = 1;
         }
         _loc19_ = [0,[1,0],[0,-1],[-1,0],[0,1]];
         _loc3_ = mapdate[_loc12_ + _loc19_[_loc11_][0]][_loc13_ + _loc19_[_loc11_][1]];
      }
      _loc15_ = builddate[_loc3_][7];
      map_say.say_0 = _loc15_ == null ? "明日天空城" : _loc15_;
      _loc2_ = 1;
      while(_loc2_ <= 6)
      {
         map_say["say_" + _loc2_] = "";
         _loc2_ = _loc2_ + 1;
      }
      _loc8_ = builddate[_loc3_][1];
      if(_loc8_ == 16)
      {
         _loc22_ = builddate[_loc3_][3];
         if(_loc22_ % 2 == 0)
         {
            _loc24_ = builddate[_loc3_ - 1][4];
            _loc6_ = builddate[_loc3_ - 1][2];
            _loc4_ = builddate[_loc3_ - 1][0];
            if(_loc4_ == 0)
            {
               map_say.say_3 = "地价：";
               map_say.say_4 = builddate[_loc3_ - 1][8];
            }
            else
            {
               if(_loc24_ == 6)
               {
                  _loc5_ = moneydate[_loc4_][11] * 2000;
                  map_say.say_5 = "共计" + moneydate[_loc4_][11] + "家";
                  map_say.say_6 = "连锁店";
               }
               else
               {
                  _loc7_ = housedate[_loc4_][_loc6_][0];
                  _loc2_ = 0;
                  while(_loc2_ < _loc7_)
                  {
                     _loc1_ = housedate[_loc4_][_loc6_][1][_loc2_];
                     _loc5_ += hiredate[builddate[_loc1_][4]] * builddate[_loc1_][8];
                     _loc2_ = _loc2_ + 1;
                  }
               }
               map_say.say_1 = "地主：";
               map_say.say_2 = playerdate[_loc4_][0];
               map_say.say_3 = "付费：";
               map_say.say_4 = _loc5_ * price_id;
            }
         }
      }
      else if(_loc8_ <= 15 && _loc8_ >= 1)
      {
         _loc22_ = builddate[_loc3_][3];
         if(_loc22_ == 2)
         {
            _loc14_ = stockdate[_loc8_][19];
            _loc21_ = playerdate[_loc14_][0];
            _loc23_ = builddate[_loc3_][9];
            if(_loc14_ > 0)
            {
               map_say.say_1 = "总裁：";
               map_say.say_2 = _loc21_;
            }
            _loc16_ = stockdate[_loc8_][17];
            if(_loc16_ > 0)
            {
               map_say.say_3 = "累计盈利：";
               map_say.say_4 = _loc16_;
            }
            if(_loc23_ > 0)
            {
               map_say.say_5 = "待购股份：";
               map_say.say_6 = _loc23_;
            }
         }
      }
      else if(_loc8_ == 23)
      {
         _loc22_ = builddate[_loc3_][3];
         if(_loc22_ == 2)
         {
            _loc23_ = builddate[_loc3_][9];
            map_say.say_5 = "累计金额：";
            map_say.say_6 = _loc23_;
         }
      }
   }
}
function grelease1()
{
   map_say1.gotoAndStop(1);
}
function gpress1()
{
   var _loc9_ = _xmouse;
   var _loc10_ = _ymouse;
   var _loc17_ = game1._xmouse;
   var _loc18_ = game1._ymouse;
   var _loc13_;
   var _loc12_;
   var _loc3_;
   var _loc5_;
   var _loc8_;
   var _loc26_;
   var _loc25_;
   var _loc20_;
   var _loc11_;
   var _loc19_;
   var _loc15_;
   var _loc2_;
   var _loc22_;
   var _loc24_;
   var _loc6_;
   var _loc4_;
   var _loc7_;
   var _loc1_;
   var _loc14_;
   var _loc21_;
   var _loc23_;
   var _loc16_;
   if(_loc10_ > 50 && _loc10_ < 600 && _loc9_ > 0 && _loc9_ < 750)
   {
      _loc13_ = int(_loc17_ / XL);
      _loc12_ = int(_loc18_ / YL);
      _loc3_ = mapdate[_loc12_][_loc13_];
      _loc5_ = 0;
      if(_loc10_ < 200 && _loc9_ < 500)
      {
         map_say1.gotoAndStop(3);
      }
      else if(_loc10_ < 200 && _loc9_ >= 500)
      {
         map_say1.gotoAndStop(4);
      }
      else if(_loc10_ >= 200 && _loc9_ >= 500)
      {
         map_say1.gotoAndStop(5);
      }
      else
      {
         map_say1.gotoAndStop(2);
      }
      map_say1._x = _loc9_;
      map_say1._y = _loc10_;
      _loc8_ = builddate[_loc3_][1];
      if(_loc8_ == 0)
      {
         _loc26_ = _loc13_ * XL + XL / 2 - _loc17_;
         _loc25_ = _loc12_ * YL + YL / 2 - _loc18_;
         _loc20_ = (- Math.atan2(_loc26_,_loc25_)) / 0.017453292519943295;
         _loc11_ = int((_loc20_ + 225) / 90) + 1;
         if(_loc11_ == 5)
         {
            _loc11_ = 1;
         }
         _loc19_ = [0,[1,0],[0,-1],[-1,0],[0,1]];
         _loc3_ = mapdate[_loc12_ + _loc19_[_loc11_][0]][_loc13_ + _loc19_[_loc11_][1]];
      }
      _loc15_ = builddate[_loc3_][7];
      map_say1.say_0 = _loc15_ == null ? "明日城" : _loc15_;
      _loc2_ = 1;
      while(_loc2_ <= 6)
      {
         map_say1["say_" + _loc2_] = "";
         _loc2_ = _loc2_ + 1;
      }
      _loc8_ = builddate[_loc3_][1];
      if(_loc8_ == 16)
      {
         _loc22_ = builddate[_loc3_][3];
         if(_loc22_ % 2 == 0)
         {
            _loc24_ = builddate[_loc3_ - 1][4];
            _loc6_ = builddate[_loc3_ - 1][2];
            _loc4_ = builddate[_loc3_ - 1][0];
            if(_loc4_ == 0)
            {
               map_say1.say_3 = "地价：";
               map_say1.say_4 = builddate[_loc3_ - 1][8];
            }
            else
            {
               if(_loc24_ == 6)
               {
                  _loc5_ = moneydate[_loc4_][11] * 2000;
                  map_say1.say_5 = "共计" + moneydate[_loc4_][11] + "家";
                  map_say1.say_6 = "连锁店";
               }
               else
               {
                  _loc7_ = housedate[_loc4_][_loc6_][0];
                  _loc2_ = 0;
                  while(_loc2_ < _loc7_)
                  {
                     _loc1_ = housedate[_loc4_][_loc6_][1][_loc2_];
                     _loc5_ += hiredate[builddate[_loc1_][4]] * builddate[_loc1_][8];
                     _loc2_ = _loc2_ + 1;
                  }
               }
               map_say1.say_1 = "地主：";
               map_say1.say_2 = playerdate[_loc4_][0];
               map_say1.say_3 = "付费：";
               map_say1.say_4 = _loc5_ * price_id;
            }
         }
      }
      else if(_loc8_ <= 15 && _loc8_ >= 1)
      {
         _loc22_ = builddate[_loc3_][3];
         if(_loc22_ == 2)
         {
            _loc14_ = stockdate[_loc8_][19];
            _loc21_ = playerdate[_loc14_][0];
            _loc23_ = builddate[_loc3_][9];
            if(_loc14_ > 0)
            {
               map_say1.say_1 = "总裁：";
               map_say1.say_2 = _loc21_;
            }
            _loc16_ = stockdate[_loc8_][17];
            if(_loc16_ > 0)
            {
               map_say1.say_3 = "累计盈利：";
               map_say1.say_4 = _loc16_;
            }
            if(_loc23_ > 0)
            {
               map_say1.say_5 = "待购股份：";
               map_say1.say_6 = _loc23_;
            }
         }
      }
      else if(_loc8_ == 23)
      {
         _loc22_ = builddate[_loc3_][3];
         if(_loc22_ == 2)
         {
            _loc23_ = builddate[_loc3_][9];
            map_say1.say_5 = "累计金额：";
            map_say1.say_6 = _loc23_;
         }
      }
   }
}
function putbalk()
{
   var _loc14_ = new Array();
   var _loc6_ = 1;
   var _loc4_;
   var _loc13_;
   var _loc12_;
   while(_loc6_ <= znum)
   {
      _loc4_ = game["player" + _loc6_];
      if(_loc4_)
      {
         _loc13_ = _loc4_._x / XL;
         _loc12_ = _loc4_._y / YL;
         _loc14_[_loc6_ - 1] = mapdate[_loc12_][_loc13_];
      }
      _loc6_ = _loc6_ + 1;
   }
   var _loc3_ = new Array();
   var _loc15_ = 0;
   var _loc17_ = builddate.length;
   _loc6_ = 1;
   var _loc5_;
   var _loc11_;
   var _loc9_;
   var _loc10_;
   while(_loc6_ < _loc17_)
   {
      _loc5_ = builddate[_loc6_];
      _loc11_ = _loc5_[1];
      if(_loc11_ < 23)
      {
         _loc9_ = _loc5_[6];
         _loc10_ = _loc5_[10];
         if(_loc9_ > 0 && _loc10_ == 0)
         {
            _loc3_[_loc15_] = _loc6_;
            _loc15_ = _loc15_ + 1;
         }
      }
      _loc6_ = _loc6_ + 1;
   }
   var _loc16_ = _loc14_.length;
   var _loc7_ = _loc3_.length;
   _loc6_ = 0;
   var _loc8_;
   var _loc1_;
   var _loc2_;
   while(_loc6_ < _loc16_)
   {
      _loc8_ = _loc14_[_loc6_];
      _loc1_ = 0;
      while(_loc1_ < _loc7_)
      {
         _loc2_ = _loc3_[_loc1_];
         if(_loc8_ == _loc2_)
         {
            _loc3_.splice(_loc1_,1);
            _loc7_ = _loc7_ - 1;
            break;
         }
         _loc1_ = _loc1_ + 1;
      }
      _loc6_ = _loc6_ + 1;
   }
   var _loc18_ = random(_loc7_);
   _loc18_ = _loc3_[_loc18_];
   var _loc19_ = [0,0,0];
   _loc19_[0] = builddate[_loc18_][13];
   _loc19_[1] = builddate[_loc18_][14];
   _loc19_[2] = _loc18_;
   return _loc19_;
}
function setnpc(id)
{
   var _loc3_ = "npc" + id;
   var _loc1_ = game.attachMovie(_loc3_,_loc3_,100);
   var _loc2_ = putbalk();
   _loc1_._x = _loc2_[0] * XL;
   _loc1_._y = _loc2_[1] * YL;
   _loc1_.swapDepths(30000 + _loc1_._y * 3000 / YL + _loc1_._x * 30 / XL + 10);
   builddate[_loc2_[2]][10] = Number(id);
   builddate[_loc2_[2]][11] = _loc3_;
}
function Gametoxy()
{
   gamex = game._x;
   gamey = game._y;
   var _loc2_ = 184 - gamex;
   var _loc1_ = 313 - gamey;
   if(_loc2_ < 0 || _loc1_ < 0 || _loc2_ > 1900 || _loc1_ > 1952)
   {
      mapshow.fillRect(new flash.geom.Rectangle(0,0,800,600),6737151);
   }
   mapshow.copyPixels(mapload,new flash.geom.Rectangle(184 - gamex,313 - gamey,800,600),new flash.geom.Point(0,0));
}
function setGameHide()
{
   game._visible = false;
   mapz._visible = false;
}
function setGameShow()
{
   game._visible = true;
   mapz._visible = true;
}
function loadsay(id)
{
   loading.say = id + " %";
   loading.loading.gotoAndStop(id);
}
function setNewGame()
{
   var _loc5_;
   var _loc11_;
   var _loc17_;
   var _loc16_;
   var _loc2_;
   var _loc4_;
   var _loc3_;
   var _loc12_;
   var _loc1_;
   var _loc7_;
   var _loc10_;
   var _loc9_;
   var _loc8_;
   var _loc6_;
   var _loc13_;
   var _loc15_;
   var _loc14_;
   if(tenor_id == 0)
   {
      if(seeload == 0)
      {
         attachMovie("loading","loading",99000);
         loadsay(1);
         seeload++;
      }
      else if(seeload == 1)
      {
         setMC1();
         seeload++;
      }
      else if(seeload == 2)
      {
         setMC2();
         seeload++;
      }
      else if(seeload == 3)
      {
         seeload = 0;
         loadsay(random(5) + 2);
         tenor_id++;
      }
   }
   else if(tenor_id == 1)
   {
      attachMovie("game","game",11110);
      loadsay(random(9) + 10);
      tenor_id++;
   }
   else if(tenor_id == 2)
   {
      if(game._width > 0)
      {
         attachMovie("mask","mask",11120);
         game.setMask(mask);
         attachMovie("map_say","map_say",11130);
         loadsay(random(5) + 20);
         tenor_id++;
      }
   }
   else if(tenor_id == 3)
   {
      if(seeload == 0)
      {
         _loc5_ = 1;
         while(_loc5_ <= znum)
         {
            game.createEmptyMovieClip("player" + _loc5_,100 + _loc5_);
            _loc5_ = _loc5_ + 1;
         }
         _loc11_ = "star" + playerdate[1][7] + ".swf";
         game.player1.loadMovie(_loc11_);
         seeload++;
      }
      else if(seeload == 1)
      {
         _loc17_ = game.player1.getBytesLoaded();
         _loc16_ = game.player1.getBytesTotal();
         if(_loc17_ == _loc16_)
         {
            _loc11_ = "star" + playerdate[2][7] + ".swf";
            game.player2.loadMovie(_loc11_);
            seeload++;
         }
      }
      else if(seeload == 2)
      {
         _loc17_ = game.player2.getBytesLoaded();
         _loc16_ = game.player2.getBytesTotal();
         if(_loc17_ == _loc16_)
         {
            _loc11_ = "star" + playerdate[3][7] + ".swf";
            game.player3.loadMovie(_loc11_);
            seeload++;
         }
      }
      else if(seeload == 3)
      {
         _loc17_ = game.player3.getBytesLoaded();
         _loc16_ = game.player3.getBytesTotal();
         if(_loc17_ == _loc16_)
         {
            _loc11_ = "star" + playerdate[4][7] + ".swf";
            game.player4.loadMovie(_loc11_);
            seeload++;
         }
      }
      else if(seeload == 4)
      {
         _loc17_ = game.player4.getBytesLoaded();
         _loc16_ = game.player4.getBytesTotal();
         if(_loc17_ == _loc16_)
         {
            seeload++;
         }
      }
      else if(seeload == 5)
      {
         seeload++;
      }
      else if(seeload == 6)
      {
         _loc5_ = 1;
         while(_loc5_ <= znum)
         {
            _loc2_ = game["player" + _loc5_];
            _loc4_ = startpdate[start_arr[_loc5_]][random(2)];
            _loc2_._x = _loc4_[1] * XL;
            _loc2_._y = _loc4_[2] * YL;
            _loc2_.swapDepths(30000 + _loc2_._y * 3000 / YL + _loc2_._x * 30 / XL + 8 - _loc5_);
            _loc2_.gotoAndStop((_loc4_[0] - 1) * 30 + 1);
            playerdate[_loc5_][2] = _loc4_[0];
            _loc5_ = _loc5_ + 1;
         }
         seeload = 0;
         loadsay(random(9) + 40);
         tenor_id++;
      }
   }
   else if(tenor_id == 4)
   {
      _loc5_ = 1;
      while(_loc5_ <= znum)
      {
         _loc11_ = "gufen" + playerdate[_loc5_][7];
         _loc3_ = game.attachMovie(_loc11_,"gufen" + _loc5_,100 + _loc5_);
         _loc12_ = startpdate[start_arr[_loc5_]][2];
         _loc3_._x = _loc12_[0];
         _loc3_._y = _loc12_[1];
         _loc3_.swapDepths(30000 + _loc3_._y * 3000 / YL + _loc3_._x * 30 / XL + 0);
         _loc1_ = stockdate[playerdate[_loc5_][7]];
         _loc1_[10 + _loc5_][0] = 3000;
         _loc1_[10 + _loc5_][1] = 10;
         _loc1_[18] = 2;
         _loc1_[19] = _loc5_;
         _loc1_[20] = startpdate[start_arr[_loc5_]][3];
         _loc1_[1] = 20;
         _loc1_[2] = 19;
         _loc1_[3] = 20;
         _loc1_[4] = 1;
         _loc1_[5] = 25;
         _loc1_[6] = 15;
         _loc7_ = builddate[_loc1_[20]];
         _loc10_ = builddate[_loc1_[20] - 1];
         _loc9_ = builddate[_loc1_[20] - 2];
         _loc7_[9] = 2000;
         _loc8_ = playerdate[_loc5_][7];
         _loc7_[1] = _loc8_;
         _loc10_[1] = _loc8_;
         _loc9_[1] = _loc8_;
         _loc8_ = _loc1_[0];
         _loc7_[7] = _loc8_;
         _loc10_[7] = _loc8_;
         _loc9_[7] = _loc8_;
         _loc5_ = _loc5_ + 1;
      }
      loadsay(random(5) + 50);
      tenor_id++;
   }
   else if(tenor_id == 5)
   {
      ppid = game["player" + pid];
      gamex = 352 - ppid._x;
      gamey = 280 - ppid._y;
      game._x = gamex;
      game._y = gamey;
      loadsay(random(5) + 55);
      tenor_id++;
   }
   else if(tenor_id == 6)
   {
      _loc5_ = 1;
      while(_loc5_ <= 56)
      {
         _loc6_ = builddate[_loc5_ * 2];
         _loc11_ = "brand" + _loc5_;
         _loc2_ = game.attachMovie("brand",_loc11_,100 + _loc5_);
         _loc13_ = builddate[_loc5_ * 2 - 1][6];
         _loc2_._x = _loc6_[13] * XL;
         _loc2_._y = _loc6_[14] * YL;
         _loc2_.gotoAndStop(_loc13_);
         _loc2_.swapDepths(30000 + _loc2_._y * 3000 / YL + _loc2_._x * 30 / XL + 0);
         _loc6_[12] = _loc11_;
         _loc5_ = _loc5_ + 1;
      }
      loadsay(random(9) + 60);
      tenor_id++;
   }
   else if(tenor_id == 7)
   {
      _loc15_ = balkdate.length;
      _loc5_ = 1;
      while(_loc5_ < _loc15_)
      {
         _loc14_ = balkdate[_loc5_][1];
         if(_loc14_ == 1)
         {
            setnpc(_loc5_);
         }
         _loc5_ = _loc5_ + 1;
      }
      loadsay(random(9) + 70);
      tenor_id++;
   }
   else if(tenor_id == 8)
   {
      mapload = flash.display.BitmapData.loadBitmap("map");
      mapshow = new flash.display.BitmapData(800,600,true,0);
      createEmptyMovieClip("mapz",9999);
      mapz.attachBitmap(mapshow,99,"auto",true);
      loadsay(random(3) + 80);
      tenor_id++;
   }
   else if(tenor_id == 9)
   {
      Gametoxy();
      mapz.onRelease = grelease;
      mapz.onPress = gpress;
      mapz.useHandCursor = false;
      loadsay(random(5) + 80);
      tenor_id++;
   }
   else if(tenor_id == 10)
   {
      attachMovie("face","face",11150);
      loadsay(random(5) + 85);
      tenor_id++;
   }
   else if(tenor_id == 11)
   {
      face.say_m0 = month_id + "月" + day_id + "日";
      face.say_m1 = weekdate[week_id];
      face.face.gotoAndStop(playerdate[pid][7]);
      face.face.name = playerdate[pid][0];
      loadsay(95);
      tenor_id++;
   }
   else if(tenor_id == 12)
   {
      asset_pg();
      changemd_pg();
      timez = 0;
      loadsay(100);
      tenor_id++;
   }
   else if(tenor_id == 13)
   {
      timez++;
      if(timez >= 15)
      {
         timez = 0;
         tenor_id++;
      }
   }
   else if(tenor_id == 14)
   {
      loading.removeMovieClip();
      tenor_id++;
   }
   else if(tenor_id == 15)
   {
      play();
      tenor_id = 0;
      onEnterFrame = null;
   }
}
function setLoadGame()
{
   var _loc9_;
   var _loc35_;
   var _loc33_;
   var _loc41_;
   var _loc40_;
   var _loc21_;
   var _loc12_;
   var _loc2_;
   var _loc23_;
   var _loc31_;
   var _loc29_;
   var _loc28_;
   var _loc27_;
   var _loc24_;
   var _loc7_;
   var _loc22_;
   var _loc8_;
   var _loc14_;
   var _loc20_;
   var _loc18_;
   var _loc11_;
   var _loc39_;
   var _loc38_;
   var _loc3_;
   var _loc10_;
   var _loc15_;
   var _loc32_;
   var _loc19_;
   var _loc17_;
   var _loc4_;
   var _loc30_;
   var _loc26_;
   var _loc36_;
   var _loc37_;
   var _loc6_;
   var _loc1_;
   var _loc34_;
   var _loc25_;
   var _loc5_;
   var _loc16_;
   var _loc13_;
   if(tenor_id == 0)
   {
      if(seeload == 0)
      {
         attachMovie("loading","loading",99000);
         loadsay(1);
         seeload++;
      }
      else if(seeload == 1)
      {
         setMC1();
         seeload++;
      }
      else if(seeload == 2)
      {
         setMC2();
         seeload++;
      }
      else if(seeload == 3)
      {
         seeload = 0;
         loadsay(random(5) + 2);
         tenor_id++;
      }
   }
   else if(tenor_id == 1)
   {
      attachMovie("game","game",1001);
      loadsay(random(9) + 10);
      tenor_id++;
   }
   else if(tenor_id == 2)
   {
      if(game._width > 0)
      {
         game.swapDepths(11110);
         attachMovie("mask","mask",11119);
         mask.swapDepths(11120);
         game.setMask(mask);
         attachMovie("map_say","map_say",11130);
         seeload = 0;
         loadsay(random(5) + 20);
         tenor_id++;
      }
   }
   else if(tenor_id == 3)
   {
      if(seeload == 0)
      {
         _loc9_ = 1;
         while(_loc9_ <= znum)
         {
            game.createEmptyMovieClip("player" + _loc9_,100 + _loc9_);
            _loc9_ = _loc9_ + 1;
         }
         _loc35_ = playerdate[1][3];
         if(_loc35_ != 9)
         {
            _loc33_ = "star" + playerdate[1][7] + ".swf";
            game.player1.loadMovie(_loc33_);
            seeload++;
         }
         else
         {
            game.player1.removeMovieClip();
            seeload += 2;
         }
      }
      else if(seeload == 1)
      {
         _loc41_ = game.player1.getBytesLoaded();
         _loc40_ = game.player1.getBytesTotal();
         if(_loc41_ == _loc40_)
         {
            seeload++;
         }
      }
      else if(seeload == 2)
      {
         _loc35_ = playerdate[2][3];
         if(_loc35_ != 9)
         {
            _loc33_ = "star" + playerdate[2][7] + ".swf";
            game.player2.loadMovie(_loc33_);
            seeload++;
         }
         else
         {
            game.player2.removeMovieClip();
            seeload += 2;
         }
      }
      else if(seeload == 3)
      {
         _loc41_ = game.player2.getBytesLoaded();
         _loc40_ = game.player2.getBytesTotal();
         if(_loc41_ == _loc40_)
         {
            seeload++;
         }
      }
      else if(seeload == 4)
      {
         _loc35_ = playerdate[3][3];
         if(_loc35_ != 9)
         {
            _loc33_ = "star" + playerdate[3][7] + ".swf";
            game.player3.loadMovie(_loc33_);
            seeload++;
         }
         else
         {
            game.player3.removeMovieClip();
            seeload += 2;
         }
      }
      else if(seeload == 5)
      {
         _loc41_ = game.player3.getBytesLoaded();
         _loc40_ = game.player3.getBytesTotal();
         if(_loc41_ == _loc40_)
         {
            seeload++;
         }
      }
      else if(seeload == 6)
      {
         _loc35_ = playerdate[4][3];
         if(_loc35_ != 9)
         {
            _loc33_ = "star" + playerdate[4][7] + ".swf";
            game.player4.loadMovie(_loc33_);
            seeload++;
         }
         else
         {
            game.player4.removeMovieClip();
            seeload += 2;
         }
      }
      else if(seeload == 7)
      {
         _loc41_ = game.player4.getBytesLoaded();
         _loc40_ = game.player4.getBytesTotal();
         if(_loc41_ == _loc40_)
         {
            seeload++;
         }
      }
      else if(seeload == 8)
      {
         timez = 0;
         seeload++;
         loadsay(random(9) + 30);
      }
      else if(seeload == 9)
      {
         timez++;
         if(timez >= 10)
         {
            timez = 0;
            seeload++;
         }
      }
      else if(seeload == 10)
      {
         _loc9_ = 1;
         while(_loc9_ <= znum)
         {
            _loc21_ = playerdate[_loc9_];
            _loc35_ = _loc21_[3];
            if(_loc35_ != 9)
            {
               _loc12_ = game["player" + _loc9_];
               _loc12_._x = _loc21_[13];
               _loc12_._y = _loc21_[14];
               _loc12_.swapDepths(30000 + _loc12_._y * 3000 / YL + _loc12_._x * 30 / XL + 8 - _loc9_);
               _loc2_ = _loc21_[2];
               _loc23_ = _loc21_[9] * 10 + 1;
               _loc12_.gotoAndStop((_loc2_ - 1) * 30 + _loc23_);
               _loc31_ = int((_loc12_._x + waydate1[_loc2_][0]) / XL);
               _loc29_ = int((_loc12_._y + waydate1[_loc2_][1]) / YL);
               _loc28_ = mapdate[_loc29_][_loc31_];
               _loc27_ = builddate[_loc28_][6];
               if(_loc27_ == 0)
               {
                  _loc24_ = _loc2_ % 2 != 1 ? [1,3] : [2,4];
                  _loc2_ = _loc24_(random(_loc24_.length));
                  _loc12_.gotoAndStop((_loc2_ - 1) * 30 + _loc23_);
                  _loc21_[2] = _loc2_;
               }
            }
            _loc9_ = _loc9_ + 1;
         }
         seeload = 0;
         loadsay(random(9) + 40);
         tenor_id++;
      }
   }
   else if(tenor_id == 4)
   {
      _loc9_ = 1;
      while(_loc9_ <= znum)
      {
         _loc33_ = "gufen" + playerdate[_loc9_][7];
         _loc7_ = game.attachMovie(_loc33_,"gufen" + _loc9_,100 + _loc9_);
         _loc22_ = startpdate[start_arr[_loc9_]][2];
         _loc7_._x = _loc22_[0];
         _loc7_._y = _loc22_[1];
         _loc7_.swapDepths(30000 + _loc7_._y * 3000 / YL + _loc7_._x * 30 / XL + 0);
         _loc8_ = stockdate[playerdate[_loc9_][7]];
         _loc14_ = builddate[_loc8_[20]];
         _loc20_ = builddate[_loc8_[20] - 1];
         _loc18_ = builddate[_loc8_[20] - 2];
         _loc11_ = _loc8_[0];
         _loc14_[7] = _loc11_;
         _loc20_[7] = _loc11_;
         _loc18_[7] = _loc11_;
         _loc11_ = playerdate[_loc9_][7];
         _loc14_[1] = _loc11_;
         _loc20_[1] = _loc11_;
         _loc18_[1] = _loc11_;
         _loc9_ = _loc9_ + 1;
      }
      loadsay(random(5) + 50);
      tenor_id++;
   }
   else if(tenor_id == 5)
   {
      face.face.gotoAndStop(playerdate[pid][7]);
      face.face.face.gotoAndStop(7);
      face.face.name = playerdate[pid][0];
      ppid = game["player" + pid];
      ppid.swapDepths(30000 + ppid._y * 3000 / YL + ppid._x * 30 / XL + 8);
      gamex = 352 - ppid._x;
      gamey = 280 - ppid._y;
      game._x = gamex;
      game._y = gamey;
      Gametoxy();
      _loc39_ = playerdate[pid][1];
      _loc38_ = playerdate[pid][4];
      if(_loc39_ == 0 && _loc38_ == 0)
      {
         face.gotoAndStop(1);
         Mouse.hide();
         mouseh._visible = true;
         mouseh.startDrag(true,-300,-300,1600,1000);
      }
      else
      {
         face.gotoAndStop(2);
         Mouse.hide();
         mouseh._visible = false;
      }
      loadsay(random(5) + 55);
      tenor_id++;
   }
   else if(tenor_id == 6)
   {
      _loc9_ = 1;
      while(_loc9_ <= 56)
      {
         _loc3_ = builddate[_loc9_ * 2 - 1];
         _loc10_ = _loc3_[0];
         _loc15_ = _loc3_[4];
         _loc27_ = _loc3_[6];
         _loc32_ = _loc3_[12];
         _loc19_ = _loc3_[13];
         _loc17_ = _loc3_[14];
         if(_loc10_ > 0 || _loc15_ > 0)
         {
            _loc4_ = game.attachMovie("house",_loc32_,100 + _loc9_);
            _loc30_ = _loc10_ != 0 ? _loc10_ : 7;
            _loc4_.land.gotoAndStop(_loc30_);
            _loc4_.gotoAndStop((_loc27_ - 1) * 10 + _loc15_ + 1);
         }
         else
         {
            _loc26_ = builddate[_loc9_ * 2][12];
            _loc4_ = game.attachMovie("brand",_loc26_,100 + _loc9_);
            _loc4_.gotoAndStop(_loc27_);
         }
         _loc4_._x = _loc19_ * XL + waydate1[_loc27_][0];
         _loc4_._y = _loc17_ * YL + waydate1[_loc27_][1];
         _loc4_.swapDepths(30000 + _loc4_._y * 3000 / YL + _loc4_._x * 30 / XL + 0);
         _loc9_ = _loc9_ + 1;
      }
      loadsay(random(9) + 60);
      tenor_id++;
   }
   else if(tenor_id == 7)
   {
      _loc36_ = builddate;
      _loc37_ = _loc36_.length;
      _loc9_ = 0;
      while(_loc9_ < _loc37_)
      {
         _loc6_ = _loc36_[_loc9_];
         _loc27_ = _loc6_[6];
         _loc1_ = _loc6_[10];
         _loc34_ = _loc6_[11];
         _loc19_ = _loc6_[13];
         _loc17_ = _loc6_[14];
         if(_loc1_ > 0)
         {
            if(_loc1_ <= 5 || _loc1_ >= 9)
            {
               _loc25_ = "npc" + _loc1_;
               _loc5_ = game.attachMovie(_loc25_,_loc25_,100);
               _loc5_._x = _loc19_ * XL;
               _loc5_._y = _loc17_ * YL;
               _loc5_.swapDepths(30000 + _loc5_._y * 3000 / YL + _loc5_._x * 30 / XL + 9);
            }
            else if(_loc1_ == 6 || _loc1_ == 7)
            {
               _loc25_ = _loc1_ != 6 ? "mine" : "balk";
               _loc5_ = game.attachMovie(_loc25_,_loc34_,100);
               if(_loc1_ == 6)
               {
                  _loc5_.gotoAndStop(_loc27_);
               }
               _loc5_._x = _loc19_ * XL;
               _loc5_._y = _loc17_ * YL;
               _loc5_.swapDepths(30000 + 3000 * _loc5_._y / YL + 30 * _loc5_._x / XL + 1);
            }
         }
         _loc9_ = _loc9_ + 1;
      }
      _loc9_ = 1;
      while(_loc9_ <= znum)
      {
         _loc12_ = game["player" + _loc9_];
         _loc21_ = playerdate[_loc9_];
         _loc16_ = _loc21_[3];
         if(_loc16_ == 2 || _loc16_ == 3)
         {
            _loc12_._visible = false;
         }
         _loc13_ = _loc21_[5];
         if(_loc13_ > 0)
         {
            _loc12_.npcz.gotoAndStop(_loc13_);
         }
         _loc9_ = _loc9_ + 1;
      }
      loadsay(random(9) + 70);
      tenor_id++;
   }
   else if(tenor_id == 8)
   {
      mapload = flash.display.BitmapData.loadBitmap("map");
      mapshow = new flash.display.BitmapData(800,600,true,0);
      createEmptyMovieClip("mapz",9999);
      mapz.attachBitmap(mapshow,99,"auto",true);
      loadsay(random(5) + 80);
      tenor_id++;
   }
   else if(tenor_id == 9)
   {
      Gametoxy();
      mapz.onRelease = grelease;
      mapz.onPress = gpress;
      mapz.useHandCursor = false;
      loadsay(random(5) + 80);
      tenor_id++;
   }
   else if(tenor_id == 10)
   {
      attachMovie("face","face",11150);
      loadsay(random(5) + 85);
      tenor_id++;
   }
   else if(tenor_id == 11)
   {
      face.say_m0 = month_id + "月" + day_id + "日";
      face.say_m1 = weekdate[week_id];
      face.face.gotoAndStop(playerdate[pid][7]);
      face.face.name = playerdate[pid][0];
      loadsay(95);
      tenor_id++;
   }
   else if(tenor_id == 12)
   {
      asset_pg();
      changemd_pg();
      timez = 0;
      loadsay(100);
      tenor_id++;
   }
   else if(tenor_id == 13)
   {
      timez++;
      if(timez >= 15)
      {
         timez = 0;
         tenor_id++;
      }
   }
   else if(tenor_id == 14)
   {
      loading.removeMovieClip();
      tenor_id++;
   }
   else if(tenor_id == 15)
   {
      play();
      tenor_id = 0;
      onEnterFrame = null;
   }
}
function delplayer()
{
   playerdate[pid][3] = 9;
   var _loc19_ = game["player" + pid];
   _loc19_.swapDepths(100);
   _loc19_.removeMovieClip();
   pnum--;
   var _loc12_ = moneydate[pid];
   var _loc15_ = _loc12_.length;
   var _loc7_ = 1;
   while(_loc7_ < _loc15_)
   {
      _loc12_[_loc7_] = 0;
      _loc7_ = _loc7_ + 1;
   }
   _loc7_ = 1;
   var _loc1_;
   var _loc5_;
   var _loc6_;
   var _loc2_;
   var _loc8_;
   while(_loc7_ <= 15)
   {
      _loc1_ = stockdate[_loc7_];
      if(_loc1_[19] == pid)
      {
         _loc5_ = 0;
         _loc6_ = 0;
         _loc2_ = 1;
         while(_loc2_ <= znum)
         {
            if(_loc2_ != pid)
            {
               if(_loc6_ < _loc1_[_loc2_ + 10][0])
               {
                  _loc6_ = _loc1_[_loc2_ + 10][0];
                  _loc5_ = _loc2_;
               }
            }
            _loc2_ = _loc2_ + 1;
         }
         if(_loc5_ == 0)
         {
            _loc1_[19] = 0;
            builddate[_loc1_[20]][0] = 0;
         }
         else
         {
            _loc1_[19] = _loc5_;
            builddate[_loc1_[20]][0] = _loc5_;
         }
      }
      if(_loc7_ < 13)
      {
         if(_loc1_[18] == 2)
         {
            _loc8_ = 5000 - builddate[_loc1_[20]][9];
            if(_loc1_[pid + 10][0] > _loc8_)
            {
               builddate[_loc1_[20]][9] = 5000;
               _loc1_[10] += _loc1_[pid + 10][0] - _loc8_;
            }
            else
            {
               builddate[_loc1_[20]][9] += _loc1_[pid + 10][0];
            }
         }
         else
         {
            _loc1_[10] += _loc1_[pid + 10][0];
         }
      }
      else
      {
         builddate[_loc1_[20]][9] += _loc1_[pid + 10][0];
      }
      _loc1_[pid + 10][0] = 0;
      _loc1_[pid + 10][1] = 0;
      _loc7_ = _loc7_ + 1;
   }
   var _loc16_ = builddate.length;
   _loc7_ = 1;
   var _loc3_;
   var _loc4_;
   var _loc9_;
   var _loc11_;
   var _loc10_;
   while(_loc7_ < _loc16_)
   {
      _loc3_ = builddate[_loc7_];
      if(_loc3_[0] == pid && _loc3_[1] == 16 && _loc3_[3] % 2 == 1)
      {
         _loc3_[0] = 0;
         game[_loc3_[12]].land.gotoAndStop(7);
         if(_loc3_[4] == 0)
         {
            _loc4_ = game[_loc3_[12]];
            _loc9_ = _loc4_._x;
            _loc11_ = _loc4_._y;
            _loc4_.swapDepths(100);
            _loc4_.removeMovieClip();
            _loc3_[12] = "";
            _loc10_ = builddate[_loc7_ + 1][12];
            _loc4_ = game.attachMovie("brand",_loc10_,100 + _loc7_);
            _loc4_.gotoAndStop(bd6);
            _loc4_._x = _loc9_;
            _loc4_._y = _loc11_;
            _loc4_.swapDepths(30000 + _loc4_._y * 3000 / YL + _loc4_._x * 30 / XL + 0);
         }
      }
      _loc7_ = _loc7_ + 1;
   }
   var _loc13_ = housedate[pid];
   var _loc18_ = _loc13_.length;
   _loc7_ = 1;
   while(_loc7_ < _loc18_)
   {
      _loc13_[_loc7_][0] = 0;
      _loc7_ = _loc7_ + 1;
   }
   var _loc14_ = pcarddate[pid - 1];
   var _loc17_ = _loc14_.length;
   _loc7_ = 0;
   while(_loc7_ < _loc17_)
   {
      _loc14_[_loc7_] = 0;
      _loc7_ = _loc7_ + 1;
   }
}
function delgame()
{
   var _loc2_ = 1;
   var _loc1_;
   while(_loc2_ <= znum)
   {
      _loc1_ = game["player" + _loc2_];
      if(_loc1_)
      {
         _loc1_.unloadMovie();
         _loc1_.swapDepths(100);
         _loc1_.removeMovieClip();
      }
      _loc2_ = _loc2_ + 1;
   }
   for(var _loc3_ in game)
   {
      game[_loc3_].swapDepths(100);
      game[_loc3_].removeMovieClip();
   }
   game.swapDepths(100);
   game.removeMovieClip();
   mask.swapDepths(100);
   mask.removeMovieClip();
   map_say.swapDepths(100);
   map_say.removeMovieClip();
   mapz.swapDepths(100);
   mapz.removeMovieClip();
   delete mapload;
   delete mapshow;
   face.swapDepths(100);
   face.removeMovieClip();
   new_id = 0;
}
function delPart()
{
   delgame();
   new_id = 1;
}
function setMC1()
{
   createEmptyMovieClip("game",160);
   createEmptyMovieClip("mask",161);
   createEmptyMovieClip("map_say",162);
   createEmptyMovieClip("game1",163);
   createEmptyMovieClip("mapz",164);
   createEmptyMovieClip("face",165);
   mapload = new flash.display.BitmapData(1,1,true,0);
   mapshow = new flash.display.BitmapData(1,1,true,0);
}
function setMC2()
{
   game.removeMovieClip();
   game1.removeMovieClip();
   mask.removeMovieClip();
   map_say.removeMovieClip();
   mapz.removeMovieClip();
   face.removeMovieClip();
}
function goback()
{
   if(tenor_id == 0)
   {
      变更地图说明框状态;
      map_say.gotoAndStop(1);
      tenor_id = 1;
   }
   if(tenor_id == 1)
   {
      if(moneydate[pid][1] + moneydate[pid][2] <= 0)
      {
         out_id = playerdate[pid][7];
         attachMovie("bankrupt","bankrupt",61000);
         system_id = 1;
         gotoAndStop(15);
      }
      else
      {
         tenor_id = 2;
      }
   }
   var _loc6_;
   var _loc2_;
   if(tenor_id == 2)
   {
      _loc6_ = 0;
      _loc2_ = pid + 1;
      while(_loc2_ <= znum)
      {
         if(playerdate[_loc2_][3] != 9)
         {
            _loc6_ = _loc6_ + 1;
            break;
         }
         _loc2_ = _loc2_ + 1;
      }
      if(day_id == 1 && _loc6_ == 0)
      {
         attachMovie("bank","bank",61000);
         system_id = 1;
         gotoAndStop(15);
      }
      else
      {
         tenor_id = 3;
      }
   }
   var _loc5_;
   var _loc4_;
   var _loc10_;
   var _loc3_;
   if(tenor_id == 3)
   {
      _loc6_ = 0;
      _loc5_ = 0;
      _loc4_ = 0;
      _loc2_ = 1;
      while(_loc2_ <= znum)
      {
         _loc10_ = playerdate[_loc2_][1];
         _loc3_ = playerdate[_loc2_][3];
         if(_loc10_ != 1 && _loc3_ != 9)
         {
            _loc6_ = _loc6_ + 1;
         }
         if(_loc3_ != 9)
         {
            _loc5_ = _loc5_ + 1;
            _loc4_ = _loc2_;
         }
         _loc2_ = _loc2_ + 1;
      }
      if(_loc6_ == 0)
      {
         attachMovie("gameover","gameover",61000);
         system_id = 1;
         gotoAndStop(15);
      }
      else if(_loc5_ <= 1)
      {
         out_id = playerdate[_loc4_][7];
         attachMovie("gamewin","gamewin",61000);
         system_id = 1;
         gotoAndStop(15);
      }
      else
      {
         tenor_id = 4;
      }
   }
   var _loc1_;
   var _loc8_;
   var _loc11_;
   var _loc9_;
   if(tenor_id == 4)
   {
      ppid = game["player" + pid];
      ppid.swapDepths(30000 + ppid._y * 3000 / YL + ppid._x * 30 / XL + 8 - pid);
      if(supply_id == 1)
      {
         supply_id = 0;
         _loc2_ = 1;
         while(_loc2_ <= znum)
         {
            _loc1_ = playerdate[_loc2_];
            _loc8_ = _loc1_[12];
            if(_loc8_ != -1)
            {
               if(_loc8_ == 1)
               {
                  _loc8_ = 2;
               }
               _loc1_[1] = _loc8_;
               _loc1_[12] = -1;
            }
            _loc2_ = _loc2_ + 1;
         }
      }
      _loc6_ = 0;
      _loc2_ = 1;
      while(_loc2_ <= znmu - 1)
      {
         pid++;
         if(pid > znum)
         {
            pid = 1;
            _loc6_ = 1;
         }
         if(playerdate[pid][3] != 9)
         {
            break;
         }
         _loc2_ = _loc2_ + 1;
      }
      if(_loc6_ == 1)
      {
         checkMoney();
         _loc11_ = [31,28,31,30,31,30,31,31,30,31,30,31];
         day_id++;
         if(day_id > _loc11_[month_id - 1])
         {
            month_id++;
            day_id = 1;
            month_sd_pg();
            price_id = price_pg();
         }
         if(month_id >= 13)
         {
            year_id++;
            month_id = 1;
         }
         week_id++;
         if(week_id >= 7)
         {
            week_id = 0;
            week_sd_pg();
         }
         face.say_m0 = month_id + "月" + day_id + "日";
         face.say_m1 = weekdate[week_id];
         day_sd_pg();
         asset_pg();
         jin_pg();
         if(supply_id == 1)
         {
            supply_id = 0;
            _loc2_ = 1;
            while(_loc2_ <= znum)
            {
               _loc1_ = playerdate[_loc2_];
               _loc8_ = _loc1_[12];
               if(_loc8_ != -1)
               {
                  if(_loc8_ == 1)
                  {
                     _loc8_ = 2;
                  }
                  _loc1_[1] = _loc8_;
                  _loc1_[12] = -1;
               }
               _loc2_ = _loc2_ + 1;
            }
         }
      }
      face.face.gotoAndStop(playerdate[pid][7]);
      face.face.face.gotoAndStop(7);
      face.face.name = playerdate[pid][0];
      ppid = game["player" + pid];
      ppid.swapDepths(30000 + ppid._y * 3000 / YL + ppid._x * 30 / XL + 8);
      game._x = 352 - ppid._x;
      game._y = 280 - ppid._y;
      Gametoxy();
      _loc10_ = playerdate[pid][1];
      _loc9_ = playerdate[pid][4];
      if(_loc10_ == 0 && _loc9_ == 0)
      {
         face.gotoAndStop(1);
         Mouse.hide();
         mouseh._visible = true;
         mouseh.startDrag(true,-300,-300,1600,1000);
         system_id = 0;
      }
      else
      {
         face.gotoAndStop(2);
         Mouse.hide();
         mouseh._visible = false;
      }
      changemd_pg();
      tenor_id = 5;
   }
   var _loc7_;
   if(tenor_id == 5)
   {
      if(pid == 1)
      {
         _loc8_ = gala_arr[month_id];
         if(day_id == _loc8_[1])
         {
            _loc7_ = attachMovie("gala","gala",61000);
            _loc7_._x = 400;
            _loc7_._y = 300;
            _loc7_.pic.gotoAndStop(_loc8_[0]);
            _loc7_.gala_say1 = _loc8_[2];
            _loc7_.gala_say2 = _loc8_[3];
            system_id = 1;
            gotoAndStop(15);
         }
         else
         {
            tenor_id = 6;
         }
      }
      else
      {
         tenor_id = 6;
      }
   }
   if(tenor_id == 6)
   {
      tenor_id = 0;
      sport_id = 0;
      begin_id = 0;
      end_id = 0;
      yesno_id = 0;
      timez = 0;
      show_id = 0;
      gotoAndPlay(10);
   }
}
function run()
{
   var _loc3_;
   var _loc5_;
   if(sport_id == 0)
   {
      _loc3_ = playerdate[pid][3];
      _loc5_ = playerdate[pid][1];
      ppid = game["player" + pid];
      if(_loc3_ == 0)
      {
         if(_loc5_ == 0)
         {
            if(begin_id == 0)
            {
               freenpc();
            }
            else if(begin_id == 2)
            {
               brow_pg(8);
               toss_pg();
               begin_id = 3;
               face.gotoAndStop(2);
            }
            else if(begin_id == 3)
            {
               if(step_id > 0)
               {
                  if(stop_id == 1)
                  {
                     sport_id = 2;
                     end_id = 1;
                     stop_id = 0;
                     step_id = 0;
                     map_say.gotoAndStop(1);
                  }
                  else
                  {
                     goload_pg();
                  }
               }
            }
         }
         else if(_loc5_ > 0)
         {
            if(begin_id == 0)
            {
               freenpc();
            }
            else if(begin_id == 1)
            {
               timez = 0;
               begin_id = 7;
            }
            else if(begin_id != 2)
            {
               if(begin_id != 3)
               {
                  if(begin_id != 4)
                  {
                     if(begin_id == 7)
                     {
                        timez++;
                        if(timez == 1)
                        {
                           brow_pg(7);
                        }
                        else if(timez > 20)
                        {
                           timez = 0;
                           begin_id = 8;
                        }
                     }
                     else if(begin_id == 8)
                     {
                        brow_pg(8);
                        toss_pg();
                        begin_id = 9;
                     }
                     else if(begin_id == 9)
                     {
                        if(step_id > 0)
                        {
                           goload_pg();
                        }
                     }
                  }
               }
            }
         }
      }
      else if(_loc3_ != 1)
      {
         if(_loc3_ != 4)
         {
            if(_loc3_ == 5)
            {
               show2_pg("动弹不得~~~",playerdate[pid][0] + "正在冬眠状态中！");
               sport_id = 4;
               end_id = 8;
            }
            else if(_loc3_ == 2 || _loc3_ == 3)
            {
               setfree_pg();
            }
            else if(_loc3_ == 9)
            {
               gotoAndPlay(12);
            }
         }
      }
   }
   if(sport_id == 1)
   {
      if(x1 != x2)
      {
         ppid._x += lx;
         game._x -= lx;
         x1 = ppid._x;
      }
      if(y1 != y2)
      {
         ppid._y += ly;
         game._y -= ly;
         y1 = ppid._y;
      }
      Gametoxy();
      ppid.swapDepths(30000 + int(ppid._y * 3000 / YL) + int(ppid._x * 30 / XL) + 8);
      if(x1 == x2 && y1 == y2)
      {
         sport_id = 2;
      }
   }
   if(sport_id == 2)
   {
      dz = mapdate[ppid._y / YL][ppid._x / XL];
      da = builddate[dz][5];
      if(da > 0)
      {
         selfveer_pg();
      }
      bd1 = builddate[dz][1];
      if(bd1 == 18)
      {
         _loc5_ = playerdate[pid][1];
         if(_loc5_ == 0)
         {
            self_pg1();
         }
         else
         {
            AI_build18();
         }
      }
      else if(bd1 == 19)
      {
         _loc5_ = playerdate[pid][1];
         if(_loc5_ == 0)
         {
            self_pg2();
         }
         else
         {
            AI_build19();
         }
      }
      else
      {
         sport_id = 3;
      }
   }
   if(sport_id == 3)
   {
      dz = mapdate[ppid._y / YL][ppid._x / XL];
      bd1 = builddate[dz][1];
      bd10 = builddate[dz][10];
      if(bd10 == 6)
      {
         balk_pg6();
      }
      else
      {
         step_id--;
         if(step_id < 0)
         {
            step_id = 0;
         }
         sport_id = step_id != 0 ? 0 : 4;
      }
   }
   var _loc4_;
   if(sport_id == 4)
   {
      if(end_id == 0)
      {
         dz = mapdate[ppid._y / YL][ppid._x / XL];
         bd10 = builddate[dz][10];
         if(bd10 > 0)
         {
            _root["balk_pg" + bd10]();
         }
         else
         {
            end_id = 1;
         }
      }
      else if(end_id == 1)
      {
         brow_pg(1);
         dz = mapdate[ppid._y / YL][ppid._x / XL];
         bd1 = builddate[dz][1];
         _loc4_ = playerdate[pid][5];
         if(bd1 == 16 && (_loc4_ == 10 || _loc4_ == 11))
         {
            end_id = _loc4_ != 10 ? 3 : 2;
         }
         else
         {
            end_id = 5;
         }
      }
      else if(end_id == 2)
      {
         faery_10();
      }
      else if(end_id == 3)
      {
         faery_11();
      }
      else if(end_id == 5)
      {
         dz = mapdate[ppid._y / YL][ppid._x / XL];
         bd1 = builddate[dz][1];
         pg_id = bd1;
         if(pg_id < 16)
         {
            pg_id = 1;
         }
         end_id = 6;
      }
      else if(end_id == 6)
      {
         this["end_pg" + pg_id]();
      }
      else if(end_id == 8)
      {
         changemd_pg();
         timez = 0;
         end_id = 9;
      }
      else if(end_id == 9)
      {
         timez++;
         if(timez > 50)
         {
            timez = 0;
            end_id = 0;
            sport_id = 0;
            gotoAndPlay(12);
         }
      }
   }
}
var mapload;
var mapshow;
var timez = 0;
var seeload = 0;
