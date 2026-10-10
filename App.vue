<script>
	const APP_VERSION = '0.3.2-beta.10'

	export default {
		onLaunch: function() {
			console.log(`App Launch. 欢迎来到 UniAppKoishiMarket! version: ${APP_VERSION}`)
		},
		onShow: function() {
			console.log(`App Show. 欢迎回到 UniAppKoishiMarket! version: ${APP_VERSION}`)
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
	/*  #endif  */

	/*  #ifdef  MP-WEIXIN || MP-QQ  */
	page, view, text, button, input, textarea {
	    font-family: inherit;
	}
	/*  #endif  */

</style>
