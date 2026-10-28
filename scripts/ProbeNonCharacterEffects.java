import java.io.*;
import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;
import com.jpexs.decompiler.flash.SWF;
import com.jpexs.decompiler.flash.tags.DefineSpriteTag;
import com.jpexs.decompiler.flash.tags.base.ImageTag;
import com.jpexs.decompiler.flash.tags.base.BoundedTag;

/** Evidence-only export: original bitmap bytes rendered by JPEXS and placement matrices. */
class ProbeNonCharacterEffects {
 public static void main(String[]args)throws Exception{
  try(var in=new FileInputStream(args[0])){
   var swf=new SWF(in,true);var root=Path.of(args[1]);Files.createDirectories(root);
   var all=new StringBuilder("{\"sprites\":[");boolean firstSprite=true;
   for(int id:new int[]{1163,1162,1185,1184,3758,391,1027,1026,1080,1048,1079}){
    var sprite=(DefineSpriteTag)swf.getCharacter(id);if(!firstSprite)all.append(',');firstSprite=false;
    var rect=sprite.getRectWithStrokes();all.append("{\"symbol\":").append(id).append(",\"frames\":").append(sprite.frameCount).append(",\"boundsTwips\":[").append(rect.Xmin).append(',').append(rect.Xmax).append(',').append(rect.Ymin).append(',').append(rect.Ymax).append("],\"bitmaps\":[");
    var deps=new TreeSet<Integer>();sprite.getNeededCharactersDeep(deps,new HashSet<String>());boolean firstBitmap=true;
    for(int dep:deps)if(swf.getCharacter(dep) instanceof ImageTag image){if(!firstBitmap)all.append(',');firstBitmap=false;var dim=image.getImageDimension();ImageIO.write(image.getImageCached().getBufferedImage(),"png",root.resolve(dep+".png").toFile());all.append("{\"id\":").append(dep).append(",\"size\":[").append(dim.width).append(',').append(dim.height).append("]}");}
    all.append("],\"timeline\":[");
    for(int i=0;i<sprite.frameCount;i++){
     if(i>0)all.append(',');all.append('[');boolean firstLayer=true;
     for(var entry:sprite.getTimeline().getFrame(i).layers.entrySet()){
      var state=entry.getValue();if(state.characterId<0)continue;if(!firstLayer)all.append(',');firstLayer=false;
      var m=state.getDrawingMatrix();var color=state.colorTransForm;
      all.append("{\"depth\":").append(entry.getKey()).append(",\"symbol\":").append(state.characterId).append(",\"matrix\":[").append(m.getScaleXFloat()).append(',').append(m.getRotateSkew0Float()).append(',').append(m.getRotateSkew1Float()).append(',').append(m.getScaleYFloat()).append(',').append(m.translateX/20.0).append(',').append(m.translateY/20.0).append("],\"alpha\":").append(color==null?1:color.getAlphaMulti()/256.0).append(",\"visible\":").append(state.isVisible);var character=state.getCharacter();if(character instanceof BoundedTag bounded){var b=bounded.getRectWithStrokes();all.append(",\"bounds\":[").append(b.Xmin/20.0).append(',').append(b.Ymin/20.0).append(',').append(b.Xmax/20.0).append(',').append(b.Ymax/20.0).append(']');}all.append('}');
     }all.append(']');
    }all.append("]}");
   }all.append("]}\n");System.out.print(all);
  }
 }
}
