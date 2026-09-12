function showp()
{
   var _loc2_ = 1;
   var _loc4_;
   var _loc3_;
   while(_loc2_ < a_arr.length)
   {
      _loc4_ = this["pp" + _loc2_];
      _loc3_ = a_arr[_loc2_];
      _loc4_.gotoAndStop(_loc3_ + 1);
      this["name" + _loc2_] = _loc3_ != 0 ? b_arr[_loc3_][0] : "";
      _loc2_ = _loc2_ + 1;
   }
}
function showmc()
{
   var _loc3_ = 1;
   var _loc4_;
   var _loc2_;
   while(_loc3_ <= 12)
   {
      _loc4_ = b_arr[_loc3_];
      _loc2_ = this["mc" + _loc3_];
      if(_loc4_[2] > 0)
      {
         _loc2_.gotoAndStop(_loc4_[3] + 1);
         _loc2_.nowf = _loc4_[3] + 1;
      }
      else
      {
         _loc2_.gotoAndStop(1);
         _loc2_.nowf = 1;
      }
      _loc3_ = _loc3_ + 1;
   }
}
stop();
var name1;
var name2;
var name3;
var name4;
var ai1;
var ai2;
var ai3;
var ai4;
var pd = _root.playerdate;
var mnd = _root.moneydate;
var std = _root.start_arr;
var ch_id = 0;
var say = "请用鼠标点选星座角色……";
var i = 1;
while(i <= 4)
{
   this["name" + i] = "";
   i++;
}
var a_arr = [0,0,0,0,0];
var b_arr = [0,["卷  毛",0,0,0,"[牡羊座]"],["阿  牛",0,0,0,"[金牛座]"],["吉吉&米米",0,0,0,"[双子座]"],["佳  佳",0,0,0,"[巨蟹座]"],["大  牌",0,0,0,"[狮子座]"],["薇  薇",0,0,0,"[处女座]"],["帅  戈",0,0,0,"[天秤座]"],["大  尾",0,0,0,"[天蝎座]"],["阿  飞",0,0,0,"[射手座]"],["阿  杰",0,0,0,"[摩羯座]"],["怪  卡",0,0,0,"[水瓶座]"],["妮  妮",0,0,0,"[双鱼座]"]];
var i = 1;
while(i <= 12)
{
   var temp = this["mc" + i];
   temp.id = i;
   temp.onRollOver = function()
   {
      this.nowf = this._currentframe;
      var _loc2_;
      if(this.nowf == 1)
      {
         ch_id = a_arr[0];
         _loc2_ = ch_id + 2;
         if(_loc2_ == 6)
         {
            _loc2_ = 5;
         }
         this.gotoAndStop(_loc2_);
      }
      else
      {
         this.gotoAndStop(1);
      }
      say = b_arr[this.id][0] + "  " + b_arr[this.id][4];
   };
   temp.onRollOut = function()
   {
      this.gotoAndStop(this.nowf);
      say = "";
   };
   i++;
}
var i = 1;
while(i <= 12)
{
   var temp = this["mc" + i];
   temp.onRelease = function()
   {
      _root.callsound(1);
      var _loc4_ = b_arr[this.id];
      var _loc6_;
      var _loc5_;
      var _loc3_;
      if(_loc4_[2] == 0)
      {
         ch_id = a_arr[0];
         if(ch_id < 4)
         {
            ch_id++;
            a_arr[0] = ch_id;
            a_arr[ch_id] = this.id;
            _loc4_[2] = 1;
            _loc4_[3] = ch_id;
            this._parent["pp" + ch_id].gotoAndStop(this.id + 1);
            this._parent["name" + ch_id] = _loc4_[0];
            this.gotoAndStop(ch_id + 1);
            this.nowf = ch_id + 1;
         }
         else if(ch_id == 4)
         {
            _loc6_ = a_arr[1];
            b_arr[_loc6_][2] = 0;
            b_arr[_loc6_][3] = 0;
            _loc5_ = a_arr.length - 1;
            _loc3_ = 1;
            while(_loc3_ < _loc5_)
            {
               a_arr[_loc3_] = a_arr[_loc3_ + 1];
               if(_loc3_ == _loc5_ - 1)
               {
                  a_arr[_loc3_ + 1] = this.id;
               }
               b_arr[a_arr[_loc3_]][3]--;
               _loc3_ = _loc3_ + 1;
            }
            _loc4_[2] = 1;
            _loc4_[3] = ch_id;
            this.gotoAndStop(ch_id + 1);
            this.nowf = ch_id + 1;
         }
      }
      else
      {
         this.gotoAndStop(1);
         this.nowf = 1;
         a_arr[_loc4_[3]] = 0;
         a_arr[0]--;
         ch_id = a_arr[0];
         _loc5_ = a_arr.length - 1;
         _loc3_ = _loc4_[3];
         while(_loc3_ < _loc5_)
         {
            a_arr[_loc3_] = a_arr[_loc3_ + 1];
            if(_loc3_ == _loc5_ - 1)
            {
               a_arr[_loc3_ + 1] = 0;
            }
            b_arr[a_arr[_loc3_]][3]--;
            _loc3_ = _loc3_ + 1;
         }
         _loc4_[2] = 0;
         _loc4_[3] = 0;
      }
      showp();
      showmc();
   };
   i++;
}
bt.onRelease = function()
{
   ch_id = a_arr[0];
   var _loc6_;
   var _loc11_;
   var _loc3_;
   var _loc7_;
   var _loc4_;
   var _loc5_;
   var _loc10_;
   var _loc9_;
   var _loc8_;
   if(ch_id == 0)
   {
      say = "请至少选择一个玩家";
      _root.callsound(2);
   }
   else
   {
      _root.callsound(1);
      trace(ch_id);
      if(ch_id < 4)
      {
         _loc6_ = new Array();
         _loc11_ = 0;
         _loc3_ = 1;
         while(_loc3_ < b_arr.length)
         {
            if(b_arr[_loc3_][2] == 0)
            {
               _loc6_[_loc11_] = _loc3_;
               _loc11_ = _loc11_ + 1;
            }
            _loc3_ = _loc3_ + 1;
         }
         _loc3_ = ch_id + 1;
         while(_loc3_ <= 4)
         {
            _loc7_ = random(_loc6_.length);
            _loc4_ = _loc6_[_loc7_];
            a_arr[_loc3_] = _loc4_;
            _loc5_ = b_arr[_loc4_];
            _loc5_[1] = 1;
            _loc5_[2] = 1;
            _loc5_[3] = _loc3_;
            _loc6_.splice(_loc7_,1);
            this._parent["mc" + _loc4_].gotoAndStop(_loc3_);
            _loc3_ = _loc3_ + 1;
         }
         showp();
      }
      _loc10_ = [1,2,3,4];
      _loc3_ = 1;
      while(_loc3_ <= 4)
      {
         _loc9_ = b_arr[a_arr[_loc3_]];
         _loc8_ = _loc9_[0];
         pd[_loc3_][0] = _loc8_;
         mnd[_loc3_][0] = _loc8_;
         pd[_loc3_][1] = _loc9_[1] != 0 ? 1 : 0;
         pd[_loc3_][7] = a_arr[_loc3_];
         _loc7_ = random(_loc10_.length);
         std[_loc3_] = _loc10_[_loc7_];
         _loc10_.splice(_loc7_,1);
         _loc3_ = _loc3_ + 1;
      }
      if(ch_id < 4)
      {
         play();
      }
      else
      {
         gotoAndPlay(149);
      }
   }
};
btback.onRelease = function()
{
   gotoAndStop(121);
};
