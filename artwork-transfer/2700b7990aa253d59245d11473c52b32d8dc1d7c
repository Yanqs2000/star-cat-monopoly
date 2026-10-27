import java.io.FileInputStream;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.stream.IntStream;
import com.jpexs.decompiler.flash.*;
import com.jpexs.decompiler.flash.tags.DefineSpriteTag;
import com.jpexs.decompiler.flash.exporters.FrameExporter;
import com.jpexs.decompiler.flash.exporters.modes.SpriteExportMode;
import com.jpexs.decompiler.flash.exporters.settings.SpriteExportSettings;

/** Original bank frame7 chooses man.gotoAndStop(characterId). Never saves the SWF.
 * java -cp <ffdec.jar> scripts/ExportMonthlyAssets.java public/original/play.swf <temporary-output>
 * Output champions/1.png..12.png is copied byte-for-byte into public/modern/assets/monthly/.
 */
class ExportMonthlyAssets {
  public static void main(String[] args) throws Exception {
    var source=Path.of(args[0]);var out=Path.of(args[1]);
    var hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(source)));
    if(!hash.equals("790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba"))throw new IllegalArgumentException("Original SWF hash changed");
    try(var input=new FileInputStream(source.toFile())) {
      var swf=new SWF(input,true);var man=(DefineSpriteTag)swf.getCharacter(2517);
      if(man.frameCount!=12)throw new IllegalStateException("Monthly character frames changed");
      var handler=new AbortRetryIgnoreHandler(){public int handle(Throwable e){return ABORT;}public AbortRetryIgnoreHandler getNewInstance(){return this;}};
      Files.createDirectories(out.resolve("champions"));Files.createDirectories(out.resolve("render"));
      new FrameExporter().exportSpriteFrames(handler,out.resolve("render").toString(),swf,2517,IntStream.range(0,12).boxed().toList(),1,new SpriteExportSettings(SpriteExportMode.PNG,4.0,4),null);
      for(int id=1;id<=12;id++)Files.copy(out.resolve("render/DefineSprite_2517/"+id+".png"),out.resolve("champions/"+id+".png"),StandardCopyOption.REPLACE_EXISTING);
    }
  }
}
