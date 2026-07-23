#!/usr/bin/env python3
"""Bump version across project files. Usage: python scripts/bump.py -v <version> [-c <code>]"""

import argparse
import json
import os
import re
import sys


class S:
    BOLD = "\033[1m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    DIM = "\033[2m"
    RESET = "\033[0m"


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PACKAGE_JSON = os.path.join(ROOT, "package.json")
MANIFEST_JSON = os.path.join(ROOT, "manifest.json")
APP_VUE = os.path.join(ROOT, "App.vue")

VERSION_REGEX = re.compile(r"\d+\.\d+\.\d+(-[\w.]+)?")


def ok(msg):
    print(f"  {S.GREEN}✅{S.RESET} {msg}")


def warn(msg):
    print(f"  {S.YELLOW}⚠️ {S.RESET} {msg}")


def err(msg):
    print(f"  {S.RED}❌{S.RESET} {msg}")


def info(msg):
    print(f"  {S.CYAN}ℹ️ {S.RESET} {S.DIM}{msg}{S.RESET}")


def banner():
    print()
    print(f"  {S.BOLD}╔══════════════════════════════════════╗{S.RESET}")
    print(
        f"  {S.BOLD}║       {S.MAGENTA}📦  Version Bumper{S.RESET}{S.BOLD}             ║{S.RESET}"
    )
    print(f"  {S.BOLD}╚══════════════════════════════════════╝{S.RESET}")
    print()


def footer(old_ver, new_ver):
    print(f"  ---------------------------------------------")
    ok(f"{S.BOLD}Done: {old_ver} → {new_ver}{S.RESET}")
    print()


def plural(n, word):
    return f"{n} {word}{'s' if n != 1 else ''}"


def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_file(path, content):
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(content)


def replace_in_content(content, old_ver, new_ver):
    count = content.count(old_ver)
    if count:
        content = content.replace(old_ver, new_ver)
    return content, count


def get_old_version():
    content = read_file(PACKAGE_JSON)
    data = json.loads(content)
    ver = data.get("version")
    if not ver:
        err("Cannot read version from package.json")
        sys.exit(1)
    return ver


def validate_version(ver):
    if not VERSION_REGEX.fullmatch(ver):
        err(f"Invalid version format: {ver}")
        info("Expected format: X.Y.Z or X.Y.Z-rc.N (e.g. 0.1.5 or 0.1.5-rc.1)")
        sys.exit(1)


def validate_code(code):
    if not code.isdigit():
        err(f"Invalid versionCode: {code} — must be a number")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="统一更新项目版本号",
        add_help=False,
    )
    parser.add_argument("-v", "--version", help="新版本号，如 0.1.5-rc.1")
    parser.add_argument(
        "-c", "--code", help="versionCode（manifest.json），如 20260607"
    )
    parser.add_argument("-h", "--help", action="store_true", help="显示帮助信息")
    args = parser.parse_args()

    if args.help or (not args.version and not args.code):
        banner()
        print(
            f"  {S.BOLD}Usage:{S.RESET} python scripts/bump.py {S.CYAN}-v <version> [-c <code>]{S.RESET}"
        )
        print()
        info("  -v, --version   新版本号（如 0.1.5-rc.1）")
        info("  -c, --code      versionCode（如 20260607，仅 manifest.json）")
        info("  -h, --help      显示此帮助")
        print()
        err("At least one of -v or -c is required.")
        print()
        sys.exit(1)

    banner()

    if args.version:
        validate_version(args.version)
    if args.code:
        validate_code(args.code)

    old_ver = get_old_version() if args.version else None
    new_ver = args.version

    if args.version:
        assert old_ver is not None
        if old_ver == new_ver:
            warn(f"Already at {old_ver}, nothing to change for version.")
        info(f"Old version: {old_ver}")
        info(f"New version: {new_ver}")

    if args.code:
        info(f"New versionCode: {args.code}")
    print(f"  ---------------------------------------------")
    print()

    total = 0

    # ── package.json ────────────────────────────────
    if args.version:
        assert old_ver is not None and new_ver is not None
        content = read_file(PACKAGE_JSON)
        old = f'"version": "{old_ver}"'
        new = f'"version": "{new_ver}"'
        c = content.count(old)
        if c:
            content = content.replace(old, new)
            write_file(PACKAGE_JSON, content)
            total += c
        print(f"  {S.BOLD}📄 package.json{S.RESET}")
        ok(f"replaced {plural(c, 'occurrence')}: {old_ver} → {new_ver}")
        print()

    # ── manifest.json ───────────────────────────────
    content_mf = read_file(MANIFEST_JSON)
    mf_changed = False

    if args.version:
        assert old_ver is not None and new_ver is not None
        old = f'"versionName" : "{old_ver}"'
        new = f'"versionName" : "{new_ver}"'
        c = content_mf.count(old)
        if c:
            content_mf = content_mf.replace(old, new)
            mf_changed = True
        print(f"  {S.BOLD}📄 manifest.json{S.RESET}")
        ok(f"replaced {plural(c, 'occurrence')}: {old_ver} → {new_ver}")

    if args.code:
        old_code = re.search(r'"versionCode"\s*:\s*(\d+)', content_mf)
        if old_code:
            old_str = old_code.group(0)
            new_str = old_str.replace(old_code.group(1), args.code)
            content_mf = content_mf.replace(old_str, new_str)
            mf_changed = True
            ok(f"replaced 1 occurrence: versionCode {old_code.group(1)} → {args.code}")
        else:
            warn("versionCode not found in manifest.json")

    if mf_changed:
        write_file(MANIFEST_JSON, content_mf)
    print()

    # ── App.vue (3 occurrences) ─────────────────────
    if args.version:
        assert old_ver is not None and new_ver is not None
        content = read_file(APP_VUE)
        c = content.count(old_ver)
        if c:
            content = content.replace(old_ver, new_ver)
            write_file(APP_VUE, content)
            total += c
        print(f"  {S.BOLD}📄 App.vue{S.RESET}")
        ok(f"replaced {plural(c, 'occurrence')}: {old_ver} → {new_ver}")
        print()

    if args.version:
        assert old_ver is not None and new_ver is not None
        footer(old_ver, new_ver)
    else:
        footer(None, f"code={args.code}")


if __name__ == "__main__":
    main()
