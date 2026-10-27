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
            int[] ids = {130, 308, 488, 664};
            int[] rootFrames = {5, 35, 65, 95};
            System.out.print("[");
            for (int i = 0; i < ids.length; i++) {
                var sprite = (DefineSpriteTag) swf.getCharacter(ids[i]);
                RECT bounds = sprite.getRectWithStrokes();
                DepthState state = swf.getTimeline().getDepthState(rootFrames[i], 1);
                if (state.characterId != ids[i]) throw new IllegalStateException("Unexpected root frame mapping");
                var m = state.matrix;
                if (Math.abs(m.getScaleXFloat() - 1) > 0.0001 || Math.abs(m.getScaleYFloat() - 1) > 0.0001 || m.hasRotate)
                    throw new IllegalStateException("Preview expects translation-only root placement");
                if (i > 0) System.out.print(",");
                System.out.printf(java.util.Locale.ROOT,
                    "{\"id\":%d,\"frames\":%d,\"boundsTwips\":[%d,%d,%d,%d],\"translateTwips\":[%d,%d]}",
                    ids[i], sprite.frameCount, bounds.Xmin, bounds.Xmax, bounds.Ymin, bounds.Ymax, m.translateX, m.translateY);
            }
            System.out.println("]");
        }
    }
}
