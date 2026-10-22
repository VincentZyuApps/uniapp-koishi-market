/**
 * Koishi 插件市场数据源测试脚本 (ES Module)
 * 用法:
 *   node scripts/test_market.mjs                 # 默认对比测试自建 CF CDN 源与 laoke 直连源
 *   node scripts/test_market.mjs <custom_url>   # 测试指定数据源地址
 */

const TARGET_SOURCES = [
	{
		name: 'VincentZyu StoreLuna (CF Anycast CDN)',
		url: 'https://storeluna-cf.vincentzyu233.cn/storeluna/index.json'
	},
	{
		name: 'VincentZyu StoreLuna (laoke 深圳阿里云直连 / 无 CF)',
		url: 'https://storeluna.vincentzyu233.cn/storeluna/index.json'
	}
]

// 命令行参数支持指定单个 URL
const customArg = process.argv[2]
const sourcesToTest = customArg
	? [{ name: '自定义测试源', url: customArg }]
	: TARGET_SOURCES

async function testSingleSource({ name, url }, showDetails = false) {
	console.log(`\n==================================================`)
	console.log(`📡 正在测试: ${name}`)
	console.log(`🌐 目标地址: ${url}`)
	console.log(`==================================================`)

	const startTime = Date.now()
	try {
		const response = await fetch(url, {
			headers: { 'User-Agent': 'uniapp-koishi-market-cli-test/1.0' },
			signal: AbortSignal.timeout(15000)
		})

		const duration = Date.now() - startTime
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		const data = await response.json()
		const jsonBytes = JSON.stringify(data).length
		const sizeKb = (jsonBytes / 1024).toFixed(1)

		console.log(`✅ 请求成功! 耗时: ${duration}ms | 数据大小: ~${sizeKb} KB`)
		console.log(`   - 服务端版本: ${data.version || '未知'}`)
		console.log(`   - 镜像标识:   ${data.mirror || '无'}`)
		console.log(`   - 插件总数:   ${data.objects?.length || data.total || 0} 个`)
		console.log(`   - 更新时间:   ${data.forceTime ? new Date(data.forceTime).toLocaleString() : '无'}`)

		if (showDetails && data.objects && data.objects.length > 0) {
			console.log(`\n📦 前 3 个插件示例:`)
			data.objects.slice(0, 3).forEach((item, idx) => {
				const pkg = item.package || {}
				console.log(`   [${idx + 1}] ${item.shortname || pkg.name} (v${pkg.version || '0.0.0'})`)
				console.log(`       分类: ${item.category || 'other'} | 下载: ${item.downloads?.lastMonth || 0}/月 | 评分: ${(item.rating || 0).toFixed(1)}`)
			})

			// 分类与徽章统计概览
			const categories = {}
			const badges = { verified: 0, preview: 0, insecure: 0, portable: 0 }
			data.objects.forEach(p => {
				const cat = p.category || 'other'
				categories[cat] = (categories[cat] || 0) + 1
				if (p.verified) badges.verified++
				if (p.manifest?.preview) badges.preview++
				if (p.insecure) badges.insecure++
				if (p.portable) badges.portable++
			})

			console.log(`\n🏷️ 徽章统计: 官方认证 ${badges.verified} | 预览版 ${badges.preview} | 便携版 ${badges.portable} | 风险提示 ${badges.insecure}`)
			const topCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 4)
			console.log(`📊 主要分类: ${topCats.map(([c, n]) => `${c}(${n})`).join(', ')} ...`)
		}

		return { success: true, duration, total: data.objects?.length || 0 }
	} catch (error) {
		const duration = Date.now() - startTime
		console.error(`❌ 请求失败! 耗时: ${duration}ms`)
		console.error(`   错误详情: ${error.message}`)
		return { success: false, duration, error: error.message }
	}
}

// 顶层执行测试
console.log('🚀 开始执行 Koishi 插件市场数据源自动化测试 (ES Module)...')
const results = []

for (let i = 0; i < sourcesToTest.length; i++) {
	const source = sourcesToTest[i]
	// 仅首个源展开详细样例展示，后续源输出精简统计以保持控制台清爽
	const result = await testSingleSource(source, i === 0)
	results.push({ name: source.name, ...result })
}

console.log(`\n==================================================`)
console.log(`🏁 测试汇总对比结果:`)
console.log(`==================================================`)
results.forEach(r => {
	const statusIcon = r.success ? '🟢 正常' : '🔴 失败'
	const info = r.success ? `${r.duration}ms (${r.total} 个插件)` : `失败: ${r.error}`
	console.log(`- ${r.name.padEnd(50)} [${statusIcon}] ${info}`)
})
console.log(`\n🎉 测试全部完成!`)
