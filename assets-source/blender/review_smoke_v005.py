"""Create human-readable smoke density playback from the actual Blender bake.

Run with Python + Pillow after build_smoke_v005.py --bake. These review images
visualize linear extinction density on dark sky; they are not browser captures
and do not contain the website's directional lighting shader.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets-source' / 'blender' / 'renders' / 'smoke-v005'
ATLAS = ROOT / 'public' / 'art' / 'smoke-density-light-v005.png'
FAMILIES = ['Fuse wisps', 'Motor exhaust', 'Burst cloud']
array = np.asarray(Image.open(ATLAS).convert('RGBA'), dtype=np.float32) / 255
# Blender writes the first texture cells from the bottom of the image.
array = array[::-1]


def frame_view(family, frame):
    x = frame % 4 * 132 + 2
    y = (family * 4 + frame // 4) * 132 + 2
    density = array[y:y + 128, x:x + 128, 0][::-1]
    # Dark absorption is preserved inside the cloud while a notional soft key
    # provides readable edges. Alpha is the actual exported Blender density.
    dy, dx = np.gradient(density)
    rim = np.minimum(1, np.sqrt(dx * dx + dy * dy) * 10)
    transmitted = np.exp(-density * 2.2)
    shade = (.09 + .65 * transmitted + rim * .2) * density
    rgb = np.array([.022, .032, .047]) + shade[:, :, None] * np.array([.62, .67, .73])
    return Image.fromarray(np.uint8(np.clip(rgb, 0, 1) * 255)).resize((256, 256), Image.Resampling.LANCZOS)


playback = []
for frame in range(16):
    canvas = Image.new('RGB', (768, 300), (6, 9, 14))
    draw = ImageDraw.Draw(canvas)
    for family in range(3):
        canvas.paste(frame_view(family, frame), (family * 256, 36))
        draw.text((family * 256 + 10, 10), FAMILIES[family] + ' | frame %02d' % frame, fill=(219, 202, 164))
    playback.append(canvas)
playback[0].save(OUT / 'smoke-playback.gif', save_all=True, append_images=playback[1:], duration=120, loop=0)

board = Image.new('RGB', (1024, 918), (6, 9, 14))
draw = ImageDraw.Draw(board)
for family in range(3):
    for column, frame in enumerate([0, 5, 10, 15]):
        board.paste(frame_view(family, frame), (column * 256, family * 306 + 40))
        draw.text((column * 256 + 10, family * 306 + 12), FAMILIES[family] + ' | %02d' % frame, fill=(219, 202, 164))
board.save(OUT / 'representative-frames.png')
print('Saved representative-frames.png and smoke-playback.gif from the exported atlas')
