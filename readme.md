![uniapp-koishi-market](https://socialify.git.ci/VincentZyuApps/uniapp-koishi-market/image?custom_description=%F0%9F%93%A6+%E5%9F%BA%E4%BA%8E+uni-app+%2B+Vue+3+%E7%9A%84+Koishi+%E6%8F%92%E4%BB%B6%E5%B8%82%E5%9C%BA%E6%B5%8F%E8%A7%88%E5%99%A8%EF%BC%8C%E6%94%AF%E6%8C%81%E5%A4%9A%E9%95%9C%E5%83%8F%E6%BA%90%E5%88%87%E6%8D%A2%E3%80%81%E6%8F%92%E4%BB%B6%E6%90%9C%E7%B4%A2%2F%E7%AD%9B%E9%80%89%2F%E6%8E%92%E5%BA%8F%EF%BC%8C%E5%B7%B2%E5%8F%91%E8%A1%8C%E5%88%B0GitHub+Pages+%E7%BD%91%E9%A1%B5%E7%AB%AF+%26+QQ+%E5%B0%8F%E7%A8%8B%E5%BA%8F%E3%80%82+&description=1&font=JetBrains+Mono&forks=1&issues=1&language=1&logo=https%3A%2F%2Fraw.githubusercontent.com%2FVincentZyuApps%2Funiapp-koishi-market%2Frefs%2Fheads%2Fmain%2Fdoc%2Funiapp-logo.svg&name=1&owner=1&pulls=1&stargazers=1&theme=Auto)

# uniapp-koishi-market

📦 基于 uni-app + Vue 3 的 Koishi 插件市场网页，支持多镜像源切换、插件搜索/筛选/排序，已部署为 GitHub Pages 网页端 & QQ 小程序。 

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VincentZyuApps/uniapp-koishi-market)
<s>[![Gitee](https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white)](https://gitee.com/vincent-zyu/uniapp-koishi-market) (🔒已被Gitee强行Private，何意味)</s>
[![GitLab](https://img.shields.io/badge/GitLab-FC6D26?style=for-the-badge&logo=gitlab&logoColor=white)](https://gitlab.com/VincentZyu233/uniapp-koishi-market)
[![Codeberg](https://img.shields.io/badge/Codeberg-2185D0?style=for-the-badge&logo=codeberg&logoColor=white)](https://codeberg.org/VincentZyu/uniapp-koishi-market)

> 🙃 Gitee的repo被平台莫名其妙设为私有。开放？自由？不存在的

## 🔗 在线访问

| 平台 | 入口 |
| :--- | :--- |
| **GitHub Pages** [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-online-181717?style=for-the-badge&logo=github)](https://vincentzyuapps.github.io/uniapp-koishi-market/#/) | <https://vincentzyuapps.github.io/uniapp-koishi-market/#/> |
| **Cloudflare Pages** [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-online-F38020?style=for-the-badge&logo=cloudflare)](https://uniapp-koishi-market.pages.dev) | <https://uniapp-koishi-market.pages.dev> |
| **QQ 小程序** [![QQ 小程序](https://img.shields.io/badge/QQ%20%E5%B0%8F%E7%A8%8B%E5%BA%8F-online-12B7F5?style=for-the-badge&logo=qq)](https://m.q.qq.com/a/s/780e4930897b10f165367ddcd6b46c16) | 搜索 **koishi的npm插件**，或者浏览器打开：<br><https://m.q.qq.com/a/s/780e4930897b10f165367ddcd6b46c16> |

## 📸 预览

| 平台 | 截图 |
| :---: | :---: |
| Web 端 | ![preview-index](doc/preview-index.png) |
| 插件详情 | ![preview-plugin-detail](doc/preview-plugin-detail.png) |
| QQ 小程序 | ![qq-miniapp](doc/koishi的npm插件-qq小程序.png) |

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
| --- | --- | --- |
| 前端框架 | [uni-app](https://github.com/dcloudio/uni-app) + [Vue](https://github.com/vuejs/vue) | 跨平台 UI 构建 |
| 后端数据 | [StoreLuna](https://github.com/koishi-shangxue-plugins/koishi-shangxue-apps/tree/main/plugins/storeluna) | Koishi 插件市场数据源 |
| API 服务 | [FastAPI](https://github.com/fastapi/fastapi) | CORS 中间件，提供接口服务 |
| 内网穿透 | [frp](https://github.com/fatedier/frp) | 转发后端服务 |
| 反向代理 | [Nginx](https://github.com/nginx/nginx) | 反代 & 静态资源托管 |

## 🚀 GitHub Action 部署

> **注意**：只有 commit message 中包含 `pub page` 时，才会触发 GitHub Pages 部署流程。  
> 手动 `workflow_dispatch` 触发不受此限制。

### 📟 Git 命令行操作
```shell
# HBuilderX gui界面左上角： 发行 -> 发行到WebH5
python py-util/generate_cf_redirects.py
git add -A
git add -f unpackage/dist/build/web/
git status --short
git status unpackage/dist/build/web/
git ls-files unpackage/dist/build/web/
git commit -m "pub page: 更新页面"   # 如果想要更新ghpage和cfpage的话
git push github main
git push gitee main
git push gitlab main
git push codeberg main
```