function balk_pg1()
{
   var _loc7_;
   var _loc2_;
   var _loc5_;
   var _loc4_;
   var _loc3_;
   var _loc6_;
   var _loc8_;
   var _loc9_;
   var _loc1_;
   if(tenor_id == 0)
   {
      tenor_id = 1;
      timez = 0;
      show_id = 0;
      _loc7_ = game.attachMovie("fog","fog",100);
      _loc7_._x = ppid._x;
      _loc7_._y = ppid._y;
      _loc2_ = _loc7_._x / XL;
      _loc5_ = _loc7_._y / YL;
      _loc7_.swapDepths(30000 + 3000 * _loc5_ + 30 * _loc2_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez == 15)
      {
         _loc7_ = game[builddate[dz][11]];
         _loc7_.swapDepths(110);
         _loc7_.removeMovieClip();
         timez = 0;
         _loc4_ = playerdate[pid][1];
         if(_loc4_ == 0)
         {
            _loc7_ = attachMovie("witch","witch",60000);
            tenor_id = 2;
         }
         else
         {
            tenor_id = 4;
         }
      }
   }
   else if(tenor_id != 2)
   {
      if(tenor_id == 3)
      {
         tenor_id = 8;
      }
      else if(tenor_id == 4)
      {
         _loc3_ = moneydate[pid][1];
         _loc6_ = moneydate[pid][2];
         _loc8_ = _loc3_ + _loc6_;
         _loc9_ = moneydate[pid][3];
         _loc1_ = playerdate[pid][8];
         if(_loc1_ > 2)
         {
         }
         if(_loc1_ > 1)
         {
         }
         if(_loc1_ > 0)
         {
         }
         tenor_id = 8;
      }
      else if(tenor_id == 8)
      {
         setnpc(1);
         tenor_id = 9;
      }
      else if(tenor_id == 9)
      {
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         yesno_id = 0;
         tenor_id = 0;
         end_id = 1;
         asset_pg();
      }
   }
}
function balk_pg2()
{
   var _loc1_;
   var _loc3_;
   var _loc4_;
   var _loc2_;
   if(tenor_id == 0)
   {
      tenor_id = 1;
      timez = 0;
      show_id = 0;
      _loc1_ = game.attachMovie("fog","fog",100);
      _loc1_._x = ppid._x;
      _loc1_._y = ppid._y;
      _loc3_ = _loc1_._x / XL;
      _loc4_ = _loc1_._y / YL;
      _loc1_.swapDepths(30000 + 3000 * _loc4_ + 30 * _loc3_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez == 10)
      {
         _loc1_ = game[builddate[dz][11]];
         _loc1_.swapDepths(110);
         _loc1_.removeMovieClip();
         _loc2_ = playerdate[pid][5];
         if(_loc2_ > 0)
         {
            setnpc(_loc2_);
         }
         ppid.npcz.gotoAndStop(2);
         tenor_id = 2;
         timez = 0;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         _loc1_ = attachMovie("show_npc2","show_npc2",50000);
         _loc1_._x = 400;
         _loc1_._y = 300;
         _loc1_.show_say1 = "恭喜发财";
         _loc1_.show_say2 = "财神附体，赠送现钞";
         show_id = 0;
         yesno_id = 0;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         brow_pg(3);
         mood_pg(4);
         moneydate[pid][1] += yesno_id;
         yesno_id = 0;
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         playerdate[pid][5] = 2;
         playerdate[pid][6] = 7;
         show_id = 0;
         tenor_id = 0;
         end_id = 1;
         asset_pg();
      }
   }
}
function balk_pg3()
{
   var _loc1_;
   var _loc3_;
   var _loc4_;
   var _loc2_;
   if(tenor_id == 0)
   {
      tenor_id = 1;
      timez = 0;
      show_id = 0;
      _loc1_ = game.attachMovie("fog","fog",100);
      _loc1_._x = ppid._x;
      _loc1_._y = ppid._y;
      _loc3_ = _loc1_._x / XL;
      _loc4_ = _loc1_._y / YL;
      _loc1_.swapDepths(30000 + 3000 * _loc4_ + 30 * _loc3_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez == 10)
      {
         _loc1_ = game[builddate[dz][11]];
         _loc1_.swapDepths(110);
         _loc1_.removeMovieClip();
         _loc2_ = playerdate[pid][5];
         if(_loc2_ > 0)
         {
            setnpc(_loc2_);
         }
         ppid.npcz.gotoAndStop(3);
         tenor_id = 2;
         timez = 0;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         show_id = 0;
         if(moneydate[pid][1] > 0)
         {
            _loc1_ = attachMovie("show_npc2","show_npc2",50000);
            _loc1_._x = 400;
            _loc1_._y = 300;
            _loc1_.show_say1 = "财散人安乐~~";
            _loc1_.show_say2 = "穷神附体，遗失现金";
            yesno_id = -1;
            tenor_id = 3;
         }
         else
         {
            show2_pg("穷神感慨~~","你居然比我这个穷神还穷啊！");
            tenor_id = 4;
         }
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         brow_pg(5);
         mood_pg(5);
         moneydate[pid][1] -= yesno_id;
         if(moneydate[pid][1] < 0)
         {
            moneydate[pid][1] = 0;
         }
         builddate[159][9] += yesno_id;
         builddate[160][9] += yesno_id;
         yesno_id = 0;
         show_id = 0;
         tenor_id = 5;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         brow_pg(5);
         mood_pg(11);
         show_id = 0;
         tenor_id = 5;
      }
   }
   else if(tenor_id == 5)
   {
      if(show_id == 1)
      {
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         playerdate[pid][5] = 3;
         playerdate[pid][6] = 7;
         show_id = 0;
         tenor_id = 0;
         end_id = 1;
         asset_pg();
      }
   }
}
function balk_pg4()
{
   var _loc2_;
   var _loc6_;
   var _loc10_;
   var _loc4_;
   var _loc1_;
   var _loc3_;
   var _loc5_;
   var _loc9_;
   var _loc8_;
   var _loc7_;
   if(tenor_id == 0)
   {
      tenor_id = 1;
      timez = 0;
      show_id = 0;
      _loc2_ = game.attachMovie("fog","fog",100);
      _loc2_._x = ppid._x;
      _loc2_._y = ppid._y;
      _loc6_ = _loc2_._x / XL;
      _loc10_ = _loc2_._y / YL;
      _loc2_.swapDepths(30000 + 3000 * _loc10_ + 30 * _loc6_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez == 10)
      {
         _loc2_ = game[builddate[dz][11]];
         _loc2_.swapDepths(110);
         _loc2_.removeMovieClip();
         _loc4_ = playerdate[pid][5];
         if(_loc4_ > 0)
         {
            setnpc(_loc4_);
         }
         ppid.npcz.gotoAndStop(4);
         tenor_id = 2;
         timez = 0;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         _loc1_ = pcarddate[pid - 1];
         _loc3_ = _loc1_[0];
         _loc5_ = _loc1_[23];
         _loc9_ = _loc1_[24];
         if(_loc3_ < 23)
         {
            _loc8_ = outcard();
            _loc7_ = outcard();
            _loc1_[0] += 2;
            _loc1_[_loc1_[0] - 1] = _loc8_;
            _loc1_[_loc1_[0]] = _loc7_;
         }
         else if(_loc3_ == 23)
         {
            _loc8_ = _loc5_;
            _loc7_ = outcard();
            _loc1_[0] = 24;
            _loc1_[_loc1_[0]] = _loc7_;
         }
         else if(_loc3_ == 24)
         {
            _loc8_ = _loc5_;
            _loc7_ = _loc9_;
         }
         _loc2_ = attachMovie("show_npc4","show_npc4",50000);
         _loc2_._x = 400;
         _loc2_._y = 300;
         _loc2_.show_say1 = "鸿运当头";
         _loc2_.show_say2 = "福神附体，赠送卡片";
         _loc2_.show_say3 = carddate[_loc8_][0];
         _loc2_.show_say4 = carddate[_loc7_][0];
         show_id = 0;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         brow_pg(3);
         mood_pg(4);
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         playerdate[pid][5] = 4;
         playerdate[pid][6] = 7;
         show_id = 0;
         tenor_id = 0;
         end_id = 1;
         asset_pg();
      }
   }
}
function balk_pg5()
{
   var _loc5_;
   var _loc8_;
   var _loc10_;
   var _loc6_;
   var _loc1_;
   var _loc3_;
   var _loc7_;
   var _loc9_;
   var _loc4_;
   var _loc2_;
   if(tenor_id == 0)
   {
      tenor_id = 1;
      timez = 0;
      show_id = 0;
      _loc5_ = game.attachMovie("fog","fog",100);
      _loc5_._x = ppid._x;
      _loc5_._y = ppid._y;
      _loc8_ = _loc5_._x / XL;
      _loc10_ = _loc5_._y / YL;
      _loc5_.swapDepths(30000 + 3000 * _loc10_ + 30 * _loc8_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez == 10)
      {
         _loc5_ = game[builddate[dz][11]];
         _loc5_.swapDepths(110);
         _loc5_.removeMovieClip();
         _loc6_ = playerdate[pid][5];
         if(_loc6_ > 0)
         {
            setnpc(_loc6_);
         }
         ppid.npcz.gotoAndStop(5);
         tenor_id = 2;
         timez = 0;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         _loc1_ = pcarddate[pid - 1];
         _loc3_ = _loc1_[0];
         _loc7_ = _loc1_[1];
         _loc9_ = _loc1_[2];
         if(_loc3_ > 2)
         {
            _loc4_ = random(_loc3_) + 1;
            r1 = _loc1_[_loc4_];
            _loc2_ = _loc4_;
            while(_loc2_ <= _loc3_)
            {
               _loc1_[_loc2_] = _loc1_[_loc2_ + 1];
               if(_loc2_ == _loc3_)
               {
                  _loc1_[_loc2_] = 0;
               }
               _loc2_ = _loc2_ + 1;
            }
            _loc1_[0] = _loc1_[0] - 1;
            _loc3_ = _loc1_[0];
            _loc4_ = random(_loc3_) + 1;
            r2 = _loc1_[_loc4_];
            _loc2_ = _loc4_;
            while(_loc2_ <= _loc3_)
            {
               _loc1_[_loc2_] = _loc1_[_loc2_ + 1];
               if(_loc2_ == _loc3_)
               {
                  _loc1_[_loc2_] = 0;
               }
               _loc2_ = _loc2_ + 1;
            }
            _loc1_[0] = _loc1_[0] - 1;
         }
         else if(_loc3_ == 2)
         {
            var r1 = _loc7_;
            var r2 = _loc9_;
            _loc1_[0] = 0;
            _loc1_[1] = 0;
            _loc1_[2] = 0;
         }
         else if(_loc3_ == 1)
         {
            var r1 = _loc7_;
            var r2 = 0;
            _loc1_[0] = 0;
            _loc1_[1] = 0;
         }
         else if(_loc3_ == 0)
         {
            var r1 = 0;
            var r2 = 0;
         }
         _loc5_ = attachMovie("show_npc4","show_npc4",50000);
         _loc5_._x = 400;
         _loc5_._y = 300;
         _loc5_.show_say1 = "霉运当头";
         _loc5_.show_say2 = "衰神附体，遗失卡片";
         _loc5_.show_say3 = r1 != 0 ? carddate[r1][0] : "缺";
         _loc5_.show_say4 = r2 != 0 ? carddate[r2][0] : "缺";
         show_id = 0;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         brow_pg(5);
         mood_pg(5);
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         playerdate[pid][5] = 5;
         playerdate[pid][6] = 7;
         show_id = 0;
         tenor_id = 0;
         end_id = 1;
         asset_pg();
      }
   }
}
function balk_pg6()
{
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc1_ = game[builddate[dz][11]];
      _loc1_.swapDepths(110);
      _loc1_.removeMovieClip();
      show2_pg("出状况啦~~~","被路障拦下！");
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         show_id = 0;
         tenor_id = 0;
         step_id = 0;
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         sport_id = 4;
      }
   }
}
function balk_pg7()
{
   var _loc1_;
   var _loc3_;
   var _loc4_;
   var _loc2_;
   if(tenor_id == 0)
   {
      _loc1_ = game[builddate[dz][11]];
      _loc1_.swapDepths(110);
      _loc1_.removeMovieClip();
      brow_pg(10);
      tenor_id = 1;
      timez = 0;
      _loc1_ = game.attachMovie("boom","boom",100);
      _loc1_._x = ppid._x;
      _loc1_._y = ppid._y;
      _loc3_ = _loc1_._x / XL;
      _loc4_ = _loc1_._y / YL;
      _loc1_.swapDepths(30000 + 3000 * _loc4_ + 30 * _loc3_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez >= 65)
      {
         attachMovie("car2","car2",53005);
         show_id = 0;
         tenor_id = 2;
         timez = 0;
      }
   }
   else if(tenor_id == 2)
   {
      timez++;
      if(timez >= 48)
      {
         ppid._visible = false;
         _loc3_ = ppid._x / XL;
         _loc4_ = ppid._y / YL;
         ppid.swapDepths(30000 + 3000 * _loc4_ + 30 * _loc3_ + 8 - pid);
         tenor_id = 3;
         timez = 0;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         ppid._x = hospitaldate[1] * XL;
         ppid._y = hospitaldate[2] * YL;
         game._x = 352 - ppid._x;
         game._y = 280 - ppid._y;
         Gametoxy();
         mood_pg(5);
         _loc2_ = playerdate[pid];
         _loc2_[2] = hospitaldate[0];
         _loc2_[9] = 0;
         brow_pg(5);
         _loc2_[3] = 3;
         _loc2_[4] = 3;
         step_id = 0;
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         end_id = 8;
         tenor_id = 0;
         show_id = 0;
      }
   }
}
function balk_pg8()
{
   end_id = 1;
}
function balk_pg9()
{
   var _loc2_;
   var _loc3_;
   var _loc4_;
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc2_ = game[builddate[dz][11]];
      _loc2_.swapDepths(110);
      _loc2_.removeMovieClip();
      attachMovie("trait","trait",60000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "路遇恶犬";
      trait.trait_say2 = "与恶犬大战三百回合，落败入院";
      trait.pic.gotoAndStop(9);
      tenor_id = 1;
      show_id = 0;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         attachMovie("car2","car2",53005);
         show_id = 0;
         tenor_id = 2;
         timez = 0;
      }
   }
   else if(tenor_id == 2)
   {
      timez++;
      if(timez >= 48)
      {
         ppid._visible = false;
         _loc3_ = ppid._x / XL;
         _loc4_ = ppid._y / YL;
         ppid.swapDepths(30000 + 3000 * _loc4_ + 30 * _loc3_ + 8 - pid);
         tenor_id = 3;
         timez = 0;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         ppid._x = hospitaldate[1] * XL;
         ppid._y = hospitaldate[2] * YL;
         game._x = 352 - ppid._x;
         game._y = 280 - ppid._y;
         Gametoxy();
         mood_pg(5);
         _loc1_ = playerdate[pid];
         _loc1_[2] = hospitaldate[0];
         _loc1_[9] = 0;
         brow_pg(5);
         _loc1_[3] = 3;
         _loc1_[4] = 3;
         setnpc(9);
         step_id = 0;
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         end_id = 8;
         tenor_id = 0;
         show_id = 0;
      }
   }
}
function balk_pg10()
{
   var _loc1_;
   var _loc3_;
   var _loc4_;
   var _loc2_;
   if(tenor_id == 0)
   {
      tenor_id = 1;
      timez = 0;
      show_id = 0;
      _loc1_ = game.attachMovie("fog","fog",100);
      _loc1_._x = ppid._x;
      _loc1_._y = ppid._y;
      _loc3_ = _loc1_._x / XL;
      _loc4_ = _loc1_._y / YL;
      _loc1_.swapDepths(30000 + 3000 * _loc4_ + 30 * _loc3_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez == 10)
      {
         _loc1_ = game[builddate[dz][11]];
         _loc1_.swapDepths(110);
         _loc1_.removeMovieClip();
         _loc2_ = playerdate[pid][5];
         if(_loc2_ > 0)
         {
            setnpc(_loc2_);
         }
         ppid.npcz.gotoAndStop(10);
         tenor_id = 2;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         show2_pg("哎呀呀不得了~~~","被天使附身了！");
         show_id = 0;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         brow_pg(1);
         mood_pg(11);
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         playerdate[pid][5] = 10;
         playerdate[pid][6] = 7;
         show_id = 0;
         tenor_id = 0;
         end_id = 1;
      }
   }
}
function balk_pg11()
{
   var _loc1_;
   var _loc3_;
   var _loc4_;
   var _loc2_;
   if(tenor_id == 0)
   {
      tenor_id = 1;
      timez = 0;
      show_id = 0;
      _loc1_ = game.attachMovie("fog","fog",100);
      _loc1_._x = ppid._x;
      _loc1_._y = ppid._y;
      _loc3_ = _loc1_._x / XL;
      _loc4_ = _loc1_._y / YL;
      _loc1_.swapDepths(30000 + 3000 * _loc4_ + 30 * _loc3_ + 17);
   }
   else if(tenor_id == 1)
   {
      timez++;
      if(timez == 10)
      {
         _loc1_ = game[builddate[dz][11]];
         _loc1_.swapDepths(110);
         _loc1_.removeMovieClip();
         _loc2_ = playerdate[pid][5];
         if(_loc2_ > 0)
         {
            setnpc(_loc2_);
         }
         ppid.npcz.gotoAndStop(11);
         tenor_id = 2;
         timez = 0;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         show2_pg("哎呀呀不得了~~~","被恶魔附身了！");
         show_id = 0;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         brow_pg(1);
         mood_pg(11);
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         playerdate[pid][5] = 11;
         playerdate[pid][6] = 7;
         show_id = 0;
         tenor_id = 0;
         end_id = 1;
      }
   }
}
function balk_pg12()
{
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc1_ = game[builddate[dz][11]];
      _loc1_.swapDepths(110);
      _loc1_.removeMovieClip();
      attachMovie("trait","trait",50000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "路遇交警";
      trait.trait_say2 = "因超速驾驶和闯红灯被罚1000元";
      trait.pic.gotoAndStop(12);
      tenor_id = 1;
      show_id = 0;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         brow_pg(5);
         mood_pg(5);
         pay = 1000;
         moneydate[pid][1] -= pay;
         if(moneydate[pid][1] < 0)
         {
            moneydate[pid][2] += moneydate[pid][1];
            moneydate[pid][1] = 0;
         }
         builddate[159][9] += pay;
         builddate[160][9] += pay;
         show_id = 0;
         tenor_id = 2;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         setnpc(12);
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         tenor_id = 0;
         end_id = 1;
         show_id = 0;
         asset_pg();
      }
   }
}
function balk_pg13()
{
   var _loc2_;
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc2_ = moneydate[pid][3];
      tenor_id = _loc2_ <= 30 ? 3 : 1;
      show_id = 0;
      _loc1_ = game[builddate[dz][11]];
      _loc1_.swapDepths(110);
      _loc1_.removeMovieClip();
   }
   else if(tenor_id == 1)
   {
      attachMovie("trait","trait",50000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "路遇流氓";
      trait.trait_say2 = "被流氓勒索了身上20％的奖券！";
      trait.pic.gotoAndStop(13);
      tenor_id = 2;
      show_id = 0;
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         brow_pg(5);
         mood_pg(5);
         pay = int(moneydate[pid][3] * 0.2);
         moneydate[pid][3] -= pay;
         builddate[159][9] += pay * 100;
         builddate[160][9] += pay * 100;
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 3)
   {
      attachMovie("trait","trait",50000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "路遇流氓";
      trait.trait_say2 = "流氓威逼你收下他送的100奖券";
      trait.pic.gotoAndStop(13);
      tenor_id = 4;
      show_id = 0;
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         brow_pg(1);
         mood_pg(11);
         pay = 100;
         moneydate[pid][3] += pay;
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      if(show_id == 1)
      {
         setnpc(13);
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         tenor_id = 0;
         end_id = 1;
         show_id = 0;
         asset_pg();
      }
   }
}
function balk_pg14()
{
   var _loc5_;
   var _loc3_;
   var _loc4_;
   var _loc6_;
   var _loc2_;
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc5_ = pcarddate[pid - 1][0];
      tenor_id = _loc5_ <= 3 ? 5 : 1;
      show_id = 0;
      _loc3_ = game[builddate[dz][11]];
      _loc3_.swapDepths(110);
      _loc3_.removeMovieClip();
      attachMovie("trait","trait",50000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "路遇小偷";
      trait.trait_say2 = "你仔细搜索钱包，检查损失";
      trait.pic.gotoAndStop(14);
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         _loc4_ = pcarddate[pid - 1];
         _loc6_ = _loc4_[0];
         _loc2_ = random(_loc6_) + 1;
         r1 = _loc4_[_loc2_];
         _loc1_ = _loc2_;
         while(_loc1_ <= _loc6_)
         {
            _loc4_[_loc1_] = _loc4_[_loc1_ + 1];
            if(_loc1_ == _loc6_)
            {
               _loc4_[_loc1_] = 0;
            }
            _loc1_ = _loc1_ + 1;
         }
         _loc4_[0] = _loc4_[0] - 1;
         _loc6_ = _loc4_[0];
         _loc2_ = random(_loc6_) + 1;
         r2 = _loc4_[_loc2_];
         _loc1_ = _loc2_;
         while(_loc1_ <= _loc6_)
         {
            _loc4_[_loc1_] = _loc4_[_loc1_ + 1];
            if(_loc1_ == _loc6_)
            {
               _loc4_[_loc1_] = 0;
            }
            _loc1_ = _loc1_ + 1;
         }
         _loc4_[0] = _loc4_[0] - 1;
         _loc3_ = attachMovie("show_npc4","show_npc4",50000);
         _loc3_._x = 400;
         _loc3_._y = 300;
         _loc3_.show_say1 = "霉运当头";
         _loc3_.show_say2 = "遇到小偷，遗失卡片";
         _loc3_.show_say3 = carddate[r1][0];
         _loc3_.show_say4 = carddate[r2][0];
         show_id = 0;
         tenor_id = 2;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         brow_pg(5);
         mood_pg(5);
         pay = 5000;
         builddate[159][9] += pay;
         builddate[160][9] += pay;
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 5)
   {
      if(show_id == 1)
      {
         _loc4_ = pcarddate[pid - 1];
         _loc6_ = _loc4_[0];
         var r1 = outcard();
         var r2 = outcard();
         _loc4_[0] += 2;
         _loc4_[_loc4_[0] - 1] = r1;
         _loc4_[_loc4_[0]] = r2;
         _loc3_ = attachMovie("show_npc4","show_npc4",50000);
         _loc3_._x = 400;
         _loc3_._y = 300;
         _loc3_.show_say1 = "意外！你的运气不太坏";
         _loc3_.show_say2 = "小偷失手，反被你索得卡片";
         _loc3_.show_say3 = carddate[r1][0];
         _loc3_.show_say4 = carddate[r2][0];
         show_id = 0;
         tenor_id = 6;
      }
   }
   else if(tenor_id == 6)
   {
      if(show_id == 1)
      {
         brow_pg(1);
         mood_pg(11);
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      if(show_id == 1)
      {
         setnpc(14);
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         tenor_id = 0;
         end_id = 1;
         show_id = 0;
         asset_pg();
      }
   }
}
function balk_pg15()
{
   var _loc2_;
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc2_ = moneydate[pid][1];
      tenor_id = _loc2_ <= 3000 ? 3 : 1;
      show_id = 0;
      _loc1_ = game[builddate[dz][11]];
      _loc1_.swapDepths(110);
      _loc1_.removeMovieClip();
   }
   else if(tenor_id == 1)
   {
      yesno_id = 5 + random(6);
      attachMovie("trait","trait",50000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "路遇乞丐";
      trait.trait_say2 = "被乞丐强行索取了" + yesno_id + "％的现金";
      trait.pic.gotoAndStop(15);
      tenor_id = 2;
      show_id = 0;
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         brow_pg(5);
         mood_pg(5);
         pay = int(moneydate[pid][1] * yesno_id / 100);
         moneydate[pid][1] -= pay;
         builddate[159][9] += pay;
         builddate[160][9] += pay;
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 3)
   {
      attachMovie("trait","trait",50000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "路遇乞丐";
      trait.trait_say2 = "你太穷酸了，乞丐施舍你2万元";
      trait.pic.gotoAndStop(15);
      tenor_id = 4;
      show_id = 0;
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         brow_pg(1);
         mood_pg(11);
         pay = 20000;
         moneydate[pid][1] += pay;
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      if(show_id == 1)
      {
         setnpc(15);
         builddate[dz][10] = 0;
         builddate[dz][11] = "";
         tenor_id = 0;
         end_id = 1;
         show_id = 0;
         asset_pg();
      }
   }
}
function faery_10()
{
   var _loc1_ = mapdate[ppid._y / YL][ppid._x / XL];
   var _loc10_;
   var _loc4_;
   var _loc5_;
   var _loc2_;
   var _loc8_;
   var _loc13_;
   var _loc3_;
   var _loc6_;
   var _loc12_;
   var _loc9_;
   var _loc7_;
   var _loc11_;
   if(tenor_id == 0)
   {
      _loc10_ = builddate[_loc1_][4];
      tenor_id = _loc10_ < 5 ? 1 : 9;
   }
   else if(tenor_id == 1)
   {
      _loc4_ = builddate[_loc1_][6];
      _loc5_ = "mc_npc10";
      _loc2_ = game.attachMovie(_loc5_,_loc5_,100);
      _loc2_._x = ppid._x + waydate1[_loc4_][0];
      _loc2_._y = ppid._y + waydate1[_loc4_][1];
      _loc8_ = _loc2_._x / XL;
      _loc13_ = _loc2_._y / YL;
      _loc2_.swapDepths(30000 + 3000 * _loc13_ + 30 * _loc8_ + 9);
      tenor_id = 2;
      show_id = 0;
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         if(builddate[_loc1_][12] == "")
         {
            _loc2_ = game[builddate[_loc1_ + 1][12]];
            _loc8_ = _loc2_._x;
            _loc13_ = _loc2_._y;
            _loc2_.swapDepths(100);
            _loc2_.removeMovieClip();
            _loc4_ = builddate[_loc1_][6];
            house_num++;
            _loc5_ = "house" + house_num;
            _loc3_ = game.attachMovie("house",_loc5_,100 + house_num);
            _loc3_._x = _loc8_;
            _loc3_._y = _loc13_;
            _loc8_ /= XL;
            _loc13_ /= YL;
            temh.swapDepths(30000 + 3000 * _loc13_ + 30 * _loc8_ + 0);
            _loc3_.land.gotoAndStop(7);
            _loc3_.gotoAndStop((_loc4_ - 1) * 10 + 1);
            builddate[_loc1_][12] = _loc5_;
         }
         _loc6_ = builddate[_loc1_][0];
         _loc10_ = builddate[_loc1_][4];
         if(_loc10_ == 0 && _loc6_ != 0)
         {
            moneydate[_loc6_][10]++;
         }
         _loc12_ = builddate[_loc1_][12];
         _loc9_ = game[_loc12_];
         _loc7_ = game.attachMovie("house_mov","house_mov",100);
         _loc7_._x = _loc9_._x;
         _loc7_._y = _loc9_._y;
         _loc8_ = _loc7_._x / XL;
         _loc13_ = _loc7_._y / YL;
         _loc7_.swapDepths(30000 + 3000 * _loc13_ + 30 * _loc8_ + 16);
         _loc4_ = builddate[_loc1_][6];
         _loc11_ = _loc4_ <= 2 ? _loc4_ : _loc4_ - 2;
         _loc7_.gotoAndStop((_loc11_ - 1) * 10 + _loc10_ + 1);
         _loc7_.house.gotoAndPlay(2);
         builddate[_loc1_][4]++;
         _loc10_ = builddate[_loc1_][4];
         _loc9_.gotoAndStop((_loc4_ - 1) * 10 + _loc10_ + 1);
         _loc9_._visible = false;
         tenor_id = 3;
         show_id = 9;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 2)
      {
         _loc7_ = game.house_mov;
         _loc10_ = builddate[_loc1_][4];
         _loc4_ = builddate[_loc1_][6];
         _loc11_ = _loc4_ <= 2 ? _loc4_ : _loc4_ - 2;
         _loc7_.gotoAndStop((_loc11_ - 1) * 10 + _loc10_ + 1);
         _loc7_.house.gotoAndPlay(18);
         show_id = 8;
      }
      else if(show_id == 1)
      {
         _loc7_ = game.house_mov;
         _loc7_.swapDepths(100);
         _loc7_.removeMovieClip();
         _loc12_ = builddate[_loc1_][12];
         _loc9_ = game[_loc12_];
         _loc9_._visible = true;
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      show2_pg("天使现身~~~","天使施法，房子升级");
      show_id = 0;
      tenor_id = 5;
   }
   else if(tenor_id == 5)
   {
      if(show_id == 1)
      {
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      tenor_id = 0;
      end_id = 5;
      asset_pg();
   }
}
function faery_11()
{
   var _loc1_ = mapdate[ppid._y / YL][ppid._x / XL];
   var _loc9_;
   var _loc3_;
   var _loc4_;
   var _loc2_;
   var _loc7_;
   var _loc12_;
   var _loc5_;
   var _loc11_;
   var _loc8_;
   var _loc6_;
   var _loc10_;
   if(tenor_id == 0)
   {
      _loc9_ = builddate[_loc1_][4];
      tenor_id = !(_loc9_ == 0 || _loc9_ > 5) ? 1 : 9;
   }
   else if(tenor_id == 1)
   {
      _loc3_ = builddate[_loc1_][6];
      _loc4_ = "mc_npc11";
      _loc2_ = game.attachMovie(_loc4_,_loc4_,100);
      _loc2_._x = ppid._x + waydate1[_loc3_][0];
      _loc2_._y = ppid._y + waydate1[_loc3_][1];
      _loc7_ = _loc2_._x / XL;
      _loc12_ = _loc2_._y / YL;
      _loc2_.swapDepths(30000 + 3000 * _loc12_ + 30 * _loc7_ + 9);
      tenor_id = 2;
      show_id = 0;
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         _loc5_ = builddate[_loc1_][0];
         _loc9_ = builddate[_loc1_][4];
         if(_loc9_ == 1 && _loc5_ != 0)
         {
            moneydate[_loc5_][10]--;
         }
         _loc11_ = builddate[_loc1_][12];
         _loc8_ = game[_loc11_];
         _loc6_ = game.attachMovie("house_mov","house_mov",100);
         _loc6_._x = _loc8_._x;
         _loc6_._y = _loc8_._y;
         _loc7_ = _loc6_._x / XL;
         _loc12_ = _loc6_._y / YL;
         _loc6_.swapDepths(30000 + 3000 * _loc12_ + 30 * _loc7_ + 16);
         _loc3_ = builddate[_loc1_][6];
         _loc10_ = _loc3_ <= 2 ? _loc3_ : _loc3_ - 2;
         _loc6_.gotoAndStop((_loc10_ - 1) * 10 + _loc9_ + 1);
         _loc6_.house.gotoAndPlay(2);
         builddate[_loc1_][4]--;
         _loc9_ = builddate[_loc1_][4];
         _loc8_.gotoAndStop((_loc3_ - 1) * 10 + _loc9_ + 1);
         _loc8_._visible = false;
         tenor_id = 3;
         show_id = 9;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 2)
      {
         _loc6_ = game.house_mov;
         _loc9_ = builddate[_loc1_][4];
         _loc3_ = builddate[_loc1_][6];
         _loc10_ = _loc3_ <= 2 ? _loc3_ : _loc3_ - 2;
         _loc6_.gotoAndStop((_loc10_ - 1) * 10 + _loc9_ + 1);
         _loc6_.house.gotoAndPlay(18);
         show_id = 8;
      }
      else if(show_id == 1)
      {
         _loc6_ = game.house_mov;
         _loc6_.swapDepths(100);
         _loc6_.removeMovieClip();
         _loc11_ = builddate[_loc1_][12];
         _loc8_ = game[_loc11_];
         _loc8_._visible = true;
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      show2_pg("恶魔现身~~~","恶魔施法，房子降级");
      show_id = 0;
      tenor_id = 5;
   }
   else if(tenor_id == 5)
   {
      if(show_id == 1)
      {
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      tenor_id = 0;
      end_id = 5;
      asset_pg();
   }
}
function end_pg16()
{
   var _loc3_ = mapdate[ppid._y / YL][ppid._x / XL];
   var _loc6_ = builddate[_loc3_][0];
   var _loc7_;
   var _loc11_;
   var _loc13_;
   var _loc10_;
   var _loc8_;
   var _loc17_;
   var _loc20_;
   var _loc21_;
   var _loc14_;
   var _loc19_;
   var _loc16_;
   var _loc15_;
   var _loc18_;
   var _loc9_;
   var _loc1_;
   var _loc4_;
   var _loc2_;
   var _loc5_;
   var _loc12_;
   var _loc22_;
   if(_loc6_ == 0)
   {
      if(tenor_id == 0)
      {
         if(playerdate[pid][1] == 0)
         {
            attachMovie("yesno","yesno",50000);
         }
         else
         {
            attachMovie("yesno_AI","yesno",60000);
         }
         yesno._x = 400;
         yesno._y = 300;
         yesno.yn_say1 = builddate[_loc3_][7];
         yesno.yn_say2 = "购买此地需要花费";
         yesno.yn_say3 = builddate[_loc3_][8] + "元";
         tenor_id = 1;
      }
      else if(tenor_id == 1)
      {
         if(yesno_id == 1)
         {
            show_id = 0;
            if(moneydate[pid][1] >= builddate[_loc3_][8])
            {
               moneydate[pid][1] -= builddate[_loc3_][8];
               ceo_id = 1;
               moneydate[pid][9]++;
               _loc7_ = builddate[_loc3_][2];
               housedate[pid][_loc7_][0]++;
               housedate[pid][_loc7_][1][housedate[pid][_loc7_][0] - 1] = _loc3_;
               _loc11_ = builddate[_loc3_][6];
               _loc13_ = "catup" + _loc11_;
               _loc10_ = game.attachMovie(_loc13_,_loc13_,100);
               _loc10_._x = ppid._x + waydate1[_loc11_][0];
               _loc10_._y = ppid._y + waydate1[_loc11_][1];
               _loc10_.swapDepths(30000 + _loc10_._y * 3000 / YL + _loc10_._x * 30 / XL + 9);
               tenor_id = 2;
            }
            else
            {
               show2_pg("出状况啦~~~","现金不足！");
               tenor_id = 8;
               show_id = 0;
            }
         }
         else if(yesno_id == 2)
         {
            mood_pg(8);
            tenor_id = 9;
            show_id = 0;
         }
      }
      else if(tenor_id == 2)
      {
         if(show_id == 1)
         {
            _loc10_ = game[builddate[_loc3_ + 1][12]];
            _loc10_.swapDepths(100);
            _loc10_.removeMovieClip();
            if(builddate[_loc3_][12] == "")
            {
               _loc11_ = builddate[_loc3_][6];
               house_num++;
               _loc13_ = "house" + house_num;
               _loc8_ = game.attachMovie("house",_loc13_,100 + house_num);
               _loc8_._x = ppid._x + waydate1[_loc11_][0];
               _loc8_._y = ppid._y + waydate1[_loc11_][1];
               _loc8_.swapDepths(30000 + _loc8_._y * 3000 / YL + _loc8_._x * 30 / XL + 0);
               _loc8_.land.gotoAndStop(pid);
               _loc8_.gotoAndStop((_loc11_ - 1) * 10 + 1);
               builddate[_loc3_][12] = _loc13_;
            }
            else
            {
               game[builddate[_loc3_][12]].land.gotoAndStop(pid);
               _loc17_ = builddate[_loc3_][4];
               if(_loc17_ > 0)
               {
                  moneydate[pid][10]++;
               }
            }
            brow_pg(3);
            mood_pg(2);
            show_id = 0;
            tenor_id = 9;
         }
      }
      else if(tenor_id == 8)
      {
         if(show_id == 1)
         {
            tenor_id = 9;
            show_id = 0;
            brow_pg(4);
            mood_pg(5);
         }
      }
      else if(tenor_id == 9)
      {
         if(ceo_id > 0)
         {
            builddate[_loc3_][0] = pid;
            ceo_id = 0;
         }
         yesno_id = 0;
         end_id = 8;
         tenor_id = 0;
         changemd_pg();
      }
   }
   else if(_loc6_ == pid)
   {
      _loc17_ = builddate[_loc3_][4];
      if(tenor_id == 0)
      {
         if(_loc17_ >= 5)
         {
            tenor_id = 9;
            mood_pg(0);
         }
         else
         {
            _loc20_ = playerdate[pid][1];
            _loc21_ = _loc20_ != 0 ? "yesno_AI" : "yesno";
            attachMovie(_loc21_,"yesno",60000);
            yesno._x = 400;
            yesno._y = 300;
            yesno.yn_say1 = builddate[_loc3_][7];
            yesno.yn_say2 = "投资升级此地需花费";
            yesno.yn_say3 = 100 * (_loc17_ + 1) + "元";
            tenor_id = 1;
            yesno_id = 0;
         }
      }
      else if(tenor_id == 1)
      {
         if(yesno_id == 1)
         {
            if(moneydate[pid][1] >= 100 * (_loc17_ + 1))
            {
               moneydate[pid][1] -= 100 * (_loc17_ + 1);
               _loc14_ = playerdate[pid][5];
               if(_loc14_ == 4)
               {
                  show2_pg("鸿运当头~~~","福神附体，投资加倍");
                  tenor_id = 2;
               }
               else if(_loc14_ == 5)
               {
                  show2_pg("倒霉运ing~~~","衰神附体，投资失败");
                  tenor_id = 8;
               }
               else
               {
                  yesno_id = 1;
                  tenor_id = 3;
               }
            }
            else
            {
               show2_pg("出状况啦~~~","现金不足！");
               tenor_id = 8;
            }
            show_id = 0;
         }
         else if(yesno_id == 2)
         {
            mood_pg(8);
            tenor_id = 9;
            show_id = 0;
         }
      }
      else if(tenor_id == 2)
      {
         if(show_id == 1)
         {
            yesno_id = 2;
            tenor_id = 3;
         }
      }
      else if(tenor_id == 3)
      {
         _loc11_ = builddate[_loc3_][6];
         _loc13_ = "catup" + _loc11_;
         _loc10_ = game.attachMovie(_loc13_,_loc13_,100);
         _loc10_._x = ppid._x + waydate1[_loc11_][0];
         _loc10_._y = ppid._y + waydate1[_loc11_][1];
         _loc10_.swapDepths(30000 + _loc10_._y * 3000 / YL + _loc10_._x * 30 / XL + 9);
         show_id = 0;
         tenor_id = 4;
      }
      else if(tenor_id == 4)
      {
         if(show_id == 1)
         {
            if(_loc17_ == 0)
            {
               moneydate[pid][10]++;
            }
            _loc19_ = builddate[_loc3_][12];
            _loc16_ = game[_loc19_];
            _loc15_ = game.attachMovie("house_mov","house_mov",100);
            _loc15_._x = _loc16_._x;
            _loc15_._y = _loc16_._y;
            _loc15_.swapDepths(30000 + 3000 * _loc15_._y / YL + 30 * _loc15_._x / XL + 16);
            _loc15_.land.gotoAndStop(pid);
            _loc11_ = builddate[_loc3_][6];
            _loc18_ = _loc11_ <= 2 ? _loc11_ : _loc11_ - 2;
            _loc15_.gotoAndStop((_loc18_ - 1) * 10 + _loc17_ + 1);
            _loc15_.house.gotoAndPlay(2);
            if(yesno_id == 1)
            {
               builddate[_loc3_][4]++;
            }
            else if(_loc17_ >= 4)
            {
               builddate[_loc3_][4] = 5;
               yesno_id = 1;
            }
            else
            {
               builddate[_loc3_][4] += 2;
            }
            _loc17_ = builddate[_loc3_][4];
            _loc16_.gotoAndStop((_loc11_ - 1) * 10 + _loc17_ + 1);
            _loc16_._visible = false;
            tenor_id = 5;
            show_id = 9;
            timez = 0;
         }
      }
      else if(tenor_id == 5)
      {
         if(show_id == 2)
         {
            _loc15_ = game.house_mov;
            _loc11_ = builddate[_loc3_][6];
            _loc18_ = _loc11_ <= 2 ? _loc11_ : _loc11_ - 2;
            _loc15_.gotoAndStop((_loc18_ - 1) * 10 + _loc17_ + 1);
            _loc15_.house.gotoAndPlay(18);
            show_id = 8;
         }
         else if(show_id == 1)
         {
            _loc15_ = game.house_mov;
            _loc15_.swapDepths(100);
            _loc15_.removeMovieClip();
            _loc19_ = builddate[_loc3_][12];
            _loc16_ = game[_loc19_];
            _loc16_._visible = true;
            brow_pg(3);
            mood_pg(10);
            show_id = 7;
            tenor_id = 9;
         }
      }
      else if(tenor_id == 8)
      {
         if(show_id == 1)
         {
            tenor_id = 9;
            show_id = 0;
            brow_pg(4);
            mood_pg(5);
         }
      }
      else if(tenor_id == 9)
      {
         yesno_id = 0;
         end_id = 8;
         tenor_id = 0;
         changemd_pg();
      }
   }
   else if(tenor_id == 0)
   {
      _loc17_ = builddate[_loc3_][4];
      _loc7_ = builddate[_loc3_][2];
      if(_loc17_ == 6)
      {
         pay = moneydate[_loc6_][11] * 2000;
      }
      else
      {
         pay = 0;
         _loc9_ = housedate[_loc6_][_loc7_][0];
         _loc1_ = 0;
         while(_loc1_ < _loc9_)
         {
            _loc4_ = housedate[_loc6_][_loc7_][1][_loc1_];
            pay += hiredate[builddate[_loc4_][4]] * builddate[_loc4_][8];
            _loc2_ = game.attachMovie("ray","ray" + _loc1_,100 + _loc1_);
            _loc5_ = game[builddate[_loc4_][12]];
            _loc2_._x = _loc5_._x;
            _loc2_._y = _loc5_._y;
            _loc2_.swapDepths(30000 + _loc2_._y * 3000 / YL + _loc2_._x * 30 / XL + 13);
            _loc1_ = _loc1_ + 1;
         }
      }
      yesno_id = 0;
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(yesno_id == 1)
      {
         attachMovie("show","show",50100);
         show._x = 400;
         show._y = 300;
         show.show_say1 = "交出买路钱~";
         show.show_say2 = "此地属于" + playerdate[_loc6_][0] + "\n" + "请支付过路费用" + "\n" + pay + "元";
         yesno_id = 0;
         show_id = 0;
         tenor_id = 2;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         _loc14_ = playerdate[pid][5];
         if(_loc14_ == 2)
         {
            show2_pg("鸿运当头~~~","财神附体，免缴路费");
            tenor_id = 7;
         }
         else if(_loc14_ == 3)
         {
            yesno_id = 2;
            show2_pg("倒霉运ing~~~","穷神附体，收费加倍");
            tenor_id = 8;
         }
         else
         {
            yesno_id = 1;
            tenor_id = 8;
            show_id = 1;
         }
      }
   }
   else if(tenor_id == 7)
   {
      if(show_id == 1)
      {
         tenor_id = 9;
         show_id = 0;
         brow_pg(3);
         mood_pg(4);
      }
   }
   else if(tenor_id == 8)
   {
      if(show_id == 1)
      {
         pay *= yesno_id;
         _loc12_ = moneydate[pid][1];
         if(_loc12_ >= pay)
         {
            moneydate[pid][1] -= pay;
         }
         else
         {
            moneydate[pid][1] = 0;
            moneydate[pid][2] -= pay - _loc12_;
         }
         moneydate[_loc6_][2] += pay;
         tenor_id = 9;
         show_id = 0;
         brow_pg(5);
         _loc22_ = pay != 0 ? 3 : 14;
         mood_pg(_loc22_);
      }
   }
   else if(tenor_id == 9)
   {
      yesno_id = 0;
      end_id = 8;
      tenor_id = 0;
      changemd_pg();
   }
}
function end_pg1()
{
   var _loc12_ = mapdate[ppid._y / YL][ppid._x / XL];
   var _loc3_ = builddate[_loc12_][1];
   var _loc4_ = stockdate[_loc3_][1];
   var _loc8_ = stockdate[_loc3_][19];
   var _loc2_ = stockdate[_loc3_][20];
   var _loc9_;
   var _loc11_;
   var _loc10_;
   var _loc13_;
   var _loc5_;
   var _loc6_;
   var _loc7_;
   var _loc1_;
   if(_loc8_ == 0)
   {
      if(tenor_id == 0)
      {
         _loc9_ = builddate[_loc2_][9];
         oddstock_pg(_loc2_,_loc9_,_loc4_);
         tenor_id = 1;
      }
      else if(tenor_id == 1)
      {
         if(yesno_id == 1)
         {
            showcounter_pg(_loc2_,_loc4_);
            tenor_id = 2;
            show_id = 0;
         }
         else if(yesno_id == 2)
         {
            mood_pg(8);
            tenor_id = 4;
            show_id = 0;
         }
      }
      else if(tenor_id == 2)
      {
         if(yesno_id >= 0 && show_id == 1)
         {
            paystock_pg(_loc2_,_loc3_,_loc4_);
            if(yesno_id > 0)
            {
               director_pg(_loc2_,_loc3_);
               tenor_id = 3;
            }
            else
            {
               tenor_id = 4;
            }
            changemd_pg();
            show_id = 0;
         }
      }
      else if(tenor_id == 3)
      {
         if(show_id == 1)
         {
            tenor_id = 4;
            show_id = 0;
            brow_pg(2);
            mood_pg(1);
         }
      }
      else if(tenor_id == 4)
      {
         yesno_id = 0;
         end_id = 8;
         tenor_id = 0;
         if(ceo_id > 0)
         {
            stockdate[_loc3_][19] = ceo_id;
            ceo_id = 0;
            changemd_pg();
         }
      }
   }
   else if(_loc8_ == pid)
   {
      if(tenor_id == 0)
      {
         _loc9_ = builddate[_loc2_][9];
         if(_loc9_ > 0)
         {
            oddstock_pg(_loc2_,_loc9_,_loc4_);
            tenor_id = 1;
         }
         else
         {
            mood_pg(0);
            tenor_id = 4;
         }
      }
      else if(tenor_id == 1)
      {
         if(yesno_id == 1)
         {
            showcounter_pg(_loc2_,_loc4_);
            tenor_id = 2;
            show_id = 0;
         }
         else if(yesno_id == 2)
         {
            mood_pg(8);
            tenor_id = 4;
            show_id = 0;
         }
      }
      else if(tenor_id == 2)
      {
         if(yesno_id >= 0 && show_id == 1)
         {
            paystock_pg(_loc2_,_loc3_,_loc4_);
            mood_pg(0);
            tenor_id = 4;
            show_id = 0;
         }
      }
      else if(tenor_id == 4)
      {
         yesno_id = 0;
         end_id = 8;
         tenor_id = 0;
         changemd_pg();
      }
   }
   else if(_loc8_ != pid)
   {
      if(tenor_id == 0)
      {
         tenor_id = _loc3_ >= 13 ? 3 : 1;
      }
      else if(tenor_id == 1)
      {
         attachMovie("show","show",50000);
         show._x = 300;
         show._y = 250;
         show.show_say1 = builddate[_loc2_][7];
         show.show_say2 = "公司经营权属于\r" + playerdate[_loc8_][0] + "\n" + "费用　" + builddate[_loc2_][8] + "\n" + "将投掷决定倍数！";
         attachMovie("yntz2","yntz2",50100);
         yntz2._x = 380;
         yntz2._y = 320;
         yesno_id = 0;
         tenor_id = 2;
      }
      else if(tenor_id == 2)
      {
         if(yesno_id > 0)
         {
            pay = yesno_id * builddate[_loc2_][8];
            stockdate[_loc3_][17] += pay;
            attachMovie("show","show1",50200);
            show1._x = 400;
            show1._y = 400;
            show1.show_say1 = builddate[_loc2_][7];
            show1.show_say2 = "总共缴纳费用为\r" + pay + " 元";
            paybill_pg(pay);
            yesno_id = 0;
            tenor_id = 6;
            show_id = 0;
         }
      }
      else if(tenor_id == 3)
      {
         _loc11_ = builddate[_loc2_][8];
         attachMovie("show","show",50000);
         show._x = 300;
         show._y = 250;
         show.show_say1 = builddate[_loc2_][7];
         show.show_say2 = "公司经营权属于\r" + playerdate[_loc8_][0] + "\n" + "费用　" + _loc11_ + "\n" + "由房子数量决定倍数！";
         tenor_id = 4;
         show_id = 0;
      }
      else if(tenor_id == 4)
      {
         if(show_id == 1)
         {
            tenor_id = 5;
            show_id = 0;
         }
      }
      else if(tenor_id == 5)
      {
         _loc10_ = moneydate[pid][10];
         _loc11_ = builddate[_loc2_][8];
         pay = _loc10_ * _loc11_;
         attachMovie("show","show1",50100);
         show1._x = 400;
         show1._y = 300;
         show1.show_say1 = "费用缴纳~~";
         show1.show_say2 = "您共拥有 " + _loc10_ + " 间房子" + "\n" + "共计缴纳 " + "\n" + pay + " 元";
         stockdate[_loc3_][17] += pay;
         paybill_pg(pay);
         tenor_id = 6;
         show_id = 0;
      }
      else if(tenor_id == 6)
      {
         if(show_id == 1)
         {
            changemd_pg();
            tenor_id = 7;
            show_id = 0;
            brow_pg(5);
            _loc13_ = pay != 0 ? 3 : 14;
            mood_pg(_loc13_);
         }
      }
      else if(tenor_id == 7)
      {
         _loc9_ = builddate[_loc2_][9];
         if(_loc9_ > 0)
         {
            oddstock_pg(_loc2_,_loc9_,_loc4_);
            tenor_id = 8;
         }
         else
         {
            tenor_id = 11;
         }
      }
      else if(tenor_id == 8)
      {
         if(yesno_id == 1)
         {
            showcounter_pg(_loc2_,_loc4_);
            tenor_id = 9;
         }
         else if(yesno_id == 2)
         {
            mood_pg(8);
            tenor_id = 11;
         }
      }
      else if(tenor_id == 9)
      {
         if(yesno_id > 0 && show_id == 1)
         {
            paystock_pg(_loc2_,_loc3_,_loc4_);
            _loc5_ = _loc3_;
            _loc6_ = 0;
            _loc7_ = stockdate[_loc5_][pid + 10][0];
            _loc1_ = 11;
            while(_loc1_ <= 16)
            {
               if(_loc1_ == pid + 10)
               {
                  _loc1_ = _loc1_ + 1;
                  if(_loc1_ == 17)
                  {
                     break;
                  }
               }
               if(_loc7_ <= stockdate[_loc5_][_loc1_][0])
               {
                  _loc6_ = 1;
                  break;
               }
               _loc1_ = _loc1_ + 1;
            }
            if(_loc6_ != 1)
            {
               director_pg(_loc2_,_loc3_);
               tenor_id = 10;
            }
            else
            {
               mood_pg(9);
               tenor_id = 11;
            }
         }
         else if(yesno_id == 0 && show_id == 1)
         {
            tenor_id = 11;
         }
         show_id = 0;
      }
      else if(tenor_id == 10)
      {
         if(show_id == 1)
         {
            tenor_id = 11;
            show_id = 0;
            brow_pg(2);
            mood_pg(1);
         }
      }
      else if(tenor_id == 11)
      {
         yesno_id = 0;
         end_id = 8;
         tenor_id = 0;
         if(ceo_id > 0)
         {
            stockdate[_loc3_][19] = ceo_id;
            ceo_id = 0;
            changemd_pg();
         }
      }
   }
}
function paybill_pg(pay)
{
   var _loc1_ = moneydate[pid];
   if(_loc1_[1] >= pay)
   {
      _loc1_[1] -= pay;
   }
   else
   {
      _loc1_[2] -= pay - _loc1_[1];
      _loc1_[1] = 0;
   }
}
function paystock_pg(dz, bd1, sd1)
{
   pay = sd1 * yesno_id;
   moneydate[pid][1] -= pay;
   var _loc3_ = bd1;
   var _loc1_ = stockdate[_loc3_][pid + 10];
   var _loc2_ = _loc1_[0] * _loc1_[1];
   _loc1_[0] += yesno_id;
   _loc1_[1] = int(100 * (pay + _loc2_) / _loc1_[0]) / 100;
   builddate[dz][9] -= yesno_id;
}
function director_pg(dz, bd1)
{
   var _loc2_ = bd1;
   builddate[dz][0] = pid;
   ceo_id = pid;
   attachMovie("show","show",50505);
   show._x = 400;
   show._y = 300;
   show.show_say1 = "恭喜哦~";
   show.show_say2 = "恭喜 " + playerdate[pid][0] + " 成为" + "\n" + builddate[dz][7] + " 董事长";
}
function oddstock_pg(sd20, bd9, sd1)
{
   if(playerdate[pid][1] == 0)
   {
      attachMovie("yesno1","yesno",50303);
      yesno_id = 0;
   }
   else
   {
      attachMovie("yesno1_AI","yesno",50303);
      yesno_id = 0;
   }
   yesno._x = 400;
   yesno._y = 300;
   yesno.yn_say1 = builddate[sd20][7];
   yesno.yn_say2 = "待购股份 " + bd9 + "股" + "\n" + "承销价 " + sd1 + "元" + "\n" + "您最多可认购 1000股" + "\n" + "\n" + "您要认购吗？";
}
function showcounter_pg(dz, sd1)
{
   var _loc5_ = builddate[dz][9];
   var _loc4_ = _loc5_ < 1000 ? sd1 * _loc5_ : sd1 * 1000;
   var _loc2_ = moneydate[pid][1];
   var _loc1_ = _loc2_ < _loc4_ ? int(_loc2_ / sd1) : int(_loc4_ / sd1);
   if(playerdate[pid][1] == 0)
   {
      attachMovie("counter","counter",50405);
      counter.counter_say2 = 0;
      yesno_id = -1;
   }
   else
   {
      attachMovie("counter_AI","counter",50405);
      counter.counter_say2 = _loc1_;
      yesno_id = _loc1_;
   }
   counter._x = 400;
   counter._y = 300;
   counter.counter_say1 = _loc1_;
   show_id = 0;
}
function end_pg17()
{
   var _loc1_;
   var _loc2_;
   if(tenor_id == 0)
   {
      tenor_id++;
   }
   else if(tenor_id == 1)
   {
      _loc1_ = mapdate[ppid._y / YL][ppid._x / XL];
      yesno_id = builddate[_loc1_][2];
      attachMovie("station","station",60000);
      tenor_id = 2;
   }
   else if(tenor_id != 2)
   {
      if(tenor_id == 3)
      {
         if(yesno_id < 5)
         {
            _loc2_ = random(2);
            playerdate[pid][2] = stationdate[yesno_id][_loc2_];
            brow_pg(1);
            mood_pg(11);
            tenor_id = 6;
         }
         else
         {
            tenor_id = 4;
         }
      }
      else if(tenor_id == 4)
      {
         _loc1_ = mapdate[ppid._y / YL][ppid._x / XL];
         show2_pg("目的地~~~",builddate[_loc1_][7]);
         tenor_id = 5;
         show_id = 0;
      }
      else if(tenor_id == 5)
      {
         if(show_id == 1)
         {
            mood_pg(8);
            tenor_id = 6;
            show_id = 0;
         }
      }
      else if(tenor_id == 6)
      {
         yesno_id = 0;
         tenor_id = 0;
         end_id = 8;
      }
   }
}
function end_pg18()
{
   if(tenor_id == 0)
   {
      show2_pg("目的地~~~","明日银行");
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         end_id = 8;
         tenor_id = 0;
         show_id = 0;
      }
   }
}
function end_pg19()
{
   if(tenor_id == 0)
   {
      show2_pg("目的地~~~","明日股市");
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         end_id = 8;
         tenor_id = 0;
         show_id = 0;
      }
   }
}
function end_pg20()
{
   var _loc2_;
   if(tenor_id == 0)
   {
      _loc2_ = playerdate[pid][1];
      tenor_id = _loc2_ != 0 ? 4 : 1;
   }
   var _loc3_;
   var _loc1_;
   if(tenor_id == 1)
   {
      attachMovie("shopz","shopz",60000);
      tenor_id = 2;
   }
   else if(tenor_id != 2)
   {
      if(tenor_id == 3)
      {
         mood_pg(8);
         tenor_id = 6;
      }
      else if(tenor_id == 4)
      {
         _loc3_ = moneydate[pid][3];
         _loc1_ = playerdate[pid][8];
         if(_loc1_ > 2)
         {
         }
         if(_loc1_ > 1)
         {
         }
         if(_loc1_ > 0)
         {
         }
         tenor_id = 5;
         show2_pg("目的地~~~","卡片屋");
      }
      else if(tenor_id == 5)
      {
         if(show_id == 1)
         {
            tenor_id = 6;
            show_id = 0;
         }
      }
      else if(tenor_id == 6)
      {
         end_id = 8;
         tenor_id = 0;
         yesno_id = 0;
      }
   }
}
function end_pg21()
{
   var _loc3_;
   if(tenor_id == 0)
   {
      _loc3_ = playerdate[pid][1];
      tenor_id = _loc3_ != 0 ? 4 : 1;
   }
   var _loc2_;
   var _loc4_;
   var _loc5_;
   var _loc6_;
   var _loc1_;
   if(tenor_id == 1)
   {
      attachMovie("lottery","lottery",60000);
      tenor_id = 2;
   }
   else if(tenor_id != 2)
   {
      if(tenor_id == 3)
      {
         mood_pg(8);
         tenor_id = 6;
      }
      else if(tenor_id == 4)
      {
         _loc2_ = moneydate[pid][1];
         _loc4_ = moneydate[pid][2];
         _loc5_ = _loc2_ + _loc4_;
         _loc6_ = moneydate[pid][3];
         _loc1_ = playerdate[pid][8];
         if(_loc1_ > 2)
         {
         }
         if(_loc1_ > 1)
         {
         }
         if(_loc1_ > 0)
         {
         }
         tenor_id = 5;
         show2_pg("目的地~~~","彩票公司");
      }
      else if(tenor_id == 5)
      {
         if(show_id == 1)
         {
            tenor_id = 6;
            show_id = 0;
         }
      }
      else if(tenor_id == 6)
      {
         end_id = 8;
         tenor_id = 0;
         yesno_id = 0;
      }
   }
}
function end_pg22()
{
   var _loc3_;
   var _loc1_;
   var _loc2_;
   if(tenor_id == 0)
   {
      _loc3_ = 0;
      _loc1_ = 1;
      while(_loc1_ <= znum)
      {
         if(pid != _loc1_)
         {
            _loc2_ = playerdate[_loc1_][3];
            if(_loc2_ != 2 && _loc2_ != 3 && _loc2_ != 9)
            {
               _loc3_ = _loc3_ + 1;
            }
         }
         _loc1_ = _loc1_ + 1;
      }
      if(_loc3_ > 0)
      {
         attachMovie("courtz","courtz",60000);
         tenor_id = 1;
         yesno_id = -1;
      }
      else
      {
         show2_pg("目的地~~~","明日法院");
         tenor_id = 3;
      }
   }
   else if(tenor_id != 1)
   {
      if(tenor_id == 2)
      {
         if(yesno_id == 1)
         {
            brow_pg(1);
            mood_pg(11);
         }
         else if(yesno_id == 0)
         {
            brow_pg(2);
            mood_pg(13);
         }
         else if(yesno_id == 2)
         {
            brow_pg(5);
            mood_pg(12);
         }
         yesno_id = 0;
         tenor_id = 9;
      }
      else if(tenor_id == 3)
      {
         if(show_id == 1)
         {
            tenor_id = 9;
         }
      }
      else if(tenor_id == 9)
      {
         tenor_id = 0;
         end_id = 8;
      }
   }
}
function end_pg23()
{
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc1_ = builddate[159][9];
      attachMovie("trait","trait",50000);
      trait._x = 400;
      trait._y = 300;
      trait.trait_say1 = "失物招领~";
      trait.trait_say2 = "领取到丢失财物共计：" + _loc1_ + " 元";
      trait.pic.gotoAndStop(23);
      moneydate[pid][1] += _loc1_;
      builddate[159][9] = 0;
      builddate[160][9] = 0;
      show_id = 0;
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         if(bd10 > 0)
         {
            mood_pg(4);
            brow_pg(2);
            callsound(5);
         }
         else
         {
            mood_pg(11);
            brow_pg(1);
         }
         end_id = 8;
         tenor_id = 0;
         show_id = 0;
      }
   }
}
function end_pg24()
{
   var _loc5_;
   var _loc4_;
   var _loc1_;
   var _loc2_;
   var _loc6_;
   var _loc3_;
   if(tenor_id == 0)
   {
      _loc5_ = ppid._x / XL;
      _loc4_ = ppid._y / YL;
      game["catclub" + _loc5_ + "_" + _loc4_].gotoAndStop(2);
      tenor_id = 1;
      show_id = 0;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         attachMovie("mov_kp","mov_kp",50000);
         mov_kp._x = 352;
         mov_kp._y = 280;
         tenor_id = 2;
         show_id = 0;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         _loc1_ = pcarddate[pid - 1];
         _loc2_ = _loc1_[0];
         _loc6_ = _loc1_[24];
         _loc3_ = _loc2_ >= 24 ? _loc6_ : outcard();
         attachMovie("show","show",50100);
         show._x = 400;
         show._y = 300;
         show.show_say1 = "恭喜你~";
         show.show_say2 = "得到一张卡片\r\r" + carddate[_loc3_][0];
         callsound(4);
         if(_loc2_ < 24)
         {
            _loc1_[0] = _loc1_[0] + 1;
            _loc1_[_loc1_[0]] = _loc3_;
         }
         show_id = 0;
         tenor_id = 3;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         end_id = 8;
         tenor_id = 0;
         show_id = 0;
         mood_pg(4);
         brow_pg(3);
      }
   }
}
function outcard()
{
   var _loc4_ = carddate;
   var _loc3_ = new Array();
   var _loc2_ = 0;
   var _loc5_ = _loc4_.length;
   var _loc1_ = 5;
   while(_loc1_ < _loc5_)
   {
      if(_loc4_[_loc1_][3] != 0)
      {
         _loc3_[_loc2_] = _loc1_;
         _loc2_ = _loc2_ + 1;
      }
      _loc1_ = _loc1_ + 1;
   }
   var _loc7_ = _loc3_.length;
   var _loc0_;
   var _loc6_ = r = random(_loc7_);
   var _loc8_ = _loc3_[_loc6_];
   return _loc8_;
}
function end_pg25()
{
   var _loc1_;
   var _loc2_;
   if(tenor_id == 0)
   {
      attachMovie("luck","luck",50000);
      luck._x = 400;
      luck._y = 280;
      _loc1_ = random(luckdate.length - 1) + 1;
      _loc2_ = luckdate[_loc1_][0];
      pay = luckdate[_loc1_][2];
      luck.luck_say1 = "人人都有机会哦~~~";
      luck.luck_say2 = luckdate[_loc1_][1];
      luck.pic.gotoAndStop(_loc1_);
      if(_loc2_ == 1)
      {
         moneydate[pid][1] += pay;
         if(pay < 0)
         {
            builddate[159][9] -= pay;
            builddate[160][9] -= pay;
         }
      }
      else if(_loc2_ == 2)
      {
         moneydate[pid][3] += pay;
      }
      else if(_loc2_ == 3)
      {
      }
      tenor_id = 1;
   }
   else if(tenor_id != 1)
   {
      if(tenor_id == 2)
      {
         if(pay < 0)
         {
            brow_pg(5);
            mood_pg(5);
            callsound(6);
         }
         else
         {
            brow_pg(3);
            mood_pg(4);
            callsound(5);
         }
         end_id = 8;
         tenor_id = 0;
      }
   }
}
function end_pg26()
{
   if(tenor_id == 0)
   {
      attachMovie("mov_jq","mov_jq",50000);
      mov_jq._x = 352;
      mov_jq._y = 280;
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         show_id = 0;
         show2_pg("恭喜你~~~","得到 " + builddate[dz][8] + " 奖券");
         callsound(4);
         moneydate[pid][3] += builddate[dz][8];
         tenor_id = 2;
      }
   }
   else if(tenor_id == 2)
   {
      if(show_id == 1)
      {
         end_id = 8;
         tenor_id = 0;
         show_id = 0;
         brow_pg(3);
         mood_pg(6);
      }
   }
}
function end_pg27()
{
   var _loc1_;
   if(tenor_id == 0)
   {
      attachMovie("ludoz","ludoz",60000);
      tenor_id = 1;
      pay = moneydate[pid][3];
   }
   else if(tenor_id != 1)
   {
      if(tenor_id == 2)
      {
         changemd_pg();
         _loc1_ = moneydate[pid][3];
         if(_loc1_ > pay)
         {
            brow_pg(2);
            mood_pg(6);
            callsound(5);
         }
         else if(_loc1_ == pay)
         {
            brow_pg(1);
            mood_pg(9);
         }
         else
         {
            brow_pg(5);
            mood_pg(7);
            callsound(6);
         }
         yesno_id = 0;
         tenor_id = 0;
         end_id = 8;
      }
   }
}
function end_pg28()
{
   if(tenor_id == 0)
   {
      attachMovie("carnie","carnie",60000);
      tenor_id = 1;
   }
   else if(tenor_id != 1)
   {
      if(tenor_id == 2)
      {
         changemd_pg();
         brow_pg(2);
         mood_pg(6);
         callsound(5);
         yesno_id = 0;
         tenor_id = 0;
         end_id = 8;
      }
   }
}
function end_pg29()
{
   end_id = 8;
}
function mood_pg(tmp)
{
   attachMovie("talk","talk",55000 + random(1000));
   talk._x = 352;
   talk._y = 280;
   talk.talk_say = talkdate[tmp][random(talkdate[tmp].length - 1) + 1];
}
function brow_pg(tmp)
{
   var _loc1_ = playerdate[pid];
   way_id = _loc1_[2];
   var _loc2_ = _loc1_[9] * 10 + tmp;
   game["player" + pid].gotoAndStop((way_id - 1) * 30 + _loc2_);
   face.face.gotoAndStop(_loc1_[7]);
   face.face.face.gotoAndStop(_loc2_);
   face["head" + _loc1_[10]].face.gotoAndStop(_loc2_);
   _loc1_[11] = _loc2_;
}
function showmap_pg(x_tmp, y_tmp)
{
   var _loc9_ = attachMovie("game1","game1",80088);
   _loc9_._x = x_tmp;
   _loc9_._y = y_tmp;
   _loc9_._xscale = 25;
   _loc9_._yscale = 25;
   _loc9_.attachMovie("map25%","map25",9);
   _loc9_.map25._x = -186;
   _loc9_.map25._y = -315;
   _loc9_.map25._xscale = 400;
   _loc9_.map25._yscale = 400;
   attachMovie("map_say","map_say1",80099);
   var _loc5_ = 1;
   var _loc3_;
   while(_loc5_ <= znum)
   {
      if(playerdate[_loc5_][3] != 9)
      {
         _loc3_ = _loc9_.attachMovie("head" + playerdate[_loc5_][7],"head" + _loc5_,100 + _loc5_);
         _loc3_._x = game["player" + _loc5_]._x;
         _loc3_._y = game["player" + _loc5_]._y;
         _loc3_.swapDepths(20000000 + _loc3_._y * 3000 / YL + _loc3_._x * 30 / XL + 8 - _loc5_);
         _loc3_.t = random(50);
         _loc3_.tenor_id = 0;
         _loc3_.onEnterFrame = function()
         {
            if(this.tenor_id == 0)
            {
               this.t = this.t + 1;
               if(this.t > 50 + random(40))
               {
                  this.tenor_id = 1;
                  this.t = 0;
               }
            }
            else if(this.tenor_id == 1)
            {
               this.t = this.t + 1;
               this._alpha -= 5;
               if(this.t > 20)
               {
                  this._alpha = 0;
                  this.tenor_id = 2;
                  this.t = 0;
               }
            }
            else if(this.tenor_id == 2)
            {
               this.t = this.t + 1;
               if(this.t > 5 + random(10))
               {
                  this.tenor_id = 3;
                  this.t = 0;
               }
            }
            else if(this.tenor_id == 3)
            {
               this.t = this.t + 1;
               this._alpha += 5;
               if(this.t > 20)
               {
                  this._alpha = 100;
                  this.tenor_id = 0;
                  this.t = 0;
               }
            }
         };
      }
      _loc5_ = _loc5_ + 1;
   }
   var _loc22_ = builddate.length;
   _loc5_ = 0;
   var _loc2_;
   var _loc12_;
   var _loc20_;
   var _loc19_;
   var _loc15_;
   var _loc14_;
   var _loc11_;
   var _loc6_;
   var _loc18_;
   var _loc10_;
   var _loc4_;
   var _loc13_;
   var _loc17_;
   var _loc8_;
   while(_loc5_ < _loc22_)
   {
      _loc2_ = builddate[_loc5_];
      _loc12_ = _loc2_[0];
      _loc20_ = _loc2_[1];
      _loc19_ = _loc2_[3];
      _loc15_ = _loc2_[4];
      _loc14_ = _loc2_[6];
      _loc11_ = _loc2_[12];
      if(_loc20_ == 16 && _loc19_ % 2 == 1)
      {
         if(_loc12_ > 0 || _loc15_ > 0)
         {
            _loc6_ = _loc9_.attachMovie("house",_loc11_,100 + _loc5_);
            _loc18_ = _loc12_ != 0 ? _loc12_ : 7;
            _loc6_.land.gotoAndStop(_loc18_);
            _loc6_.gotoAndStop((_loc14_ - 1) * 10 + _loc15_ + 1);
            _loc6_._x = game[_loc11_]._x;
            _loc6_._y = game[_loc11_]._y;
            _loc6_.swapDepths(30000 + _loc6_._y * 3000 / YL + _loc6_._x * 30 / XL + 0);
         }
         else
         {
            _loc10_ = builddate[_loc5_ + 1][12];
            _loc6_ = _loc9_.attachMovie("brand",_loc10_,100 + _loc5_);
            _loc6_.gotoAndStop(_loc14_);
            _loc6_._x = game[_loc10_]._x;
            _loc6_._y = game[_loc10_]._y;
            _loc6_.swapDepths(30000 + _loc6_._y * 3000 / YL + _loc6_._x * 30 / XL + 0);
         }
      }
      _loc4_ = _loc2_[10];
      if(_loc4_ > 0)
      {
         if(_loc4_ <= 5 || _loc4_ >= 9)
         {
            _loc13_ = _loc2_[11];
            _loc17_ = "npc" + _loc4_;
            _loc8_ = _loc9_.attachMovie(_loc17_ + "_s",_loc17_,100);
            _loc8_._x = game[_loc13_]._x;
            _loc8_._y = game[_loc13_]._y;
            _loc8_.swapDepths(30000 + _loc8_._y * 3000 / YL + _loc8_._x * 30 / XL + 9);
         }
         else if(_loc4_ == 6 || _loc4_ == 7)
         {
            _loc13_ = _loc2_[11];
            _loc17_ = _loc4_ != 6 ? "mine_s" : "balk_s";
            _loc8_ = _loc9_.attachMovie(_loc17_,_loc13_,100);
            _loc8_._x = game[_loc13_]._x;
            _loc8_._y = game[_loc13_]._y;
            _loc8_.swapDepths(30000 + 3000 * _loc8_._y / YL + 30 * _loc8_._x / XL + 1);
         }
      }
      _loc5_ = _loc5_ + 1;
   }
   _loc5_ = 1;
   var _loc21_;
   var _loc7_;
   var _loc16_;
   while(_loc5_ <= znum)
   {
      _loc21_ = "gufen" + playerdate[_loc5_][7];
      _loc7_ = game1.attachMovie(_loc21_,"gufen" + _loc5_,100 + _loc5_);
      _loc16_ = startpdate[start_arr[_loc5_]][2];
      _loc7_._x = _loc16_[0];
      _loc7_._y = _loc16_[1];
      _loc7_.swapDepths(30000 + _loc7_._y * 3000 / YL + _loc7_._x * 30 / XL + 0);
      _loc5_ = _loc5_ + 1;
   }
}
function asset_pg()
{
   var _loc1_ = 1;
   var _loc15_;
   var _loc10_;
   var _loc4_;
   var _loc13_;
   var _loc2_;
   var _loc9_;
   var _loc8_;
   var _loc3_;
   var _loc12_;
   var _loc14_;
   var _loc18_;
   var _loc17_;
   var _loc16_;
   while(_loc1_ <= znum)
   {
      _loc15_ = playerdate[_loc1_][3];
      if(_loc15_ != 9)
      {
         _loc10_ = 0;
         _loc4_ = 0;
         j = 1;
         while(j <= 15)
         {
            _loc10_ += stockdate[j][_loc1_ + 10][0] * stockdate[j][3];
            j++;
         }
         _loc13_ = builddate.length;
         j = 0;
         while(j < _loc13_)
         {
            _loc2_ = builddate[j];
            _loc9_ = _loc2_[0];
            _loc8_ = _loc2_[1];
            if(_loc9_ == _loc1_ && _loc8_ == 16)
            {
               _loc3_ = _loc2_[4];
               if(_loc3_ > 0 && _loc3_ < 6)
               {
                  _loc4_ += _loc2_[9] + 100 * _loc3_ * (_loc3_ + 1) / 2;
               }
               else
               {
                  _loc4_ += _loc2_[9];
               }
            }
            j++;
         }
         _loc12_ = moneydate[_loc1_];
         _loc14_ = _loc12_[1];
         _loc18_ = _loc12_[2];
         _loc17_ = _loc12_[6];
         _loc16_ = _loc12_[8];
         _loc12_[4] = int(_loc14_ + _loc18_ - _loc17_ - _loc16_ + _loc10_ + _loc4_);
         _loc12_[12] = int(_loc10_);
      }
      else
      {
         _loc12_ = moneydate[_loc1_];
         _loc12_[4] = 0;
         _loc12_[12] = 0;
      }
      _loc1_ = _loc1_ + 1;
   }
   var _loc7_ = [0,0,0,0,0,0,0];
   var _loc5_ = [0,[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]];
   _loc1_ = 1;
   while(_loc1_ <= znum)
   {
      if(playerdate[_loc1_][3] != 9)
      {
         _loc7_[_loc1_] = moneydate[_loc1_][4];
      }
      _loc1_ = _loc1_ + 1;
   }
   var _loc6_ = 0;
   _loc1_ = 1;
   var _loc11_;
   while(_loc1_ <= pnum)
   {
      _loc6_ = 0;
      j = 1;
      while(j <= znum)
      {
         if(_loc5_[_loc1_][0] < _loc7_[j])
         {
            _loc5_[_loc1_][0] = _loc7_[j];
            _loc5_[_loc1_][1] = j;
            _loc6_ = j;
         }
         j++;
      }
      _loc7_[_loc6_] = 0;
      _loc11_ = playerdate[_loc6_];
      _loc11_[10] = _loc1_;
      face["head" + _loc1_].gotoAndStop(_loc11_[7]);
      face["head" + _loc1_].face.gotoAndStop(_loc11_[11]);
      face["bak" + _loc1_].gotoAndStop(_loc6_);
      _loc1_ = _loc1_ + 1;
   }
   if(pnum < znum)
   {
      _loc1_ = pnum + 1;
      while(_loc1_ <= znum)
      {
         face["head" + _loc1_].gotoAndStop(13);
         face["bak" + _loc1_].gotoAndStop(5);
         _loc1_ = _loc1_ + 1;
      }
   }
   changemd_pg();
}
function changemd_pg()
{
   var _loc1_ = moneydate[pid];
   face.say_m2 = _loc1_[1];
   face.say_m3 = _loc1_[2];
   face.say_m4 = _loc1_[3];
   face.say_m5 = _loc1_[9];
   face.say_m6 = price_id;
}
function day_sd_pg()
{
   var _loc1_ = 1;
   var _loc5_;
   var _loc6_;
   var _loc2_;
   var _loc7_;
   var _loc3_;
   var _loc4_;
   while(_loc1_ <= 12)
   {
      stockdate[_loc1_][2] = stockdate[_loc1_][3];
      _loc5_ = stockdate[_loc1_][7];
      _loc6_ = stockdate[_loc1_][8];
      _loc2_ = _loc5_ + random(100 * (_loc6_ - _loc5_)) / 100;
      _loc2_ = random(2) != 0 ? _loc2_ - 0.05 : _loc2_ + 0.01;
      _loc7_ = stockdate[_loc1_][1];
      _loc2_ = int(_loc7_ * _loc2_ * 100) / 100;
      stockdate[_loc1_][3] = _loc2_;
      stockdate[_loc1_][4] = int(100 * (_loc2_ - stockdate[_loc1_][2])) / 100;
      _loc3_ = stockdate[_loc1_][3];
      if(_loc3_ > stockdate[_loc1_][5])
      {
         stockdate[_loc1_][5] = _loc3_;
      }
      else if(_loc3_ < stockdate[_loc1_][6])
      {
         stockdate[_loc1_][6] = _loc3_;
      }
      _loc4_ = stockdate[_loc1_][10];
      if(_loc4_ >= 2000)
      {
         stockdate[_loc1_][9] = 500 + random(2000);
      }
      else if(_loc4_ > 200 && _loc4_ < 2000)
      {
         stockdate[_loc1_][9] = 300 + random(1200);
      }
      else if(_loc4_ <= 200)
      {
         stockdate[_loc1_][9] = random(200);
      }
      _loc1_ = _loc1_ + 1;
   }
}
function week_sd_pg()
{
   var _loc2_ = 1;
   var _loc3_;
   var _loc4_;
   var _loc1_;
   while(_loc2_ <= 12)
   {
      _loc3_ = stockdate[_loc2_][7];
      _loc4_ = stockdate[_loc2_][8];
      _loc1_ = _loc3_ + random(100 * (_loc4_ - _loc3_)) / 100;
      _loc1_ = random(2) != 0 ? _loc1_ - 0.1 : _loc1_ + 0.1;
      if(_loc1_ < 0.5)
      {
         _loc1_ = 0.68;
      }
      if(_loc1_ > 2)
      {
         _loc1_ = 1.68;
      }
      stockdate[_loc2_][7] = _loc1_;
      _loc2_ = _loc2_ + 1;
   }
}
function month_sd_pg()
{
   var _loc2_ = 1;
   var _loc1_;
   while(_loc2_ <= 12)
   {
      _loc1_ = stockdate[_loc2_][8];
      _loc1_ = random(2) != 0 ? _loc1_ - 0.25 : _loc1_ + 0.25;
      if(_loc1_ < 0.5)
      {
         _loc1_ = 0.68;
      }
      if(_loc1_ > 2)
      {
         _loc1_ = 1.68;
      }
      stockdate[_loc2_][8] = _loc1_;
      _loc2_ = _loc2_ + 1;
   }
}
function price_pg()
{
   var _loc2_ = 0;
   var _loc1_ = 1;
   while(_loc1_ <= znum)
   {
      _loc2_ += moneydate[_loc1_][4];
      _loc1_ = _loc1_ + 1;
   }
   _loc2_ = int(_loc2_ / znum / 200000);
   if(_loc2_ <= 0)
   {
      _loc2_ = 1;
   }
   var _loc3_ = 1;
   return _loc3_;
}
function jin_pg()
{
   var _loc2_ = 1;
   var _loc1_;
   var _loc4_;
   var _loc3_;
   while(_loc2_ <= znum)
   {
      _loc1_ = playerdate[_loc2_];
      _loc4_ = _loc1_[4];
      _loc3_ = _loc1_[6];
      if(_loc4_ > 0)
      {
         _loc1_[4] = _loc1_[4] - 1;
      }
      if(_loc3_ > 0)
      {
         _loc1_[6] = _loc1_[6] - 1;
      }
      _loc2_ = _loc2_ + 1;
   }
}
function show2_pg(a, b)
{
   show_id = 0;
   attachMovie("show2","show2",69000);
   show2._x = 400;
   show2._y = 300;
   show2.show_say1 = a;
   show2.show_say2 = b;
}
function findfoe_pg(pid, znum)
{
   var _loc4_ = 0;
   var _loc5_ = 0;
   var _loc1_ = 0;
   var _loc2_;
   var _loc3_;
   while(_loc1_ < znum)
   {
      _loc2_ = enemydate[pid - 1][_loc1_];
      _loc3_ = playerdate[_loc1_][3];
      if(_loc4_ < _loc2_ && _loc3_ != 9)
      {
         _loc4_ = _loc2_;
         _loc5_ = _loc1_ + 1;
      }
      _loc1_ = _loc1_ + 1;
   }
   return _loc5_;
}
function checkMoney()
{
   var _loc3_ = moneydate;
   var _loc4_ = 1;
   var _loc5_;
   var _loc1_;
   var _loc2_;
   while(_loc4_ <= 4)
   {
      _loc3_ = moneydate[_loc4_];
      _loc5_ = _loc3_.length;
      _loc1_ = 1;
      while(_loc1_ < _loc5_)
      {
         _loc2_ = Number(_loc3_[_loc1_]);
         if(isNaN(_loc2_))
         {
            _loc2_ = money_1st[_loc1_];
         }
         _loc3_[_loc1_] = _loc2_;
         _loc1_ = _loc1_ + 1;
      }
      _loc4_ = _loc4_ + 1;
   }
}
function freenpc()
{
   var _loc2_;
   var _loc4_;
   var _loc1_;
   var _loc3_;
   if(tenor_id == 0)
   {
      _loc2_ = playerdate[pid][5];
      _loc4_ = playerdate[pid][6];
      if(_loc2_ > 0 && _loc4_ == 0)
      {
         tenor_id = 1;
      }
      else
      {
         tenor_id = 9;
      }
   }
   else if(tenor_id == 1)
   {
      timez = 0;
      show_id = 0;
      tenor_id = 2;
      _loc1_ = game.attachMovie("fog","fog",100);
      _loc1_._x = ppid._x;
      _loc1_._y = ppid._y;
      _loc1_.swapDepths(30000 + 3000 * _loc1_._y / YL + 30 * _loc1_._x / XL + 17);
   }
   else if(tenor_id == 2)
   {
      timez++;
      if(timez == 10)
      {
         ppid.npcz.gotoAndStop(1);
         tenor_id = 3;
         timez = 0;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         _loc2_ = playerdate[pid][5];
         setnpc(_loc2_);
         _loc3_ = balkdate[_loc2_][0];
         show2_pg("出状况啦~~~",_loc3_ + "附身期满而去");
         show_id = 0;
         tenor_id = 4;
      }
   }
   else if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         playerdate[pid][5] = 0;
         show_id = 0;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 9)
   {
      tenor_id = 0;
      brow_pg(7);
      begin_id = 1;
   }
}
function toss_pg()
{
   var _loc1_ = game.attachMovie("tz1","tz1",100 + random(50));
   _loc1_._x = 352 - game._x;
   _loc1_._y = 280 - game._y;
   _loc1_.swapDepths(20000777);
}
function setfree_pg()
{
   var _loc1_;
   if(tenor_id == 0)
   {
      _loc1_ = playerdate[pid][4];
      tenor_id = _loc1_ != 0 ? 3 : 1;
   }
   if(tenor_id == 1)
   {
      ppid._visible = true;
      brow_pg(7);
      tenor_id = 2;
      ppid.swapDepths(30000 + ppid._y * 3000 / YL + ppid._x * 30 / XL + 8);
      if(playerdate[pid][1] == 0 && face._currentframe == 2)
      {
         face.gotoAndStop(1);
      }
   }
   else if(tenor_id == 2)
   {
      if(playerdate[pid][1] == 0 && face._currentframe == 2)
      {
         face.gotoAndStop(1);
      }
      playerdate[pid][3] = 0;
      tenor_id = 0;
   }
   if(tenor_id == 3)
   {
      if(face._currentframe == 1)
      {
         face.gotoAndStop(2);
      }
      _loc1_ = playerdate[pid][4];
      show2_pg("动弹不得~~~","还有" + _loc1_ + "天！");
      show_id = 0;
      tenor_id = 4;
   }
   var _loc2_;
   var _loc3_;
   if(tenor_id == 4)
   {
      if(show_id == 1)
      {
         show_id = 0;
         sport_id = 4;
         end_id = 8;
         timez = 0;
         tenor_id = 0;
         _loc2_ = playerdate[pid][3];
         _loc3_ = _loc2_ != 3 ? 12 : 5;
         mood_pg(_loc3_);
         brow_pg(5);
      }
   }
}
function goload_pg()
{
   x1 = ppid._x;
   y1 = ppid._y;
   way_id = playerdate[pid][2];
   var _loc2_ = waydate1[way_id][0];
   var _loc1_ = waydate1[way_id][1];
   x2 = x1 + _loc2_;
   y2 = y1 + _loc1_;
   if(speed_id == 0)
   {
      lx = _loc2_ / 16;
      ly = _loc1_ / 16;
   }
   else
   {
      lx = _loc2_ / 8;
      ly = _loc1_ / 8;
   }
   sport_id = 1;
   brow_pg(6);
   变更地图说明框状态;
   map_say.gotoAndStop(1);
}
function selfveer_pg()
{
   var _loc4_ = [0,0,0,0];
   _loc4_[0] = da - 1;
   var _loc7_ = [0,3,4,1,2];
   way_id = playerdate[pid][2];
   var _loc5_ = _loc7_[way_id];
   var _loc3_ = builddate[dz][6];
   var _loc2_ = 1;
   var _loc1_ = 0;
   while(_loc1_ < da)
   {
      if(_loc3_[_loc1_] != _loc5_)
      {
         _loc4_[_loc2_] = _loc3_[_loc1_];
         _loc2_ = _loc2_ + 1;
      }
      _loc1_ = _loc1_ + 1;
   }
   var _loc6_ = 1 + random(_loc4_[0]);
   playerdate[pid][2] = _loc4_[_loc6_];
   way_id = _loc4_[_loc6_];
   brow_pg(6);
}
function self_pg1()
{
   var _loc8_;
   var _loc4_;
   var _loc10_;
   var _loc5_;
   var _loc7_;
   var _loc2_;
   var _loc6_;
   var _loc9_;
   var _loc3_;
   var _loc1_;
   if(tenor_id == 0)
   {
      if(week_id != 0)
      {
         attachMovie("yesno","yesno",49000);
         yesno._x = 400;
         yesno._y = 300;
         yesno.yn_say1 = "银行~~~";
         yesno.yn_say2 = "路过银行要进入吗？";
         yesno.yn_say3 = "请选择";
         tenor_id = 1;
         yesno_id = 0;
      }
      else
      {
         show2_pg("银行~~~","银行周日休息一天");
         tenor_id = 8;
      }
   }
   else if(tenor_id == 1)
   {
      if(yesno_id == 1)
      {
         yesno_id = 0;
         attachMovie("yesno2","yesno2",49100);
         yesno2._x = 400;
         yesno2._y = 300;
         tenor_id = 2;
      }
      else if(yesno_id == 2)
      {
         tenor_id = 9;
      }
   }
   else if(tenor_id == 2)
   {
      if(yesno_id == 1)
      {
         yesno_id = -1;
         _loc8_ = moneydate[pid][2];
         if(_loc8_ <= 0)
         {
            show2_pg("银行帐户赤字~~~","你户头没钱了！");
            tenor_id = 8;
         }
         else
         {
            attachMovie("counter","counter",49200);
            counter._x = 400;
            counter._y = 300;
            counter.counter_say1 = _loc8_;
            counter.counter_say2 = 0;
            tenor_id = 3;
         }
      }
      else if(yesno_id == 2)
      {
         yesno_id = -1;
         _loc4_ = moneydate[pid][1];
         if(_loc4_ <= 0)
         {
            show2_pg("现金赤字~~~","你都没有钱！存什么？");
            tenor_id = 8;
         }
         else
         {
            attachMovie("counter","counter",49200);
            counter._x = 400;
            counter._y = 300;
            counter.counter_say1 = _loc4_;
            counter.counter_say2 = 0;
            tenor_id = 4;
         }
      }
      else if(yesno_id == 3)
      {
         yesno_id = -1;
         _loc10_ = moneydate[pid][5];
         _loc5_ = moneydate[pid][8];
         if(_loc10_ > 0 && _loc5_ == 0)
         {
            attachMovie("counter","counter",49200);
            counter._x = 400;
            counter._y = 300;
            counter.counter_say1 = _loc10_ * 1000;
            counter.counter_say2 = 0;
            tenor_id = 5;
         }
         else if(_loc5_ > 0)
         {
            show2_pg("贷款尚未还清~~~","请先偿还上次贷款！");
            tenor_id = 8;
         }
         else if(_loc10_ <= 0)
         {
            show2_pg("出现信任危机~~~","银行可不放心贷款给你");
            tenor_id = 8;
         }
      }
      else if(yesno_id == 4)
      {
         yesno_id = -1;
         _loc4_ = moneydate[pid][1];
         _loc5_ = moneydate[pid][8];
         if(_loc5_ == 0)
         {
            show2_pg("表错情~~~","你目前没有负债在身……");
            tenor_id = 8;
         }
         else if(_loc4_ <= 0)
         {
            show2_pg("现金赤字~~~","你身上都没钱！还什么？");
            tenor_id = 8;
         }
         else
         {
            attachMovie("counter","counter",49200);
            counter._x = 400;
            counter._y = 300;
            counter.counter_say1 = _loc4_ <= _loc5_ ? _loc4_ : _loc5_;
            counter.counter_say2 = 0;
            tenor_id = 6;
         }
      }
      else if(yesno_id == 5)
      {
         yesno_id = -1;
         _loc7_ = moneydate[pid];
         _loc2_ = pcarddate[pid - 1];
         _loc10_ = _loc7_[5];
         _loc6_ = _loc7_[6];
         _loc9_ = _loc7_[7];
         _loc3_ = _loc2_[0];
         if(_loc6_ > 0 || _loc9_ > 0)
         {
            show2_pg("抱歉~~~","你早已经拥有信用卡了！");
         }
         else if(_loc6_ == 0 && _loc9_ == 0 && _loc10_ < 50)
         {
            show2_pg("出现信任危机~~~","信用卡申请未获通过！");
         }
         else if(_loc3_ > 23)
         {
            show2_pg("卡片栏已满~~~","请为信用卡留出空间！");
         }
         else
         {
            _loc1_ = _loc3_;
            while(_loc1_ > 0)
            {
               _loc2_[_loc1_ + 1] = _loc2_[_loc1_];
               _loc1_ = _loc1_ - 1;
            }
            _loc2_[1] = 1;
            _loc2_[0] = _loc2_[0] + 1;
            show2_pg("道具更新~~~","信用卡申请获批准！");
            moneydate[pid][7] = 100000;
         }
         tenor_id = 8;
      }
      else if(yesno_id == 6)
      {
         yesno_id = -1;
         _loc4_ = moneydate[pid][1];
         _loc6_ = moneydate[pid][6];
         _loc9_ = moneydate[pid][7];
         if(_loc6_ == 0 && _loc9_ == 0)
         {
            show2_pg("表错情~~~","你都还没申请信用卡……");
            tenor_id = 8;
         }
         else if(_loc4_ <= 0)
         {
            show2_pg("现金赤字~~~","你身上都没钱！还什么？");
            tenor_id = 8;
         }
         else
         {
            attachMovie("counter","counter",49200);
            counter._x = 400;
            counter._y = 300;
            counter.counter_say1 = _loc4_ <= _loc6_ ? _loc4_ : _loc6_;
            counter.counter_say2 = 0;
            tenor_id = 7;
         }
      }
      else if(yesno_id == 7)
      {
         tenor_id = 9;
      }
   }
   else if(tenor_id == 3)
   {
      if(yesno_id >= 0)
      {
         moneydate[pid][1] += yesno_id;
         moneydate[pid][2] -= yesno_id;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 4)
   {
      if(yesno_id >= 0)
      {
         moneydate[pid][1] -= yesno_id;
         moneydate[pid][2] += yesno_id;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 5)
   {
      if(yesno_id >= 0)
      {
         moneydate[pid][1] += yesno_id;
         moneydate[pid][8] += yesno_id;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 6)
   {
      if(yesno_id >= 0)
      {
         moneydate[pid][1] -= yesno_id;
         moneydate[pid][8] -= yesno_id;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 7)
   {
      if(yesno_id >= 0)
      {
         moneydate[pid][1] -= yesno_id;
         moneydate[pid][6] -= yesno_id;
         moneydate[pid][7] += yesno_id;
         tenor_id = 9;
      }
   }
   else if(tenor_id == 8)
   {
      if(show_id == 1)
      {
         tenor_id = 9;
         show_id = 0;
      }
   }
   else if(tenor_id == 9)
   {
      changemd_pg();
      tenor_id = 0;
      yesno_id = 0;
      sport_id = 3;
   }
}
function self_pg2()
{
   if(tenor_id == 0)
   {
      if(week_id != 0)
      {
         attachMovie("yesno","yesno",49000);
         yesno._x = 300;
         yesno._y = 200;
         yesno.yn_say1 = "股市~~~";
         yesno.yn_say2 = "路过股市要进入吗？";
         yesno.yn_say3 = "请选择";
         tenor_id = 1;
         yesno_id = 0;
      }
      else
      {
         show2_pg("股市~~~","股市今日休市");
         tenor_id = 3;
      }
   }
   else if(tenor_id == 1)
   {
      if(yesno_id == 1)
      {
         yesno_id = 0;
         attachMovie("stockz","stockz",49100);
         tenor_id = 2;
      }
      else if(yesno_id == 2)
      {
         tenor_id = 9;
      }
   }
   else if(tenor_id == 2)
   {
      if(yesno_id == 1)
      {
         tenor_id = 9;
      }
   }
   else if(tenor_id == 3)
   {
      if(show_id == 1)
      {
         tenor_id = 9;
         show_id = 0;
      }
   }
   else if(tenor_id == 9)
   {
      changemd_pg();
      tenor_id = 0;
      yesno_id = 0;
      sport_id = 3;
   }
}
