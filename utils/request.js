import { MARKET_PRESETS } from './market-presets.js'

export const DEFAULT_MARKET_SEARCH_ENDPOINT = 'https://storeluna-cf.vincentzyu233.cn/storeluna/index.json'

/**
 * 获取当前设置的 endpoint
 * @returns {string} 当前 endpoint
 */
export function getManualMarketEndpoint() {
	const savedEndpoint = uni.getStorageSync('market_endpoint')
	if (savedEndpoint) return savedEndpoint
	const savedValue = uni.getStorageSync('market_preset_index')
	if (savedValue === '' || savedValue == null) return ''
	const index = Number(savedValue)
	if (!Number.isInteger(index) || index < 0 || index >= MARKET_PRESETS.length) return ''
	return MARKET_PRESETS[index].url || (index === MARKET_PRESETS.length - 1 ? uni.getStorageSync('market_custom_endpoint') || '' : '')
}

export function getCurrentEndpoint() {
	return getManualMarketEndpoint() || uni.getStorageSync('market_auto_endpoint') || DEFAULT_MARKET_SEARCH_ENDPOINT
}

function isAbortError(error) {
	const message = error?.errMsg || error?.message || ''
	return /abort/i.test(message)
}

function createAbortError(originalError) {
	const error = new Error('请求已取消')
	error.name = 'AbortError'
	error.originalError = originalError
	return error
}

/**
 * 获取 Koishi 插件市场数据
 * @param {Object} config - 配置选项
 * @param {string} config.endpoint - API 端点，默认使用存储中的端点或 DEFAULT_MARKET_SEARCH_ENDPOINT
 * @param {boolean} config.isConsoleOutput - 是否输出日志，默认 true
 * @param {boolean} config.isShowToast - 是否显示加载提示，默认 false
 * @param {string} config.loadingText - 加载提示文本
 * @returns {Promise<Object> & { abort: () => boolean }} 返回插件市场数据，并支持主动取消
 */
export function fetchMarketData(config = {}) {
	const {
		endpoint = getCurrentEndpoint(),
		isConsoleOutput = true,
		isShowToast = false,
		loadingText = '加载插件数据中...',
		timeout = 60000,
		retryCount = 1
	} = config
	const retries = Number.isFinite(Number(retryCount)) ? Math.max(0, Math.floor(Number(retryCount))) : 0
	let requestTask = null
	let retryTimer = null
	let settled = false
	let rejectRequest

	if (isConsoleOutput) console.log('正在请求插件市场数据:', endpoint)
	if (isShowToast) uni.showLoading({ title: loadingText, mask: false })

	const request = new Promise((resolve, reject) => {
		rejectRequest = reject
		const finish = (error, result) => {
			if (settled) return
			settled = true
			requestTask = null
			if (retryTimer !== null) clearTimeout(retryTimer)
			retryTimer = null
			if (isShowToast) uni.hideLoading()
			if (error) reject(error)
			else {
				if (isShowToast) uni.showToast({ title: '加载完成', icon: 'success', duration: 1500 })
				resolve(result)
			}
		}
		const run = (remaining) => {
			if (settled) return
			requestTask = uni.request({
				url: endpoint,
				method: 'GET',
				timeout,
				success: (res) => {
					if (settled) return
					if (res.statusCode !== 200) {
						if (remaining > 0) {
							requestTask = null
							retryTimer = setTimeout(() => { retryTimer = null; run(remaining - 1) }, 600)
						} else finish(new Error(`HTTP ${res.statusCode}: 请求失败`))
						return
					}
					try { finish(null, parseMarketData(res.data)) }
					catch (error) { finish(error) }
				},
				fail: (err) => {
					if (settled) return
					if (isAbortError(err)) return finish(createAbortError(err))
					if (remaining > 0) {
						requestTask = null
						retryTimer = setTimeout(() => { retryTimer = null; run(remaining - 1) }, 500)
						return
					}
					if (isConsoleOutput) console.log('插件市场数据请求失败:', err)
					const detail = err?.errMsg || err?.message || ''
					const error = new Error(/timeout/i.test(detail)
						? '请求超时，请检查网络后重试'
						: '网络请求失败，请检查网络或数据源的跨域设置')
					error.originalError = err
					finish(error)
				}
			})
		}
		run(retries)
	})

	request.abort = () => {
		if (settled) return false
		settled = true
		if (retryTimer !== null) clearTimeout(retryTimer)
		if (isShowToast) uni.hideLoading()
		requestTask?.abort?.()
		rejectRequest(createAbortError())
		return true
	}
	return request
}

/**
 * 解析插件市场数据，转换为前端需要的格式
 * @param {Object} rawData - 原始市场数据
 * @returns {Object} 格式化后的数据
 */
function parseMarketData(rawData) {
	if (!rawData || !Array.isArray(rawData.objects)) {
		throw new Error('数据源返回的市场数据格式无效')
	}
	
	const plugins = rawData.objects.map((item, index) => {
		// 解析插件基本信息
		const plugin = {
			id: index + 1,
			name: item.package?.name || item.shortname || 'unknown',
			shortname: item.shortname || '',
			version: item.package?.version || '0.0.0',
			description: getDescription(item),
			author: getAuthor(item),
			icon: '', // Koishi 插件通常没有图标字段，可以后续扩展
			category: item.category || 'other',
			
			// 状态标记
			verified: item.verified || false,
			preview: item.manifest?.preview || false,
			insecure: item.insecure || false,
			portable: item.portable || false,
			newborn: isNewborn(item.createdAt),
			ignored: item.ignored || false,
			
			// 统计数据
			downloads: item.downloads?.lastMonth || 0,
			dependents: item.dependents || 0,
			rating: item.rating || 0,
			
			// 时间信息
			createdAt: item.createdAt || '',
			updatedAt: item.updatedAt || '',
			
			// 其他信息
			license: item.license || item.package?.license || '',
			keywords: item.package?.keywords || [],
			installSize: item.installSize || 0,
			publishSize: item.publishSize || 0,
			
			// 评分详情
			score: item.score || {},
			
			// 原始数据（如果需要）
			_raw: item
		};
		
		return plugin;
	});
	
	// 统计分类数量
	const categories = {};
	const badges = {
		verified: 0,
		preview: 0,
		insecure: 0,
		portable: 0,
		newborn: 0
	};
	
	plugins.forEach(plugin => {
		// 统计分类
		categories[plugin.category] = (categories[plugin.category] || 0) + 1;
		
		// 统计徽章
		if (plugin.verified) badges.verified++;
		if (plugin.preview) badges.preview++;
		if (plugin.insecure) badges.insecure++;
		if (plugin.portable) badges.portable++;
		if (plugin.newborn) badges.newborn++;
	});
	
	return {
		forceTime: rawData.forceTime || 0,
		mirror: rawData.mirror || '',
		plugins,
		categories,
		badges,
		total: plugins.length
	};
}

/**
 * 获取插件描述
 */
function getDescription(item) {
	if (item.manifest?.description) {
		const desc = item.manifest.description;
		return desc.zh || desc.en || desc;
	}
	return item.package?.description || '暂无描述';
}

/**
 * 获取插件作者
 */
function getAuthor(item) {
	if (item.package?.publisher?.username) {
		return item.package.publisher.username;
	}
	if (item.package?.maintainers?.[0]?.username) {
		return item.package.maintainers[0].username;
	}
	if (item.package?._npmUser?.name) {
		return item.package._npmUser.name;
	}
	return 'unknown';
}

/**
 * 判断是否为新发布插件（30天内）
 */
function isNewborn(createdAt) {
	if (!createdAt) return false;
	const created = new Date(createdAt).getTime();
	const now = Date.now();
	const thirtyDays = 30 * 24 * 60 * 60 * 1000;
	return (now - created) < thirtyDays;
}
