import os

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
build_dir = os.path.join(project_root, "unpackage", "dist", "build", "web")
redirects_path = os.path.join(build_dir, "_redirects")

os.makedirs(build_dir, exist_ok=True)

with open(redirects_path, "w") as f:
    f.write("/uniapp-koishi-market/* /:splat 200\n")

print(f"✅ _redirects 已生成: {redirects_path}")
print(f"   规则: /uniapp-koishi-market/* → /:splat (200)")
