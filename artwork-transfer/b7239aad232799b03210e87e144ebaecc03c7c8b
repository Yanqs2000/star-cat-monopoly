stop();
music.stop();
music_id = random(5) + 1;
music.attachSound("backmusic" + music_id);
music.onSoundComplete = function()
{
   music_id++;
   if(music_id > 5)
   {
      music_id = 1;
   }
   music.attachSound("backmusic" + music_id);
   music.start();
};
music.start();
if(new_id == 0)
{
   onEnterFrame = setNewGame;
}
else
{
   onEnterFrame = setLoadGame;
}
system_id = 0;
