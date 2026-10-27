import java.io.FileInputStream;
import com.jpexs.decompiler.flash.SWF;
import com.jpexs.decompiler.flash.tags.DefineSpriteTag;
import com.jpexs.decompiler.flash.timeline.DepthState;
import com.jpexs.decompiler.flash.types.RECT;

/** Offline metadata only. The browser never loads this tool or the SWF. */
class OriginalSpriteBounds {
    public static void main(String[] args) throws Exception {
        try (var input = new FileInputStream(args[0])) {
            var swf = new SWF(input, true);
            int[] rootFrames = {5, 35, 65, 95};
            System.out.print("[");
            for (int i = 0; i < rootFrames.length; i++) {
                DepthState state = swf.getTimeline().getDepthState(rootFrames[i], 1);
                if (state == null) throw new IllegalStateException("Missing root placement at frame " + rootFrames[i]);
                int id = state.characterId;
                var character = swf.getCharacter(id);
                if (!(character instanceof DefineSpriteTag))
                    throw new IllegalStateException("Root placement is not a sprite at frame " + rootFrames[i]);
                var sprite = (DefineSpriteTag) character;
                RECT bounds = sprite.getRectWithStrokes();
                var m = state.matrix;
                if (i > 0) System.out.print(",");
                System.out.printf(java.util.Locale.ROOT,
                    "{\"rootFrame\":%d,\"id\":%d,\"frames\":%d,\"frameRate\":%.8f,\"boundsTwips\":[%d,%d,%d,%d],\"translateTwips\":[%d,%d],\"scale\":[%.8f,%.8f],\"hasRotate\":%s}",
                    rootFrames[i], id, sprite.frameCount, swf.frameRate, bounds.Xmin, bounds.Xmax, bounds.Ymin, bounds.Ymax,
                    m.translateX, m.translateY, m.getScaleXFloat(), m.getScaleYFloat(), Boolean.toString(m.hasRotate));
            }
            System.out.println("]");
        }
    }
}
