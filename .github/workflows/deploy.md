# 构建与部署说明

本项目的构建**在本地 HBuilderX 中完成**，构建产物提交到仓库后由 GitHub Actions / GitLab CI 自动上传到三个托管平台。

> **核心原则**：CI 不做构建，只负责上传——和你在本地 build 完手动拖文件到托管平台的行为完全一致。

---

## 📋 触发机制 (Trigger)

部署需要同时满足两个条件：
1. 推送到 `main` 分支
2. Commit Message 中包含关键词 `pub page`

| 关键词 | 说明 | 触发动作 |
| :--- | :--- | :--- |
| `pub page` | 更新页面 | ✅ 部署到 GitHub Pages<br>✅ 部署到 Cloudflare Pages<br>✅ 部署到 GitLab Pages（`.gitlab-ci.yml`） |

也可以从 GitHub Actions 页面通过 `workflow_dispatch` 手动触发，此时不检查提交信息。

**示例 Commit：**
```bash
git commit -m "feat: 发布 v0.1.x Web H5 (pub page)"
```

如果一次推送包含多个提交，GitHub Actions 检查的是本次推送的 **HEAD 提交信息**，因此最后一个提交必须包含精确小写关键词 `pub page`。GitLab CI 同样要求推送到 `main` 且提交信息包含该关键词。

---

## 🧱 版本更新与本地构建

本项目依赖 HBuilderX 的原生引擎编译，必须使用 HBuilderX GUI 操作。

### 更新版本（必须早于构建）

在项目根目录执行：

```bash
# 常规发布：versionCode 自动使用 Asia/Shanghai 当天日期
python scripts/bump.py -v 0.1.x-beta.y

# 可选：只预览，不写文件
python scripts/bump.py -v 0.1.x-beta.y --dry-run
```

脚本会同步更新 `package.json`、`manifest.json` 与 `App.vue`，并将 `manifest.json.versionCode` 更新为上海当天的 `YYYYMMDD`。补发历史版本时才需要显式传入 `-c YYYYMMDD`。

### HBuilderX 操作步骤

1. 打开 **HBuilderX**，加载本项目文件夹
2. 点击顶部菜单栏 **发行** → **网站-PC Web 或手机 H5**
3. 等待编译完成，控制台输出类似：
   ```
   [HBuilder] 项目 'uniapp-koishi-market' 发行模式启动中...
   [HBuilder] 编译成功!
   [HBuilder] 打包成功!
   ```
4. 构建产物输出到：
   ```
   unpackage/dist/build/web/
   ```

### 验证构建产物

确认 `unpackage/dist/build/web/` 目录下包含：
- `index.html`
- `assets/` 文件夹（含 JS、CSS 等资源）
- `static/` 文件夹（含图片、字体等静态资源）

### 生成 Cloudflare Pages 路径映射（必须晚于构建）

由于 `manifest.json` 中 `h5.router.base` 配置为 `/uniapp-koishi-market/`（适配 GitHub Pages 子路径），而 Cloudflare Pages 部署在根路径 `/` 下。需要生成 `_redirects` 文件让 CF Pages 自动映射路径。

> `_redirects` 文件使用 Netlify 兼容语法，Cloudflare Pages 原生支持。HBuilderX 重新发行时可能清理构建目录，因此必须在每次构建完成后重新生成。

在项目根目录执行：

```bash
python scripts/generate_cf_redirects.py
```

脚本会在 `unpackage/dist/build/web/_redirects` 中写入：
```
/uniapp-koishi-market/* /:splat 200
```

> 效果：浏览器请求 `/uniapp-koishi-market/assets/xxx` → 平台内部映射为 `/assets/xxx`，用户无感知。

本项目使用 hash 路由，`#` 后的页面路由不会发送到服务器；该规则主要用于剥离 Cloudflare Pages 根站点上的 `/uniapp-koishi-market/` 资源前缀。GitHub Pages 本身部署在同名子路径下，不依赖这条规则，但上传 `_redirects` 不会影响 GitHub Pages。

生成后确认文件内容必须精确为：

```text
/uniapp-koishi-market/* /:splat 200
```

### 完整 Git 发布流程

```bash
# 1. 先更新版本，再用 HBuilderX 手动发行 Web H5
python scripts/bump.py -v 0.1.x-beta.y
# HBuilderX GUI：发行 -> 网站-PC Web 或手机 H5

# 2. HBuilderX 构建完成后，重新生成 Cloudflare Pages 路径映射
python scripts/generate_cf_redirects.py

# 3. 暂存源码、文档、旧哈希删除及其他变更
git add -A
# web 目录已通过白名单允许跟踪；再次 -f 可确保新哈希产物完整加入
git add -f unpackage/dist/build/web/

# 4. 检查即将提交的内容
git status --short
git --no-pager diff --cached --stat
git diff --cached --check
git status --short -- unpackage/dist/build/web/
git ls-files -- unpackage/dist/build/web/

# 5. 提交；精确小写关键词 pub page 用于触发部署
git commit -m "feat: 发布 v0.1.x Web H5 (pub page)"
git log -1 --format=fuller

# 6. 推送到各远端；GitHub 与 GitLab 会分别触发 Pages 部署
git push github main
git push gitee main
git push gitlab main
git push codeberg main
```

`git diff --cached` 只展示暂存区，也就是下一次提交真正包含的内容；不要使用 `git diff HEAD --stat --short`，`git diff` 没有 `--short` 参数。如果只需要一行统计，可以使用 `git --no-pager diff --cached --shortstat`。

### 构建产物检查清单

- `index.html` 引用的 JS、CSS、图标文件都必须存在于 `unpackage/dist/build/web/`。
- `index.html` 中的资源路径应以 `/uniapp-koishi-market/` 开头。
- 新哈希资源已加入、旧哈希资源已删除，且 `index.html` 已指向新入口文件。
- 构建产物内嵌版本与 `package.json`、`manifest.json`、`App.vue` 一致。
- `_redirects` 已重新生成并纳入 Git 跟踪。
- 生产构建中包含 `bluerosion.vincentzyu233.cn`，且不再包含 `sh-aliyun2.vincentzyu233.cn` 或已删除的数据源。

---

## ☁️ 部署方式

部署**不需要登录 Cloudflare 后台拖文件**，由 GitHub Actions 自动完成。

### 方式一：GitHub Actions 自动部署（推荐）

提交时 commit message 包含 `pub page`，推送后自动触发部署任务：

| 任务 | 目标平台 | 时长 |
| :--- | :--- | :--- |
| `deploy-gh-pages` | GitHub Pages | ~1 分钟 |
| `deploy-cf-pages` | Cloudflare Pages | ~30 秒 |

多个任务**并行执行**，互不影响。可以在 GitHub 仓库的 **Actions** 标签页查看进度。

> GitLab Pages 由 `.gitlab-ci.yml` 独立触发，推送到 GitLab 的 `main` 分支且 commit 含 `pub page` 时自动部署。

### 方式二：手动上传到 Cloudflare Pages（备用）

如果需要绕过 CI 手动部署：

```bash
# 安装 wrangler（如已安装可跳过）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署到 Cloudflare Pages
npx wrangler pages deploy unpackage/dist/build/web --project-name uniapp-koishi-market
```

---

## 🚀 前置准备：手动创建 Cloudflare 项目（重要）

由于 GitHub Action 使用的是 API Token 推送模式，你需要先在 Cloudflare 后台手动创建一个同名的 **Direct Upload** 类型项目，否则 Action 会报 `Project not found` 错误。

### 创建 Cloudflare Pages 项目

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**（左侧菜单）
2. 点击 **Create application**（创建应用）
3. 在创建页面中，**不要**直接连接 GitHub，请选择标签页 **Pages**
4. **关键步骤：** 选择 **Upload assets**（上传资产）或 **Upload your static files**（上传静态文件，Direct Upload 模式）
   > 提示：该选项通常在页面底部，或者在 "Connect to Git" 按钮下方。确保选择的是 Direct Upload 模式，而不是连接 Git 仓库。
5. 输入项目名称：`uniapp-koishi-market`
   > **必须**与 `.github/workflows/deploy.yml` 中 Wrangler 命令的 `--project-name=uniapp-koishi-market` 一致。
6. 点击 **Create project** 完成创建
   - 首次创建可能需要手动上传任意文件初始化
   - ❤️ **推荐做法**：找个空文件夹（如 `temp`），里面新建一个 `index.html`（写个 "Hello" 即可），拖进去点 **Deploy site** 完成"占位"
   - 只要项目创建成功，后续的 GitHub Action 会自动覆盖这里的内容，不用担心
7. 回到 GitHub Actions 页面，**重新运行 (Re-run)** 之前失败的任务

---

## 🔑 需要配置的 GitHub Secrets

为了使 Cloudflare Pages 部署成功，需要在 GitHub 仓库中添加两个 Secrets。

进入：**GitHub 仓库 → Settings → Secrets and variables → Actions**，然后点击 **New repository secret**。

> ⚠️ **注意层级**：页面顶部有三个 tab —— **Environment secrets**、**Repository secrets**、**Organization secrets**（仅组织仓库显示）。  
> 请确保添加在 **Repository secrets** 下（默认就是这一层），**不要**选 Environment secrets（需要绑定 environment）或 Organization secrets（组织级共享，一般用不到）。

### 1. `CLOUDFLARE_API_TOKEN`

Cloudflare API 令牌，用于授权 GitHub Action 向 Cloudflare 上传文件。

**创建步骤：**

1. 打开 [Cloudflare API Tokens 管理页面](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **Create Token**
3. 选择自定义令牌，或使用可编辑后再调整权限的模板
4. 按最小权限原则配置：

   | 区域 | 设置 | 值 |
   | :--- | :--- | :--- |
   | **Permissions (权限)** | Account → Cloudflare Pages → Edit | **必须包含** |
   | **Account Resources (账户资源)** | Include → 你的 Cloudflare 账户名 | 选择你的账户 |

   Direct Upload 不需要额外授予 Workers Scripts、Workers Routes、KV 或 Zone 权限。

5. 点击 **Continue to summary**，确认信息无误
6. 点击 **Create Token**
7. **⚠️ 重要：** 复制生成的 Token（只会显示一次），粘贴到 GitHub Secrets 的 `CLOUDFLARE_API_TOKEN` 中

### 2. `CLOUDFLARE_ACCOUNT_ID`

Cloudflare 账户 ID，用于识别你的账户。

**方法一：从 URL 直接复制（最快）**

登录 Cloudflare 后，当前浏览器地址栏中的 URL 就包含了你的 Account ID：

```
https://dash.cloudflare.com/<account_id>/...
```

例如地址栏显示 `https://dash.cloudflare.com/a1b2c3d4e5f6.../some-page`，则 `a1b2c3d4e5f6...` 就是你的 Account ID，直接复制即可。

> 无论你在 Cloudflare Dashboard 中访问哪个页面，URL 中紧跟域名后的第一段**32位十六进制字符串**就是 Account ID。

**方法二：从仪表板页面复制**

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击任意域名/站点进入其管理页面
3. 在右侧栏中找到 **Overview** 页面
4. 向下滚动到右侧栏最底部，找到 **Account ID**
5. 点击复制图标，粘贴到 GitHub Secrets 的 `CLOUDFLARE_ACCOUNT_ID` 中

### 配置完成后

两个 Secrets 添加完成后，效果如下：

| Secret Name | 示例值 |
| :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | `abc123def456...`（40位字符） |
| `CLOUDFLARE_ACCOUNT_ID` | `a1b2c3d4e5f6...`（32位十六进制） |

---

## ⚙️ 配置文件说明

### 修改 Cloudflare Pages 项目名称

如需修改项目名称，编辑 `.github/workflows/deploy.yml` 中 Wrangler 命令的 `--project-name`：

```yaml
      - name: Publish to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          # ...
          command: pages deploy unpackage/dist/build/web --project-name=uniapp-koishi-market
```

修改后需要同步更新 Cloudflare 后台的项目名称，两者必须一致。

### 预览 URL

部署成功后，各平台分别分配一个访问 URL：

| 平台 | 访问 URL |
| :--- | :--- |
| GitHub Pages | `https://vincentzyuapps.github.io/uniapp-koishi-market/#/` |
| Cloudflare Pages | `https://uniapp-koishi-market.pages.dev` |
| GitLab Pages | `https://vincentzyu233.gitlab.io/uniapp-koishi-market/#/` |

如需绑定自定义域名，在 Cloudflare Pages 项目设置 → **Custom domains** 中添加即可。

---

## 🛠️ 部署逻辑

该工作流包含两个并行的任务 (Jobs)：

### 1. GitHub Pages
- **构建方式**：本地 HBuilderX 编译
- **部署目录**：`unpackage/dist/build/web/`
- **部署方式**：`actions/upload-pages-artifact` + `actions/deploy-pages`
- **访问地址**：`https://<username>.github.io/<repo>/`

### 2. Cloudflare Pages
- **构建方式**：本地 HBuilderX 编译
- **部署目录**：`unpackage/dist/build/web/`
- **部署方式**：`cloudflare/wrangler-action@v3` 调用 `wrangler pages deploy`
- **访问地址**：`https://uniapp-koishi-market.pages.dev`

> 两个任务使用完全相同的构建产物，只是部署目标不同。

### 3. GitLab Pages（独立 CI）

- **触发器**：推送到 GitLab `main` 分支 + commit 含 `pub page`
- **配置**：`.gitlab-ci.yml`（`pages` job）
- **部署方式**：将 `unpackage/dist/build/web/` 移至 `public/` 目录作为 artifact
- **访问地址**：`https://VincentZyu233.gitlab.io/uniapp-koishi-market/#/`

---

## 🔧 常见问题

### Actions 显示 skipped

确认推送目标是 GitHub `main`，并用 `git log -1 --format=fuller` 检查 HEAD 提交信息是否包含精确小写 `pub page`。

### GitHub Pages 没有更新或打开了另一个账号的旧站点

先执行 `git remote get-url github`，确认该远端所属账号与正在访问的 `https://<owner>.github.io/uniapp-koishi-market/` 中的 `<owner>` 一致。`VincentZyu233` 与 `VincentZyuApps` 是不同的 GitHub Pages 站点，推送其中一个仓库不会自动更新另一个账号的站点。

### Cloudflare Pages 页面空白或资源 404

确认 HBuilderX 构建后重新运行了 `python scripts/generate_cf_redirects.py`，并检查 `_redirects`、`index.html` 和所有新哈希资源都已提交。若 `_redirects` 缺失，Cloudflare 根站点无法解析 `/uniapp-koishi-market/assets/...` 请求。

### 页面仍显示旧版本或旧数据源

通常是版本更新后没有重新运行 HBuilderX，或没有完整暂存新旧哈希资源。检查源码版本、构建产物内嵌 `appVersion`、生产 API 地址以及 `git status --short -- unpackage/dist/build/web/`。

### Cloudflare 报 `Project not found`

确认 Cloudflare 中已创建 `uniapp-koishi-market` Direct Upload 项目，并检查 `CLOUDFLARE_ACCOUNT_ID`、API Token 权限及 Wrangler 命令中的 `--project-name`。
