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
import com.jpexs.decompiler.flash.types.RECT;

/** Offline company-sprite renderer; accepts a staged SWF with selected high-resolution fills. */
class ExportCompanyAssets {
    private static final int[] IDS = {186,180,213,183,189,192,204,198,195,201,207,210};
    private static final int[][] BOUNDS = {
        {-1780,1780,-2540,1280},{-1800,1800,-2460,1300},{-2090,2170,-2200,1520},
        {-2210,2050,-2600,1540},{-2010,2010,-2820,1520},{-1780,1860,-2020,1440},
        {-2080,1960,-2280,1560},{-2100,2100,-2180,1480},{-2260,2260,-1560,1660},
        {-2120,2120,-1840,1560},{-2090,2130,-2580,1520},{-2080,2080,-2060,1540}
    };
    private static final AbortRetryIgnoreHandler ABORT = new AbortRetryIgnoreHandler() {
        public int handle(Throwable error) { return ABORT; }
        public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };
    private static void require(boolean value, String message) {
        if (!value) throw new IllegalStateException(message);
    }
    public static void main(String[] args) throws Exception {
        require(args.length == 3, "usage: ExportCompanyAssets play.swf output-dir scratch-dir");
        double density = Double.parseDouble(System.getProperty("starcat.pixelDensity", "1.0"));
        require(Double.isFinite(density) && density >= 1 && density <= 4, "invalid pixel density");
        try (var input = new FileInputStream(args[0])) {
            var swf = new SWF(input, true);
            var exporter = new FrameExporter();
            var settings = new SpriteExportSettings(SpriteExportMode.PNG, density, 4);
            for (int i = 0; i < IDS.length; i++) {
                var sprite = swf.getCharacter(IDS[i]);
                require(sprite instanceof DefineSpriteTag, "company symbol is not a sprite: " + IDS[i]);
                var timeline = (DefineSpriteTag) sprite;
                require(timeline.frameCount == 1, "company sprite frame count changed: " + IDS[i]);
                RECT bounds = timeline.getRectWithStrokes();
                int[] expected = BOUNDS[i];
                require(bounds.Xmin == expected[0] && bounds.Xmax == expected[1]
                    && bounds.Ymin == expected[2] && bounds.Ymax == expected[3],
                    "company sprite logical bounds changed: " + IDS[i]);
                Path scratch = Path.of(args[2]).resolve("company-" + (i + 1));
                Files.createDirectories(scratch);
                var frames = exporter.exportSpriteFrames(ABORT, scratch.toString(), swf,
                    IDS[i], List.of(0), 1, settings, null);
                require(frames.size() == 1, "company frame export mismatch: " + (i + 1));
                Path target = Path.of(args[1]).resolve((i + 1) + ".png");
                Files.createDirectories(target.getParent());
                Files.copy(frames.get(0).toPath(), target, StandardCopyOption.REPLACE_EXISTING);
            }
            System.out.println("{\"tool\":\"JPEXS 26.2.1\",\"pixelDensity\":" + density
                + ",\"companySymbols\":" + java.util.Arrays.toString(IDS) + "}");
        }
    }
}
