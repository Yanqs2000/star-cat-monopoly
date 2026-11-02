from pathlib import Path
from PIL import Image
import json,unittest,numpy as np
ROOT=Path(__file__).resolve().parents[1]
class ShuaigeArtwork(unittest.TestCase):
 def test_actual_carnival_rasters_close_the_full_native_64_sample_cycle(self):
  for side in ['left','right']:
   frames=[]
   for index in range(64):
    a=np.array(Image.open(ROOT/f'public/modern/hd-characters/characters-25/role-07/carnival-{side}-{index}.webp').convert('RGBA')).astype('float32');a[:,:,:3]*=a[:,:,3:]/255;frames.append(a)
   steps=[float(np.abs(a-b).mean())for a,b in zip(frames,frames[1:])];self.assertGreater(max(steps),.001);self.assertLessEqual(float(np.abs(frames[-1]-frames[0]).mean()),max(steps)*1.05)

 def test_flight_rear_straps_are_native_green(self):
  for heading in [3,4]:
   image=Image.open(ROOT/f'public/modern/hd-characters/characters-25/role-07/fly-{heading}.webp').convert('RGBA');a=np.array(image).astype(int);a=a[:round(a.shape[0]*.65)];green=(a[:,:,1]>a[:,:,0]+25)&(a[:,:,1]>a[:,:,2]+20)&(a[:,:,3]>128)
   self.assertGreater(int(green.sum()),100,'rear flight straps must be green, independently of the yellow-green front lenses')

 def test_frontal_carnival_head_has_a_continuous_lower_cheek_contour(self):
  rig=json.loads((ROOT/'src/modern/data/shuaige-carnival.json').read_text())['characters'][0];part=rig['facings']['down-right']['actors'][0]['parts']['head'];alpha=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA'))[:,:,3]
  left=[]
  for row in alpha[round(alpha.shape[0]*.4):round(alpha.shape[0]*.86)]:
   xs=np.where(row>128)[0]
   if len(xs):left.append(int(xs.min()))
  self.assertLessEqual(max(abs(b-a)for a,b in zip(left,left[1:])),5,'frontal cheek must not have a polygon-cut missing corner')

 def test_arm_bones_do_not_carry_long_backward_texture_bars(self):
  for stem in ['shuaige-map-rig','shuaige-carnival']:
   rig=json.loads((ROOT/f'src/modern/data/{stem}.json').read_text())['characters'][0]
   for facing,view in rig['facings'].items():
    actor=view['actors'][0]
    for arm in actor['arms']:
     for name in [arm['upper'],arm['lower']]:
      part=actor['parts'][name];alpha=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA'))[:,:,3];ys,xs=np.where(alpha>128);axis=np.array(part['axis']);unit=axis/np.linalg.norm(axis);points=np.column_stack([xs,ys])/rig['density']-np.array(part['pivot']);projection=points@unit
      self.assertGreaterEqual(float(projection.min()),-1,stem+'/'+facing+'/'+name+': hidden bone roots cannot bake a backward sleeve bar')

 def test_white_glove_tips_do_not_contain_a_second_purple_sleeve(self):
  rig=json.loads((ROOT/'src/modern/data/shuaige-map-rig.json').read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   actor=view['actors'][0]
   for arm in actor['arms']:
    part=actor['parts'][arm['tip']];a=np.array(Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')).astype(int);opaque=a[:,:,3]>128
    purple=(a[:,:,0]<170)&(a[:,:,2]>a[:,:,0]+50)&(a[:,:,1]<120)&opaque
    self.assertLessEqual(int(purple.sum()),max(10,int(opaque.sum()*.005)),facing+'/'+arm['name']+': a glove must not carry a duplicate cut sleeve')
 def test_both_shoulders_enter_opaque_torso_surfaces(self):
  rig=json.loads((ROOT/'src/modern/data/shuaige-map-rig.json').read_text())['characters'][0]
  for facing,view in rig['facings'].items():
   actor=view['actors'][0];part=actor['parts']['body'];spine=actor['joints']['spine'];image=Image.open(ROOT/'public/modern'/part['url']).convert('RGBA')
   for arm in actor['arms']:
    root=actor['joints'][arm['root']];x,y=[round((v-o+p)*rig['density'])for v,o,p in zip(root,spine,part['pivot'])];alpha=image.getpixel((x,y))[3]if 0<=x<image.width and 0<=y<image.height else 0
    self.assertGreater(alpha,128,facing+'/'+arm['name']+': arms cannot float beside the torso')
if __name__=='__main__':unittest.main()
