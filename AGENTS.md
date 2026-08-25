# Repository Instructions

## Scope

- 本文件适用于整个 `uniapp-koishi-market` 仓库喵。
- 修改前先阅读相关源码、`git status` 与现有部署文档，不要假设工作区是干净的喵。

## Safety And Git

- 保留用户已有的暂存、未暂存和未跟踪改动，不得恢复、覆盖或顺手格式化任务范围外的文件喵。
- 未获得明确授权时，不执行 `git add`、`git commit`、`git push`、生产部署或远端状态修改喵。
- 获得暂存授权后优先使用限定路径的 `git add -- <paths>`，只有用户明确要求全部暂存时才使用 `git add -A` 喵。
- 提交前检查 `git status`、实际暂存文件和 `git diff --cached --check`，确保没有混入其他任务的改动喵。
- CRLF/LF 提示不代表代码错误，不得因此批量重写或重新规范化文件喵。
- 临时文件、日志和缓存必须放入已忽略目录，并在任务结束前只删除由当前任务明确创建的内容喵。
- 不得使用宽泛清理命令删除用户缓存，也不得把 `unpackage/dist/build/web/` 当作缓存清理喵。

## Style And Interaction

- `App.vue` 已全局导入 `styles/theme.scss`，跨页面配色、状态色、滚动条与动效令牌以该文件为唯一来源喵。
- 页面与组件优先使用已有的 `var(--bg-*)`、`var(--surface*)`、`var(--text-*)`、`var(--border*)`、`var(--primary-color)`、`var(--accent*)` 及语义状态色，不重复编写浅深色值喵。
- 新增跨页面视觉语义时，必须在 `theme.scss` 的浅色与深色令牌中同时定义，再由局部样式消费喵。
- 新页面根节点必须接入 `theme.scss` 的页面选择器，确保主题令牌和动画档位能够继承喵。
- `theme.scss` 无需在页面或组件中重复导入；可脱离页面根节点复用的组件才保留合理的 CSS 变量回退值喵。
- 页面专属布局、尺寸、媒体查询和局部视觉细节保留在对应 `.vue` 中，避免宽泛全局选择器造成样式串扰喵。
- 下拉、多选、开关与滚动容器优先复用 `form-select`、`form-checkbox-group`、`form-toggle`、`styled-scroll-view` 组件喵。
- 新增或修改动效时遵从 `utils/motion.js` 的档位和减少动态效果偏好，不绕过用户设置喵。
- 图标悬浮旋转优先复用 `utils/hover-icon-motion.js`，离开悬浮时必须平滑归位，不能出现角度突变喵。

## Development And Build

- Codex 不主动启动、重启或停止开发服务器，开发服务由用户管理喵。
- 用户提供本地地址后可以进行只读验证，但不得控制对应服务进程喵。
- Codex 不执行 HBuilderX 构建，也不得用 `npm run build:h5` 或其他 CLI 构建替代 HBuilderX 喵。
- 源码、版本或 H5 配置修改完成后，必须停下并等待用户明确确认已使用 HBuilderX 重新发行 Web H5 喵。
- HBuilderX 构建完成后，仍需等待用户明确要求，才能校验或暂存构建产物喵。
- `unpackage/dist/build/web/` 是受 Git 跟踪的正式发布产物，不得手工编辑其中的压缩文件喵。
- 哈希资源重命名属于正常构建结果，必须同时包含旧文件删除、新文件新增和 `index.html` 引用更新喵。

## Versioning

- 发布前必须先修改版本，再执行 HBuilderX 构建喵。
- `manifest.json` 的 `versionName` 与 `package.json` 的 `version` 必须保持一致喵。
- 每次发布都要把 `manifest.json` 的 `versionCode` 更新为当天日期，格式为 `YYYYMMDD` 喵。
- 构建后必须确认产物内嵌版本与源码版本一致，禁止手工修改构建文件补版本喵。

## Deployment

- GitHub Actions 只部署仓库中已提交的 `unpackage/dist/build/web/`，不会安装依赖或重新构建喵。
- 自动部署仅在推送到 `main` 且 HEAD 提交信息包含精确小写标记 `[pub-page]` 或 `[pub page]` 时触发喵。
- 推送 GitHub 会部署 GitHub Pages 与 Cloudflare Pages，推送 GitLab 会部署 GitLab Pages 喵。
- GitHub Actions 的 `workflow_dispatch` 不检查提交信息，但只部署 GitHub Pages 与 Cloudflare Pages 喵。
- 发布流程和平台配置以 `.github/workflows/deploy.yml`、`.github/workflows/deploy.md` 与 `.gitlab-ci.yml` 为准喵。
- 未获得明确授权时，不推送 GitHub、Gitee、GitLab 或 Codeberg 中的任何远端喵。

## Project-Specific Rules

- H5 路由基础路径保持为 `/uniapp-koishi-market/`，改动时必须同步考虑 GitHub Pages 与 Cloudflare Pages 喵。
- 用户完成 HBuilderX 构建后，发布前必须运行 `python scripts/generate_cf_redirects.py` 并确认 `_redirects` 规则正确喵。
- 由于构建目录的忽略规则，新生成文件可能需要在获得授权后使用 `git add -f unpackage/dist/build/web/` 喵。
- 当前默认市场代理为 `https://bluerosion.vincentzyu233.cn/koishi-market-proxy/market` 喵。
- 修改市场端点、预设内容或预设顺序时，必须兼容历史 `market_endpoint` 与 `market_preset_index` 本地存储值喵。
- 删除预设后必须校验旧索引边界，避免历史用户进入设置页时越界喵。

## Release Verification

- 在获得用户明确授权后，检查 `index.html` 引用的所有入口资源是否存在喵。
- 检查构建产物中的版本、市场代理地址和预设源与源码一致喵。
- 确认旧域名、已删除预设和旧版本没有残留在正式构建产物中喵。
- 确认 `_redirects` 已包含 `/uniapp-koishi-market/* /:splat 200` 喵。
