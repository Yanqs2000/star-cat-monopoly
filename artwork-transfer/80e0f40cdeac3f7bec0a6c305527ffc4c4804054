stop();
var i = 1;
while(i <= 3)
{
   if(bt_arr[i - 1] == 1)
   {
      var temp = this["bt" + i];
      temp.id = i;
      temp.onRelease = function()
      {
         ch_id = this.id;
         _root.gotoAndStop(15);
         gotoAndStop(3);
      };
   }
   i++;
}
bt0.onRelease = function()
{
   gotoAndStop(5);
};
