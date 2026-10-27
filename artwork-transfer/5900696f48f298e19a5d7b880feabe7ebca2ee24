import sys,numpy as np
from PIL import Image
sys.path.insert(0,'scripts');from hd_map_seams import _alpha_components

def count(im,density):
 a=np.array(im.convert('RGB')).astype(int);mask=(a[:,:,0]<65)&(a[:,:,1]>90)&(a[:,:,1]>2*a[:,:,0])&(a[:,:,2]<85);found=[]
 for ys,xs in _alpha_components(mask):
  w=(xs.max()-xs.min()+1)/density;h=(ys.max()-ys.min()+1)/density
  if 5<w<30 and 10<h<45 and len(xs)>30*density*density and len(xs)/((xs.max()-xs.min()+1)*(ys.max()-ys.min()+1))>.45:found.append({'bounds':[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],'worldSize':[w,h],'pixels':len(xs)})
 return found
if __name__=='__main__':
 import produce_hd_map as m
 for name in ['before.png','after-restoration.png']:
  im=Image.open(m.CACHE/'batch24-inputs/building-count'/name);print(name,count(im,m.DENSITY))
