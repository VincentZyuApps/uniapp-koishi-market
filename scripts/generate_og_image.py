#!/usr/bin/env python3
"""Create the branded H5 sharing image and multi-size default favicon (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
image = Image.new('RGB', (1200, 630), '#171527')
draw = ImageDraw.Draw(image)
# Quiet orbital lines echo the existing brand mark.
draw.ellipse((760, -180, 1340, 400), outline='#35305a', width=2)
draw.ellipse((830, -110, 1270, 330), outline='#302b51', width=2)
draw.rounded_rectangle((70, 64, 1130, 566), radius=28, outline='#39334f', width=2)
logo = Image.open(root / 'static/icon-512.png').convert('RGBA').resize((154, 154), Image.Resampling.LANCZOS)
image.paste(logo, (840, 235), logo)
font_path = '/System/Library/Fonts/STHeiti Medium.ttc'
latin_path = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
font = ImageFont.truetype(font_path, 58)
small = ImageFont.truetype(font_path, 25)
latin = ImageFont.truetype(latin_path, 22)
draw.text((128, 155), 'KOISHI  /  PLUGIN MARKET', fill='#9e90da', font=latin)
draw.text((128, 242), 'Koishi 插件市场', fill='#f5f3ff', font=font)
draw.text((130, 348), '搜索、筛选与探索 Koishi 插件', fill='#bfb8d2', font=small)
draw.rounded_rectangle((130, 435, 352, 484), radius=24, fill='#6b56bc')
draw.text((154, 446), '探索插件目录', fill='#ffffff', font=ImageFont.truetype(font_path, 21))
image.save(root / 'static/og-market.png', optimize=True)
icon = Image.open(root / 'static/icon-512.png').convert('RGBA')
icon.save(root / '__static__/favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
