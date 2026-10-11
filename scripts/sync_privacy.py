#!/usr/bin/env python3
# 📄 同步根目录 privacy.md 到前端 utils/privacy-content.js
# 🧭 privacy.md 是项目中隐私声明文案的唯一事实来源 (Single Source of Truth)
# 用法：
#   python scripts/sync_privacy.py          # 直接同步更新
#   python scripts/sync_privacy.py --check  # 仅检查是否已同步，不同步则报错退出
"""Synchronize privacy.md to frontend utils/privacy-content.js."""

import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIVACY_MD = os.path.join(ROOT, "privacy.md")
TARGET_JS = os.path.join(ROOT, "utils", "privacy-content.js")


def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


import subprocess


def markdown_to_html(md_text):
    """通过 node 运行 marked 将 Markdown 预编译为纯净 HTML，避免小程序运行时依赖与兼容性问题。"""
    try:
        res = subprocess.run(
            ["node", "-e", "const fs=require('fs');const {marked}=require('marked');console.log(marked.parse(process.argv[1]));", md_text],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True,
            cwd=ROOT,
        )
        return res.stdout.strip()
    except Exception as e:
        print(f"⚠️ 调用 node marked 失败: {e}，使用轻量回退转换", file=sys.stderr)
        # 兜底：基础正则转换
        import re
        html = md_text
        html = re.sub(r"^### (.*)$", r"<h3>\1</h3>", html, flags=re.M)
        html = re.sub(r"^## (.*)$", r"<h2>\1</h2>", html, flags=re.M)
        html = re.sub(r"^# (.*)$", r"<h1>\1</h1>", html, flags=re.M)
        html = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", html)
        html = re.sub(r"`(.*?)`", r"<code>\1</code>", html)
        html = re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2">\1</a>', html)
        return html


def generate_js_content(md_text):
    html_text = markdown_to_html(md_text)
    escaped_md = json.dumps(md_text, ensure_ascii=False)
    escaped_html = json.dumps(html_text, ensure_ascii=False)
    return (
        "// ⚠️ 本文件由 scripts/sync_privacy.py 自动生成，请勿手动编辑！\n"
        "// 📄 文案唯一事实来源 (Single Source of Truth) 为根目录的 privacy.md\n"
        f"export const PRIVACY_MARKDOWN = {escaped_md};\n"
        f"export const PRIVACY_HTML = {escaped_html};\n"
    )


def main():
    parser = argparse.ArgumentParser(description="同步 privacy.md 到前端代码")
    parser.add_argument(
        "--check",
        action="store_true",
        help="检查 target 文件是否与 privacy.md 保持最新同步",
    )
    args = parser.parse_args()

    if not os.path.isfile(PRIVACY_MD):
        print(f"❌ 未找到源文件: {PRIVACY_MD}", file=sys.stderr)
        return 1

    md_content = read_file(PRIVACY_MD)
    expected_js = generate_js_content(md_content)

    if args.check:
        if not os.path.isfile(TARGET_JS):
            print(f"❌ 目标文件不存在: {TARGET_JS}，请运行 python scripts/sync_privacy.py", file=sys.stderr)
            return 1
        current_js = read_file(TARGET_JS)
        if current_js != expected_js:
            print(f"❌ {TARGET_JS} 与 {PRIVACY_MD} 内容不一致，请运行 python scripts/sync_privacy.py 进行同步！", file=sys.stderr)
            return 1
        print("✅ 隐私文案处于最新同步状态")
        return 0

    write_file(TARGET_JS, expected_js)
    print(f"✅ 隐私政策已成功从 privacy.md 同步到 {os.path.relpath(TARGET_JS, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
