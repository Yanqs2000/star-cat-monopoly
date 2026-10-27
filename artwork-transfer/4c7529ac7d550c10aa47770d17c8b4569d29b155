date1 = [0,1,1,2,3,3,3,3];
date2 = ["就凭你们，也想和我斗！","赢得太轻松了……真没意思呢","有没有像样一点的对手呀？","你们，这回逊毙了哦……","用脚趾头想都知道，赢的当然是我啦","我的垄断时代到了哟，HOHOHOHOHO~~~","感谢CCTV、MTV以及明日TV给我这个机会","玩游戏，要先看懂规则滴","俺是世界第一等！","哈哈哈哈哈哈哈哈哈哈哈~~~","不好意思，各位承让了","赢钱要靠技术的，你们学着点","哼哼哼哼哼，你们也有今天呀","这个宝座，我八百年前就预定好了","能力越大，责任越大，我太辛苦了"];
_root.asset_pg();
var i = 1;
while(i <= 6)
{
   this["name" + i] = "";
   this["money" + i] = "";
   i++;
}
date3 = [0,["",0,0],["",0,0],["",0,0],["",0,0],["",0,0],["",0,0]];
var k = 0;
var i = 1;
while(i <= znum)
{
   var j = 1;
   while(j <= znum)
   {
      var pd = _root.playerdate[j];
      var md = _root.moneydate[j];
      if(pd[10] == i)
      {
         date3[i][0] = pd[0];
         date3[i][1] = pd[7];
         date3[i][2] = md[4];
         this["name" + i] = pd[0];
         this["money" + i] = md[4] <= 0 ? "破 产" : md[4];
         break;
      }
      j++;
   }
   i++;
}
name = date3[1][0];
man.gotoAndStop(date3[1][1]);
say = date2[random(date2.length)];
var i = 2;
while(i <= znum)
{
   var temp = attachMovie("pose" + date3[i][1],"play" + i,90000 + i * 100);
   temp._x = 500 + 120 * (i - 2);
   temp._y = 520;
   temp.gotoAndStop(date1[i]);
   i++;
}
stop();
timez = -250;
