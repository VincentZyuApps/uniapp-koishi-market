![uniapp-koishi-market](https://socialify.git.ci/VincentZyuApps/uniapp-koishi-market/image?custom_description=%F0%9F%93%A6+%E5%9F%BA%E4%BA%8E+uni-app+%2B+Vue+3+%E7%9A%84+Koishi+%E6%8F%92%E4%BB%B6%E5%B8%82%E5%9C%BA%E6%B5%8F%E8%A7%88%E5%99%A8%EF%BC%8C%E6%94%AF%E6%8C%81%E5%A4%9A%E9%95%9C%E5%83%8F%E6%BA%90%E5%88%87%E6%8D%A2%E3%80%81%E6%8F%92%E4%BB%B6%E6%90%9C%E7%B4%A2%2F%E7%AD%9B%E9%80%89%2F%E6%8E%92%E5%BA%8F%EF%BC%8C%E5%B7%B2%E5%8F%91%E8%A1%8C%E5%88%B0GitHub+Pages+%E7%BD%91%E9%A1%B5%E7%AB%AF+%26+QQ+%E5%B0%8F%E7%A8%8B%E5%BA%8F%E3%80%82+&description=1&font=JetBrains+Mono&forks=1&issues=1&language=1&logo=https%3A%2F%2Fraw.githubusercontent.com%2FVincentZyuApps%2Funiapp-koishi-market%2Frefs%2Fheads%2Fmain%2Fdoc%2Funiapp-logo.svg&name=1&owner=1&pulls=1&stargazers=1&theme=Auto)

# uniapp-koishi-market

> 基于 UniApp 开发的 Koishi 插件市场浏览器，支持 GitHub Pages 和 QQ 小程序。

## 📸 预览

| 平台 | 截图 |
| :---: | :---: |
| Web 端 | ![preview-index](doc/preview-index.png) |
| 插件详情 | ![preview-plugin-detail](doc/preview-plugin-detail.png) |
| QQ 小程序 | ![qq-miniapp](doc/koishi的npm插件-qq小程序.png) |

## 🔗 在线访问

- **GitHub Pages**：<https://vincentzyuapps.github.io/uniapp-koishi-market/#/>
- **QQ 小程序**：搜索 **koishi的npm插件**，或访问 <https://m.q.qq.com/a/s/780e4930897b10f165367ddcd6b46c16>

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

```shell
git add .
git add -f unpackage/dist/build/web/
git status --short
git status unpackage/dist/build/web/
git ls-files unpackage/dist/build/web/
git commit -m "pub page: 更新页面"   # commit message 需要包含 pub page 才会部署
git push github main
git push origin main
```