import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import com.jpexs.decompiler.flash.AbortRetryIgnoreHandler;
import com.jpexs.decompiler.flash.SWF;
import com.jpexs.decompiler.flash.exporters.FrameExporter;
import com.jpexs.decompiler.flash.exporters.modes.SpriteExportMode;
import com.jpexs.decompiler.flash.exporters.settings.SpriteExportSettings;
import com.jpexs.decompiler.flash.tags.DefineSpriteTag;
import com.jpexs.decompiler.flash.tags.EndTag;
import com.jpexs.decompiler.flash.tags.ShowFrameTag;

/** Original company-dialog artwork only. Dynamic placeholder text is not rasterized. */
class ExportCompanyUiAssets {
    private static final AbortRetryIgnoreHandler ABORT = new AbortRetryIgnoreHandler() {
        public int handle(Throwable error) { return ABORT; }
        public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };
    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
    public static void main(String[] args) throws Exception {
        try (var input = new FileInputStream(args[0])) {
            var swf = new SWF(input, true);
            var source = (DefineSpriteTag) swf.getCharacter(1515);
            require(source.frameCount == 50, "show frame count changed");
            var frame = source.getTimeline().getFrames().get(19);
            var dialog = new DefineSpriteTag(swf);
            dialog.setCharacterId(5001);
            dialog.setExportName("company-dialog-art");
            int[] depths = {1, 3};
            int[] ids = {1510, 1512};
            int[] xs = {-3960, 0};
            int[] ys = {-3480, 300};
            for (int i = 0; i < depths.length; i++) {
                var layer = frame.layers.get(depths[i]);
                require(layer.characterId == ids[i] && layer.matrix.translateX == xs[i]
                    && layer.matrix.translateY == ys[i] && layer.matrix.getScaleXFloat() == 1
                    && layer.matrix.getScaleYFloat() == 1, "show artwork layer changed");
                dialog.addTag(layer.toPlaceObjectTag(depths[i]));
            }
            dialog.addTag(new ShowFrameTag(swf));
            dialog.addTag(new EndTag(swf));
            dialog.setFrameCount(1);
            swf.addTag(dialog);
            dialog.resetTimeline();
            var bounds = dialog.getRectWithStrokes();
            require(bounds.Xmin == -3960 && bounds.Xmax == 3960 && bounds.Ymin == -3480
                && bounds.Ymax == 3400, "show artwork bounds changed");
            var settings = new SpriteExportSettings(SpriteExportMode.PNG, 1.0, 4);
            var files = new FrameExporter().exportSpriteFrames(ABORT, args[2], swf, 5001,
                List.of(0), 1, settings, null);
            require(files.size() == 1, "expected one original dialog artwork frame");
            Path destination = Path.of(args[1]);
            Files.createDirectories(destination.getParent());
            Files.copy(files.get(0).toPath(), destination, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
