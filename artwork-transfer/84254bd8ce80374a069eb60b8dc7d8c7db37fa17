import java.io.File;
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
import com.jpexs.decompiler.flash.tags.DefineSpriteTag;
import com.jpexs.decompiler.flash.tags.EndTag;
import com.jpexs.decompiler.flash.tags.RemoveObject2Tag;
import com.jpexs.decompiler.flash.tags.ShowFrameTag;
import com.jpexs.decompiler.flash.tags.base.PlaceObjectTypeTag;
import com.jpexs.decompiler.flash.timeline.DepthState;
import com.jpexs.decompiler.flash.timeline.Frame;
import com.jpexs.decompiler.flash.types.RECT;

/** Offline-only export of original property sprites. The source SWF is never saved. */
class ExportPropertyAssets {
    private static final int BRAND_ID = 839;
    private static final int HOUSE_ID = 3401;
    private static final int LAND_ID = 3147;
    private static final int[] BRAND_BOUNDS = {-8, 1152, -515, 745};
    private static final int[] HOUSE_BOUNDS = {-360, 1440, -1373, 1107};

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
            require(actual[index] == expected[index], name + " bounds changed");
        }
    }

    private static void addFrame(DefineSpriteTag target, Frame source, Integer landReplacementId) {
        for (var entry : source.layers.entrySet()) {
            int depth = entry.getKey();
            DepthState state = entry.getValue();
            PlaceObjectTypeTag placement = state.toPlaceObjectTag(depth);
            if (landReplacementId != null && state.characterId == LAND_ID && "land".equals(state.instanceName)) {
                require(depth == 2, "land must remain at depth 2");
                require(state.matrix.translateX == 337 && state.matrix.translateY == 557,
                    "land placement changed");
                placement.setCharacterId(landReplacementId);
            }
            target.addTag(placement);
        }
        target.addTag(new ShowFrameTag(target.getSwf()));
    }

    private static DefineSpriteTag oneFrameCopy(SWF swf, Frame source, int id, String exportName) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        result.setExportName(exportName);
        addFrame(result, source, null);
        result.addTag(new EndTag(swf));
        result.setFrameCount(1);
        swf.addTag(result);
        result.resetTimeline();
        return result;
    }

    private static DefineSpriteTag frozenHouse(SWF swf, DefineSpriteTag source, int landId,
                                                int id, String exportName) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        result.setExportName(exportName);
        List<Integer> previousDepths = new ArrayList<>();
        for (Frame frame : source.getTimeline().getFrames()) {
            for (int depth : previousDepths) {
                RemoveObject2Tag remove = new RemoveObject2Tag(swf);
                remove.setDepth(depth);
                result.addTag(remove);
            }
            addFrame(result, frame, landId);
            previousDepths = new ArrayList<>(frame.layers.keySet());
        }
        result.addTag(new EndTag(swf));
        result.setFrameCount(source.frameCount);
        swf.addTag(result);
        result.resetTimeline();
        return result;
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
        require(args.length == 3, "usage: ExportPropertyAssets play.swf output-dir scratch-dir");
        Path sourcePath = Path.of(args[0]);
        Path output = Path.of(args[1]);
        Path scratch = Path.of(args[2]);

        try (var input = new FileInputStream(sourcePath.toFile())) {
            SWF swf = new SWF(input, true);
            DefineSpriteTag brand = sprite(swf, BRAND_ID);
            DefineSpriteTag house = sprite(swf, HOUSE_ID);
            DefineSpriteTag land = sprite(swf, LAND_ID);
            require(brand.frameCount == 4, "brand frame count changed");
            require(house.frameCount == 40, "house frame count changed");
            require(land.frameCount == 10, "land frame count changed");
            requireBounds(brand, BRAND_BOUNDS, "brand");
            requireBounds(house, HOUSE_BOUNDS, "house");

            int nextId = swf.getNextCharacterId();
            int[] landIds = new int[4];
            int[] ownerShapeIds = new int[4];
            for (int owner = 1; owner <= 4; owner++) {
                Frame ownerFrame = land.getTimeline().getFrame(owner - 1);
                require(ownerFrame.layers.size() == 1, "owner marker frame must have one layer");
                ownerShapeIds[owner - 1] = ownerFrame.layers.firstEntry().getValue().characterId;
                landIds[owner - 1] = nextId++;
                oneFrameCopy(swf, ownerFrame, landIds[owner - 1], "property_owner_" + owner);
            }
            require(java.util.Arrays.equals(ownerShapeIds, new int[] {3140, 3142, 3144, 3146}),
                "owner marker source shapes changed");

            int[] frozenHouseIds = new int[4];
            for (int owner = 1; owner <= 4; owner++) {
                frozenHouseIds[owner - 1] = nextId++;
                DefineSpriteTag frozen = frozenHouse(
                    swf, house, landIds[owner - 1], frozenHouseIds[owner - 1],
                    "property_house_owner_" + owner);
                requireBounds(frozen, HOUSE_BOUNDS, "frozen house owner " + owner);
            }
            swf.updateCharacters();

            FrameExporter exporter = new FrameExporter();
            double pixelDensity = Double.parseDouble(System.getProperty("starcat.pixelDensity", "1.0"));
            require(Double.isFinite(pixelDensity) && pixelDensity >= 1.0 && pixelDensity <= 4.0,
                "pixel density must be between 1 and 4");
            SpriteExportSettings settings = new SpriteExportSettings(SpriteExportMode.PNG, pixelDensity, 4);
            for (int facing = 1; facing <= 4; facing++) {
                exportFrame(exporter, settings, swf, BRAND_ID, facing - 1,
                    scratch.resolve("sign-" + facing),
                    output.resolve("sell-sign/facing-" + facing + ".png"));
            }
            for (int owner = 1; owner <= 4; owner++) {
                for (int facing = 1; facing <= 4; facing++) {
                    for (int level = 0; level <= 5; level++) {
                        int sourceFrame = (facing - 1) * 10 + level;
                        exportFrame(exporter, settings, swf, frozenHouseIds[owner - 1], sourceFrame,
                            scratch.resolve("house-" + owner + "-" + facing + "-" + level),
                            output.resolve("houses/owner-" + owner + "/facing-" + facing
                                + "/level-" + level + ".png"));
                    }
                }
            }

            System.out.printf(
                "{\"tool\":\"JPEXS 26.2.1\",\"brandId\":839,\"brandBoundsTwips\":[-8,1152,-515,745],"
                + "\"houseId\":3401,\"houseBoundsTwips\":[-360,1440,-1373,1107],"
                + "\"landId\":3147,\"landPlacementTwips\":[337,557],"
                + "\"ownerFrames\":[1,2,3,4],\"ownerShapeIds\":[3140,3142,3144,3146],"
                + "\"houseFrameFormula\":\"(facing-1)*10+level+1\"}%n");
        }
    }
}
