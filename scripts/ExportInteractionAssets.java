import java.io.File;
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

/** Offline-only export of original card faces and luck illustrations. */
class ExportInteractionAssets {
    private static final int CARD_SPRITE_ID = 1721;
    private static final int LUCK_SPRITE_ID = 1412;
    private static final int[] CARD_IDS = {1, 5, 6, 7, 9, 11, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 33};
    private static final int[] CARD_BOUNDS = {-500, 797, -640, 700};
    private static final int[] LUCK_BOUNDS = {0, 8000, 0, 6000};

    private static final AbortRetryIgnoreHandler ABORT = new AbortRetryIgnoreHandler() {
        @Override public int handle(Throwable throwable) { return AbortRetryIgnoreHandler.ABORT; }
        @Override public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    private static DefineSpriteTag sprite(SWF swf, int id) {
        var character = swf.getCharacter(id);
        require(character instanceof DefineSpriteTag, "Character " + id + " is not a sprite");
        return (DefineSpriteTag) character;
    }

    private static int[] bounds(DefineSpriteTag sprite) {
        RECT rect = sprite.getRectWithStrokes();
        return new int[] {rect.Xmin, rect.Xmax, rect.Ymin, rect.Ymax};
    }

    private static void requireBounds(DefineSpriteTag sprite, int[] expected, String name) {
        int[] actual = bounds(sprite);
        for (int index = 0; index < 4; index++) {
            require(actual[index] == expected[index], name + " bounds changed at index " + index
                + ": " + actual[index]);
        }
    }

    private static void exportFrame(FrameExporter exporter, SpriteExportSettings settings,
                                    SWF swf, int spriteId, int zeroBasedFrame,
                                    Path scratch, Path target) throws Exception {
        Files.createDirectories(scratch);
        List<File> files = exporter.exportSpriteFrames(
            ABORT, scratch.toString(), swf, spriteId, List.of(zeroBasedFrame), 1, settings, null);
        require(files.size() == 1, "Expected one exported frame, got " + files.size());
        Files.createDirectories(target.getParent());
        Files.copy(files.get(0).toPath(), target, StandardCopyOption.REPLACE_EXISTING);
    }

    public static void main(String[] args) throws Exception {
        require(args.length == 3, "usage: ExportInteractionAssets play.swf output-dir scratch-dir");
        Path sourcePath = Path.of(args[0]);
        Path output = Path.of(args[1]);
        Path scratch = Path.of(args[2]);

        try (var input = new FileInputStream(sourcePath.toFile())) {
            SWF swf = new SWF(input, true);
            DefineSpriteTag cards = sprite(swf, CARD_SPRITE_ID);
            DefineSpriteTag luck = sprite(swf, LUCK_SPRITE_ID);
            require(cards.frameCount == 40, "card sprite frame count changed");
            require(luck.frameCount == 60, "luck sprite frame count changed");
            requireBounds(cards, CARD_BOUNDS, "card sprite");
            requireBounds(luck, LUCK_BOUNDS, "luck sprite");

            FrameExporter exporter = new FrameExporter();
            double pixelDensity = Double.parseDouble(System.getProperty("starcat.pixelDensity", "1.0"));
            require(Double.isFinite(pixelDensity) && pixelDensity >= 1.0 && pixelDensity <= 4.0,
                "pixel density must be between 1 and 4");
            SpriteExportSettings settings = new SpriteExportSettings(SpriteExportMode.PNG, pixelDensity, 4);
            for (int cardId : CARD_IDS) {
                int sourceFrame = cardId + 1;
                exportFrame(exporter, settings, swf, CARD_SPRITE_ID, sourceFrame - 1,
                    scratch.resolve("card-" + cardId), output.resolve("cards/" + cardId + ".png"));
            }
            for (int luckId = 1; luckId <= 41; luckId++) {
                exportFrame(exporter, settings, swf, LUCK_SPRITE_ID, luckId - 1,
                    scratch.resolve("luck-" + luckId), output.resolve("luck/" + luckId + ".png"));
            }

            System.out.println(
                "{\"tool\":\"JPEXS 26.2.1\",\"cardSpriteId\":1721,"
                + "\"cardFrameCount\":40,\"cardBoundsTwips\":[-500,797,-640,700],"
                + "\"luckSpriteId\":1412,\"luckFrameCount\":60,"
                + "\"luckBoundsTwips\":[0,8000,0,6000]}"
            );
        }
    }
}
