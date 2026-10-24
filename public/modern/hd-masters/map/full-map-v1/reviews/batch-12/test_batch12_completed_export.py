import sys, unittest
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,'scripts')
import produce_hd_map as m

class CompletedNativeExportTest(unittest.TestCase):
    def test_completed_parcels_are_not_overwritten_by_rejected_neighbor_preview(self):
        # This region is below the accepted new ride joint and outside the
        # validated green30 donor. Its parcel spirals/posts belong to r6c2.
        core=Image.open(m.WORK/'assembled/r6c2.png').convert('RGBA')
        exported=Image.open(m.WORK/'reviews/batch-12/r6c2.webp').convert('RGBA')
        rect=(m.px(440)-m.px(400),m.py(1504)-m.py(1412),m.px(640)-m.px(400),m.py(1652)-m.py(1412))
        expected=np.array(core.crop(rect));actual=np.array(exported.crop(rect))
        wrong=int(np.any(expected!=actual,axis=2).sum())
        self.assertEqual(wrong,0,f'{wrong} completed parcel pixels were replaced by an unqualified preview')

if __name__=='__main__':unittest.main()
