<script>
	const APP_VERSION = '0.3.6-rc.2'

	import { useTheme } from '@/utils/theme.js'
	import { loadFonts } from '@/utils/fonts.js'
	// #ifdef WEB
	import { setupNativeScrollbarHover } from '@/utils/native-scrollbar-hover.js'
	// #endif

	export default {
		onLaunch: function() {
			console.log(`App Launch. 欢迎来到 UniAppKoishiMarket! version: ${APP_VERSION}`)
			const { refreshTheme } = useTheme()
			refreshTheme()
			loadFonts()
			// #ifdef WEB
			setupNativeScrollbarHover()
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
		font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
	}

	/*  #ifdef WEB  */
	/* 确保所有常规元素继承字体，等宽代码区域采用 Cascadia Mono + 霞鹜文楷 */
	*, ::before, ::after {
		font-family: inherit;
	}

	code, kbd, samp, pre {
		font-family: 'Cascadia Mono', 'LXGW WenKai', 'PingFang SC', 'Source Han Sans SC', 'Noto Sans CJK SC', 'Noto Sans SC', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
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

	/* 原生滚动容器在桌面端仅靠近对应边缘时显示滚动条。 */
	@media (hover: hover) and (min-width: 601px) {
		*:not(.native-scrollbar-edge-visible) {
			scrollbar-color: transparent transparent !important;
		}
		*:not(.native-scrollbar-edge-visible)::-webkit-scrollbar-thumb,
		*:not(.native-scrollbar-edge-visible)::-webkit-scrollbar-track {
			background-color: transparent !important;
			border-color: transparent !important;
		}
	}
	/*  #endif  */

	/*  #ifndef WEB  */
	/* 小程序端普通元素优先采用 霞鹜文楷，回退思源黑体、苹方及现代无衬线字体 */
	page, view, text, button, input, textarea {
	    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
	}

	/* 小程序端代码、等宽容器和代码类优先采用 Cascadia Mono + 霞鹜文楷 + 思源黑体 */
	code, kbd, samp, pre, .mono, .font-mono, .code-text, .copyable, .info-value, .version-text, .plugin-name, .plugin-package, .link-url, .package-name, .version-tag {
	    font-family: 'Cascadia Mono', 'LXGW WenKai', 'PingFang SC', 'Source Han Sans SC', 'Noto Sans CJK SC', 'Noto Sans SC', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	}
	/*  #endif  */

</style>
