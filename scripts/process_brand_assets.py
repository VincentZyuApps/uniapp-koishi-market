import os
from PIL import Image, ImageDraw

STATIC_DIR = 'static'
SRC_GPT = 'tmp/image/try-imagen/gpt自己二次处理过的-霓虹轨道紫色星球图标.png'

# 仅保留这 4 张标准命名的资产
OUT_TRANS_PNG = os.path.join(STATIC_DIR, 'logo_transparent_bg.png')
OUT_TRANS_ICO = os.path.join(STATIC_DIR, 'logo_transparent_bg.ico')
OUT_ROUND_PNG = os.path.join(STATIC_DIR, 'logo_roundedrectangle_bg.png')
OUT_ROUND_ICO = os.path.join(STATIC_DIR, 'logo_roundedrectangle_bg.ico')

def main():
    print("1. 读取并净化 GPT 真透明图片底噪...")
    im = Image.open(SRC_GPT).convert('RGBA')
    r, g, b, a = im.split()
    
    # 过滤微弱底噪: Alpha <= 5 设为 0
    a = a.point(lambda p: 0 if p <= 5 else p)
    im.putalpha(a)
    
    # 紧凑裁剪主体
    bbox = im.getbbox()
    print(f"主体实际 bbox: {bbox}")
    cropped = im.crop(bbox)
    cw, ch = cropped.size

    # 规范化到 1024x1024 正方形透明画布，主体占比 92%（四周留 4% 呼吸边距）
    target_size = 1024
    scale = (target_size * 0.92) / max(cw, ch)
    nw = int(cw * scale)
    nh = int(ch * scale)
    resized_trans = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas_trans = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    ox = (target_size - nw) // 2
    oy = (target_size - nh) // 2
    canvas_trans.paste(resized_trans, (ox, oy), resized_trans)

    # 导出 logo_transparent_bg.png
    canvas_trans.save(OUT_TRANS_PNG, 'PNG')
    print(f"已生成: {OUT_TRANS_PNG}")

    # 导出 logo_transparent_bg.ico (多尺寸 16, 24, 32, 48, 64, 128, 256)
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    canvas_trans.save(OUT_TRANS_ICO, format='ICO', sizes=ico_sizes)
    print(f"已生成: {OUT_TRANS_ICO}")

    print("2. 生成纯净深色圆角矩形背景的 Logo (无额外紫色圆圈/光晕)...")
    # 纯净深色卡片背景 (#161426, RGB: 22, 20, 38)
    bg = Image.new('RGBA', (target_size, target_size), (22, 20, 38, 255))
    
    # 主体在卡片中占比 84% 居中贴合
    bg_scale = (target_size * 0.84) / max(cw, ch)
    bnw = int(cw * bg_scale)
    bnh = int(ch * bg_scale)
    bg_resized = cropped.resize((bnw, bnh), Image.Resampling.LANCZOS)
    box = (target_size - bnw) // 2
    boy = (target_size - bnh) // 2
    bg.paste(bg_resized, (box, boy), bg_resized)

    # 4x 超采样绘制平滑圆角矩形蒙版 (radius 220px)
    supersample = 4
    ss = target_size * supersample
    mask_super = Image.new('L', (ss, ss), 0)
    draw_super = ImageDraw.Draw(mask_super)
    draw_super.rounded_rectangle(
        [0, 0, ss - 1, ss - 1],
        radius=int(220 * supersample),
        fill=255
    )
    mask = mask_super.resize((target_size, target_size), Image.Resampling.LANCZOS)

    canvas_round = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    canvas_round.paste(bg, (0, 0))
    canvas_round.putalpha(mask)

    # 导出 logo_roundedrectangle_bg.png
    canvas_round.save(OUT_ROUND_PNG, 'PNG')
    print(f"已生成: {OUT_ROUND_PNG}")

    # 导出 logo_roundedrectangle_bg.ico
    canvas_round.save(OUT_ROUND_ICO, format='ICO', sizes=ico_sizes)
    print(f"已生成: {OUT_ROUND_ICO}")

if __name__ == '__main__':
    main()
