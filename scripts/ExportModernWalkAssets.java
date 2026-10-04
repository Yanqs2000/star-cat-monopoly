import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

import com.jpexs.decompiler.flash.AbortRetryIgnoreHandler;
import com.jpexs.decompiler.flash.SWF;
import com.jpexs.decompiler.flash.exporters.FrameExporter;
import com.jpexs.decompiler.flash.exporters.modes.SpriteExportMode;
import com.jpexs.decompiler.flash.exporters.settings.SpriteExportSettings;
import com.jpexs.decompiler.flash.tags.DefineSpriteTag;
import com.jpexs.decompiler.flash.tags.base.BoundedTag;
import com.jpexs.decompiler.flash.timeline.DepthState;
import com.jpexs.decompiler.flash.types.RECT;

/** Offline export of the original four-direction walk timeline at a chosen pixel density. */
class ExportModernWalkAssets {
    private static final int[] ROOT_FRAMES = {5, 35, 65, 95};
    private static final String[] FACINGS = {"down-right", "down-left", "up-left", "up-right"};
    private static final AbortRetryIgnoreHandler ABORT = new AbortRetryIgnoreHandler() {
        @Override public int handle(Throwable throwable) { return AbortRetryIgnoreHandler.ABORT; }
        @Override public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    private static String sha256(Path path) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (var stream = Files.newInputStream(path)) {
            byte[] buffer = new byte[64 * 1024];
            for (int count; (count = stream.read(buffer)) >= 0;) digest.update(buffer, 0, count);
        }
        return HexFormat.of().formatHex(digest.digest());
    }

    private static int[] bounds(BoundedTag tag) {
        RECT rect = tag.getRectWithStrokes();
        return new int[] {rect.Xmin, rect.Xmax, rect.Ymin, rect.Ymax};
    }

    private static String jsonArray(int[] values) {
        return "[" + values[0] + "," + values[1] + "," + values[2] + "," + values[3] + "]";
    }

    public static void main(String[] args) throws Exception {
        require(args.length == 4, "usage: ExportModernWalkAssets swf output-dir scratch-dir pixel-density");
        Path source = Path.of(args[0]), output = Path.of(args[1]), scratch = Path.of(args[2]);
        double density = Double.parseDouble(args[3]);
        require(Double.isFinite(density) && density >= 1 && density <= 4,
            "pixel density must be between 1 and 4");
        try (var input = new FileInputStream(source.toFile())) {
            SWF swf = new SWF(input, true);
            require(swf.frameRate == 30.0f, "source frame rate changed");
            require(swf.getTimeline().getFrameCount() == 120, "source root frame count changed");
            FrameExporter exporter = new FrameExporter();
            SpriteExportSettings settings = new SpriteExportSettings(SpriteExportMode.PNG, density, 4);
            StringBuilder manifest = new StringBuilder("{\"tool\":\"JPEXS 26.2.1\",\"sourceSha256\":\"")
                .append(sha256(source)).append("\",\"pixelDensity\":").append(density).append(",\"clips\":[");
            for (int index = 0; index < ROOT_FRAMES.length; index++) {
                int rootFrame = ROOT_FRAMES[index];
                DepthState placement = swf.getTimeline().getDepthState(rootFrame, 1);
                require(placement != null, "missing actor at root frame " + rootFrame);
                Object raw = swf.getCharacter(placement.characterId);
                require(raw instanceof DefineSpriteTag, "walk actor is not an animated sprite");
                DefineSpriteTag sprite = (DefineSpriteTag) raw;
                require(sprite.frameCount > 0, "walk clip has no frames");
                int[] sourceBounds = bounds(sprite);
                List<Integer> frames = new ArrayList<>();
                for (int frame = 0; frame < sprite.frameCount; frame++) frames.add(frame);
                Path target = output.resolve(FACINGS[index]);
                Files.createDirectories(scratch.resolve(FACINGS[index]));
                List<File> exported = exporter.exportSpriteFrames(ABORT,
                    scratch.resolve(FACINGS[index]).toString(), swf, sprite.getCharacterId(),
                    frames, 1, settings, null);
                require(exported.size() == sprite.frameCount, "walk frame count changed");
                Files.createDirectories(target);
                for (int frame = 0; frame < exported.size(); frame++) {
                    Files.copy(exported.get(frame).toPath(), target.resolve((frame + 1) + ".png"),
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
                if (index > 0) manifest.append(',');
                manifest.append("{\"facing\":\"").append(FACINGS[index])
                    .append("\",\"sourceRootFrame\":").append(rootFrame)
                    .append(",\"sourceSymbol\":").append(sprite.getCharacterId())
                    .append(",\"frameCount\":").append(sprite.frameCount)
                    .append(",\"frameDurationMs\":").append(1000.0 / swf.frameRate)
                    .append(",\"sourceBoundsTwips\":").append(jsonArray(sourceBounds))
                    .append(",\"placementTwips\":[").append(placement.matrix.translateX)
                    .append(',').append(placement.matrix.translateY).append("]}");
            }
            manifest.append("]}");
            System.out.println(manifest);
        }
    }
}
