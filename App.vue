<script>
	const APP_VERSION = '0.3.4-beta.16'

	import { useTheme } from '@/utils/theme.js'

	export default {
		onLaunch: function() {
			console.log(`App Launch. 欢迎来到 UniAppKoishiMarket! version: ${APP_VERSION}`)
			const { refreshTheme } = useTheme()
			refreshTheme()

			// #ifndef WEB
			// 动态加载 Cascadia Mono 等宽字体 (约 16KB，极速异步下载，不占小程序包体积)
			uni.loadFontFace({
				family: 'Cascadia Mono',
				source: 'url("https://cdn.jsdmirror.com/npm/@fontsource/cascadia-mono@5.3.0/files/cascadia-mono-latin-400-normal.woff2")',
				global: true,
				success: () => {
					console.log('✅ [Font] Cascadia Mono 通过 jsdmirror 加载成功')
				},
				fail: (err) => {
					console.warn('⚠️ [Font] Cascadia Mono 加载失败:', JSON.stringify(err))
				}
			})

			// 动态加载 霞鹜文楷 GB (单文件 woff2 约 1.97MB，支持全量常用简体汉字，不占小程序本地包体积)
			uni.loadFontFace({
				family: 'LXGW WenKai',
				source: 'url("https://cdn.jsdmirror.com/gh/LupusCaeruleus/Fonts@main/LxgwWenKaiGB-Regular.woff2")',
				global: true,
				success: () => {
					console.log('✅ [Font] 霞鹜文楷 (LXGW WenKai) 通过 jsdmirror 加载成功')
				},
				fail: (err) => {
					console.warn('⚠️ [Font] 霞鹜文楷 (LXGW WenKai) 加载失败:', JSON.stringify(err))
				}
			})
			// #endif
		},
		onShow: function() {
			console.log(`App Show. 欢迎回到 UniAppKoishiMarket! version: ${APP_VERSION}`)
			const { refreshTheme } = useTheme()
			refreshTheme()
		},
		onHide: function() {
			console.log(`App Hide. 欢迎离开 UniAppKoishiMarket! version: ${APP_VERSION}`)
		}
	}
</script>

<style lang="scss">
	@import './styles/theme.scss';

	/* #ifdef WEB */
	@import '@free-fonts/lxgw-wenkai/lxgw-wenkai.css';
	@import '@fontsource/cascadia-mono/index.css';
	/* #endif */
	
	/* 全局应用字体 */
	page {
		font-family: 'LXGW WenKai', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
	}

	/*  #ifdef WEB  */
	/* 确保所有常规元素继承字体，等宽代码区域采用 Cascadia Mono + 霞鹜文楷 */
	*, ::before, ::after {
		font-family: inherit;
	}

	code, kbd, samp, pre {
		font-family: 'Cascadia Mono', 'LXGW WenKai', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	}

	/* 全局自定义滚动条（优雅紫色主题胶囊条） */
	::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	::-webkit-scrollbar-track {
		background: var(--scrollbar-track, rgba(85, 70, 163, 0.14));
		border-radius: 999px;
	}

	::-webkit-scrollbar-thumb {
		background: var(--scrollbar-thumb, #6d5bd0);
		border-radius: 999px;
		border: 1px solid transparent;
		background-clip: padding-box;
		transition: background-color 0.2s ease;
	}

	::-webkit-scrollbar-thumb:hover {
		background: var(--primary-color, #5546a3);
	}

	* {
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-thumb, #6d5bd0) var(--scrollbar-track, rgba(85, 70, 163, 0.14));
	}
	/*  #endif  */

	/*  #ifndef WEB  */
	/* 小程序端普通元素优先采用 霞鹜文楷，回退系统无衬线字体 */
	page, view, text, button, input, textarea {
	    font-family: 'LXGW WenKai', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
	}

	/* 小程序端代码、等宽容器和代码类优先采用 Cascadia Mono + 霞鹜文楷 */
	code, kbd, samp, pre, .mono, .font-mono, .code-text, .copyable, .info-value, .version-text, .plugin-name, .plugin-package, .link-url, .package-name, .version-tag {
	    font-family: 'Cascadia Mono', 'LXGW WenKai', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	}
	/*  #endif  */

</style>
