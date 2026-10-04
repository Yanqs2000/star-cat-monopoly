"""Verify source coverage, manifest integrity, file hashes, and 2x image bounds."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/modern/assets'
DEST = ROOT / 'public/modern/assets-hd'


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(131072), b''):
            digest.update(block)
    return digest.hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def verify_alpha(entry: dict, image: Image.Image) -> None:
    require(isinstance(entry.get('expectedAlphaSha256'), str)
            and len(entry['expectedAlphaSha256']) == 64,
            f"Expected alpha digest is missing: {entry.get('path', '<unknown>')}")
    require(isinstance(entry.get('sourceHasTransparency'), bool),
            f"Source transparency flag is missing: {entry.get('path', '<unknown>')}")
    alpha = image.convert('RGBA').getchannel('A')
    actual = hashlib.sha256(alpha.tobytes()).hexdigest()
    require(actual == entry['expectedAlphaSha256'],
            f"Decoded alpha channel differs from generated pixels: {entry.get('path', '<unknown>')}")
    minimum, maximum = alpha.getextrema()
    if entry['sourceHasTransparency']:
        require(minimum < 255,
                f"Transparent source became opaque: {entry.get('path', '<unknown>')}")
    else:
        require((minimum, maximum) == (255, 255),
                f"Opaque source acquired transparency: {entry.get('path', '<unknown>')}")


def verify_manifest_metadata(manifest: dict, entries: dict[str, dict]) -> None:
    source_index = json.loads((SOURCE / 'characters/index.json').read_text())
    character_paths = {item['id']: Path(item['manifestUrl'].removeprefix('assets/'))
                       for item in source_index['characters']}

    def by_url(url: str) -> dict:
        require(isinstance(url, str) and url.startswith('assets/'), f'Invalid timeline URL: {url}')
        path = Path(url.removeprefix('assets/')).with_suffix('.webp')
        entry = entries.get(f'assets-hd/{path.as_posix()}')
        require(entry is not None, f'Missing timeline image: {url}')
        return entry

    def same(entry: dict, values: dict, label: str) -> None:
        for key, expected in values.items():
            require(entry.get(key) == expected,
                    f'{label} {key} differs from source metadata: {entry.get(key)} != {expected}')

    def vector(url: str, group: str, width: int, height: int, anchor: list[float], values: dict, label: str) -> dict:
        entry = by_url(url)
        same(entry, {'group': group, 'pixelDensity': 2, 'sourcePixelDensity': 2,
                     'logicalSize': [width, height], 'logicalAnchor': anchor,
                     'pixelSize': [width * 2, height * 2], **values}, label)
        return entry

    original_manifest = json.loads((ROOT / 'public/original/manifest.json').read_text())
    original_hashes = {item['name']: item['sha256'] for item in original_manifest['files']}
    play_hash = original_hashes['play.swf']

    expected_buildings = {
        'building': (178, 2), 'building-181': (181, 4), 'building-190': (190, 6),
        'building-187': (187, 5), 'building-196': (196, 8), 'building-199': (199, 10),
        'building-193': (193, 9), 'building-205': (205, 11), 'building-202': (202, 7),
        'building-208': (208, 12), 'building-211': (211, 3),
    }
    candidates = manifest.get('buildingCandidates')
    require(isinstance(candidates, list) and len(candidates) == 11,
            'HD profile must include the 11 selected company-building candidates')
    candidate_by_company = {}
    for item in candidates:
        expected = expected_buildings.get(item.get('key'))
        require(expected is not None and (item.get('bitmapId'), item.get('companyId')) == expected,
                f'Unexpected company building candidate mapping: {item}')
        require(item.get('shapeId') == expected[0] + 1, f'Building shape relation changed: {item}')
        candidate = ROOT / item['source']
        require(candidate.is_file() and sha256(candidate) == item.get('sourceSha256'),
                f'Building candidate checksum mismatch: {item.get("key")}')
        require(item['companyId'] not in candidate_by_company, 'Duplicate candidate company id')
        candidate_by_company[item['companyId']] = item
    patch = manifest.get('companyPatch', {})
    require(patch.get('sourceSha256') == play_hash, 'Company render source is not the locked original SWF')
    require(patch.get('bitmapIds') == sorted(item[0] for item in expected_buildings.values()),
            'Company candidate bitmap patch set differs from selected assets')
    require(patch.get('shapeIds') == sorted(item[0] + 1 for item in expected_buildings.values()),
            'Company candidate shape patch set differs from selected assets')

    company_manifest = json.loads((SOURCE / 'companies/manifest.json').read_text())
    require(company_manifest.get('sourceSha256') == play_hash, 'Company source manifest hash mismatch')
    require(manifest.get('vectorRenders', {}).get('companySprites') == 12,
            'Company sprite 2x render coverage mismatch')
    for company in company_manifest['companies']:
        entry = vector(company['url'], 'companies', company['width'], company['height'],
                       [company['offsetX'], company['offsetY']],
                       {'source': 'public/original/play.swf', 'sourceSha256': play_hash,
                        'companyId': company['characterId'], 'sourceSymbol': company['sourceSpriteId'],
                        'boundsTwips': company['boundsTwips']}, f'company {company["characterId"]}')
        candidate = candidate_by_company.get(company['characterId'])
        if candidate:
            same(entry, {'candidate': candidate['source'], 'candidateSha256': candidate['sourceSha256'],
                         'bitmapId': candidate['bitmapId'], 'shapeId': candidate['shapeId']},
                 f'company {company["characterId"]} selected candidate')
        else:
            require(company['characterId'] == 1, f'Uncovered company candidate: {company["characterId"]}')

    property_manifest = json.loads((SOURCE / 'properties/manifest.json').read_text())
    require(property_manifest.get('sourceSha256') == play_hash, 'Property source manifest hash mismatch')
    property_count = 0
    for item in property_manifest['sellSigns']:
        source = SOURCE / item['url'].removeprefix('assets/')
        with Image.open(source) as image: width, height = image.size
        vector(item['url'], 'properties', width, height, [item['offsetX'], item['offsetY']],
               {'source': 'public/original/play.swf', 'sourceSha256': play_hash,
                'sourceSymbol': 839, 'sourceFrame': item['facing'], 'facing': item['facing']}, 'sale sign')
        property_count += 1
    for item in property_manifest['houses']:
        source = SOURCE / item['url'].removeprefix('assets/')
        with Image.open(source) as image: width, height = image.size
        vector(item['url'], 'properties', width, height, [item['offsetX'], item['offsetY']],
               {'source': 'public/original/play.swf', 'sourceSha256': play_hash,
                'sourceSymbol': 3401, 'sourceFrame': (item['facing'] - 1) * 10 + item['level'] + 1,
                'ownerId': item['ownerId'], 'facing': item['facing'], 'level': item['level']}, 'house')
        property_count += 1
    require(manifest.get('vectorRenders', {}).get('propertySprites') == property_count == 100,
            'Property vector render coverage mismatch')

    world_manifest = json.loads((SOURCE / 'world/manifest.json').read_text())
    require(world_manifest.get('sourceSha256') == play_hash, 'World source manifest hash mismatch')
    world_count = 0
    for clip in world_manifest['clips']:
        for frame_number, frame in enumerate(clip['frames'], start=1):
            vector(frame['url'], 'world', frame['width'], frame['height'],
                   [frame['offsetX'], frame['offsetY']],
                   {'source': 'public/original/play.swf', 'sourceSha256': play_hash,
                    'sourceSymbol': clip['sourceSymbol'], 'sourceFrame': frame_number,
                    'fps': clip['fps'], 'loop': clip['loop'], 'durationMs': 1000 / clip['fps']},
                   f'world {clip["id"]} frame {frame_number}')
            world_count += 1
    for house in world_manifest['neutralHouses']:
        vector(house['url'], 'world', house['width'], house['height'],
               [house['offsetX'], house['offsetY']],
               {'source': 'public/original/play.swf', 'sourceSha256': play_hash,
                'sourceSymbol': 3401, 'sourceFrame': house['sourceFrame'],
                'facing': house['facing'], 'level': house['level']}, 'neutral house')
        world_count += 1
    require(manifest.get('vectorRenders', {}).get('worldFrames') == world_count == 810,
            'World timeline vector render coverage mismatch')

    interaction_manifest = json.loads((SOURCE / 'interactions/manifest.json').read_text())
    require(interaction_manifest.get('sourceSha256') == play_hash, 'Interaction source manifest hash mismatch')
    interaction_count = 0
    for item in [*interaction_manifest['cards'], *interaction_manifest['luck']]:
        symbol = 1721 if item['url'].startswith('assets/interactions/cards/') else 1412
        vector(item['url'], 'interactions', item['width'], item['height'],
               [item['offsetX'], item['offsetY']],
               {'source': 'public/original/play.swf', 'sourceSha256': play_hash,
                'sourceSymbol': symbol, 'sourceFrame': item['sourceFrame'], 'interactionId': item['id']},
               'interaction illustration')
        interaction_count += 1
    require(manifest.get('vectorRenders', {}).get('interactionFrames') == interaction_count == 58,
            'Interaction vector render coverage mismatch')

    activity_manifest = json.loads((SOURCE / 'activities/manifest.json').read_text())
    require(activity_manifest.get('sourceSha256') == play_hash, 'Activity source manifest hash mismatch')
    activity_count = 0
    for clip in activity_manifest['clips']:
        for frame in clip['frames']:
            entry = vector(frame['url'], 'activities', frame['width'], frame['height'],
                           [frame['offsetX'], frame['offsetY']],
                           {'source': 'public/original/play.swf', 'sourceSha256': play_hash,
                            'sourceSymbol': clip['sourceSymbol'], 'sourceFrame': frame['sourceFrame'],
                            'fps': clip['fps'], 'loop': clip['loop'],
                            'durationMs': 1000 / clip['fps']}, 'activity timeline')
            native, padding = entry.get('nativeRenderSize'), entry.get('fitPaddingPx')
            require(isinstance(native, list) and len(native) == 2
                    and isinstance(padding, list) and len(padding) == 2
                    and all(isinstance(value, int) and 0 <= value <= 1 for value in padding)
                    and [native[index] + padding[index] for index in range(2)] == entry['pixelSize'],
                    f'Activity fit-to-canvas bounds are invalid: {entry["path"]}')
            activity_count += 1
    require(manifest.get('vectorRenders', {}).get('activityFrames') == activity_count == 1538,
            'Activity timeline vector render coverage mismatch')

    characters = manifest.get('characters')
    require(isinstance(characters, list) and len(characters) == 12, 'Character report coverage mismatch')
    for report in characters:
        cid = report['id']
        swf_name = f'star{cid}.swf'
        require(report['sourceHash'] == original_hashes[swf_name], f'Character source hash mismatch: {swf_name}')
        candidate = ROOT / report['candidate']
        require(candidate.is_file() and sha256(candidate) == report['candidateSha256'],
                f'Character art candidate checksum mismatch: {cid}')
        walk_manifest = json.loads((SOURCE / character_paths[cid]).read_text())
        require(walk_manifest['sourceHashes'].get(swf_name) == report['sourceHash'],
                f'Character walk manifest mismatch: {cid}')
        for clip in walk_manifest['clips']:
            x0, x1, y0, y1 = clip['sourceBoundsTwips']
            pixel_size = [math.ceil((x1 - x0) * 2 / 20),
                          math.ceil((y1 - y0) * 2 / 20)]
            for frame in clip['frames']:
                entry = by_url(frame['url'])
                same(entry, {'group': 'characters', 'characterId': cid, 'action': 'walk',
                             'facing': clip['facing'], 'sourceFrame': frame['sourceFrame'],
                             'pixelSize': pixel_size, 'sourceBoundsTwips': clip['sourceBoundsTwips'],
                             'fps': 30, 'durationMs': frame['durationMs'],
                             'logicalAnchor': [frame['offsetX'], frame['offsetY']]},
                     f'character {cid} walking frame')

        reaction_manifest = json.loads((SOURCE / 'characters' / str(cid) / 'reactions' / 'manifest.json').read_text())
        require(reaction_manifest['sourceSha256'] == report['sourceHash'],
                f'Character action source hash mismatch: {cid}')
        for clip in reaction_manifest['clips']:
            for frame_number, frame in enumerate(clip['frames'], start=1):
                entry = by_url(frame['url'])
                same(entry, {'group': 'characters', 'characterId': cid, 'action': clip['name'],
                             'facing': clip['facing'], 'sourceFrame': frame_number,
                             'logicalSize': [frame['width'], frame['height']],
                             'pixelSize': [frame['width'] * 2, frame['height'] * 2],
                             'logicalAnchor': [frame['offsetX'], frame['offsetY']],
                             'fps': clip['fps'], 'loop': clip['loop'], 'durationMs': 1000 / clip['fps']},
                     f'character {cid} action frame')
        for overlay in reaction_manifest['godOverlays']:
            entry = by_url(overlay['url'])
            same(entry, {'group': 'characters', 'characterId': cid, 'godId': overlay['godId'],
                         'logicalSize': [overlay['width'], overlay['height']],
                         'pixelSize': [overlay['width'] * 2, overlay['height'] * 2],
                         'logicalAnchor': [overlay['offsetX'], overlay['offsetY']]},
                 f'character {cid} god overlay')


def main() -> None:
    manifest_path = DEST / 'hd-manifest.json'
    profile_path = DEST / 'hd-profile.json'
    require(manifest_path.is_file() and profile_path.is_file(), 'HD manifest/profile index is missing')
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    profile = json.loads(profile_path.read_text())
    source_pngs = sorted(SOURCE.rglob('*.png'))
    expected = {f"assets-hd/{p.relative_to(SOURCE).with_suffix('.webp').as_posix()}" for p in source_pngs}
    actual = {f"assets-hd/{p.relative_to(DEST).as_posix()}" for p in DEST.rglob('*.webp')}
    entries = manifest.get('files')
    require(isinstance(entries, list), 'HD manifest files must be an array')
    listed = [entry.get('path') for entry in entries if isinstance(entry, dict)]
    require(len(listed) == len(entries) and len(set(listed)) == len(listed), 'HD manifest has invalid or duplicate paths')
    require(set(listed) == expected == actual,
            f'Asset path mismatch: source={len(expected)}, listed={len(listed)}, disk={len(actual)}, '
            f'missing={len(expected-actual)}, extra={len(actual-expected)}')
    require(profile.get('sourceAssetCount') == len(source_pngs) == profile.get('assetCount') == len(entries),
            'HD profile index does not declare complete source coverage')
    require(profile.get('profile') == 'hd' and profile.get('pixelDensity') == 2, 'HD profile metadata is invalid')
    require(profile.get('manifest') == 'hd-manifest.json' and
            profile.get('manifestSha256') == hashlib.sha256(manifest_bytes).hexdigest(),
            'HD profile index manifest hash mismatch')

    checked_sources: dict[str, str] = {}
    total_bytes = 0
    for entry in entries:
        rel = entry['path'].removeprefix('assets-hd/')
        output = DEST / rel
        source = (ROOT / entry['source']).resolve()
        require(source.is_relative_to(ROOT.resolve()), f'Source path escapes repository: {entry["source"]}')
        require(output.is_file() and source.is_file(), f'Missing source/output for {entry["path"]}')
        require(sha256(output) == entry.get('outputSha256'), f'Output checksum mismatch: {entry["path"]}')
        source_hash = checked_sources.get(entry['source'])
        if source_hash is None:
            source_hash = sha256(source)
            checked_sources[entry['source']] = source_hash
        require(source_hash == entry.get('sourceSha256'), f'Source checksum mismatch: {entry["source"]}')
        density = entry.get('sourcePixelDensity')
        size = entry.get('sourceSize')
        expected_size = entry.get('pixelSize')
        require(density in (1, 2) and isinstance(size, list) and len(size) == 2,
                f'Invalid source density/size: {entry["path"]}')
        require(expected_size == [int(size[0] * 2 / density), int(size[1] * 2 / density)],
                f'Invalid manifest pixel bounds: {entry["path"]}')
        with Image.open(output) as image:
            image.load()
            require(image.size == tuple(expected_size), f'Invalid encoded pixel bounds: {entry["path"]}')
            verify_alpha(entry, image)
        total_bytes += output.stat().st_size

    require(profile.get('totalBytes') == total_bytes, 'HD profile byte count mismatch')
    verify_manifest_metadata(manifest, {entry['path']: entry for entry in entries})
    print(json.dumps({
        'sourcePngs': len(source_pngs), 'profileFiles': len(entries),
        'uniqueSourceFilesVerified': len(checked_sources), 'outputBytes': total_bytes,
        'pixelDensity': 2, 'manifestSha256': profile['manifestSha256'],
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
