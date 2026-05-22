<script>
	export default {
		onLaunch: function() {
			// QQ小程序的分享设置
			// 在每个页面的onLoad函数添加代码：
			// #ifdef MP-QQ
			// qq.showShareMenu({
			// 	showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment']
			// });
			// console.log("set qq.showShareMenu in App.vue");
			// #endif
			console.log('App Launch，20260523')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
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
