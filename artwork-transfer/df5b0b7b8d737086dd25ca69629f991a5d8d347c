"""Choose a hard pixel cut in shared generated-map context; never repaint/blend art."""
from __future__ import annotations
import numpy as np
from PIL import Image, ImageFilter
from collections import deque


def overlap_cut(old: Image.Image, new: Image.Image, *, transition: int,
                visibility: np.ndarray | None = None):
    if old.size != new.size or not 0 < transition <= old.width:
        raise ValueError('Shared context bounds/transition differ')
    a = np.asarray(old.convert('RGBA'))
    b = np.asarray(new.convert('RGBA'))
    if np.any(a[:, :, 3] != 255) or np.any(b[:, :, 3] != 255):
        raise ValueError('Use opaque native map references, never faded runtime tiles')
    height, width = a.shape[:2]
    difference = np.abs(a[:, :, :3].astype(float) - b[:, :, :3].astype(float))
    energy = np.mean(difference ** 2, axis=2)
    if visibility is not None:
        if visibility.shape != (height, width):
            raise ValueError('Visibility bounds differ')
        energy *= visibility
    energy[:, :width-transition] = 1e15
    parents = np.zeros((height, width), dtype=np.int32)
    previous = np.full(width, np.inf)
    previous[-1] = energy[0, -1]
    columns = np.arange(width)
    for row in range(1, height):
        # Isometric curbs can advance two pixels horizontally in one scanline.
        padded = np.pad(previous, (2, 2), constant_values=np.inf)
        choices = np.stack([padded[offset:offset+width] for offset in range(5)])
        chosen = choices.argmin(axis=0)
        parents[row] = columns + chosen - 2
        previous = energy[row] + choices[chosen, columns]
    path = np.empty(height, dtype=np.int32)
    path[-1] = width - 1
    for row in range(height-1, 0, -1):
        path[row-1] = parents[row, path[row]]
    use_new = np.arange(width)[None, :] > path[:, None]
    samples = difference[np.arange(height), path].mean(axis=1)
    if visibility is not None:
        samples = samples[visibility[np.arange(height), path] > .1]
    stats = {'meanRgbDifference': float(samples.mean()) if len(samples) else 0,
             'p95RgbDifference': float(np.quantile(samples, .95)) if len(samples) else 0,
             'visibleCutSamples': len(samples), 'maximumChangedPixels': int(width-1-path.min())}
    return use_new, path, stats


def _border_connected_low_alpha(low: np.ndarray) -> np.ndarray:
    height, width = low.shape
    outside = np.zeros(low.shape, dtype=bool)
    queue = deque()
    for row, column in ([(0, x) for x in range(width)]
                        + [(height-1, x) for x in range(width)]
                        + [(y, 0) for y in range(height)]
                        + [(y, width-1) for y in range(height)]):
        if low[row, column] and not outside[row, column]:
            outside[row, column] = True
            queue.append((row, column))
    while queue:
        row, column = queue.popleft()
        for y, x in [(row-1, column), (row+1, column), (row, column-1), (row, column+1)]:
            if 0 <= y < height and 0 <= x < width and low[y, x] and not outside[y, x]:
                outside[y, x] = True
                queue.append((y, x))
    return outside


def _alpha_components(mask: np.ndarray):
    seen = np.zeros(mask.shape, dtype=bool)
    height, width = mask.shape
    for row, column in zip(*np.where(mask)):
        if seen[row, column]:
            continue
        queue = deque([(row, column)])
        seen[row, column] = True
        points = []
        while queue:
            y, x = queue.popleft()
            points.append((y, x))
            for sy, sx in [(y-1, x), (y+1, x), (y, x-1), (y, x+1)]:
                if 0 <= sy < height and 0 <= sx < width and mask[sy, sx] and not seen[sy, sx]:
                    seen[sy, sx] = True
                    queue.append((sy, sx))
        yield np.asarray(points).T


def native_alpha_audit(image: Image.Image, *, permitted_reference: Image.Image | None = None) -> dict:
    """Inspect native alpha; an explicit source may prove an existing sky window.

    Reference alpha is used only for inspection, never to clip or fill artwork.
    Source-window bounds allow four source pixels plus one native pixel of
    resize rounding;
    at least 99% of each component must lie in the expanded original window.
    A source window must contain actual fully transparent sky, not just shading.
    Border-connected source sky cannot authorize new enclosed holes.
    """
    alpha = np.asarray(image.convert('RGBA'))[:, :, 3]
    solid = alpha >= 240
    if not solid.any():
        raise ValueError('Native map has no solid artwork')
    low = alpha < 200
    outside = _border_connected_low_alpha(low)
    enclosed_mask = low & ~outside
    enclosed = int(enclosed_mask.sum())
    approved = 0
    registration_outliers = 0
    if enclosed:
        if permitted_reference is None:
            raise ValueError(f'Native map contains {enclosed} enclosed low-alpha pixels')
        reference_alpha = np.asarray(permitted_reference.convert('RGBA'))[:, :, 3]
        reference_low = reference_alpha < 200
        reference_windows = reference_low & ~_border_connected_low_alpha(reference_low)
        actual_sky_windows = np.zeros(reference_windows.shape, dtype=bool)
        for ys, xs in _alpha_components(reference_windows):
            if (reference_alpha[ys, xs] == 0).any():
                actual_sky_windows[ys, xs] = True
        reference_windows = actual_sky_windows
        permission = Image.fromarray(reference_windows.astype(np.uint8) * 255)
        permission = permission.filter(ImageFilter.MaxFilter(9)).resize(image.size, Image.Resampling.NEAREST)
        permission = np.asarray(permission) > 0
        reference_bounds = [np.array([xs.min(), ys.min(), xs.max()+1, ys.max()+1])
                            for ys, xs in _alpha_components(reference_windows)]
        scale = np.array([permitted_reference.width/image.width,
                          permitted_reference.height/image.height] * 2)
        bounds_tolerance = 4 + scale.max()
        unmatched = 0
        for ys, xs in _alpha_components(enclosed_mask):
            bounds = np.array([xs.min(), ys.min(), xs.max()+1, ys.max()+1]) * scale
            outliers = int((~permission[ys, xs]).sum())
            matching_bounds = any(np.all(np.abs(bounds - expected) <= bounds_tolerance) for expected in reference_bounds)
            if not matching_bounds or outliers / len(xs) > .01:
                unmatched += len(xs)
            else:
                registration_outliers += outliers
        if unmatched:
            raise ValueError(f'Native map contains {unmatched} unmatched enclosed low-alpha pixels')
        approved = enclosed
    return {'enclosedLowAlphaPixels': enclosed,
            'referenceApprovedSkyPixels': approved,
            'referenceRegistrationOutlierPixels': registration_outliers,
            'borderConnectedLowAlphaPixels': int(outside.sum()),
            'solidAlphaMedian': float(np.median(alpha[solid])),
            'fullyOpaqueFraction': float((alpha == 255).mean()),
            'nativeAlphaModified': False}


def native_overlap_cut(old: Image.Image, new: Image.Image, *, transition: int,
                       visibility: np.ndarray | None = None):
    """Choose a cut by displayed colors; callers select the original RGBA pixels.

    The matte is analysis-only. It is never saved into either source or output.
    Ordinary opaque-reference validation in overlap_cut remains unchanged.
    """
    matte = Image.new('RGBA', old.size, (102, 204, 255, 255))
    a = Image.alpha_composite(matte, old.convert('RGBA'))
    b = Image.alpha_composite(matte, new.convert('RGBA'))
    return overlap_cut(a, b, transition=transition, visibility=visibility)
