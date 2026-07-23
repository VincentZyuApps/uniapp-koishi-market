#!/usr/bin/env python3
# 📦 统一更新 package.json、manifest.json 与 App.vue 的版本信息。
# 🧭 versionCode 默认采用 Asia/Shanghai 当天日期；-c、--code、--versioncode、--version-code 完全等价。
# 1. 🚀 常规发布（最常用，versionCode 自动取上海当天日期）：
#    python scripts/bump.py -v 1.2.3-rc.1
# 2. 👀 发布预演（执行全部检查，但不写文件）：
#    python scripts/bump.py -v 1.2.3-rc.1 --dry-run
# 3. 🗓️ 补发指定日期的版本：
#    python scripts/bump.py -v 1.2.3-rc.1 -c 20260724
# 4. 🛠️ 只修正 versionCode，不修改版本号：
#    python scripts/bump.py --code 20260724
# 5. 🧯 显式允许版本降级并预演（最不常用）：
#    python scripts/bump.py -v 1.2.2 --allow-downgrade --dry-run
"""Safely bump project versions without building, staging, or committing."""

import argparse
from datetime import datetime, timedelta, timezone
from functools import cmp_to_key
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


class BumpError(Exception):
    pass


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKAGE_JSON = os.path.join(ROOT, "package.json")
MANIFEST_JSON = os.path.join(ROOT, "manifest.json")
APP_VUE = os.path.join(ROOT, "App.vue")

SEMVER_IDENTIFIER = r"(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)"
VERSION_VALUE_PATTERN = (
    r"(?P<major>0|[1-9]\d*)\."
    r"(?P<minor>0|[1-9]\d*)\."
    r"(?P<patch>0|[1-9]\d*)"
    rf"(?:-(?P<prerelease>{SEMVER_IDENTIFIER}(?:\.{SEMVER_IDENTIFIER})*))?"
    r"(?:\+(?P<build>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
)
VERSION_REGEX = re.compile(rf"^{VERSION_VALUE_PATTERN}$")
PACKAGE_VERSION_REGEX = re.compile(r'("version"\s*:\s*")([^"]+)(")')
MANIFEST_VERSION_REGEX = re.compile(r'("versionName"\s*:\s*")([^"]+)(")')
MANIFEST_CODE_REGEX = re.compile(r'("versionCode"\s*:\s*)(\d+)')
APP_VERSION_REGEX = re.compile(
    r"(const\s+APP_VERSION\s*=\s*['\"])([^'\"]+)(['\"])"
)
SHANGHAI_TZ = timezone(timedelta(hours=8), "Asia/Shanghai")


def ok(message):
    print(f"  {S.GREEN}✅{S.RESET} {message}")


def warn(message):
    print(f"  {S.YELLOW}⚠️ {S.RESET} {message}")


def err(message):
    print(f"  {S.RED}❌{S.RESET} {message}")


def info(message):
    print(f"  {S.CYAN}ℹ️ {S.RESET} {S.DIM}{message}{S.RESET}")


def banner(dry_run=False):
    mode = "DRY RUN" if dry_run else "UPDATE"
    width = 40
    border = f"+{'-' * width}+"

    print()
    print(f"  {S.BOLD}{border}{S.RESET}")
    print(f"  {S.BOLD}|{'Version Bumper'.center(width)}|{S.RESET}")
    print(f"  {S.BOLD}|{f'Mode: {mode}'.center(width)}|{S.RESET}")
    print(f"  {S.BOLD}{border}{S.RESET}")
    print()


def read_file(path):
    with open(path, "r", encoding="utf-8", newline="") as file:
        return file.read()


def write_file(path, content):
    with open(path, "w", encoding="utf-8", newline="") as file:
        file.write(content)


def get_single_match(pattern, content, label):
    matches = list(pattern.finditer(content))
    if len(matches) != 1:
        raise BumpError(
            f"{label} should appear exactly once, found {len(matches)} occurrence(s)"
        )
    return matches[0]


def replace_quoted_value(pattern, content, new_value, label):
    get_single_match(pattern, content, label)
    return pattern.sub(
        lambda match: f"{match.group(1)}{new_value}{match.group(3)}",
        content,
        count=1,
    )


def replace_numeric_value(pattern, content, new_value, label):
    get_single_match(pattern, content, label)
    return pattern.sub(
        lambda match: f"{match.group(1)}{new_value}",
        content,
        count=1,
    )


def validate_version(version):
    if not VERSION_REGEX.fullmatch(version):
        raise BumpError(
            "Invalid version format. Expected SemVer such as "
            "1.2.3, 1.2.3-beta.1, or 1.2.3-rc.1"
        )


def compare_semver(left, right):
    left_match = VERSION_REGEX.fullmatch(left)
    right_match = VERSION_REGEX.fullmatch(right)
    if left_match is None or right_match is None:
        raise BumpError("Cannot compare invalid SemVer values")

    core_names = ("major", "minor", "patch")
    left_core = tuple(int(left_match.group(name)) for name in core_names)
    right_core = tuple(int(right_match.group(name)) for name in core_names)
    if left_core != right_core:
        return 1 if left_core > right_core else -1

    left_pre = left_match.group("prerelease")
    right_pre = right_match.group("prerelease")
    if left_pre is None or right_pre is None:
        if left_pre == right_pre:
            return 0
        return 1 if left_pre is None else -1

    left_identifiers = left_pre.split(".")
    right_identifiers = right_pre.split(".")
    for left_identifier, right_identifier in zip(
        left_identifiers, right_identifiers
    ):
        if left_identifier == right_identifier:
            continue

        left_numeric = left_identifier.isdigit()
        right_numeric = right_identifier.isdigit()
        if left_numeric and right_numeric:
            return 1 if int(left_identifier) > int(right_identifier) else -1
        if left_numeric != right_numeric:
            return -1 if left_numeric else 1
        return 1 if left_identifier > right_identifier else -1

    if len(left_identifiers) == len(right_identifiers):
        return 0
    return 1 if len(left_identifiers) > len(right_identifiers) else -1


def validate_version_code(version_code):
    if not re.fullmatch(r"\d{8}", version_code):
        raise BumpError("versionCode must be an 8-digit date in YYYYMMDD format")
    try:
        datetime.strptime(version_code, "%Y%m%d")
    except ValueError as error:
        raise BumpError(
            f"Invalid calendar date for versionCode: {version_code}"
        ) from error


def shanghai_today():
    return datetime.now(SHANGHAI_TZ).strftime("%Y%m%d")


def read_project_state():
    package_content = read_file(PACKAGE_JSON)
    manifest_content = read_file(MANIFEST_JSON)
    app_content = read_file(APP_VUE)

    try:
        package_data = json.loads(package_content)
    except json.JSONDecodeError as error:
        raise BumpError(f"package.json is not valid JSON: {error}") from error

    package_version = package_data.get("version")
    if not isinstance(package_version, str) or not package_version:
        raise BumpError("package.json does not contain a valid version")

    package_match = get_single_match(
        PACKAGE_VERSION_REGEX, package_content, "package.json version"
    )
    if package_match.group(2) != package_version:
        raise BumpError("package.json parsed version does not match its source text")

    manifest_match = get_single_match(
        MANIFEST_VERSION_REGEX, manifest_content, "manifest.json versionName"
    )
    code_match = get_single_match(
        MANIFEST_CODE_REGEX, manifest_content, "manifest.json versionCode"
    )
    app_match = get_single_match(
        APP_VERSION_REGEX, app_content, "App.vue APP_VERSION"
    )

    versions = {
        "package.json": package_version,
        "manifest.json": manifest_match.group(2),
        "App.vue": app_match.group(2),
    }
    for name, version in versions.items():
        try:
            validate_version(version)
        except BumpError as error:
            raise BumpError(f"Invalid version in {name}: {version}") from error
    validate_version_code(code_match.group(2))

    return {
        "versions": versions,
        "version_code": code_match.group(2),
        "contents": {
            PACKAGE_JSON: package_content,
            MANIFEST_JSON: manifest_content,
            APP_VUE: app_content,
        },
    }


def build_changes(state, target_version, target_code):
    original = state["contents"]
    updated = dict(original)

    if target_version != state["versions"]["package.json"]:
        updated[PACKAGE_JSON] = replace_quoted_value(
            PACKAGE_VERSION_REGEX,
            updated[PACKAGE_JSON],
            target_version,
            "package.json version",
        )
    if target_version != state["versions"]["manifest.json"]:
        updated[MANIFEST_JSON] = replace_quoted_value(
            MANIFEST_VERSION_REGEX,
            updated[MANIFEST_JSON],
            target_version,
            "manifest.json versionName",
        )
    if target_version != state["versions"]["App.vue"]:
        updated[APP_VUE] = replace_quoted_value(
            APP_VERSION_REGEX,
            updated[APP_VUE],
            target_version,
            "App.vue APP_VERSION",
        )

    if target_code != state["version_code"]:
        updated[MANIFEST_JSON] = replace_numeric_value(
            MANIFEST_CODE_REGEX,
            updated[MANIFEST_JSON],
            target_code,
            "manifest.json versionCode",
        )

    return {
        path: content
        for path, content in updated.items()
        if content != original[path]
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "同步更新 package.json、manifest.json 与 App.vue；"
            "使用 -v 时 versionCode 默认采用 Asia/Shanghai 当天日期。"
        )
    )
    parser.add_argument(
        "-v",
        "--version",
        help="新版本号，例如 1.2.3-beta.1",
    )
    parser.add_argument(
        "-c",
        "--code",
        "--versioncode",
        "--version-code",
        dest="version_code",
        help="显式 versionCode，必须是有效的 YYYYMMDD 日期",
    )
    parser.add_argument(
        "--allow-downgrade",
        action="store_true",
        help="显式允许目标版本低于当前最高版本",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="执行读取、校验和变更计算，但不写入文件",
    )
    args = parser.parse_args()

    if not args.version and not args.version_code:
        parser.error("at least one of --version or --version-code is required")
    if args.allow_downgrade and not args.version:
        parser.error("--allow-downgrade requires --version")
    return args


def main():
    args = parse_args()
    banner(args.dry_run)

    try:
        if args.version:
            validate_version(args.version)
        if args.version_code:
            validate_version_code(args.version_code)

        state = read_project_state()
        today = shanghai_today()
        versions = state["versions"]
        unique_versions = set(versions.values())

        if not args.version and len(unique_versions) != 1:
            details = ", ".join(
                f"{name}={value}" for name, value in versions.items()
            )
            raise BumpError(
                "Current project versions are inconsistent; --version is required "
                f"to reconcile them: {details}"
            )

        highest_version = max(
            versions.values(), key=cmp_to_key(compare_semver)
        )
        target_version = args.version or highest_version
        target_code = args.version_code or today

        if (
            args.version
            and compare_semver(target_version, highest_version) < 0
            and not args.allow_downgrade
        ):
            raise BumpError(
                f"Version downgrade blocked: target {target_version} is lower than "
                f"current highest version {highest_version}; use --allow-downgrade "
                "to proceed explicitly"
            )

        if args.version and len(unique_versions) != 1:
            details = ", ".join(
                f"{name}={value}" for name, value in versions.items()
            )
            warn(
                f"Current project versions are inconsistent ({details}); "
                f"--version {target_version} will reconcile all sources"
            )

        if args.version_code and args.version_code != today:
            warn(
                f"Explicit versionCode {args.version_code} differs from "
                f"today in Asia/Shanghai ({today})"
            )

        info(f"Project root: {ROOT}")
        if len(unique_versions) == 1:
            info(f"Version: {highest_version} → {target_version}")
        else:
            info(f"Highest current version: {highest_version}")
            info(f"Target version for all sources: {target_version}")

        if args.version_code:
            code_source = (
                f"explicit argument; Asia/Shanghai today is {today}"
            )
        else:
            code_source = "automatic Asia/Shanghai today"
        info(
            f"versionCode: {state['version_code']} → {target_code} "
            f"({code_source})"
        )

        changes = build_changes(state, target_version, target_code)
        print()

        if not changes:
            warn("All version fields already match the requested values")
            info("No files were written")
            return 0

        for path in changes:
            relative_path = os.path.relpath(path, ROOT)
            info(f"Will update: {relative_path}")

        print()
        if args.dry_run:
            ok("Dry run completed; no files were written")
        else:
            for path, content in changes.items():
                write_file(path, content)
            ok(f"Updated {len(changes)} file(s)")
            info("Next step: use HBuilderX to rebuild Web H5 manually")

        return 0
    except BumpError as error:
        err(str(error))
        info("No files were written")
        return 1


if __name__ == "__main__":
    sys.exit(main())
