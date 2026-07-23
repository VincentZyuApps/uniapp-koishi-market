import base64
import os

# 使用相对路径（脚本在 scripts/ 下，项目根目录是上级）
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

font_file = os.path.join(project_root, "static", "fonts", "LXGWWenKaiMono-Regular.ttf")
app_vue_path = os.path.join(project_root, "App.vue")

# 转换字体文件为base64
print("正在转换 Regular 字体...")
with open(font_file, "rb") as f:
    font_data = f.read()
    base64_str = base64.b64encode(font_data).decode("utf-8")

print(f"Regular 转换完成，大小: {len(base64_str)} 字符")

# 读取App.vue文件
print("\n正在读取 App.vue...")
with open(app_vue_path, "r", encoding="utf-8") as f:
    content = f.read()

# 要替换的旧字体定义（相对路径版本，这是当前 App.vue 中的内容）
old_font_face = """\t/*  #ifdef WEB  */
\t@font-face {
\t\tfont-family: 'LXGWWenKaiMono';
\t\tsrc: url('/static/fonts/LXGWWenKaiMono-Regular.ttf') format('truetype');
\t\tfont-weight: 500;
\t\tfont-style: normal;
\t}
\t/*  #endif  */"""

# 新字体定义（base64 版本）
new_font_face = f"""\t/*  #ifdef WEB  */
\t@font-face {{
\t\tfont-family: 'LXGWWenKaiMono';
\t\tsrc: url('data:font/truetype;charset=utf-8;base64,{base64_str}') format('truetype');
\t\tfont-weight: 500;
\t\tfont-style: normal;
\t}}
\t/*  #endif  */"""

# 替换内容
if old_font_face in content:
    print("\n找到要替换的字体定义，正在替换...")
    new_content = content.replace(old_font_face, new_font_face)

    # 写入文件
    with open(app_vue_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print("✅ App.vue 已成功更新为base64字体！")
    print("⚠️ 警告：CSS 文件将膨胀至约 33 MB，Cloudflare Pages 将无法部署！")
else:
    print("❌ 未找到要替换的字体定义，请检查App.vue内容")
