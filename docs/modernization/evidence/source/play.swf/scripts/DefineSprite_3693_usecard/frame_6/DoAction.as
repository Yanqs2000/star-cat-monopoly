function card_pg()
{
   var _loc4_;
   if(tenor_id == 0)
   {
      _root.mouseh._visible = false;
      _loc4_ = attachMovie("moused","moused",12345);
      _loc4_._x = _xmouse;
      _loc4_._y = _ymouse;
      _loc4_.gotoAndStop(id);
      startDrag(moused,1,-300,-300,1600,1000);
      onMouseDown = function()
      {
         var _loc9_ = getpoint();
         var _loc6_ = _loc9_[0];
         var _loc7_ = bd[_loc6_];
         var _loc8_ = _loc7_[1];
         var _loc10_;
         var _loc12_;
         var _loc5_;
         var _loc2_;
         var _loc4_;
         var _loc3_;
         var _loc11_;
         if(_loc8_ > 0 && _loc8_ < 30)
         {
            _loc10_ = _loc7_[6];
            _loc12_ = _loc7_[10];
            _loc5_ = 0;
            _loc2_ = 1;
            while(_loc2_ <= znum)
            {
               _loc4_ = _root.game["player" + _loc2_];
               _loc3_ = md[_loc4_._y / YL][_loc4_._x / XL];
               if(_loc3_ == _loc6_)
               {
                  _loc5_ = 1;
                  break;
               }
               _loc2_ = _loc2_ + 1;
            }
            if(_loc12_ == 0 && _loc5_ == 0)
            {
               if(_loc8_ < 24 && _loc10_ > 0 || _loc8_ > 23)
               {
                  _loc11_ = id != 6 ? "mine" : "balk";
                  _root.balk_num = _root.balk_num + 1;
                  _loc4_ = _root.game.attachMovie(_loc11_,_loc11_ + _root.balk_num,123);
                  _loc4_._x = _loc9_[1] * XL;
                  _loc4_._y = _loc9_[2] * YL;
                  _loc4_.swapDepths(30000 + 3000 * _loc4_._y / YL + 30 * _loc4_._x / XL + 1);
                  if(id == 6)
                  {
                     _loc4_.gotoAndStop(_loc10_);
                  }
                  _loc7_[10] = id;
                  _loc7_[11] = _loc4_._name;
                  sortcard();
                  show_id = 1;
               }
               else
               {
                  show2_pg("喂~~~~","这可是商业用地");
               }
            }
            else
            {
               show2_pg("很抱歉~~~~","此处已经被占用");
            }
         }
         else
         {
            show2_pg("小处不可随便~~~~","请维持风景区的整洁");
         }
      };
      tenor_id = 1;
   }
   else if(tenor_id == 1)
   {
      if(show_id == 1)
      {
         delete onMouseDown;
         moused.stopDrag();
         _root.mouseh._visible = true;
         _root.mouseh.startDrag(true,-300,-300,1600,1200);
         show_id = 0;
         gotoAndPlay(100);
         onEnterFrame = null;
      }
   }
}
gotoAndStop(90);
