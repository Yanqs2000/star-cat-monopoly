date0 = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
var pnum = _root.pnum;
var znum = _root.znum;
var pd = _root.playerdate;
var sd = _root.stockdate;
var md = _root.moneydate;
var i = 1;
while(i <= 15)
{
   this["stock" + i] = _root.stockdate[i][0];
   i++;
}
var i = 1;
while(i <= znum)
{
   this["name" + i] = pd[i][0];
   i++;
}
var i = 1;
while(i <= 15)
{
   var st17 = sd[i][17];
   if(st17 > 0)
   {
      var j = 1;
      while(j <= znum)
      {
         var sd10 = sd[i][j + 10][0];
         if(sd10 > 0)
         {
            date0[j - 1][i - 1] += sd10;
            this["txt" + i + j] = date0[j - 1][i - 1];
         }
         j++;
      }
      var k = 0;
      var j = 1;
      while(j <= znum)
      {
         k += sd[i][j + 10][0];
         j++;
      }
      var j = 1;
      while(j <= znum)
      {
         var temp = int(st17 * sd[i][j + 10][0] / k);
         if(temp > 0)
         {
            date0[j - 1][i - 1] += temp;
            this["txt" + i + j] = date0[j - 1][i - 1];
         }
         j++;
      }
      sd[i][17] = 0;
   }
   i++;
}
var i = 1;
while(i <= znum)
{
   if(pd[i][3] != 9)
   {
      temp = 0;
      var j = 1;
      while(j <= 15)
      {
         temp += date0[i - 1][j - 1];
         j++;
      }
      md[i][2] += temp;
      this["money" + i] = temp;
   }
   else
   {
      this["money" + i] = " ";
   }
   i++;
}
var timez = 0;
onEnterFrame = function()
{
   timez++;
   if(timez >= 150)
   {
      timez = 0;
      nextFrame();
   }
};
bk.onRelease = function()
{
   nextFrame();
};
bk.useHandCursor = false;
stop();
