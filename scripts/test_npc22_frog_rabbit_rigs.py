"""Regression checks for fixed-root, canonical-identity local NPC gestures."""
import importlib.util
import json
import math
from pathlib import Path
import unittest

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class LocalGestureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder = load('npc22_builder', ROOT / 'scripts/build-npc22.py')
        review = ROOT / 'public/hd-review/characters-22-23'
        cls.source = json.loads((review / 'source-timeline.json').read_text())
        cls.definitions = {d['id']: d for d in json.loads((review / 'npc-pose-index.json').read_text())}
        cls.layouts = json.loads((review / 'npc-atlas-layout.json').read_text())

    def fixture(self, npc):
        d = self.definitions[npc]
        poses = self.builder.split_atlas(Image.open(ROOT / f'public/hd-review/characters-22-23/{npc}-master.png'), d['uniqueCompositePoses'], self.layouts.get(npc))
        rects, _ = self.builder.source_body_rects(self.source, d['sourceSymbol'], len(d['framePoseIndicesZeroBased']))
        union = self.builder.union_rect(rects)
        canvas = tuple([math.floor(v) for v in union[:2]] + [math.ceil(v) for v in union[2:]])
        registered = [self.builder.register_pose(p, rects[f-1], canvas, 2) for p, f in zip(poses, d['poseFirstFramesOneBased'])]
        module = load('frog_rabbit_rigs', ROOT / 'scripts/npc22_frog_rabbit_rigs.py')
        sample = module.prepare_rig(npc, registered, 2, canvas, ROOT, d)
        origin = ((3 - canvas[0])*2, (-44 - canvas[1])*2) if npc == 'npc-13' else ((-8 - canvas[0])*2, (-71 - canvas[1])*2)
        return sample, registered[0], origin, registered, canvas, d

    def patch(self, image, origin, box):
        x, y = origin
        return np.asarray(image)[int(y+box[1]):int(y+box[3]), int(x+box[0]):int(x+box[2])]

    def test_face_and_planted_feet_never_drift_or_change_identity(self):
        # A global translation/optical-flow warp or a substituted generated face fails.
        for npc, face, feet in [('npc-13', (0, 0, 112, 96), (10, 119, 94, 132)), ('npc-14', (56, 98, 127, 144), (23, 178, 124, 196))]:
            sample, canonical, origin, _, _, d = self.fixture(npc)
            for t in np.arange(0, len(d['framePoseIndicesZeroBased']), .5):
                with self.subTest(npc=npc, time=t):
                    frame = sample(float(t))
                    self.assertTrue(np.array_equal(self.patch(frame, origin, face), self.patch(canonical, origin, face)), 'face identity or position changed')
                    self.assertTrue(np.array_equal(self.patch(frame, origin, feet), self.patch(canonical, origin, feet)), 'planted feet moved')

    def test_local_gesture_changes_at_fractional_frame_times(self):
        # Returning pose zero or sparse holds dressed up as 60 fps fails.
        for npc, box, times in [('npc-13', (14, 92, 100, 115), [2.5, 3, 3.5, 4]), ('npc-14', (124, 54, 172, 96), [4.5, 5, 5.5, 6])]:
            sample, _, origin, _, _, _ = self.fixture(npc)
            patches = [self.patch(sample(t), origin, box).tobytes() for t in times]
            self.assertEqual(len(set(patches)), len(times), npc)

    def test_pose_zero_and_loop_boundary_preserve_canonical(self):
        for npc in ['npc-13', 'npc-14']:
            sample, canonical, _, _, _, d = self.fixture(npc)
            self.assertTrue(np.array_equal(sample(0), canonical))
            self.assertTrue(np.array_equal(sample(len(d['framePoseIndicesZeroBased'])), canonical))

    def test_expanded_canvas_does_not_change_gesture_or_registration(self):
        # Moving the canonical image onto the builder's safety padding must
        # only translate the rendered canvas, not move the local controls.
        module = load('frog_rabbit_rigs', ROOT / 'scripts/npc22_frog_rabbit_rigs.py')
        for npc in ['npc-13', 'npc-14']:
            sample, canonical, _, poses, canvas, d = self.fixture(npc)
            padded = []
            for pose in poses:
                image = Image.new('RGBA', (pose.width + 64, pose.height + 64))
                image.alpha_composite(pose, (32, 32))
                padded.append(image)
            expanded = (canvas[0]-16, canvas[1]-16, canvas[2]+16, canvas[3]+16)
            other = module.prepare_rig(npc, padded, 2, expanded, ROOT, d)
            for t in [0, 3.5, 6, 9.5, 12, 23.5]:
                cropped = other(t).crop((32, 32, canonical.width+32, canonical.height+32))
                self.assertTrue(np.array_equal(sample(t), cropped), (npc, t))

    def test_other_generated_poses_cannot_contaminate_the_rig(self):
        # Facial identity and position must come only from canonical pose zero.
        module = load('frog_rabbit_rigs', ROOT / 'scripts/npc22_frog_rabbit_rigs.py')
        for npc in ['npc-13', 'npc-14']:
            sample, canonical, _, poses, canvas, d = self.fixture(npc)
            poison = [canonical] + [Image.new('RGBA', canonical.size, (255, 0, 255, 255)) for _ in poses[1:]]
            other = module.prepare_rig(npc, poison, 2, canvas, ROOT, d)
            self.assertTrue(np.array_equal(sample(5.5), other(5.5)))


if __name__ == '__main__':
    unittest.main()
