import os
from PIL import Image, ImageDraw

STATIC_DIR = 'static'
SRC_GPT = 'tmp/image/try-imagen/gpt自己二次处理过的-霓虹轨道紫色星球图标.png'

# 4 张新资产目标文件
OUT_TRANS_PNG = os.path.join(STATIC_DIR, 'logo_transparent_bg.png')
OUT_TRANS_ICO = os.path.join(STATIC_DIR, 'logo_transparent_bg.ico')
OUT_ROUND_PNG = os.path.join(STATIC_DIR, 'logo_roundedrectangle_bg.png')
OUT_ROUND_ICO = os.path.join(STATIC_DIR, 'logo_roundedrectangle_bg.ico')

def main():
    print("1. 读取并净化 GPT 真透明图片底噪...")
    im = Image.open(SRC_GPT).convert('RGBA')
    w, h = im.size
    
    # 过滤微弱底噪 (Alpha <= 5 设为 0)
    datas = im.getdata()
    new_data = []
    for item in datas:
        if item[3] <= 5:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    im.putdata(new_data)
    
    # 紧凑裁剪主体
    bbox = im.getbbox()
    print(f"净化后实际主体 bbox: {bbox}")
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

    print("2. 生成带有深色质感圆角矩形背景的 Logo...")
    # 深色拟物背景: Koishi 深空墨紫 (#161426)
    bg = Image.new('RGBA', (target_size, target_size), (22, 20, 38, 255))
    
    # 中心微光光晕
    bg_draw = ImageDraw.Draw(bg)
    for r in range(512, 0, -16):
        alpha_val = int(45 * (1 - r / 512))
        bg_draw.ellipse(
            [512 - r, 512 - r, 512 + r, 512 + r],
            fill=(110, 85, 210, alpha_val)
        )
    
    # 主体在卡片中占比 84%
    bg_scale = (target_size * 0.84) / max(cw, ch)
    bnw = int(cw * bg_scale)
    bnh = int(ch * bg_scale)
    bg_resized = cropped.resize((bnw, bnh), Image.Resampling.LANCZOS)
    box = (target_size - bnw) // 2
    boy = (target_size - bnh) // 2
    bg.paste(bg_resized, (box, boy), bg_resized)

    # 4x 超采样绘制精致平滑圆角矩形蒙版 (radius 220px)
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

    # 兼容过渡软链接/复制给旧文件名，确保历史路径完全不损坏
    canvas_trans.save(os.path.join(STATIC_DIR, 'koishi_market_mp.ico'), format='ICO', sizes=ico_sizes)
    canvas_round.save(os.path.join(STATIC_DIR, 'koishi_market_mp.png'), 'PNG')
    canvas_trans.save(os.path.join(STATIC_DIR, 'koishi_market_transparent.png'), 'PNG')
    print("旧文件名兼容镜像更新完毕！")

if __name__ == '__main__':
    main()
