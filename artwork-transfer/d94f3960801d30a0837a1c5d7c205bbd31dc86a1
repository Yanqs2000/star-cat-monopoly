"""Read-only stage-one evidence inventory. Does not execute ActionScript.

Inputs: original SWFs and a JPEXS script/text export in .analysis-cache/ffdec.
Outputs: reproducible JSON evidence under docs/modernization/evidence.
"""
from pathlib import Path
import collections
import hashlib
import json
import re
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/modernization/evidence'
EXPORT = ROOT / '.analysis-cache/ffdec'
TAGS = {0:'End',1:'ShowFrame',2:'DefineShape',6:'DefineBits',7:'DefineButton',9:'SetBackgroundColor',10:'DefineFont',11:'DefineText',12:'DoAction',14:'DefineSound',15:'StartSound',18:'SoundStreamHead',19:'SoundStreamBlock',20:'DefineBitsLossless',21:'DefineBitsJPEG2',22:'DefineShape2',26:'PlaceObject2',28:'RemoveObject2',32:'DefineShape3',33:'DefineText2',34:'DefineButton2',35:'DefineBitsJPEG3',36:'DefineBitsLossless2',37:'DefineEditText',39:'DefineSprite',43:'FrameLabel',45:'SoundStreamHead2',46:'DefineMorphShape',48:'DefineFont2',56:'ExportAssets',57:'ImportAssets',59:'DoInitAction',69:'FileAttributes',70:'PlaceObject3',75:'DefineFont3',76:'SymbolClass',83:'DefineShape4',84:'DefineMorphShape2',86:'DefineSceneAndFrameLabelData',87:'DefineBinaryData',88:'DefineFontName',90:'DefineBitsJPEG4'}


class Bits:
    def __init__(self, data, bit=0):
        self.data, self.bit = data, bit
    def read(self, n, signed=False):
        v = 0
        for _ in range(n):
            v = v * 2 + ((self.data[self.bit // 8] >> (7-self.bit % 8)) & 1)
            self.bit += 1
        return v - (1 << n) if signed and n and v & (1 << (n-1)) else v


def tag_stream(data, start, end):
    p = start
    while p < end:
        offset = p
        h = struct.unpack_from('<H', data, p)[0]
        p += 2
        length = h & 63
        if length == 63:
            length = struct.unpack_from('<I', data, p)[0]
            p += 4
        if p + length > end:
            raise ValueError('Invalid tag length')
        yield h >> 6, data[p:p+length], offset
        p += length
    if p != end:
        raise ValueError('Tag stream does not end on boundary')


def swf_inventory(path):
    raw = path.read_bytes()
    assert raw[:3] in (b'CWS', b'FWS')
    body = zlib.decompress(raw[8:]) if raw[:3] == b'CWS' else raw[8:]
    assert len(body) + 8 == struct.unpack_from('<I', raw, 4)[0]
    bits = Bits(body)
    n = bits.read(5)
    rect = [bits.read(n, True) for _ in range(4)]
    p = (bits.bit + 7) // 8
    fps, frames = struct.unpack_from('<HH', body, p)
    counts = collections.Counter()
    sprites, symbols, sounds, images, root_labels = [], [], [], [], []
    def scan(data, start=0, root=False):
        frame = 1
        labels, placements, actions = [], set(), []
        for code, d, offset in tag_stream(data, start, len(data)):
            counts[TAGS.get(code, str(code))] += 1
            if code == 1:
                frame += 1
            elif code == 43:
                labels.append({'frame': frame, 'label': d.split(b'\0')[0].decode('utf8')})
            elif code == 39:
                identity, frame_count = struct.unpack_from('<HH', d)
                child = scan(d, 4)
                sprites.append({'id': identity, 'frames': frame_count, **child})
            elif code in (12,59):
                actions.append({'frame': frame, 'tag': TAGS[code], 'bytes': len(d)})
            elif code == 26 and d[0] & 2:
                placements.add(struct.unpack_from('<H', d, 3)[0])
            elif code == 56:
                count = struct.unpack_from('<H', d)[0]
                q = 2
                for _ in range(count):
                    identity = struct.unpack_from('<H', d, q)[0]
                    q += 2
                    end = d.index(0, q)
                    symbols.append({'id': identity, 'name': d[q:end].decode('utf8')})
                    q = end + 1
            elif code == 14:
                identity = struct.unpack_from('<H', d)[0]
                format_id, rate_id = d[2] >> 4, (d[2] >> 2) & 3
                samples = struct.unpack_from('<I', d, 3)[0]
                rate = [5512.5,11025,22050,44100][rate_id]
                sounds.append({'id':identity,'format':format_id,'sampleRate':rate,'channels':(d[2]&1)+1,'samples':samples,'seconds':round(samples/rate,3)})
            elif code in (6,20,21,35,36,90):
                images.append({'id':struct.unpack_from('<H',d)[0],'tag':TAGS[code],'bytes':len(d)})
        return {'labels':labels, 'placedIds':sorted(placements), 'actionFrames':actions}
    main = scan(body, p+4, True)
    for sound in sounds:
        sound['names'] = [s['name'] for s in symbols if s['id'] == sound['id']]
    for sprite in sprites:
        sprite['names'] = [s['name'] for s in symbols if s['id'] == sprite['id']]
    return {'file':path.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'version':raw[3],'stageTwips':rect,'stagePixels':[(rect[1]-rect[0])/20,(rect[3]-rect[2])/20],'fps':fps/256,'rootFrames':frames,'counts':dict(sorted(counts.items())),'rootTimeline':main,'symbols':symbols,'sprites':sorted(sprites,key=lambda s:s['id']),'images':images,'sounds':sounds}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT/'public/original/manifest.json').read_text())
    inventory = []
    for file in manifest['files']:
        item = swf_inventory(ROOT/'public/original'/file['name'])
        assert item['sha256'] == file['sha256'] and item['bytes'] == file['bytes']
        inventory.append(item)
    (OUT/'swf-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')
    sources, tables, selected = [], {}, []
    for path in sorted(EXPORT.rglob('*.as')):
        text = path.read_text()
        relative = path.relative_to(EXPORT).as_posix()
        lines = text.splitlines()
        sources.append({'source':relative,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'lines':len(lines),'functions':[{'name':m[1],'line':i} for i,l in enumerate(lines,1) if (m:=re.match(r'function (\w+)\(',l))], 'randomCalls':len(re.findall(r'\brandom\(',text)), 'onEnterFrameAssignments':len(re.findall(r'onEnterFrame\s*=',text)), 'timelineCalls':len(re.findall(r'\b(?:gotoAndPlay|gotoAndStop)\(',text))})
        if relative in ('play.swf/scripts/frame_3/DoAction.as','play.swf/scripts/frame_6/DoAction.as'):
            for i, line in enumerate(lines, 1):
                m = re.fullmatch(r'(?:var )?(\w+) = (\[.*\]);', line)
                if not m:
                    continue
                try:
                    value = json.loads(m[2])
                except json.JSONDecodeError:
                    continue
                tables[m[1]] = {'source':relative,'line':i,'value':value}
        # Keep the core and representative timeline sources reviewable in Git.
        if relative.startswith('play.swf/scripts/frame_') or any(s in relative for s in ('_tz1/', '_game/', '_startmenu/', '_bank/', '_yesno_AI/', '_counter_AI/', '_usecard/', '_system_save/', '_system_load/')):
            dest = OUT/'source'/relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(text)
            selected.append(relative)
    (OUT/'script-index.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n')
    (OUT/'original-tables.json').write_text(json.dumps(tables,ensure_ascii=False,indent=2)+'\n')
    table = tables['builddate1']['value']
    summary = {'swfCount':len(inventory),'bitmapCount':sum(len(i['images']) for i in inventory),'spriteCount':sum(len(i['sprites']) for i in inventory),'soundCount':sum(len(i['sounds']) for i in inventory),'scripts':len(sources),'scriptLines':sum(s['lines'] for s in sources),'reviewableSources':len(selected),'mapRows':len(tables['mapdate1']['value']),'mapColumns':len(tables['mapdate1']['value'][0]),'buildTableRows':len(table),'residentialRecords':sum(r[1]==16 for r in table),'residentialParcels':sum(r[1]==16 and r[3]%2==1 for r in table),'cardDefinitions':len(tables['carddate']['value']),'randomDrawPoolCardIds':[i for i,r in enumerate(tables['carddate']['value']) if i>=5 and r[3]!=0],'luckEvents':len(tables['luckdate']['value'])-1,'stockTableRows':len(tables['stockdate']['value']),'randomCalls':sum(s['randomCalls'] for s in sources),'onEnterFrameAssignments':sum(s['onEnterFrameAssignments'] for s in sources)}
    (OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
