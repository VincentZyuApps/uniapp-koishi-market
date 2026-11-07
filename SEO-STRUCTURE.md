# H5 搜索引擎文件

规范站点为 `https://vincentzyuapps.github.io/uniapp-koishi-market/`。首页与 `seo-generated/` 下的插件目录和详情是可抓取的 HTML；详情页面展示市场数据，并链接回交互式市场。原有 `#/` 路由仍供应用和小程序使用，不作为独立 sitemap URL。

`__static__/` 是 H5 Vite 公共资源目录，HBuilderX 发行时需确认其内容随 Web H5 发布。`sitemap.xml` 是索引，`sitemap-1.xml` 等包含首页、目录和插件详情的规范地址；`robots.txt` 声明 sitemap。静态站点无法在每次请求时实时计算 sitemap：每次 H5 发行之前，在项目根目录执行：

```sh
python3 scripts/generate_seo.py
```

生成器读取项目默认市场源，重新生成 HTML 和 sitemap；网络错误或数据无效会报错，不应在失败时发布过期结果。也可用 `--input <市场数据 JSON>` 离线验证。插件在源数据变化后，要再次生成并重新发行才能更新搜索引擎看到的页面。生成资源属于源码公开资源，不要直接改写发行目录。未涉及任何后端接口或用户数据。

插件详情的 description 与社交简介优先使用插件数据；简介少于 80 个字符时补充名称和已有的人员信息。数据明确提供开发者时使用“开发”，只有发布者时使用“发布”，避免把自动发布账号当成开发者。关键词只取插件提供的关键词，没有时不沿用首页关键词。交互式详情页在浏览器加载数据后更新这些信息；无需执行 JavaScript 的分享抓取器应使用上述静态插件详情地址。

Open Graph 图片为 `static/og-market.png`，默认多尺寸 ICO 为 `__static__/favicon.ico`。可用安装了 Pillow 且具有相应字体的环境运行 `scripts/generate_og_image.py` 重新生成；普通 sitemap 更新不需要 Pillow。

GitHub Pages 项目站点位于共享域名的子目录，项目无法控制 `https://vincentzyuapps.github.io/robots.txt`。子目录的 `robots.txt` 不等同于域名根目录的爬虫规则；如有域名根目录管理权，可在那里声明本项目 sitemap，否则在搜索平台的站点管理工具中提交 sitemap。Cloudflare 根域名部署需按最终访问地址和既有重写规则确认这些文件能实际访问。多个部署域名统一指向现有 GitHub Pages 规范地址。

发布后应验证真实 HTTP 状态、内容类型、规范链接、sitemap、OG 图片与 favicon，并使用搜索平台工具检查实际抓取和收录。静态预览图对所有插件共用品牌图，但标题和描述按插件生成。搜索引擎或社交平台是否展示图标、预览及收录由其自行决定。
