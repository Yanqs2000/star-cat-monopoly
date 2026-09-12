i = 1;
while(i <= znum)
{
   var md8 = _root.moneydate[i][8];
   if(md8 > 0)
   {
      if(md8 <= 10000)
      {
         this["loan" + i + 1] = md8;
         this["loan" + i + 2] = md8;
         this["loan" + i + 3] = 0;
         _root.moneydate[i][2] -= md8;
         _root.moneydate[i][8] = 0;
      }
      else
      {
         this["loan" + i + 1] = md8;
         this["loan" + i + 2] = 10000;
         this["loan" + i + 3] = md8 - 10000;
         _root.moneydate[i][2] -= 10000;
         _root.moneydate[i][8] -= 10000;
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
