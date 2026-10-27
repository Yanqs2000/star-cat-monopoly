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
import com.jpexs.decompiler.flash.tags.ShowFrameTag;
import com.jpexs.decompiler.flash.tags.base.BoundedTag;
import com.jpexs.decompiler.flash.tags.base.DrawableTag;
import com.jpexs.decompiler.flash.tags.base.PlaceObjectTypeTag;
import com.jpexs.decompiler.flash.timeline.DepthState;
import com.jpexs.decompiler.flash.timeline.Frame;
import com.jpexs.decompiler.flash.types.MATRIX;
import com.jpexs.decompiler.flash.types.RECT;

/** Offline-only export of character reaction and attached-god source frames. */
class ExportReactionAssets {
    private static final String[] FACINGS = {
        "down-right", "down-left", "up-left", "up-right"
    };
    private static final String[] REACTIONS = {
        "neutral", "ready", "happy", "sad", "hurt"
    };
    private static final int[] OFFSETS = {1, 7, 3, 5, 10};
    private static final int[] GOD_IDS = {2, 3, 4, 5, 10, 11};

    private static final AbortRetryIgnoreHandler ABORT = new AbortRetryIgnoreHandler() {
        @Override public int handle(Throwable throwable) { return AbortRetryIgnoreHandler.ABORT; }
        @Override public AbortRetryIgnoreHandler getNewInstance() { return this; }
    };

    private record ClipExport(String name, String facing, int sourceRootFrame,
                              int sourceSymbol, int frames, MATRIX sourceMatrix,
                              int[] sourceBounds, DefineSpriteTag rendered,
                              int[] renderBounds) {}
    private record OverlayExport(int godId, int sourceRootFrame, int sourceSymbol,
                                 MATRIX sourceMatrix, int[] sourceBounds,
                                 DefineSpriteTag rendered, int[] renderBounds) {}

    private static void require(boolean condition, String message) {
        if (!condition) throw new IllegalStateException(message);
    }

    private static int[] bounds(BoundedTag tag) {
        RECT rect = tag.getRectWithStrokes();
        return new int[] {rect.Xmin, rect.Xmax, rect.Ymin, rect.Ymax};
    }

    private static void requireIdentityScale(MATRIX matrix, String name) {
        require(matrix != null, name + " placement has no matrix");
        require(matrix.getScaleXFloat() == 1.0f && matrix.getScaleYFloat() == 1.0f &&
            !matrix.hasRotate, name + " placement transform changed");
    }

    private static void copyAssembly(DefineSpriteTag target, Frame source) {
        for (var entry : source.layers.entrySet()) {
            target.addTag(entry.getValue().toPlaceObjectTag(entry.getKey()));
        }
    }

    private static DefineSpriteTag timelineForPlacement(SWF swf, DepthState source,
                                                         int frames, int id) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        result.addTag(source.toPlaceObjectTag(1));
        for (int frame = 0; frame < frames; frame++) result.addTag(new ShowFrameTag(swf));
        result.addTag(new EndTag(swf));
        result.setFrameCount(frames);
        swf.addTag(result);
        result.resetTimeline();
        return result;
    }

    private static DefineSpriteTag frozenFrame(SWF swf, DefineSpriteTag source,
                                                int zeroBasedFrame, int id) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        copyAssembly(result, source.getTimeline().getFrame(zeroBasedFrame));
        result.addTag(new ShowFrameTag(swf));
        result.addTag(new EndTag(swf));
        result.setFrameCount(1);
        swf.addTag(result);
        result.resetTimeline();
        return result;
    }

    private static DefineSpriteTag overlayAtRootPlacement(SWF swf, DepthState rootPlacement,
                                                           int frozenId, int id) {
        DefineSpriteTag result = new DefineSpriteTag(swf);
        result.setCharacterId(id);
        PlaceObjectTypeTag placement = rootPlacement.toPlaceObjectTag(1);
        placement.setCharacterId(frozenId);
        result.addTag(placement);
        result.addTag(new ShowFrameTag(swf));
        result.addTag(new EndTag(swf));
        result.setFrameCount(1);
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
            ABORT, scratch.toString(), swf, sprite.getCharacterId(), frameNumbers, 1,
            settings, null);
        require(files.size() == frames,
            "Expected " + frames + " exported frames, got " + files.size());
        Files.createDirectories(target);
        for (int index = 0; index < files.size(); index++) {
            Files.copy(files.get(index).toPath(), target.resolve((index + 1) + ".png"),
                StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private static String jsonArray(int[] values) {
        return "[" + values[0] + "," + values[1] + "," + values[2] + "," + values[3] + "]";
    }

    private static String matrixJson(MATRIX matrix) {
        return "{\"translateX\":" + matrix.translateX +
            ",\"translateY\":" + matrix.translateY +
            ",\"scaleX\":" + matrix.getScaleXFloat() +
            ",\"scaleY\":" + matrix.getScaleYFloat() +
            ",\"rotateSkew0\":" + matrix.getRotateSkew0Float() +
            ",\"rotateSkew1\":" + matrix.getRotateSkew1Float() + "}";
    }

    private static String metadata(int characterId, List<ClipExport> clips,
                                   List<OverlayExport> overlays) {
        StringBuilder json = new StringBuilder();
        json.append("{\"tool\":\"JPEXS 26.2.1\",\"characterId\":")
            .append(characterId).append(",\"clips\":[");
        for (int index = 0; index < clips.size(); index++) {
            if (index > 0) json.append(',');
            ClipExport clip = clips.get(index);
            json.append("{\"name\":\"").append(clip.name).append("\",")
                .append("\"facing\":\"").append(clip.facing).append("\",")
                .append("\"sourceRootFrame\":").append(clip.sourceRootFrame).append(',')
                .append("\"sourceSymbol\":").append(clip.sourceSymbol).append(',')
                .append("\"frames\":").append(clip.frames).append(',')
                .append("\"sourceMatrix\":").append(matrixJson(clip.sourceMatrix)).append(',')
                .append("\"sourceBoundsTwips\":").append(jsonArray(clip.sourceBounds)).append(',')
                .append("\"renderSprite\":").append(clip.rendered.getCharacterId()).append(',')
                .append("\"renderBoundsTwips\":").append(jsonArray(clip.renderBounds)).append('}');
        }
        json.append("],\"godOverlays\":[");
        for (int index = 0; index < overlays.size(); index++) {
            if (index > 0) json.append(',');
            OverlayExport overlay = overlays.get(index);
            json.append("{\"godId\":").append(overlay.godId).append(',')
                .append("\"sourceFrame\":").append(overlay.godId).append(',')
                .append("\"sourceRootFrame\":").append(overlay.sourceRootFrame).append(',')
                .append("\"sourceDepth\":3,")
                .append("\"sourceInstance\":\"npcz\",")
                .append("\"sourceSymbol\":").append(overlay.sourceSymbol).append(',')
                .append("\"sourceMatrix\":").append(matrixJson(overlay.sourceMatrix)).append(',')
                .append("\"sourceBoundsTwips\":").append(jsonArray(overlay.sourceBounds)).append(',')
                .append("\"renderSprite\":").append(overlay.rendered.getCharacterId()).append(',')
                .append("\"renderBoundsTwips\":").append(jsonArray(overlay.renderBounds)).append('}');
        }
        json.append("]}\n");
        return json.toString();
    }

    public static void main(String[] args) throws Exception {
        require(args.length == 4 || (args.length == 5 && "cheer".equals(args[4])),
            "usage: ExportReactionAssets star.swf output-dir scratch-dir character-id [cheer]");
        String[] names = args.length == 5 ? new String[] {"cheer"} : REACTIONS;
        int[] offsets = args.length == 5 ? new int[] {2} : OFFSETS;
        Path sourcePath = Path.of(args[0]);
        Path output = Path.of(args[1]);
        Path scratch = Path.of(args[2]);
        int characterId = Integer.parseInt(args[3]);
        require(characterId >= 1 && characterId <= 12, "character id must be 1-12");

        try (var input = new FileInputStream(sourcePath.toFile())) {
            SWF swf = new SWF(input, true);
            require(swf.frameRate == 30.0f, "source frame rate changed");
            require(swf.getTimeline().getFrameCount() == 120, "source root frame count changed");
            int nextId = swf.getNextCharacterId();
            List<ClipExport> clips = new ArrayList<>();

            for (int facingIndex = 0; facingIndex < FACINGS.length; facingIndex++) {
                for (int reactionIndex = 0; reactionIndex < names.length; reactionIndex++) {
                    int rootFrame = facingIndex * 30 + offsets[reactionIndex];
                    DepthState placement = swf.getTimeline().getDepthState(rootFrame - 1, 1);
                    require(placement != null, "missing depth-1 actor at root frame " + rootFrame);
                    requireIdentityScale(placement.matrix, "root frame " + rootFrame);
                    var character = swf.getCharacter(placement.characterId);
                    require(character instanceof DrawableTag && character instanceof BoundedTag,
                        "depth-1 actor is not drawable at root frame " + rootFrame);
                    int frames = ((DrawableTag) character).getNumFrames();
                    if ("neutral".equals(names[reactionIndex]) || "ready".equals(names[reactionIndex])) {
                        require(frames == 1, "neutral/ready must be static at root frame " + rootFrame);
                    } else {
                        require(character instanceof DefineSpriteTag,
                            "animated reaction is not a sprite at root frame " + rootFrame);
                        require(frames > 1, "animated reaction has no timeline at root frame " + rootFrame);
                    }
                    DefineSpriteTag rendered = timelineForPlacement(
                        swf, placement, frames, nextId++);
                    clips.add(new ClipExport(
                        names[reactionIndex], FACINGS[facingIndex], rootFrame,
                        placement.characterId, frames, new MATRIX(placement.matrix),
                        bounds((BoundedTag) character), rendered, bounds(rendered)));
                }
            }

            DepthState npcz = swf.getTimeline().getDepthState(0, 3);
            require(npcz != null && "npcz".equals(npcz.instanceName),
                "root depth 3 must remain named npcz");
            requireIdentityScale(npcz.matrix, "npcz");
            var overlayCharacter = swf.getCharacter(npcz.characterId);
            require(overlayCharacter instanceof DefineSpriteTag,
                "npcz source must remain a sprite");
            DefineSpriteTag overlaySource = (DefineSpriteTag) overlayCharacter;
            require(overlaySource.frameCount == 15, "npcz source frame count changed");
            for (int facingIndex = 1; facingIndex < FACINGS.length; facingIndex++) {
                DepthState other = swf.getTimeline().getDepthState(facingIndex * 30, 3);
                require(other != null && "npcz".equals(other.instanceName) &&
                    other.characterId == npcz.characterId && other.matrix.equals(npcz.matrix),
                    "npcz root placement differs by facing");
            }

            List<OverlayExport> overlays = new ArrayList<>();
            for (int godId : GOD_IDS) {
                DefineSpriteTag frozen = frozenFrame(swf, overlaySource, godId - 1, nextId++);
                DefineSpriteTag rendered = overlayAtRootPlacement(
                    swf, npcz, frozen.getCharacterId(), nextId++);
                overlays.add(new OverlayExport(
                    godId, 1, npcz.characterId, new MATRIX(npcz.matrix),
                    bounds(overlaySource), rendered, bounds(rendered)));
            }

            swf.updateCharacters();
            FrameExporter exporter = new FrameExporter();
            double pixelDensity = Double.parseDouble(System.getProperty("starcat.pixelDensity", "1.0"));
            require(Double.isFinite(pixelDensity) && pixelDensity >= 1.0 && pixelDensity <= 4.0,
                "pixel density must be between 1 and 4");
            SpriteExportSettings settings = new SpriteExportSettings(SpriteExportMode.PNG, pixelDensity, 4);
            for (ClipExport clip : clips) {
                exportTimeline(exporter, settings, swf, clip.rendered, clip.frames,
                    scratch.resolve(clip.name + "-" + clip.facing),
                    output.resolve(clip.name + "/" + clip.facing));
            }
            for (OverlayExport overlay : overlays) {
                exportTimeline(exporter, settings, swf, overlay.rendered, 1,
                    scratch.resolve("god-" + overlay.godId), output.resolve("gods"));
                Path generated = output.resolve("gods/1.png");
                Path target = output.resolve("gods/" + overlay.godId + ".png");
                if (!generated.equals(target)) {
                    Files.move(generated, target, StandardCopyOption.REPLACE_EXISTING);
                }
            }
            System.out.print(metadata(characterId, clips, overlays));
        }
    }
}
