i = 1;
while(i <= znum)
{
   var md2 = _root.moneydate[i][2];
   if(md2 > 0)
   {
      var temp = int(md2 / 10);
      this["loan" + i + 1] = md2;
      this["loan" + i + 2] = temp;
      this["loan" + i + 3] = md2 + temp;
      _root.moneydate[i][2] += temp;
      if(_root.moneydate[i][2] < 0)
      {
         _root.moneydate[i][1] += _root.moneydate[i][2];
         _root.moneydate[i][2] = 0;
      }
   }
   i++;
}
stop();
