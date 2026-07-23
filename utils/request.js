export const DEFAULT_MARKET_SEARCH_ENDPOINT = 'https://bluerosion.vincentzyu233.cn/koishi-market-proxy/market'

/**
 * 获取当前设置的 endpoint
 * @returns {string} 当前 endpoint
 */
export function getCurrentEndpoint() {
	const savedEndpoint = uni.getStorageSync('market_endpoint')
	return savedEndpoint || DEFAULT_MARKET_SEARCH_ENDPOINT
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
		loadingText = '加载插件数据中...'
	} = config;
	
	if (isConsoleOutput) {
		console.log('-------[fetchMarketData]-------');
		console.log('正在请求插件市场数据:', endpoint);
		console.log('-------[fetchMarketData]-------');
	}
	
	let requestTask = null
	let settled = false

	const request = new Promise((resolve, reject) => {
		if (isShowToast) {
			uni.showLoading({
				title: loadingText,
				mask: false
			});
		}
		
		requestTask = uni.request({
			url: endpoint,
			method: 'GET',
			timeout: 30000, // 30秒超时
			header: {
				'Content-Type': 'application/json'
			},
			
			success: (res) => {
				if (isShowToast) {
					uni.hideLoading()
				}

				if (isConsoleOutput) {
					console.log('-------[success]-------');
					console.log('插件市场数据请求成功');
					console.log('状态码:', res.statusCode);
					console.log('数据大小:', JSON.stringify(res.data).length, 'bytes');
					console.log('插件数量:', res.data?.objects?.length || 0);
					console.log('-------[success]-------');
				}
				
				if (res.statusCode !== 200) {
					settled = true
					reject(new Error(`HTTP ${res.statusCode}: 请求失败`))
					return
				}

				try {
					const marketData = parseMarketData(res.data)
					settled = true

					if (isShowToast) {
						uni.showToast({
							title: '加载完成',
							icon: 'success',
							duration: 1500
						})
					}

					resolve(marketData)
				} catch (error) {
					settled = true
					reject(error)
				}
			},
			
			fail: (err) => {
				const aborted = isAbortError(err)
				if (isShowToast) {
					uni.hideLoading()
				}

				if (isConsoleOutput && !aborted) {
					console.log('-------[fail]-------');
					console.log('插件市场数据请求失败:', err);
					console.log('-------[fail]-------');
				}

				settled = true
				reject(aborted ? createAbortError(err) : err)
			}
		});
	});

	request.abort = () => {
		if (settled || !requestTask?.abort) return false
		requestTask.abort()
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
	if (!rawData || !rawData.objects) {
		return {
			forceTime: 0,
			mirror: '',
			plugins: [],
			categories: {},
			badges: {}
		};
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

// export const BASE_URL = 'https://bluerosion.vincentzyu233.cn/'

// export function qwq_request(config = {}) {
//     let { 
// 		url, endpoint,
// 		method = 'GET', header = {}, data = {}, 
// 		isConsoleOutput = true, isShowToast = false, 
// 		loadingText = '加载中', completeText = '完成' 
// 	} = config; // unpackage

//     let finalUrl = BASE_URL + url;
	
// 	if (isConsoleOutput){
// 		console.log("-------[config]-------"); console.log("utils/request: requesting... config:"); console.log(config); console.log("-------[config]-------");
// 		// console.log("request.js: BASE_URL = ", BASE_URL);
// 	}
	
//     return new Promise((resolve, reject) => {
// 		if ( isShowToast ) uni.showLoading({
// 			title: loadingText
// 		});

//         uni.request({
//             url: finalUrl,
//             data: data,
//             method: method,
//             header: header,

//             success: res => {
// 				if ( isConsoleOutput ){
// 					console.log("-------[success]-------"); console.log("utils/request: success: res: "); console.log(res); console.log("-------[success]-------");
// 				}
// 				if ( isShowToast ) uni.hideLoading();
// 				if ( isShowToast ) uni.showToast({
// 					title: completeText,
// 				    icon: 'success',
// 				    duration: 777 // Set a longer duration to ensure it stays visible
// 				});
// 				resolve(res);
//             },
//             fail: err => {
// 				if ( isConsoleOutput ){
// 					console.log("-------[fail]-------"); console.log("utils/request: err: "); console.log(err); console.log("-------[fail]-------");
// 				}
// 				// uni.hideToast();
// 				if ( isShowToast ) uni.hideLoading();
//                 uni.showModal({
//                     title: "[网络请求发生错误] 请联系开发人员VincentZyu",
//                     content: "error.detail: " + err,
//                     showCancel: false
//                 });
//                 reject(err);
//             },
//             complete: () => {

//             }
//         })
//     });
// }
