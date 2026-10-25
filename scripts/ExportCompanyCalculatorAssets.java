import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.security.MessageDigest;
import java.util.HexFormat;
import com.jpexs.decompiler.flash.AbortRetryIgnoreHandler;
import com.jpexs.decompiler.flash.SWF;
import com.jpexs.decompiler.flash.exporters.FrameExporter;
import com.jpexs.decompiler.flash.exporters.modes.SpriteExportMode;
import com.jpexs.decompiler.flash.exporters.settings.SpriteExportSettings;
import com.jpexs.decompiler.flash.tags.DefineSpriteTag;
import com.jpexs.decompiler.flash.tags.EndTag;
import com.jpexs.decompiler.flash.tags.ShowFrameTag;

/** Original calculator artwork at 2x. Does not write the source SWF. */
class ExportCompanyCalculatorAssets {
    private static final AbortRetryIgnoreHandler ABORT = new AbortRetryIgnoreHandler() {
        public int handle(Throwable error) { return ABORT; }
        public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };
    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }
    public static void main(String[] args) throws Exception {
        require(args.length == 3, "Usage: source.swf destination.png scratch-directory");
        var hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(Path.of(args[0]))));
        require(hash.equals("790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba"), "Original SWF hash mismatch");
        try (var input = new FileInputStream(args[0])) {
            var swf = new SWF(input, true);
            var source = (DefineSpriteTag) swf.getCharacter(1463);
            require(source.frameCount == 2, "counter frame count changed");
            var frame = source.getTimeline().getFrames().get(0);
            require(frame.layers.get(45).characterId == 1461 && frame.layers.get(46).characterId == 1462,
                "counter numeric field layers changed");
            var dialog = new DefineSpriteTag(swf);
            dialog.setCharacterId(5001);
            // Keep original artwork and button labels; live numeric fields are DOM text.
            for (var entry : frame.layers.entrySet()) {
                if (entry.getKey() == 45 || entry.getKey() == 46) continue;
                dialog.addTag(entry.getValue().toPlaceObjectTag(entry.getKey()));
            }
            dialog.addTag(new ShowFrameTag(swf));
            dialog.addTag(new EndTag(swf));
            dialog.setFrameCount(1);
            swf.addTag(dialog);
            dialog.resetTimeline();
            var bounds = dialog.getRectWithStrokes();
            require(bounds.Xmin == -3340 && bounds.Xmax == 3340 && bounds.Ymin == -2540
                && bounds.Ymax == 2540, "counter artwork bounds changed");
            var settings = new SpriteExportSettings(SpriteExportMode.PNG, 2.0, 4);
            var files = new FrameExporter().exportSpriteFrames(ABORT, args[2], swf, 5001,
                List.of(0), 1, settings, null);
            require(files.size() == 1, "expected one original dialog artwork frame");
            Path destination = Path.of(args[1]);
            Files.createDirectories(destination.getParent());
            var image = javax.imageio.ImageIO.read(files.get(0));
            require(image.getWidth() == 692 && image.getHeight() == 532, "counter output dimensions changed");
            Files.copy(files.get(0).toPath(), destination, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
