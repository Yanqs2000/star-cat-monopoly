function card_pg()
{
   var _loc5_;
   var _loc4_;
   var _loc11_;
   var _loc10_;
   var _loc6_;
   var _loc9_;
   var _loc8_;
   var _loc7_;
   var _loc3_;
   var _loc2_;
   if(tenor_id == 0)
   {
      _loc5_ = md[ppid._y / YL][ppid._x / XL];
      _loc4_ = bd[_loc5_];
      _loc11_ = _loc4_[1];
      if(_loc11_ == 16)
      {
         _loc10_ = _loc4_[0];
         if(_loc10_ != pid)
         {
            _loc6_ = _loc10_;
            _loc4_[0] = pid;
            _root.game[_loc4_[12]].land.gotoAndStop(pid);
            _loc9_ = _loc4_[4] + 1;
            pay = (_loc4_[8] + _loc9_ * _loc9_ * 100) * price_id;
            mnd[_loc6_][2] += pay;
            if(pay <= mnd[pid][1])
            {
               mnd[pid][1] -= pay;
            }
            else
            {
               mnd[pid][2] -= pay - mnd[pid][1];
               mnd[pid][1] = 0;
            }
            mnd[pid][9]++;
            _loc8_ = _loc4_[2];
            hd[pid][_loc8_][0]++;
            hd[pid][_loc8_][1][hd[pid][_loc8_][0] - 1] = _loc5_;
            mnd[_loc6_][9]--;
            _loc8_ = _loc4_[2];
            hd[_loc6_][_loc8_][0]--;
            if(_loc4_[4] > 0)
            {
               mnd[pid][10]++;
               mnd[_loc6_][10]--;
            }
            _loc7_ = hd[_loc6_][_loc8_][0] + 1;
            _loc3_ = hd[_loc6_][_loc8_][1];
            _loc2_ = 0;
            while(_loc2_ < _loc7_)
            {
               if(_loc3_[_loc2_] == _loc5_)
               {
                  _loc3_.splice(_loc2_,1);
                  _loc3_.push(0);
                  break;
               }
               _loc2_ = _loc2_ + 1;
            }
            sortcard();
            show2_pg("恭喜哦~~~","你已经成功收购该土地");
         }
         else
         {
            show2_pg("搞错啦~~~","这本来就是你的土地");
         }
      }
      else
      {
         show2_pg("对不起哦~~~","无法收购公共设施占地");
      }
      tenor_id = 1;
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
