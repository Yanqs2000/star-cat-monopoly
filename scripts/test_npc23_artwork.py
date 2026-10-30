from pathlib import Path
import importlib.util,unittest,json,hashlib
from PIL import Image
spec=importlib.util.spec_from_file_location('npc23',Path(__file__).with_name('build-npc23.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class NativeOpaquePanel(unittest.TestCase):
 def test_translucent_interior_is_rejected_instead_of_repaired(self):
  with self.assertRaisesRegex(ValueError,'natively opaque'):
   module.opaque_panel(Image.new('RGBA',(100,100),(30,130,240,250)),Image.new('RGBA',(50,50),'blue'))
 def test_exterior_rounding_preserves_native_opaque_interior(self):
  source=Image.new('RGBA',(50,50),'blue');source.putpixel((0,0),(0,0,0,0))
  image=module.opaque_panel(Image.new('RGB',(100,100),'blue'),source)
  self.assertEqual(image.getpixel((50,50)),(0,0,255,255));self.assertEqual(image.getpixel((0,0))[3],0)
 def test_installed_images_keep_their_registered_dimensions_and_title_opacity(self):
  data=json.loads((module.ROOT/'src/modern/data/npc-23.json').read_text())
  self.assertEqual(len(data['runtimeImages']),17)
  for item in data['runtimeImages']:
   p=module.ROOT/'public/modern'/item['url'];im=Image.open(p).convert('RGBA')
   self.assertEqual(list(im.size),item['pixelSize']);self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),item['sha256'])
   if '/trait-'in item['url']:self.assertEqual(im.getchannel('A').crop((220,36,780,96)).getextrema(),(255,255))
if __name__=='__main__':unittest.main()
