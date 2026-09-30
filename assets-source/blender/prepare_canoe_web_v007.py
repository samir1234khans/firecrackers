"""Encode browser-only 2K maps; preserve original lossless Blender bake files.

Run with system Python and Pillow before build_river_life_v007.py --build.
"""
import json
from pathlib import Path
from PIL import Image, ImageChops

TEXTURES = Path(__file__).resolve().parent / 'textures' / 'canoe-v007'
color = Image.open(TEXTURES / 'canoe-color-2k.png').convert('RGB')
color.save(TEXTURES / 'canoe-color-web-2k.jpg', quality=94, subsampling=0, optimize=True)
normal = Image.open(TEXTURES / 'canoe-normal-2k.png').convert('RGB')
normal.save(TEXTURES / 'canoe-normal-web-2k.png', optimize=True)
rough = Image.open(TEXTURES / 'canoe-roughness-2k.png').convert('RGB')
red, green, blue = rough.split()
assert ImageChops.difference(red, green).getbbox() is None
assert ImageChops.difference(red, blue).getbbox() is None
red.save(TEXTURES / 'canoe-roughness-web-2k.png', optimize=True)
receipt = {'size': [2048, 2048], 'albedo': {'format':'JPEG','quality':94,'chromaSubsampling':0,'colorspace':'sRGB'}, 'normal':{'format':'RGB lossless PNG','colorspace':'linear'},'roughness':{'format':'L lossless PNG','colorspace':'linear','allOriginalRGBChannelsIdentical':True},'files':{p.name:p.stat().st_size for p in TEXTURES.glob('*-web-*')}}
(TEXTURES / 'web-encoding-receipt.json').write_text(json.dumps(receipt, indent=2), encoding='utf-8')
print(json.dumps(receipt))
