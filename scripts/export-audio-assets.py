"""Extract original MP3 bitstreams; no resampling, no rewrite of the source SWF."""
from pathlib import Path
import hashlib, json, struct, zlib
ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = '790ac003dfe627d8d9cc0a929740d2240e18f23a98d6606ecd614804063d71ba'
NAMES = ['gamemusic','monthmusic','startmusic2','startmusic1','backmusic5','backmusic4','backmusic3','backmusic2','backmusic1','sn_9','sn_8','sn_7','sn_6','sn_5','sn_4','sn_3','sn_2','sn_10','sn_1']
raw = (ROOT/'public/original/play.swf').read_bytes()
assert hashlib.sha256(raw).hexdigest() == SOURCE_SHA
body = zlib.decompress(raw[8:]) if raw[:3] == b'CWS' else raw[8:]
offset = (5+4*(body[0]>>3)+7)//8+4
output = ROOT/'public/modern/assets/audio'
output.mkdir(parents=True, exist_ok=True)
sounds = []
while offset + 2 <= len(body):
    header = struct.unpack_from('<H',body,offset)[0]; offset += 2
    kind, size = header>>6, header&63
    if size == 63: size=struct.unpack_from('<I',body,offset)[0]; offset+=4
    data=body[offset:offset+size]; offset+=size
    if kind != 14: continue
    symbol=struct.unpack_from('<H',data)[0]
    if not 1 <= symbol <= 19: continue
    assert data[2]>>4 == 2 and struct.unpack_from('<I',data,3)[0] > 0
    name=NAMES[symbol-1]; mp3=data[9:]  # Sound header plus MP3 seek-samples field.
    assert len(mp3)>100
    (output/(name+'.mp3')).write_bytes(mp3)
    sounds.append(dict(id=name,symbol=symbol,url='assets/audio/'+name+'.mp3',sha256=hashlib.sha256(mp3).hexdigest(),bytes=len(mp3)))
assert len(sounds)==19
(output/'manifest.json').write_text(json.dumps(dict(version=1,sourceSha256=SOURCE_SHA,sounds=sounds),indent=2)+'\n')
print('19 unchanged original MP3 streams exported')
