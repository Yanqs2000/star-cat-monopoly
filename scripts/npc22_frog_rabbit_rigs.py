"""Canonical-only local gestures for the frog ruffian and white rabbit thief.

The original frog raises its crossed forearms during frames 0–12, then holds
until frame 33. The rabbit raises and lowers its folded screen-right ear over
24 source frames. Generated pose bounds are never animation controls: only
pose zero supplies pixels, and the planted feet and facial features stay fixed.
"""
import math

import numpy as np
from PIL import Image


def _ease_keys(t, keys):
    for (start, a), (end, b) in zip(keys, keys[1:]):
        if t <= end:
            u = max(0.0, (t - start) / (end - start))
            return a + (b - a) * (1 - math.cos(math.pi * u)) / 2
    return keys[-1][1]


def prepare_rig(npc, poses, density, canvas_rect, root, definition):
    """Return a continuous sampler in original 30 fps frame units.

    Coordinates below were marked on the canonical 2x runtime image, whose
    alpha starts one pixel after its left edge. getbbox is used once to locate
    that fixed image on the padded canvas, never to fit any other generated
    pose or to derive a deformation from changing whole-image bounds.
    """
    if npc not in ('npc-13', 'npc-14'):
        raise ValueError(f'No frog/rabbit rig for {npc}')
    canonical = poses[0].convert('RGBA').copy()
    bounds = canonical.getbbox()
    scale = density / 2
    ox, oy = bounds[0] - scale, bounds[1]
    period = len(definition['framePoseIndicesZeroBased'])
    rgba = np.asarray(canonical)

    if npc == 'npc-13':
        import cv2
        yy, xx = np.indices(rgba.shape[:2], dtype=np.float32)
        x, y = (xx - ox) / scale, (yy - oy) / scale
        # Compact local mesh: a crossed forearm band, zero at every boundary.
        # Neither the head through y=96 nor the belt/feet below y=116 is sampled.
        wx = np.sin(np.pi * np.clip((x - 10) / 92, 0, 1)) ** 2
        wy = np.sin(np.pi * np.clip((y - 96) / 20, 0, 1)) ** 2
        weight = wx * wy
        active = weight > 1e-7
        premult = rgba.astype(np.float32) / 255
        premult[:, :, :3] *= premult[:, :, 3:4]
        keys = [(0, 0), (2, .35), (4, .85), (6, 1), (8, .8), (10, .35), (12, 0), (33, 0)]

        def sample(t):
            amount = _ease_keys(float(t) % period, keys)
            if amount < 1e-8:
                return canonical.copy()
            # OpenCV samples on a 1/32-pixel grid. Quantize displacement
            # before adding canvas coordinates so padding cannot alter ties.
            delta = np.rint(3.4 * scale * amount * weight * 32) / 32
            moved = cv2.remap(premult, xx, yy + delta,
                              cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
            alpha = np.clip(moved[:, :, 3:4], 0, 1)
            rgb = np.divide(moved[:, :, :3], alpha, out=np.zeros_like(moved[:, :, :3]), where=alpha > 1e-8)
            converted = np.rint(np.concatenate([np.clip(rgb, 0, 1), alpha], axis=2) * 255).astype(np.uint8)
            out = rgba.copy()
            out[active] = converted[active]
            return Image.fromarray(out)

        return sample

    # A local ear mesh has a fixed root socket and a rigid distal ear. A smooth
    # transition across its white root avoids exposing a cutout seam.
    import cv2
    yy, xx = np.indices(rgba.shape[:2], dtype=np.float32)
    x, y = (xx - ox) / scale, (yy - oy) / scale
    u = np.clip((x - 119) / 19, 0, 1)
    v = np.clip((98 - y) / 12, 0, 1)
    weight = (u*u*(3 - 2*u)) * (v*v*(3 - 2*v))
    active = weight > 1e-7
    px, py = ox + 125*scale, oy + 84*scale
    dx, dy = xx - px, yy - py
    premult = rgba.astype(np.float32) / 255
    premult[:, :, :3] *= premult[:, :, 3:4]
    keys = [(0, 0), (3, .12), (6, .3), (9, .65), (12, 1), (15, .65), (18, .3), (21, .12), (24, 0)]

    def sample(t):
        amount = _ease_keys(float(t) % period, keys)
        if amount < 1e-8:
            return canonical.copy()
        angle = math.radians(24 * amount) * weight
        cosine, sine = np.cos(angle), np.sin(angle)
        sx = xx + np.rint(((cosine - 1)*dx - sine*dy) * 32) / 32
        sy = yy + np.rint((sine*dx + (cosine - 1)*dy) * 32) / 32
        moved = cv2.remap(premult, sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
        alpha = np.clip(moved[:, :, 3:4], 0, 1)
        rgb = np.divide(moved[:, :, :3], alpha, out=np.zeros_like(moved[:, :, :3]), where=alpha > 1e-8)
        converted = np.rint(np.concatenate([np.clip(rgb, 0, 1), alpha], axis=2) * 255).astype(np.uint8)
        out = rgba.copy()
        out[active] = converted[active]
        return Image.fromarray(out)

    return sample
