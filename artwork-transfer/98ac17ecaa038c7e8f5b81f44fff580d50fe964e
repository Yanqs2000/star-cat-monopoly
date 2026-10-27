import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

/** Offline-only export of world sprites with explicit nested timeline control. */
class ExportWorldAssets {
    private static final int HOUSE_ID = 3401;
    private static final int LAND_ID = 3147;
    private static final int[] HOUSE_BOUNDS = {-360, 1440, -1373, 1107};

    private static final AbortRetryIgnoreHandler ABORT = new AbortRetryIgnoreHandler() {
        @Override public int handle(Throwable throwable) { return AbortRetryIgnoreHandler.ABORT; }
        @Override public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };

    private record ClipSpec(String id, int sourceSymbol, int rootFrame, int frames,
                            int[] bounds, boolean direct) {}
    private record ClipExport(ClipSpec spec, DefineSpriteTag sprite, int[] renderBounds,
                              List<Integer> nestedChildren) {}

    private static final List<ClipSpec> CLIPS = List.of(
        new ClipSpec("npc-1", 298, 1, 3, new int[] {0, 1140, -2000, 800}, false),
        new ClipSpec("npc-2", 310, 1, 54, new int[] {-180, 1620, -1600, 800}, false),
        new ClipSpec("npc-3", 372, 1, 12, new int[] {-260, 1440, -1320, 800}, false),
        new ClipSpec("npc-4", 226, 1, 55, new int[] {-198, 1342, -1600, 800}, false),
        new ClipSpec("npc-5", 335, 1, 22, new int[] {-1320, 1160, -1780, 800}, false),
        new ClipSpec("npc-9", 293, 1, 104, new int[] {0, 1140, -720, 800}, false),
        new ClipSpec("npc-10", 361, 1, 18, new int[] {-400, 1560, -1540, 800}, false),
        new ClipSpec("npc-11", 350, 1, 18, new int[] {-620, 1780, -1620, 800}, false),
        new ClipSpec("npc-12", 263, 1, 81, new int[] {0, 1157, -1283, 800}, false),
        new ClipSpec("npc-13", 280, 1, 33, new int[] {0, 1180, -906, 800}, false),
        new ClipSpec("npc-14", 248, 1, 24, new int[] {-200, 1560, -1466, 800}, false),
        new ClipSpec("npc-15", 235, 1, 26, new int[] {0, 1119, -1266, 800}, false),
        new ClipSpec("barrier-1", 3689, 1, 10, new int[] {-240, 1660, -1440, 960}, false),
        new ClipSpec("barrier-2", 3689, 2, 10, new int[] {-240, 1660, -1440, 960}, false),
        new ClipSpec("barrier-3", 3689, 3, 10, new int[] {-240, 1660, -1440, 960}, false),
        new ClipSpec("barrier-4", 3689, 4, 10, new int[] {-240, 1660, -1440, 960}, false),
        new ClipSpec("mine", 3696, 1, 80, new int[] {12, 1061, -719, 801}, true),
        new ClipSpec("rocket", 1080, 1, 80, new int[] {-1651, 2789, -3913, 2310}, false),
        new ClipSpec("explosion", 1027, 1, 60, new int[] {-1620, 2760, -3193, 1887}, false),
        new ClipSpec("card-gain", 1163, 1, 50, new int[] {14, 1174, -4020, -680}, true),
        new ClipSpec("ticket-gain", 1185, 1, 30, new int[] {224, 964, -3420, -860}, true)
    );

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

    private static void requireInside(int[] inner, int[] outer, String name) {
        require(inner[0] >= outer[0] && inner[1] <= outer[1]
            && inner[2] >= outer[2] && inner[3] <= outer[3],
            name + " render bounds exceed source bounds");
        require((inner[0] - outer[0]) % 20 == 0 && (inner[2] - outer[2]) % 20 == 0,
            name + " render origin is not pixel aligned to source bounds");
    }

    private static List<Integer> nestedChildren(SWF swf, ClipSpec clip) {
        if (clip.direct()) return List.of();
        if ("rocket".equals(clip.id())) return List.of(1048, 1079);
        Frame assembly = sprite(swf, clip.sourceSymbol())
            .getTimeline().getFrame(clip.rootFrame() - 1);
        List<Integer> children = new ArrayList<>();
        for (DepthState state : assembly.layers.values()) {
            var character = swf.getCharacter(state.characterId);
            if (character instanceof DefineSpriteTag) {
                DefineSpriteTag child = (DefineSpriteTag) character;
                children.add(child.getCharacterId());
                require(child.frameCount == clip.frames(),
                    clip.id() + " nested frame count changed: " + child.frameCount);
            }
        }
        require(children.size() == 1, clip.id() + " must have exactly one animated child");
        return children;
    }

    private static void copyAssembly(DefineSpriteTag target, Frame assembly) {
        for (var entry : assembly.layers.entrySet()) {
            target.addTag(entry.getValue().toPlaceObjectTag(entry.getKey()));
        }
    }

    private static DefineSpriteTag nestedTimeline(SWF swf, DefineSpriteTag source,
                                                   int rootFrame, int frames, int id) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        copyAssembly(result, source.getTimeline().getFrame(rootFrame - 1));
        for (int frame = 0; frame < frames; frame++) {
            result.addTag(new ShowFrameTag(swf));
        }
        result.addTag(new EndTag(swf));
        result.setFrameCount(frames);
        swf.addTag(result);
        result.resetTimeline();
        return result;
    }

    /**
     * 1079 frame 40 stops bowwave at 1048 frame 11 (an empty frame), and frame 70
     * restarts it at frame 1. Removing/replacing depth 1 reproduces those visible
     * playheads without executing ActionScript inside the offline renderer.
     */
    private static DefineSpriteTag rocketTimeline(SWF swf, int id) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        Frame root = sprite(swf, 1080).getTimeline().getFrame(0);
        require(root.layers.get(1).characterId == 1048, "rocket tail source changed");
        require(root.layers.get(3).characterId == 1079, "rocket body source changed");
        require(sprite(swf, 1048).frameCount == 11, "rocket tail frame count changed");
        require(sprite(swf, 1079).frameCount == 80, "rocket body frame count changed");
        copyAssembly(result, root);
        for (int frame = 1; frame <= 80; frame++) {
            if (frame == 40) {
                RemoveObject2Tag remove = new RemoveObject2Tag(swf);
                remove.setDepth(1);
                result.addTag(remove);
            } else if (frame == 70) {
                result.addTag(root.layers.get(1).toPlaceObjectTag(1));
            }
            result.addTag(new ShowFrameTag(swf));
        }
        result.addTag(new EndTag(swf));
        result.setFrameCount(80);
        swf.addTag(result);
        result.resetTimeline();
        return result;
    }

    private static DefineSpriteTag oneFrameCopy(SWF swf, Frame source, int id) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        copyAssembly(result, source);
        result.addTag(new ShowFrameTag(swf));
        result.addTag(new EndTag(swf));
        result.setFrameCount(1);
        swf.addTag(result);
        result.resetTimeline();
        return result;
    }

    private static void addHouseFrame(DefineSpriteTag target, Frame source,
                                      int neutralLandId) {
        for (var entry : source.layers.entrySet()) {
            int depth = entry.getKey();
            DepthState state = entry.getValue();
            PlaceObjectTypeTag placement = state.toPlaceObjectTag(depth);
            if (state.characterId == LAND_ID && "land".equals(state.instanceName)) {
                require(depth == 2, "house land depth changed");
                require(state.matrix.translateX == 337 && state.matrix.translateY == 557,
                    "house land placement changed");
                placement.setCharacterId(neutralLandId);
            }
            target.addTag(placement);
        }
        target.addTag(new ShowFrameTag(target.getSwf()));
    }

    private static DefineSpriteTag neutralHouses(SWF swf, DefineSpriteTag source,
                                                  int neutralLandId, int id) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        List<Integer> previousDepths = new ArrayList<>();
        for (Frame frame : source.getTimeline().getFrames()) {
            for (int depth : previousDepths) {
                RemoveObject2Tag remove = new RemoveObject2Tag(swf);
                remove.setDepth(depth);
                result.addTag(remove);
            }
            addHouseFrame(result, frame, neutralLandId);
            previousDepths = new ArrayList<>(frame.layers.keySet());
        }
        result.addTag(new EndTag(swf));
        result.setFrameCount(source.frameCount);
        swf.addTag(result);
        result.resetTimeline();
        return result;
    }

    private static void exportTimeline(FrameExporter exporter, SpriteExportSettings settings,
                                       SWF swf, DefineSpriteTag sprite, int frames,
                                       Path scratch, Path target) throws Exception {
        Files.createDirectories(scratch);
        List<Integer> frameNumbers = new ArrayList<>();
        for (int frame = 0; frame < frames; frame++) frameNumbers.add(frame);
        List<File> files = exporter.exportSpriteFrames(
            ABORT, scratch.toString(), swf, sprite.getCharacterId(), frameNumbers, 1, settings, null);
        require(files.size() == frames,
            "Expected " + frames + " exported frames, got " + files.size());
        Files.createDirectories(target);
        for (int index = 0; index < files.size(); index++) {
            Files.copy(files.get(index).toPath(), target.resolve((index + 1) + ".png"),
                StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private static void exportFrame(FrameExporter exporter, SpriteExportSettings settings,
                                    SWF swf, DefineSpriteTag sprite, int zeroBasedFrame,
                                    Path scratch, Path target) throws Exception {
        Files.createDirectories(scratch);
        List<File> files = exporter.exportSpriteFrames(
            ABORT, scratch.toString(), swf, sprite.getCharacterId(),
            List.of(zeroBasedFrame), 1, settings, null);
        require(files.size() == 1, "Expected one house frame, got " + files.size());
        Files.createDirectories(target.getParent());
        Files.copy(files.get(0).toPath(), target, StandardCopyOption.REPLACE_EXISTING);
    }

    private static String jsonArray(int[] values) {
        return "[" + values[0] + "," + values[1] + "," + values[2] + "," + values[3] + "]";
    }

    private static String metadata(List<ClipExport> clips, int neutralHouseId,
                                   int[] neutralHouseBounds) {
        StringBuilder json = new StringBuilder();
        json.append("{\"tool\":\"JPEXS 26.2.1\",\"clips\":[");
        for (int index = 0; index < clips.size(); index++) {
            if (index > 0) json.append(',');
            ClipExport clip = clips.get(index);
            json.append("{\"id\":\"").append(clip.spec.id()).append("\",")
                .append("\"sourceSymbol\":").append(clip.spec.sourceSymbol()).append(',')
                .append("\"rootFrame\":").append(clip.spec.rootFrame()).append(',')
                .append("\"frames\":").append(clip.spec.frames()).append(',')
                .append("\"renderSprite\":").append(clip.sprite.getCharacterId()).append(',')
                .append("\"nestedChildren\":").append(clip.nestedChildren.toString()).append(',')
                .append("\"targetBoundsTwips\":").append(jsonArray(clip.spec.bounds())).append(',')
                .append("\"renderBoundsTwips\":").append(jsonArray(clip.renderBounds)).append('}');
        }
        json.append("],\"neutralHouses\":{")
            .append("\"sourceSymbol\":3401,\"sourceFrames\":40,")
            .append("\"landSymbol\":3147,\"landFrame\":7,")
            .append("\"renderSprite\":").append(neutralHouseId).append(',')
            .append("\"targetBoundsTwips\":").append(jsonArray(HOUSE_BOUNDS)).append(',')
            .append("\"renderBoundsTwips\":").append(jsonArray(neutralHouseBounds))
            .append("}}\n");
        return json.toString();
    }

    public static void main(String[] args) throws Exception {
        require(args.length == 3, "usage: ExportWorldAssets play.swf output-dir scratch-dir");
        Path sourcePath = Path.of(args[0]);
        Path output = Path.of(args[1]);
        Path scratch = Path.of(args[2]);

        try (var input = new FileInputStream(sourcePath.toFile())) {
            SWF swf = new SWF(input, true);
            Map<Integer, Integer> expectedSourceFrames = new LinkedHashMap<>();
            expectedSourceFrames.put(298, 40);
            expectedSourceFrames.put(310, 40);
            expectedSourceFrames.put(372, 1);
            expectedSourceFrames.put(226, 40);
            expectedSourceFrames.put(335, 1);
            expectedSourceFrames.put(293, 1);
            expectedSourceFrames.put(361, 40);
            expectedSourceFrames.put(350, 40);
            expectedSourceFrames.put(263, 1);
            expectedSourceFrames.put(280, 1);
            expectedSourceFrames.put(248, 1);
            expectedSourceFrames.put(235, 1);
            expectedSourceFrames.put(3689, 4);
            expectedSourceFrames.put(3696, 80);
            expectedSourceFrames.put(1080, 1);
            expectedSourceFrames.put(1027, 2);
            expectedSourceFrames.put(1163, 50);
            expectedSourceFrames.put(1185, 30);
            for (var entry : expectedSourceFrames.entrySet()) {
                require(sprite(swf, entry.getKey()).frameCount == entry.getValue(),
                    "Source frame count changed for " + entry.getKey());
            }
            for (ClipSpec clip : CLIPS) {
                requireBounds(sprite(swf, clip.sourceSymbol()), clip.bounds(), clip.id());
            }

            DefineSpriteTag house = sprite(swf, HOUSE_ID);
            DefineSpriteTag land = sprite(swf, LAND_ID);
            require(house.frameCount == 40, "house frame count changed");
            require(land.frameCount == 10, "land frame count changed");
            requireBounds(house, HOUSE_BOUNDS, "house");
            require(land.getTimeline().getFrame(6).layers.isEmpty(),
                "neutral land frame 7 must remain empty");

            int nextId = swf.getNextCharacterId();
            List<ClipExport> exports = new ArrayList<>();
            for (ClipSpec clip : CLIPS) {
                List<Integer> nestedChildren = nestedChildren(swf, clip);
                DefineSpriteTag rendered;
                if (clip.direct()) {
                    rendered = sprite(swf, clip.sourceSymbol());
                } else if ("rocket".equals(clip.id())) {
                    rendered = rocketTimeline(swf, nextId++);
                } else {
                    rendered = nestedTimeline(swf, sprite(swf, clip.sourceSymbol()),
                        clip.rootFrame(), clip.frames(), nextId++);
                }
                int[] renderBounds = bounds(rendered);
                requireInside(renderBounds, clip.bounds(), clip.id());
                exports.add(new ClipExport(clip, rendered, renderBounds, nestedChildren));
            }

            DefineSpriteTag emptyLand = oneFrameCopy(
                swf, land.getTimeline().getFrame(6), nextId++);
            DefineSpriteTag neutralHouse = neutralHouses(swf, house,
                emptyLand.getCharacterId(), nextId++);
            int[] neutralHouseBounds = bounds(neutralHouse);
            requireInside(neutralHouseBounds, HOUSE_BOUNDS, "neutral houses");
            swf.updateCharacters();

            FrameExporter exporter = new FrameExporter();
            double pixelDensity = Double.parseDouble(System.getProperty("starcat.pixelDensity", "1.0"));
            require(Double.isFinite(pixelDensity) && pixelDensity >= 1.0 && pixelDensity <= 4.0,
                "pixel density must be between 1 and 4");
            SpriteExportSettings settings = new SpriteExportSettings(SpriteExportMode.PNG, pixelDensity, 4);
            for (ClipExport clip : exports) {
                exportTimeline(exporter, settings, swf, clip.sprite, clip.spec.frames(),
                    scratch.resolve(clip.spec.id()), output.resolve(clip.spec.id()));
            }
            for (int facing = 1; facing <= 4; facing++) {
                for (int level = 1; level <= 5; level++) {
                    int sourceFrame = (facing - 1) * 10 + level + 1;
                    exportFrame(exporter, settings, swf, neutralHouse, sourceFrame - 1,
                        scratch.resolve("neutral-house-" + facing + "-" + level),
                        output.resolve("neutral-houses/" + facing + "/" + level + ".png"));
                }
            }

            System.out.print(metadata(exports, neutralHouse.getCharacterId(), neutralHouseBounds));
        }
    }
}
