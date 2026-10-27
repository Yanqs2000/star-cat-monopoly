"""Generate/check the complete 5C art coverage ledger from actual original/HD paths."""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import struct
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/modernization/evidence/phase-5c'


def report() -> dict[str, str]:
    manifest_bytes = (ROOT / 'public/modern/assets-hd/hd-manifest.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    source_root = ROOT / 'public/modern/assets'
    originals = {p.relative_to(source_root).as_posix() for p in source_root.rglob('*.png')}
    seen: set[str] = set()
    groups: Counter[str] = Counter()
    methods: Counter[str] = Counter()
    output = io.StringIO(newline='')
    writer = csv.writer(output, lineterminator='\n')
    writer.writerow(['group', 'original_path', 'hd_path', 'original_pixels', 'hd_pixels',
                     'source', 'source_sha256', 'method', 'detail_limit'])
    for entry in sorted(manifest['files'], key=lambda item: item['path']):
        path = entry['path']
        if not path.startswith('assets-hd/') or not path.endswith('.webp'):
            raise SystemExit(f'Unknown HD path: {path}')
        original = path.removeprefix('assets-hd/').removesuffix('.webp') + '.png'
        if original not in originals or original in seen:
            raise SystemExit(f'Missing or duplicate original: {original}')
        seen.add(original)
        raw = (source_root / original).read_bytes()[:24]
        if raw[:8] != b'\x89PNG\r\n\x1a\n':
            raise SystemExit(f'Invalid source PNG: {original}')
        width, height = struct.unpack('>II', raw[16:24])
        hd = entry['pixelSize']
        if hd != [width * 2, height * 2]:
            raise SystemExit(f'Pixel density differs: {original}')
        group = entry['group']
        if group == 'map' or entry['source'].endswith('.png'):
            limit = '静态位图插值；无新增源纹理细节'
        elif group == 'characters':
            limit = '获准候选与原时间轴；五官/材质存在生成式重绘差异'
        elif entry.get('candidate'):
            limit = '获准建筑候选；保留原逻辑边界，局部细节为生成式重绘'
        else:
            limit = '原时间轴2倍重绘；内嵌位图仍受原像素细节限制'
        writer.writerow([group, 'assets/' + original, path, f'{width}x{height}',
                         f'{hd[0]}x{hd[1]}', entry['source'], entry['sourceSha256'], entry['method'], limit])
        groups[group] += 1
        methods[limit] += 1
    if seen != originals:
        raise SystemExit(f'Unlisted images: {sorted(originals - seen)[:10]}')
    digest = hashlib.sha256(manifest_bytes).hexdigest()
    lines = ['# 5C 完整美术覆盖清单', '',
             '由 `scripts/report-modern-art-coverage.py` 从原图文件与高清manifest生成。', '',
             f'原图 **{len(originals):,}** 项，高清对应 **{len(seen):,}** 项；未映射路径 **0**。',
             f'高清manifest SHA-256：`{digest}`。', '',
             '完整逐项原图→高清路径、来源哈希、转换方法、输入/输出尺寸与细节限制见 [art-coverage.csv](art-coverage.csv)。', '',
             '| 组别 | 已覆盖图片 |', '|---|---:|']
    lines += [f'| {group} | {count:,} |' for group, count in sorted(groups.items())]
    lines += ['', '| 明确保留的细节限制 | 图片数 |', '|---|---:|']
    lines += [f'| {method} | {count:,} |' for method, count in sorted(methods.items())]
    lines += ['', '## 文字覆盖', '',
              '| 入口 | 绘制方式与检查 |', '|---|---|',
              '| 选人、对局侧栏、交易/结果、手牌、存档 | DOM字体，桌面基础14px；交易与长记录允许局部滚动 |',
              '| 魔法门、法院、兑换与原活动动态字段 | SVG foreignObject内的浏览器字体，随原viewBox缩放，原热点坐标不变 |',
              '| 地图标记和游乐场计分 | Pixi动态文字，渲染器按设备DPR（上限2）生成；小游戏800×600逻辑画布不变 |',
              '| 原图中烘焙的固定文字 | 随对应时间轴重绘或静态位图采样；源位图细节限制按CSV逐项登记 |', '',
              '完整覆盖指15,849个PNG美术资源路径均有高清对应；JSON元数据与MP3音频为两种画质共用资源，不计入PNG清单。地图与静态公司框属于插值资源；时间轴内的低分辨率位图不会因2倍输出恢复原来不存在的细节。',
              '浏览器逐组目检与游戏回放是代表样本，逐路径覆盖、尺寸、alpha、时序及锚点由完整资源验证器检查。', '']
    return {'art-coverage.csv': output.getvalue(), 'art-coverage.md': '\n'.join(lines)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for name, content in report().items():
        path = OUT / name
        if args.check:
            if not path.is_file() or path.read_text() != content:
                raise SystemExit(f'Art coverage is stale: {path}')
        else:
            OUT.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    print('5C art coverage: every original PNG has exactly one 2x HD entry; reports are current')
