import unittest,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('carve',Path(__file__).with_name('batch23-carve.py'));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class Carve(unittest.TestCase):
 def test_hole_area_and_no_overlap(self):
  box=(0,0,100,80);hole=(30,20,70,60);parts=mod.subtract(box,hole);self.assertEqual(sum((c-a)*(d-b) for a,b,c,d in parts),6400)
  for a,b,c,d in parts:self.assertFalse(min(c,70)>max(a,30) and min(d,60)>max(b,20))
  for i,(a,b,c,d) in enumerate(parts):
   for e,f,g,h in parts[i+1:]:self.assertFalse(min(c,g)>max(a,e) and min(d,h)>max(b,f))
 def test_outside_unchanged(self):self.assertEqual(mod.subtract((0,0,10,10),(20,20,30,30)),[(0,0,10,10)])
 def test_full_removal(self):self.assertEqual(mod.subtract((0,0,10,10),(-1,-1,11,11)),[])
 def test_edge_crossing(self):self.assertEqual(mod.subtract((0,0,10,10),(5,-5,15,15)),[(0,0,5,10)])
if __name__=='__main__':unittest.main()
