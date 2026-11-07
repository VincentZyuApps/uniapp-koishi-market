#!/usr/bin/env python3
"""Generate crawlable H5 pages from the public Koishi market snapshot.

Run before publishing with HBuilderX. This writes source public assets only;
it never changes the HBuilderX output directory. Pass --input for offline tests.
"""
import argparse
import hashlib
import html
import json
import re
import urllib.request
from pathlib import Path
from urllib.parse import quote, urlsplit
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / '__static__'
GENERATED = PUBLIC / 'seo-generated'
BASE = 'https://vincentzyuapps.github.io/uniapp-koishi-market/'
SOURCE = 'https://storeluna-cf.vincentzyu233.cn/storeluna/index.json'
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('', NS)


def plain(value):
    if isinstance(value, dict):
        value = value.get('zh-CN') or value.get('zh') or value.get('en') or ''
    if not isinstance(value, str):
        return ''
    value = re.sub(r'<[^>]*>', ' ', value)
    value = re.sub(r'!?\[([^\]]*)\]\([^)]*\)', r'\1', value)
    value = re.sub(r'[`*_#~]', '', value)
    return re.sub(r'\s+', ' ', value).strip()


def people(value):
    result = []
    seen = set()
    for item in value if isinstance(value, list) else [value]:
        if isinstance(item, dict):
            item = item.get('username') or item.get('name') or ''
        name = re.sub(r'\s*\(https?://[^)]*\)', '', plain(item)).strip()
        if not name or name.lower() in ('unknown', '暂无', 'unknown author') or name.lower() in seen:
            continue
        seen.add(name.lower())
        result.append(name)
    return result


def plugin_metadata(item):
    package = item.get('package') if isinstance(item.get('package'), dict) else {}
    manifest = item.get('manifest') if isinstance(item.get('manifest'), dict) else {}
    display = plain(item.get('shortname')) or plain(package.get('name')) or 'Koishi 插件'
    description = plain(manifest.get('description')) or plain(package.get('description'))
    if description == '暂无描述':
        description = ''
    authors = people(package.get('author') or item.get('author'))
    publishers = people(package.get('publisher') or item.get('publisher'))
    maintainers = people(package.get('maintainers') or item.get('maintainers') or [])

    def same_people(a, b):
        return bool(a) and len(a) == len(b) and {x.lower() for x in a} == {x.lower() for x in b}

    credits = ''
    if same_people(authors, maintainers):
        credits = f"由{'、'.join(authors)}开发与维护"
    elif not authors and same_people(publishers, maintainers):
        credits = f"由{'、'.join(publishers)}发布与维护"
    else:
        publishing = f"由{'、'.join(authors)}开发" if authors else (f"由{'、'.join(publishers)}发布" if publishers else '')
        credits = '，'.join(filter(None, [publishing, f"由{'、'.join(maintainers)}维护" if maintainers else '']))
    summary = description
    if len(description) < 80:
        prefix = f"{display}，{description.rstrip('，。；; ')}" if description else f'{display} 是一款 Koishi 插件'
        summary = prefix + (f'，{credits}' if credits else '') + '。'
    keywords = []
    seen = set()
    for keyword in package.get('keywords', []) if isinstance(package.get('keywords'), list) else []:
        word = plain(keyword)
        if word and word.lower() not in seen:
            seen.add(word.lower())
            keywords.append(word)
    return {'display': display, 'description': description, 'summary': summary[:170], 'keywords': keywords,
            'authors': authors, 'publishers': publishers, 'maintainers': maintainers}


def esc(value):
    return html.escape(str(value), quote=True)


def slug(name):
    return re.sub(r'[^a-z0-9._-]+', '-', name.lower()).strip('-')[:70] + '-' + hashlib.sha256(name.encode('utf-8')).hexdigest()[:16]


def safe_link(value):
    if not isinstance(value, str):
        return ''
    try:
        parsed = urlsplit(value)
        return value if parsed.scheme in ('https', 'http') and parsed.netloc else ''
    except ValueError:
        return ''


def page(title, description, canonical, body, schema=None, noindex=False, keywords=None):
    data = ''
    if schema:
        data = '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026') + '</script>'
    keyword_tag = f'<meta name="keywords" content="{esc(", ".join(keywords))}">' if keywords else ''
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(description)}">{keyword_tag}<meta name="robots" content="{'noindex,follow' if noindex else 'index,follow'}"><link rel="canonical" href="{esc(canonical)}"><link rel="icon" href="{BASE}favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="{BASE}static/logo.svg"><link rel="apple-touch-icon" href="{BASE}static/apple-touch-icon.png"><meta property="og:type" content="website"><meta property="og:site_name" content="Koishi 插件市场"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{esc(canonical)}"><meta property="og:image" content="{BASE}static/og-market.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Koishi 插件市场"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(description)}"><meta name="twitter:image" content="{BASE}static/og-market.png"><link rel="stylesheet" href="{BASE}seo-generated/pages.css">{data}</head><body><header><a class="brand" href="{BASE}"><img src="{BASE}static/logo.svg" alt="" width="36" height="36">Koishi 插件市场</a><a href="{BASE}">打开插件市场</a></header><main>{body}</main><footer><a href="{BASE}seo-generated/index-1.html">插件目录</a> · <a href="{BASE}">Koishi 插件市场</a></footer></body></html>'''


def xml_file(path, tag, locations):
    root = ET.Element(f'{{{NS}}}{tag}')
    child = 'url' if tag == 'urlset' else 'sitemap'
    for loc in locations:
        el = ET.SubElement(root, f'{{{NS}}}{child}')
        ET.SubElement(el, f'{{{NS}}}loc').text = loc
    ET.ElementTree(root).write(path, encoding='utf-8', xml_declaration=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Use a local market JSON snapshot')
    args = parser.parse_args()
    if args.input:
        data = json.loads(args.input.read_text(encoding='utf-8'))
    else:
        request = urllib.request.Request(SOURCE, headers={'User-Agent': 'KoishiMarketSEO/1.0'})
        with urllib.request.urlopen(request, timeout=90) as response:
            data = json.load(response)
    if not isinstance(data, dict) or not isinstance(data.get('objects'), list) or not data['objects']:
        raise ValueError('市场数据无效，未更新 SEO 文件')
    entries = {}
    for item in data['objects']:
        if not isinstance(item, dict):
            continue
        package = item.get('package') if isinstance(item.get('package'), dict) else {}
        name = package.get('name')
        if not isinstance(name, str) or not name or len(name) > 214 or not re.fullmatch(r'(?:@[a-z0-9._~-]+/)?[a-z0-9._~-]+', name):
            continue
        entries.setdefault(name, item)
    if not entries:
        raise ValueError('市场数据不含有效的 npm 包名，未更新 SEO 文件')
    GENERATED.mkdir(parents=True, exist_ok=True)
    plugin_dir = GENERATED / 'plugins'
    plugin_dir.mkdir(exist_ok=True)
    generated_files = []
    details = []
    items = sorted(entries.items(), key=lambda x: x[0].lower())
    for name, item in items:
        package = item['package']
        metadata = plugin_metadata(item)
        display = metadata['display']
        description = metadata['description'] or '暂无描述'
        summary = metadata['summary']
        author = '、'.join(metadata['authors'])
        publisher = '、'.join(metadata['publishers'])
        maintainers = '、'.join(metadata['maintainers'])
        version = plain(package.get('version'))
        canonical = BASE + 'seo-generated/plugins/' + slug(name) + '.html'
        app_url = BASE + '#/pages/plugin-detail/plugin-detail?name=' + quote(name, safe='')
        links = package.get('links') if isinstance(package.get('links'), dict) else {}
        link_html = ''.join(f'<li><a href="{esc(url)}" rel="nofollow noopener" target="_blank">{esc(label)}</a></li>' for label, url in ((key, safe_link(links.get(key))) for key in ('npm', 'homepage', 'repository', 'bugs')) if url)
        facts = ''.join(f'<div><dt>{esc(label)}</dt><dd>{esc(value)}</dd></div>' for label, value in [('包名', name), ('版本', version), ('开发者', author), ('发布者', publisher), ('维护者', maintainers), ('许可证', plain(package.get('license')))] if value)
        body = f'<nav><a href="{BASE}">首页</a> / <a href="{BASE}seo-generated/index-1.html">插件目录</a> / {esc(display)}</nav><article><p class="eyebrow">KOISHI PLUGIN</p><h1>{esc(display)}</h1><p class="package">{esc(name)}</p><p class="description">{esc(description)}</p><a class="action" href="{esc(app_url)}">在市场中查看插件</a><h2>插件信息</h2><dl>{facts}</dl>' + (f'<h2>相关链接</h2><ul>{link_html}</ul>' if link_html else '') + '</article>'
        schema = {'@context': 'https://schema.org', '@type': 'SoftwareSourceCode', 'name': display, 'description': description, 'url': canonical}
        if version:
            schema['version'] = version
        path = plugin_dir / (slug(name) + '.html')
        path.write_text(page(f'{display} - Koishi 插件详情', summary, canonical, body, schema, keywords=metadata['keywords']), encoding='utf-8')
        generated_files.append(str(path.relative_to(GENERATED)))
        details.append(canonical)
    page_size = 150
    directory_urls = []
    for offset in range(0, len(items), page_size):
        number = offset // page_size + 1
        canonical = BASE + f'seo-generated/index-{number}.html'
        directory_urls.append(canonical)
        entries_html = ''.join(f'<li><a href="{BASE}seo-generated/plugins/{slug(name)}.html">{esc(plain(item.get("shortname")) or name)}</a><span>{esc(name)}</span></li>' for name, item in items[offset:offset + page_size])
        prev = f'<a href="{BASE}seo-generated/index-{number - 1}.html">上一页</a>' if number > 1 else ''
        nxt = f'<a href="{BASE}seo-generated/index-{number + 1}.html">下一页</a>' if offset + page_size < len(items) else ''
        body = f'<nav><a href="{BASE}">首页</a> / 插件目录</nav><h1>Koishi 插件目录</h1><p>浏览 Koishi 插件及其版本、描述与相关链接。第 {number} 页。</p><ul class="directory">{entries_html}</ul><nav class="pagination">{prev} {nxt}</nav>'
        path = GENERATED / f'index-{number}.html'
        path.write_text(page(f'Koishi 插件目录 - 第 {number} 页', f'浏览 Koishi 插件目录第 {number} 页，了解插件名称、描述和版本信息。', canonical, body, {'@context': 'https://schema.org', '@type': 'WebPage', 'name': f'Koishi 插件目录 - 第 {number} 页', 'url': canonical}), encoding='utf-8')
        generated_files.append(str(path.relative_to(GENERATED)))
    # Only remove paths recorded by a previous run of this generator.
    manifest_path = GENERATED / 'generated-files.json'
    if manifest_path.exists():
        old = json.loads(manifest_path.read_text(encoding='utf-8'))
        for relative in old:
            candidate = (GENERATED / relative).resolve()
            if candidate.is_relative_to(GENERATED.resolve()) and relative not in generated_files and candidate.is_file():
                candidate.unlink()
    manifest_path.write_text(json.dumps(generated_files, ensure_ascii=False), encoding='utf-8')
    locations = [BASE] + directory_urls + details
    # Keep each sitemap comfortably below both protocol limits.
    sitemap_names = []
    for i in range(0, len(locations), 10000):
        sitemap_name = f'sitemap-{i // 10000 + 1}.xml'
        xml_file(PUBLIC / sitemap_name, 'urlset', locations[i:i + 10000])
        sitemap_names.append(BASE + sitemap_name)
    xml_file(PUBLIC / 'sitemap.xml', 'sitemapindex', sitemap_names)
    (PUBLIC / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: ' + BASE + 'sitemap.xml\n', encoding='utf-8')
    print(f'Generated {len(details)} plugin pages, {len(directory_urls)} directory pages and {len(sitemap_names)} sitemap(s).')

if __name__ == '__main__':
    main()
