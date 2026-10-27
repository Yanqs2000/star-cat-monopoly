import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import com.jpexs.decompiler.flash.AbortRetryIgnoreHandler;
import com.jpexs.decompiler.flash.SWF;
import com.jpexs.decompiler.flash.exporters.FrameExporter;
import com.jpexs.decompiler.flash.exporters.modes.SpriteExportMode;
import com.jpexs.decompiler.flash.exporters.settings.SpriteExportSettings;
import com.jpexs.decompiler.flash.tags.*;
import com.jpexs.decompiler.flash.timeline.Frame;

/** Offline original-art export. The source file is never saved. */
class ExportActivityAssets {
    private static final AbortRetryIgnoreHandler HANDLER = new AbortRetryIgnoreHandler() {
        public int handle(Throwable error) { return AbortRetryIgnoreHandler.ABORT; }
        public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };
    private static int nextId = 7000;
    private static void require(boolean value, String reason) {
        if (!value) throw new IllegalStateException(reason);
    }
    private static DefineSpriteTag sprite(SWF swf, int id) { return (DefineSpriteTag) swf.getCharacter(id); }
    private static DefineSpriteTag copy(SWF swf, DefineSpriteTag source, int first, int count, Integer picId) {
        var result = new DefineSpriteTag(swf);
        result.setCharacterId(nextId++);
        var previous = new ArrayList<Integer>();
        for (int i = 0; i < count; i++) {
            for (int depth : previous) {
                var remove = new RemoveObject2Tag(swf); remove.setDepth(depth); result.addTag(remove);
            }
            Frame frame = source.getTimeline().getFrames().get(first + i);
            for (var entry : frame.layers.entrySet()) {
                var placement = entry.getValue().toPlaceObjectTag(entry.getKey());
                if (picId != null && "pic".equals(entry.getValue().instanceName)) placement.setCharacterId(picId);
                result.addTag(placement);
            }
            result.addTag(new ShowFrameTag(swf));
            previous = new ArrayList<>(frame.layers.keySet());
        }
        result.addTag(new EndTag(swf)); result.setFrameCount(count); swf.addTag(result); result.resetTimeline();
        return result;
    }
    private static String quoted(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }
    private static void fields(SWF swf, Frame frame, double[] parent,
                               List<String> output, int recursion) {
        require(recursion < 12, "unexpected cyclic artwork");
        for (var layer : frame.layers.values()) {
            var m = layer.matrix;
            double a=m.getScaleXFloat(),d=m.getScaleYFloat();
            double c=m.getRotateSkew1Float(),skew=m.getRotateSkew0Float();
            double tx=m.translateX/20.0,ty=m.translateY/20.0;
            double[] t={parent[0]*a+parent[2]*skew,parent[1]*a+parent[3]*skew,
                parent[0]*c+parent[2]*d,parent[1]*c+parent[3]*d,
                parent[0]*tx+parent[2]*ty+parent[4],parent[1]*tx+parent[3]*ty+parent[5]};
            var tag = swf.getCharacter(layer.characterId);
            if (tag instanceof DefineEditTextTag text) {
                var b = text.bounds;
                output.add("{\"characterId\":"+layer.characterId+",\"variable\":"+quoted(text.variableName)
                    +",\"x\":"+(t[4]+t[0]*b.Xmin/20.0+t[2]*b.Ymin/20.0)+",\"y\":"+(t[5]+t[1]*b.Xmin/20.0+t[3]*b.Ymin/20.0)
                    +",\"matrix\":["+t[0]+","+t[1]+","+t[2]+","+t[3]+"],\"width\":"+((b.Xmax-b.Xmin)/20.0)
                    +",\"height\":"+((b.Ymax-b.Ymin)/20.0)+",\"fontSize\":"+(text.fontHeight/20.0)
                    +",\"align\":"+text.align+"}");
            } else if (tag instanceof DefineSpriteTag child) {
                int index = Math.floorMod(layer.time, child.frameCount);
                fields(swf, child.getTimeline().getFrames().get(index), t, output, recursion+1);
            }
        }
    }
    private static String export(SWF swf, String id, int sourceId, int count, Integer npc,
                                  Path output, Path cache) throws Exception {
        var source = sprite(swf, sourceId);
        var b = source.getRectWithStrokes();
        DefineSpriteTag render = source;
        if (npc != null) {
            var picture = copy(swf, sprite(swf, 1313), npc-1, 1, null);
            render = copy(swf, source, 0, count, picture.getCharacterId());
        } else if (count == 1 && source.frameCount > 1) render = copy(swf, source, 0, 1, null);
        require(source.frameCount >= count, "missing native frames "+id);
        var indices = new ArrayList<Integer>();
        for (int i=0;i<count;i++) indices.add(i);
        Path scratch = cache.resolve(id); Files.createDirectories(scratch);
        var files = new FrameExporter().exportSpriteFrames(HANDLER, scratch.toString(), swf,
            render.getCharacterId(), indices, 1, new SpriteExportSettings(SpriteExportMode.PNG,1.0,4), null);
        require(files.size()==count, "frame export mismatch "+id);
        Path folder = output.resolve(id); Files.createDirectories(folder);
        StringBuilder meta=new StringBuilder("{\"id\":"+quoted(id)+",\"sourceSymbol\":"+sourceId
            +",\"sourcePicFrame\":"+(npc==null?"null":npc)+",\"boundsTwips\":["+b.Xmin+","+b.Xmax+","+b.Ymin+","+b.Ymax+"],\"frames\":[");
        for (int i=0;i<count;i++) {
            Files.copy(files.get(i).toPath(), folder.resolve((i+1)+".png"), StandardCopyOption.REPLACE_EXISTING);
            var textFields=new ArrayList<String>();
            if (sourceId==1319 || sourceId==1479 || sourceId==2184 || sourceId==2194)
                fields(swf, source.getTimeline().getFrames().get(i),new double[]{1,0,0,1,0,0},textFields,0);
            if (i>0)meta.append(',');
            meta.append("{\"sourceFrame\":").append(i+1).append(",\"fields\":[").append(String.join(",",textFields)).append("]}");
        }
        return meta.append("]}").toString();
    }
    public static void main(String[] args) throws Exception {
        try (var input=new FileInputStream(args[0])) {
            var swf=new SWF(input,true);
            for(var tag:swf.getTags()) if(tag instanceof DefineEditTextTag text) text.initialText="";
            Path out=Path.of(args[1]),cache=Path.of(args[2]);
            var clips=new ArrayList<String>();
            for(int npc:new int[]{9,12,13,14,15,23})clips.add(export(swf,"trait-"+npc,1319,60,npc,out,cache));
            clips.add(export(swf,"show-npc4",1479,50,null,out,cache));
            clips.add(export(swf,"witch",2184,1,null,out,cache));
            clips.add(export(swf,"lottery",2194,1,null,out,cache));
            clips.add(export(swf,"fog",3758,19,null,out,cache));
            clips.add(export(swf,"car2",865,111,null,out,cache));
            System.out.println("{\"clips\":["+String.join(",",clips)+"]}");
        }
    }
}
