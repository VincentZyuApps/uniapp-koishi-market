<script>
	export default {
		onLaunch: function() {
			console.log('App Launch. 欢迎来到 uniapp koishi market!. version: 0.1.4-rc.4')
		},
		onShow: function() {
			console.log('App Show. 欢迎回到 uniapp koishi market!. version: 0.1.4-rc.4')
		},
		onHide: function() {
			console.log('App Hide. 欢迎离开 uniapp koishi market!. version: 0.1.4-rc.4')
		}
	}
</script>

<style>
	/*  #ifdef WEB  */
	@font-face {
		font-family: 'LXGWWenKaiMono';
		src: url('/static/fonts/LXGWWenKaiMono-Regular.ttf') format('truetype');
		font-weight: 500;
		font-style: normal;
	}
	/*  #endif  */
	
	/* 全局应用字体 */
	page {
		font-family: 'LXGWWenKaiMono', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
	}

	/*  #ifdef WEB  */
	/* 确保所有元素继承字体 */
	* {
		font-family: inherit;
	}
	/*  #endif  */

	/*  #ifdef  MP-WEIXIN  */
	page, view, text, button, input, textarea {
	    font-family: inherit;
	}
	/*  #endif  */
	
	/*  #ifdef  MP-QQ  */
	* {
		font-family: inherit;
	}
	/*  #endif  */

</style>
