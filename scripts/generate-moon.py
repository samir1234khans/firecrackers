"""Bake a fixed gibbous disc from NASA LROC color and LOLA preview relief.

Run from repository root with Python, Pillow and NumPy. The 8-bit elevation
preview gives visual relief only; this is not a quantitative terrain model.
"""
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
color = np.asarray(Image.open(root / 'assets-source/moon/lroc_color_2k.jpg').convert('RGB'), dtype=float) / 255
height = np.asarray(Image.open(root / 'assets-source/moon/ldem_3_8bit.jpg').convert('L'), dtype=float) / 255
size = 1024
y, x = np.mgrid[:size, :size]
x = (x + .5 - size / 2) / (size * .475)
y = -(y + .5 - size / 2) / (size * .475)
r2 = x*x + y*y
z = np.sqrt(np.maximum(0, 1-r2))
longitude = np.arctan2(x, z)
latitude = np.arcsin(np.clip(y, -1, 1))
u = longitude / (2*np.pi) + .5
v = .5 - latitude / np.pi

def sample(a, u, v):
    h, w = a.shape[:2]
    xx, yy = u*(w-1), np.clip(v, 0, 1)*(h-1)
    ix, iy = xx.astype(int), yy.astype(int)
    dx, dy = xx-ix, yy-iy
    if a.ndim == 3: dx, dy = dx[...,None], dy[...,None]
    return (a[iy,ix]*(1-dx)+a[iy,np.minimum(ix+1,w-1)]*dx)*(1-dy)+(a[np.minimum(iy+1,h-1),ix]*(1-dx)+a[np.minimum(iy+1,h-1),np.minimum(ix+1,w-1)]*dx)*dy

albedo = sample(color,u,v)
elevation = sample(height,u,v)
dy, dx = np.gradient(elevation)
normal = np.stack((x-dx*5, y+dy*5, z),axis=-1)
normal /= np.maximum(.001,np.linalg.norm(normal,axis=-1,keepdims=True))
light = np.array([.40,.18,.899]);light /= np.linalg.norm(light)
incidence = np.maximum(0,normal@light)
# A restrained lunar diffuse response, rather than glossy highlights.
diffuse = incidence / np.maximum(.06,incidence+z)
linear = np.where(albedo<=.04045,albedo/12.92,((albedo+.055)/1.055)**2.4)
linear *= (.025 + diffuse*.97)[...,None]
rgb = np.where(linear<=.0031308,linear*12.92,1.055*linear**(1/2.4)-.055)
alpha = np.clip((1-np.sqrt(r2))*size*.475+.5,0,1)
rgba = np.concatenate((np.clip(rgb,0,1),alpha[...,None]),axis=-1)
out = Image.fromarray(np.round(rgba*255).astype('uint8'),'RGBA').resize((512,512),Image.Resampling.LANCZOS)
out.save(root/'public/art/moon-lro-v001.png',optimize=True)
print('Baked 512px lunar disc:',(root/'public/art/moon-lro-v001.png').stat().st_size,'bytes')
