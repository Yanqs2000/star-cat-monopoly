i = 1;
while(i <= znum)
{
   var md6 = _root.moneydate[i][6];
   if(md6 > 0)
   {
      if(md6 <= 10000)
      {
         this["card" + i + 1] = md6;
         this["card" + i + 2] = md6;
         this["card" + i + 3] = 0;
         _root.moneydate[i][6] = 0;
         _root.moneydate[i][7] = 100000;
         _root.moneydate[i][2] -= md6;
      }
      else
      {
         var temp = int(md6 / 2);
         this["card" + i + 1] = md6;
         this["card" + i + 2] = temp;
         this["card" + i + 3] = md6 - temp;
         _root.moneydate[i][6] -= temp;
         _root.moneydate[i][7] += temp;
         _root.moneydate[i][2] -= temp;
      }
      if(_root.moneydate[i][2] < 0)
      {
         _root.moneydate[i][1] += _root.moneydate[i][2];
         _root.moneydate[i][2] = 0;
      }
   }
   i++;
}
stop();
