stop();
var i = 1;
while(i <= 3)
{
   var temp = this["bt" + i];
   temp.id = i;
   temp.onRelease = function()
   {
      ch_id = this.id;
      gotoAndStop(3);
   };
   i++;
}
bt0.onRelease = function()
{
   gotoAndStop(5);
};
