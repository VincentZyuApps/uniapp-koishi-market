// utils/fonts.js
// 跨端网络字体加载服务，适配微信、QQ、支付宝小程序的页面作用域隔离与缓存机制

export const loadFonts = () => {
	// #ifndef WEB
	const loadSingleFont = (options) => {
		return new Promise((resolve) => {
			let finished = false
			const timer = setTimeout(() => {
				if (!finished) {
					finished = true
					console.warn(`⏱️ [Font] ${options.family} 加载超时 (10s)，自动跳过继续下一个`)
					resolve(false)
				}
			}, 10000)

			console.log(`📡 [Font] 发起加载字体: ${options.family}`)
			try {
				uni.loadFontFace({
					...options,
					success: (res) => {
						if (!finished) {
							finished = true
							clearTimeout(timer)
							console.log(`✅ [Font] ${options.family} 加载成功:`, JSON.stringify(res || {}))
							resolve(true)
						}
					},
					fail: (err) => {
						if (!finished) {
							finished = true
							clearTimeout(timer)
							console.warn(`⚠️ [Font] ${options.family} 加载失败:`, JSON.stringify(err || {}))
							resolve(false)
						}
					}
				})
			} catch (e) {
				if (!finished) {
					finished = true
					clearTimeout(timer)
					console.error(`💥 [Font] 调用 loadFontFace 抛出同步异常 (${options.family}):`, e)
					resolve(false)
				}
			}
		})
	}

	return (async () => {
		await loadSingleFont({
			family: 'Cascadia Mono',
			source: 'url("https://cdn.jsdmirror.com/npm/@fontsource/cascadia-mono@5.3.0/files/cascadia-mono-latin-400-normal.woff")',
			global: true
		})

		await loadSingleFont({
			family: 'LXGW WenKai',
			source: 'url("https://cdn.jsdmirror.com/gh/LupusCaeruleus/Fonts@main/LxgwWenKaiGB-Regular.woff2")',
			global: true
		})
	})()
	// #endif
}
