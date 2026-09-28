import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
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
        return copy(swf,source,first,count,"pic",picId,Set.of());
    }
    private static DefineSpriteTag copy(SWF swf, DefineSpriteTag source, int first, int count,
                                         String childName, Integer replacement, Set<String> removed) {
        var result = new DefineSpriteTag(swf);
        result.setCharacterId(nextId++);
        var previous = new ArrayList<Integer>();
        for (int i = 0; i < count; i++) {
            for (int depth : previous) {
                var remove = new RemoveObject2Tag(swf); remove.setDepth(depth); result.addTag(remove);
            }
            Frame frame = source.getTimeline().getFrames().get(first + i);
            for (var entry : frame.layers.entrySet()) {
                if (entry.getValue().instanceName != null && removed.contains(entry.getValue().instanceName)) continue;
                var placement = entry.getValue().toPlaceObjectTag(entry.getKey());
                if (replacement != null && childName.equals(entry.getValue().instanceName)) placement.setCharacterId(replacement);
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
        } else if (count == 1 && source.frameCount > 1) {
            render = copy(swf, source, 0, 1, null);
            b = render.getRectWithStrokes();
        }
        return exportRender(swf,id,sourceId,render,0,count,npc,b,output,cache);
    }
    private static String exportRender(SWF swf,String id,int sourceId,DefineSpriteTag render,int first,int count,Integer selection,
                                        com.jpexs.decompiler.flash.types.RECT b,Path output,Path cache) throws Exception {
        require(render.frameCount >= count, "missing native frames "+id);
        var indices = new ArrayList<Integer>();
        for (int i=0;i<count;i++) indices.add(i);
        Path scratch = cache.resolve(id); Files.createDirectories(scratch);
        var files = new FrameExporter().exportSpriteFrames(HANDLER, scratch.toString(), swf,
            render.getCharacterId(), indices, 1, new SpriteExportSettings(SpriteExportMode.PNG,1.0,4), null);
        require(files.size()==count, "frame export mismatch "+id);
        Path folder = output.resolve(id); Files.createDirectories(folder);
        StringBuilder meta=new StringBuilder("{\"id\":"+quoted(id)+",\"sourceSymbol\":"+sourceId
            +",\"sourcePicFrame\":"+(selection==null?"null":selection)+",\"nativeFirstFrame\":"+(first+1)+",\"boundsTwips\":["+b.Xmin+","+b.Xmax+","+b.Ymin+","+b.Ymax+"],\"frames\":[");
        for (int i=0;i<count;i++) {
            Files.copy(files.get(i).toPath(), folder.resolve((i+1)+".png"), StandardCopyOption.REPLACE_EXISTING);
            var textFields=new ArrayList<String>();
            fields(swf, sprite(swf,sourceId).getTimeline().getFrames().get(first+i),new double[]{1,0,0,1,0,0},textFields,0);
            if (i>0)meta.append(',');
            var placements=new ArrayList<String>();
            if(id.equals("ludo-dice"))for(var layer:sprite(swf,sourceId).getTimeline().getFrames().get(first+i).layers.values()) {
                if(layer.instanceName!=null && layer.instanceName.startsWith("tz")) {
                    var m=layer.matrix;
                    placements.add("{\"name\":"+quoted(layer.instanceName)+",\"x\":"+m.translateX/20.0+",\"y\":"+m.translateY/20.0+",\"matrix\":["+m.getScaleXFloat()+","+m.getRotateSkew0Float()+","+m.getRotateSkew1Float()+","+m.getScaleYFloat()+"]}");
                }
            }
            meta.append("{\"sourceFrame\":").append(i+1).append(",\"fields\":[").append(String.join(",",textFields)).append("]");
            if(!placements.isEmpty())meta.append(",\"placements\":[").append(String.join(",",placements)).append("]");
            meta.append("}");
        }
        return meta.append("]}").toString();
    }
    public static void main(String[] args) throws Exception {
        try (var input=new FileInputStream(args[0])) {
            var swf=new SWF(input,true);
            for(var tag:swf.getTags()) if(tag instanceof DefineEditTextTag text) text.initialText="";
            Path out=Path.of(args[1]),cache=Path.of(args[2]);
            var clips=new ArrayList<String>();
            if(args.length>3 && "ludo".equals(args[3])) {
                var betting=copy(swf,sprite(swf,2163),0,1,null);
                clips.add(exportRender(swf,"ludo-betting",2163,betting,0,1,null,betting.getRectWithStrokes(),out,cache));
                var game=copy(swf,sprite(swf,2163),2,1,null);
                clips.add(exportRender(swf,"ludo-game",2163,game,2,1,null,game.getRectWithStrokes(),out,cache));
                clips.add(export(swf,"ludo-chip",1571,1,null,out,cache));
                clips.add(export(swf,"ludo-win",1575,40,null,out,cache));
                var dice=copy(swf,sprite(swf,1594),0,40,"",null,Set.of("tz1","tz2","tz3","tz4","tz5","tz6"));
                clips.add(exportRender(swf,"ludo-dice",1594,dice,0,40,null,dice.getRectWithStrokes(),out,cache));
                for(int face=1;face<=6;face++) {
                    var picture=copy(swf,sprite(swf,1576),face-1,1,null);
                    clips.add(exportRender(swf,"ludo-face-"+face,1576,picture,face-1,1,null,picture.getRectWithStrokes(),out,cache));
                    var shadow=copy(swf,sprite(swf,1589),face-1,1,null);
                    clips.add(exportRender(swf,"ludo-shadow-"+face,1589,shadow,face-1,1,null,shadow.getRectWithStrokes(),out,cache));
                }
                System.out.println("{\"clips\":["+String.join(",",clips)+"]}");return;
            }
            if(args.length>3 && "portal-npcs".equals(args[3])) {
                for(int npc:new int[]{1,2,3,4,5,9,10,11,12,13,14,15}) {
                    var icon=(DefineSpriteTag)swf.getCharacterByExportName("npc"+npc+"_s");
                    clips.add(export(swf,"mini-npc-"+npc,icon.getCharacterId(),1,null,out,cache));
                }
                for(String name:new String[]{"balk_s","mine_s"}) {
                    var icon=(DefineSpriteTag)swf.getCharacterByExportName(name);
                    clips.add(export(swf,name.equals("balk_s")?"mini-barrier":"mini-mine",icon.getCharacterId(),1,null,out,cache));
                }
                System.out.println("{\"clips\":["+String.join(",",clips)+"]}");return;
            }
            if(args.length>3 && "portal-map".equals(args[3])) {
                clips.add(export(swf,"map-mini",216,1,null,out,cache));
                clips.add(export(swf,"magic-talk",1298,1,null,out,cache));
                for(int character=1;character<=12;character++) {
                    var head=(DefineSpriteTag)swf.getCharacterByExportName("head"+character);
                    clips.add(export(swf,"head-"+character,head.getCharacterId(),1,null,out,cache));
                }
                System.out.println("{\"clips\":["+String.join(",",clips)+"]}");return;
            }
            if(args.length>3 && "court-verdict".equals(args[3])) {
                var verdict=copy(swf,sprite(swf,2683),2,1,null);
                clips.add(exportRender(swf,"court-verdict",2683,verdict,2,1,null,verdict.getRectWithStrokes(),out,cache));
                System.out.println("{\"clips\":["+String.join(",",clips)+"]}");return;
            }
            if (args.length>3 && "task3".equals(args[3])) {
                var station=copy(swf,sprite(swf,2542),1,1,null);
                clips.add(exportRender(swf,"station",2542,station,1,1,null,station.getRectWithStrokes(),out,cache));
                var target=copy(swf,sprite(swf,2683),0,1,"",null,Set.of("man1","man2","man3","man4","man5","shan1"));
                clips.add(exportRender(swf,"court-target",2683,target,0,1,null,target.getRectWithStrokes(),out,cache));
                var cases=copy(swf,sprite(swf,2683),1,1,"",null,Set.of("shan2"));
                clips.add(exportRender(swf,"court-case",2683,cases,1,1,null,cases.getRectWithStrokes(),out,cache));
                clips.add(export(swf,"show2",1472,45,null,out,cache));
                clips.add(export(swf,"car1",884,113,null,out,cache));
                clips.add(export(swf,"court-highlight",2667,23,null,out,cache));
                for(int character=1;character<=12;character++) {
                    var face=copy(swf,sprite(swf,2042),character-1,1,null);
                    clips.add(exportRender(swf,"face-"+character,2042,face,character-1,1,null,face.getRectWithStrokes(),out,cache));
                    for(int heading=1;heading<=4;heading++) {
                        int index=(character-1)*10+heading;
                        var picture=copy(swf,sprite(swf,981),index-1,1,null);
                        var fly=copy(swf,sprite(swf,982),0,1,"fly",picture.getCharacterId(),Set.of());
                        clips.add(exportRender(swf,"fly-"+character+"-"+heading,982,fly,0,1,index,fly.getRectWithStrokes(),out,cache));
                    }
                }
                System.out.println("{\"clips\":["+String.join(",",clips)+"]}");
                return;
            }
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
