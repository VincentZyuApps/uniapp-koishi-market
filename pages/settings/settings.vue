<template>
	<view class="settings-page" :class="{ 'dark-mode': isDarkMode }" :style="{ paddingTop: statusBarOffset + 'px' }">
		<view class="settings-header">
			<text class="header-title">⚙️ 设置</text>
			<view class="theme-toggle" @click="toggleTheme">
				<text>{{ isDarkMode ? '🌙' : '☀️' }}</text>
			</view>
		</view>
		
		<view class="settings-content">
			<!-- 插件市场源设置 -->
			<view class="setting-section" :class="{ 'select-open': isPresetSelectOpen }">
				<view class="section-title">
					<text class="title-icon">🌐</text>
					<text class="title-text">插件市场数据源</text>
				</view>
				
			<!-- 预设源选择 -->
			<view class="setting-item">
				<text class="item-label">选择预设源</text>
				<form-select v-model="selectedPresetIndex" :options="presetSelectOptions" @change="onPresetChange" @open-change="onPresetSelectOpenChange" />
			</view>
			<!-- 自定义 URL 仅在选择自定义预设时显示 -->
			<view v-if="isCustomPreset" class="setting-item">
				<text class="item-label">自定义源地址</text>
				<textarea 
					class="custom-input" 
					v-model="customEndpoint" 
					placeholder="输入自定义 API 端点"
					@blur="onCustomEndpointChange"
					auto-height
				/>
				<button class="copy-btn" :disabled="!customEndpoint.trim()" @click="copyEndpoint(customEndpoint, '自定义源地址')">
					<text>复制</text>
				</button>
			</view>
			
			<!-- 当前使用的 URL -->
			<view class="setting-item info-item">
				<text class="item-label">当前源地址</text>
				<view class="url-display">
					<text class="current-url" selectable>{{ currentEndpoint }}</text>
					<button class="copy-btn" @click="copyEndpoint(currentEndpoint, '当前源地址')">
						<text>复制</text>
					</button>
				</view>
			</view>
				
				<!-- 源信息说明 -->
				<view class="source-info">
					<view class="info-row">
						<text class="info-label">地区：</text>
						<text class="info-value">{{ presetSources[selectedPresetIndex].region }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">说明：</text>
						<text class="info-value">{{ presetSources[selectedPresetIndex].description }}</text>
					</view>
				</view>
			</view>
			
			<!-- 测试连接按钮 -->
			<view class="action-section">
				<button class="test-btn" @click="testConnection" :disabled="isTesting">
					<text>{{ isTesting ? '测试中...' : '🔍 测试连接' }}</text>
				</button>
				<button class="reset-btn" @click="resetToDefault">
					<text>🔄 恢复默认</text>
				</button>
			</view>
			
			<!-- 测试过程与结果 -->
			<view v-if="isTesting || testResult" class="test-result" :class="{ success: testResult?.success, error: testResult && !testResult.success, testing: isTesting }">
				<view class="test-progress-list">
					<view v-for="step in testProgress" :key="step.key" class="test-progress-row" :class="step.status">
						<view class="progress-indicator">
							<text v-if="step.status === 'done'">✓</text>
							<text v-else-if="step.status === 'error'">!</text>
							<text v-else-if="step.status === 'active'" class="progress-spinner">•</text>
							<text v-else>○</text>
						</view>
						<text class="progress-text">{{ step.label }}</text>
					</view>
				</view>
				<view v-if="testResult" class="result-summary">
					<text class="result-icon">{{ testResult.success ? '✅' : '❌' }}</text>
					<text class="result-text">{{ testResult.message }}</text>
				</view>
			</view>
			
			<!-- 返回按钮 -->
			<view class="back-section">
				<button class="back-btn" @click="goBack">
					<text>← 返回插件市场</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import FormSelect from '@/components/form-select/form-select.vue'
import { onLoad } from "@dcloudio/uni-app";
import { DEFAULT_MARKET_SEARCH_ENDPOINT, fetchMarketData } from '../../utils/request.js'
// #ifdef MP-WEIXIN || MP-QQ
import { getStatusBarHeight } from '@/utils/system.js'
// #endif

// 主题模式
const isDarkMode = ref(true)
const statusBarOffset = ref(0)

// 预设源列表
const presetSources = ref([
	{
		name: 'VincentZyu FastAPI代理（推荐）',
		url: 'https://bluerosion.vincentzyu233.cn/koishi-market-proxy/market',
		region: '全球',
		description: '自建 FastAPI 代理源，解决跨域问题'
	},
	{
		name: 'NyanZone',
		url: 'https://registry.nyan.zone/k/market/index.json',
		region: '全球',
		description: '官方推荐源，速度快且稳定'
	},
	{
		name: '上学聚合源(大陆推荐)',
		url: 'https://cdn.jsdmirror.com/gh/shangxueink/koishi-registry-aggregator@gh-pages/market.json',
		region: '全球',
		description: '聚合多个源的数据，插件最全'
	},
	{
		name: 't4wefan（大陆）',
		url: 'https://registry.koishi.t4wefan.pub/index.json',
		region: '中国大陆',
		description: '大陆镜像源，国内访问速度快'
	},
	{
		name: 'Lipraty（大陆）',
		url: 'https://koi.nyan.zone/registry/index.json',
		region: '中国大陆',
		description: '大陆镜像源，备选方案'
	},
	{
		name: 'itzdrli（全球）',
		url: 'https://kp.itzdrli.cc',
		region: '全球',
		description: '全球CDN源'
	},
	{
		name: 'Q78KG（全球）',
		url: 'https://koishi-registry.yumetsuki.moe/index.json',
		region: '全球',
		description: '社区维护源'
	},
	{
		name: 'Koishi官方（全球）',
		url: 'https://registry.koishi.chat/index.json',
		region: '全球',
		description: 'Koishi 官方源'
	},
	{
		name: '自定义',
		url: '',
		region: '自定义',
		description: '使用下方自定义地址'
	}
])

// 当前选择的预设索引
const selectedPresetIndex = ref(0)
// 自定义端点
const customEndpoint = ref('')
// 测试状态
const isTesting = ref(false)
// 测试结果
const testResult = ref(null)
const testProgress = ref([])
const isPresetSelectOpen = ref(false)

const defaultPresetIndex = 0
const customPresetIndex = computed(() => presetSources.value.length - 1)
const presetSelectOptions = computed(() => presetSources.value.map((source, index) => ({
	value: index,
	label: source.name,
	description: source.url || source.description
})))
const isCustomPreset = computed(() => selectedPresetIndex.value === customPresetIndex.value)

// 当前端点（计算属性）
const currentEndpoint = computed(() => {
	if (isCustomPreset.value) {
		// 选择了"自定义"
		return customEndpoint.value.trim() || DEFAULT_MARKET_SEARCH_ENDPOINT
	}
	return presetSources.value[selectedPresetIndex.value].url
})

// 加载保存的设置
onMounted(() => {
	// 小程序状态栏适配
	// #ifdef MP-WEIXIN || MP-QQ
	const statusBarHeight = getStatusBarHeight()
	statusBarOffset.value = statusBarHeight + 10
	console.log('状态栏高度:', statusBarHeight, 'px，偏移量:', statusBarOffset.value, 'px')
	// #endif
	
	// 加载主题
	const savedTheme = uni.getStorageSync('theme')
	if (savedTheme) {
		isDarkMode.value = savedTheme === 'dark'
	}
	
	// 加载端点设置
	const savedEndpoint = uni.getStorageSync('market_endpoint')
	const savedPresetIndex = uni.getStorageSync('market_preset_index')
	
	const savedIndex = Number(savedPresetIndex)
	if (Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < presetSources.value.length) {
		selectedPresetIndex.value = savedIndex
	}

	const savedCustomEndpoint = uni.getStorageSync('market_custom_endpoint')
	if (savedCustomEndpoint) {
		customEndpoint.value = savedCustomEndpoint
	} else if (isCustomPreset.value && savedEndpoint) {
		// 兼容旧版本：自定义地址曾与当前地址共用同一个存储键。
		customEndpoint.value = savedEndpoint
	}
})

// 切换主题
const toggleTheme = () => {
	isDarkMode.value = !isDarkMode.value
	uni.setStorageSync('theme', isDarkMode.value ? 'dark' : 'light')
}

// 预设源变化
const onPresetChange = (value) => {
	selectedPresetIndex.value = Number(value)
	uni.setStorageSync('market_preset_index', selectedPresetIndex.value)
	
	// 预设源立即生效；空自定义源则明确回退到默认源。
	if (!isCustomPreset.value) {
		const selectedUrl = presetSources.value[selectedPresetIndex.value].url
		uni.setStorageSync('market_endpoint', selectedUrl)
	} else {
		uni.setStorageSync('market_endpoint', currentEndpoint.value)
	}
	
	clearTestResult()
	
	uni.showToast({
		title: '已切换数据源',
		icon: 'success'
	})
}

// 自定义端点变化
const onCustomEndpointChange = () => {
	const endpoint = customEndpoint.value.trim()
	if (!endpoint) return

	customEndpoint.value = endpoint
	selectedPresetIndex.value = customPresetIndex.value
	uni.setStorageSync('market_preset_index', selectedPresetIndex.value)
	uni.setStorageSync('market_custom_endpoint', endpoint)
	uni.setStorageSync('market_endpoint', endpoint)
	clearTestResult()

	uni.showToast({
		title: '已保存自定义源',
		icon: 'success'
	})
}

const onPresetSelectOpenChange = (isOpen) => {
	isPresetSelectOpen.value = isOpen
}

const copyEndpoint = (endpoint, label) => {
	const value = endpoint.trim()
	if (!value) return

	uni.setClipboardData({
		data: value,
		success: () => {
			uni.showToast({
				title: `已复制${label}`,
				icon: 'success'
			})
		}
	})
}

const createTestProgress = () => [
	{ key: 'endpoint', label: '已确认市场源地址', status: 'done' },
	{ key: 'request', label: '正在请求插件市场数据', status: 'active' },
	{ key: 'response', label: '正在等待市场响应', status: 'pending' },
	{ key: 'summary', label: '正在整理响应统计', status: 'pending' }
]

const updateTestProgress = (key, status, label) => {
	testProgress.value = testProgress.value.map((step) => step.key === key
		? { ...step, status, label: label || step.label }
		: step)
}

const clearTestResult = () => {
	testResult.value = null
	testProgress.value = []
}

// 测试连接
const testConnection = async () => {
	if (!currentEndpoint.value) {
		uni.showToast({
			title: '请先设置数据源',
			icon: 'none'
		})
		return
	}
	
	isTesting.value = true
	testResult.value = null
	testProgress.value = createTestProgress()
	
	try {
		const startTime = Date.now()
		await nextTick()
		const data = await fetchMarketData({
			endpoint: currentEndpoint.value,
			isConsoleOutput: false,
			isShowToast: false
		})
		updateTestProgress('request', 'done', '已完成插件市场请求')
		updateTestProgress('response', 'done', '已收到市场响应')
		updateTestProgress('summary', 'active')
		await nextTick()
		const endTime = Date.now()
		const duration = endTime - startTime
		updateTestProgress('summary', 'done', '已整理响应统计')
		
		testResult.value = {
			success: true,
			message: `连接成功！获取到 ${data.total} 个插件，耗时 ${duration}ms`
		}
	} catch (error) {
		const activeStep = testProgress.value.find((step) => step.status === 'active')
		if (activeStep) updateTestProgress(activeStep.key, 'error', `${activeStep.label.replace('正在', '')}失败`)
		testResult.value = {
			success: false,
			message: `连接失败：${error.message || '网络错误'}`
		}
	} finally {
		isTesting.value = false
	}
}

// 恢复默认设置
const resetToDefault = () => {
	uni.showModal({
		title: '确认恢复',
		content: '确定要恢复到默认数据源吗？',
		success: (res) => {
			if (res.confirm) {
				selectedPresetIndex.value = defaultPresetIndex
				customEndpoint.value = ''
				uni.removeStorageSync('market_custom_endpoint')
				uni.setStorageSync('market_preset_index', defaultPresetIndex)
				uni.setStorageSync('market_endpoint', presetSources.value[defaultPresetIndex].url)
				clearTestResult()
				
				uni.showToast({
					title: '已恢复默认设置',
					icon: 'success'
				})
			}
		}
	})
}

// 返回
const goBack = () => {
	uni.navigateBack()
}

onLoad(()=>{
	// #ifdef MP-QQ
	console.log("qq小程序的神秘要求捏");
	qq.showShareMenu({
		showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment'],
		withShareTicket: true,
	});
	// #endif
	// #ifdef MP-WEIXIN
	wx.showShareMenu({
		withShareTicket: true,
		menus: ['shareAppMessage', 'shareTimeline']
	});
	// #endif
})
</script>

<style scoped>
.settings-page {
	width: 100vw;
	min-height: 100vh;
	background-color: var(--bg-primary, #ffffff);
	color: var(--text-primary, #1f2328);
	padding: 40rpx 60rpx;
	box-sizing: border-box;
	
	/* 浅色主题变量 */
	--bg-primary: #ffffff;
	--bg-secondary: #f8f8f9;
	--text-primary: #1f2328;
	--text-secondary: #656d76;
	--text-tertiary: #8c959f;
	--border-color: #d0d7de;
	--primary-color: #5546a3;
	--success-color: #1a7f37;
	--danger-color: #d1242f;
	--surface: #ffffff;
	--surface-subtle: #f8f8f9;
	--border: #d0d7de;
	--accent: #5546a3;
	--accent-soft: #edeafa;
	--accent-ring: rgba(85, 70, 163, 0.18);
	--scrollbar-track: rgba(85, 70, 163, 0.14);
	--scrollbar-thumb: #6d5bd0;
}

.settings-page.dark-mode {
	--bg-primary: #0d1117;
	--bg-secondary: #161b22;
	--text-primary: #e6edf3;
	--text-secondary: #8b949e;
	--text-tertiary: #6e7681;
	--border-color: #30363d;
	--primary-color: #7c6bce;
	--success-color: #2ea043;
	--danger-color: #f85149;
	--surface: #161b22;
	--surface-subtle: #0d1117;
	--border: #30363d;
	--accent: #7c6bce;
	--accent-soft: #282342;
	--accent-ring: rgba(124, 107, 206, 0.24);
	--scrollbar-track: rgba(124, 107, 206, 0.18);
	--scrollbar-thumb: #a99cff;
}

.settings-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 60rpx;
}

.header-title {
	font-size: 48rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.theme-toggle {
	padding: 16rpx;
	font-size: 48rpx;
	cursor: pointer;
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	border-radius: 50%;
}

.theme-toggle:hover {
	transform: rotate(180deg) scale(1.1);
	background: rgba(124, 107, 206, 0.1);
}

.theme-toggle:active {
	transform: rotate(180deg) scale(0.9);
}

.settings-content {
	max-width: 1200rpx;
	margin: 0 auto;
}

.setting-section {
	position: relative;
	z-index: 0;
	background-color: var(--bg-secondary);
	border-radius: 16rpx;
	padding: 40rpx;
	margin-bottom: 40rpx;
	border: 2rpx solid var(--border-color);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	animation: slideUp 0.5s ease;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.setting-section:hover {
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
	transform: translateY(-4rpx);
}

.section-title {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 40rpx;
	padding-bottom: 24rpx;
	border-bottom: 2rpx solid var(--border-color);
}

.title-icon {
	font-size: 40rpx;
}

.title-text {
	font-size: 36rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.setting-item {
	margin-bottom: 32rpx;
}

.item-label {
	display: block;
	font-size: 28rpx;
	color: var(--text-secondary);
	margin-bottom: 16rpx;
	font-weight: 500;
}

.custom-input {
	width: 100%;
	min-height: 120rpx;
	padding: 24rpx 32rpx;
	background-color: var(--bg-primary);
	border: 2rpx solid var(--border-color);
	border-radius: 12rpx;
	font-size: 28rpx;
	color: var(--text-primary);
	font-family: 'LXGWWenKaiMono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	box-sizing: border-box;
	line-height: 1.6;
	transition: all 0.3s;
}

.info-item {
	background-color: var(--bg-primary);
	padding: 24rpx 32rpx;
	border-radius: 12rpx;
	border: 2rpx solid var(--border-color);
}

.current-url {
	flex: 1;
	min-width: 0;
	font-size: 26rpx;
	color: var(--primary-color);
	word-break: break-all;
	font-family: 'LXGWWenKaiMono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	user-select: text;
	-webkit-user-select: text;
}

.setting-section.select-open {
	z-index: 40;
}

.url-display {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	margin-top: 8rpx;
}

.copy-btn {
	flex-shrink: 0;
	min-width: 120rpx;
	margin: 16rpx 0 0;
	padding: 12rpx 20rpx;
	background-color: var(--bg-secondary);
	border: 2rpx solid var(--border-color);
	border-radius: 8rpx;
	color: var(--text-primary);
	font-size: 24rpx;
	line-height: 1.4;
}

.copy-btn::after {
	border: none;
}

.copy-btn:disabled {
	opacity: 0.5;
}

.custom-input + .copy-btn {
	margin-top: 16rpx;
}

.source-info {
	margin-top: 24rpx;
	padding: 24rpx;
	background-color: var(--bg-primary);
	border-radius: 12rpx;
	border: 2rpx solid var(--border-color);
}

.info-row {
	display: flex;
	margin-bottom: 12rpx;
	font-size: 26rpx;
}

.info-row:last-child {
	margin-bottom: 0;
}

.info-label {
	color: var(--text-tertiary);
	min-width: 100rpx;
}

.info-value {
	color: var(--text-secondary);
	flex: 1;
}

.action-section {
	display: flex;
	gap: 24rpx;
	margin-bottom: 32rpx;
}

.test-btn,
.reset-btn {
	flex: 1;
	padding: 28rpx 48rpx;
	border-radius: 12rpx;
	font-size: 32rpx;
	border: none;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	position: relative;
	overflow: hidden;
}

.test-btn::after,
.reset-btn::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 0;
	height: 0;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	transition: width 0.4s ease, height 0.4s ease;
}

.test-btn:active::after,
.reset-btn:active::after {
	width: 400rpx;
	height: 400rpx;
}

.test-btn {
	background-color: var(--primary-color);
	color: white;
}

.test-btn:hover:not(:disabled) {
	transform: translateY(-4rpx);
	box-shadow: 0 8rpx 24rpx rgba(85, 70, 163, 0.3);
}

.test-btn:active:not(:disabled) {
	transform: translateY(0);
}

.test-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.reset-btn {
	background-color: var(--bg-secondary);
	color: var(--text-primary);
	border: 2rpx solid var(--border-color);
}

.reset-btn:hover {
	transform: translateY(-4rpx);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
	border-color: var(--primary-color);
}

.reset-btn:active {
	transform: translateY(0);
}

.test-result {
	padding: 24rpx 32rpx;
	border-radius: 12rpx;
	margin-bottom: 32rpx;
	animation: resultSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes resultSlideIn {
	from {
		opacity: 0;
		transform: translateX(-20rpx) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateX(0) scale(1);
	}
}

.test-result.success {
	background-color: rgba(26, 127, 55, 0.1);
	border: 2rpx solid var(--success-color);
}

.test-result.error {
	background-color: rgba(209, 36, 47, 0.1);
	border: 2rpx solid var(--danger-color);
}

.test-result.testing {
	background-color: var(--bg-secondary);
	border: 2rpx solid var(--primary-color);
}

.test-progress-list {
	display: grid;
	gap: 14rpx;
}

.test-progress-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	min-height: 36rpx;
	color: var(--text-tertiary);
	transition: color 0.2s ease, transform 0.2s ease;
}

.test-progress-row.active {
	color: var(--primary-color);
	font-weight: 600;
	transform: translateX(4rpx);
}

.test-progress-row.done {
	color: var(--success-color);
}

.test-progress-row.error {
	color: var(--danger-color);
}

.progress-indicator {
	width: 32rpx;
	height: 32rpx;
	flex: 0 0 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	border: 2rpx solid currentColor;
	border-radius: 50%;
	font-size: 20rpx;
	line-height: 1;
}

.test-progress-row.done .progress-indicator {
	background-color: var(--success-color);
	color: #ffffff;
}

.test-progress-row.error .progress-indicator {
	background-color: var(--danger-color);
	color: #ffffff;
}

.progress-spinner {
	font-size: 32rpx;
	line-height: 0;
	animation: progressPulse 0.9s ease-in-out infinite;
}

.progress-text {
	font-size: 25rpx;
	line-height: 1.45;
}

.result-summary {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-top: 22rpx;
	padding-top: 20rpx;
	border-top: 2rpx solid var(--border-color);
}

.result-icon {
	font-size: 36rpx;
	animation: iconPop 0.5s ease;
}

@keyframes iconPop {
	0% { transform: scale(0); }
	60% { transform: scale(1.2); }
	100% { transform: scale(1); }
}

.result-text {
	font-size: 28rpx;
	color: var(--text-primary);
	flex: 1;
}

@keyframes progressPulse {
	0%, 100% { opacity: 0.35; transform: scale(0.75); }
	50% { opacity: 1; transform: scale(1.2); }
}

.back-section {
	margin-top: 60rpx;
}

.back-btn {
	width: 100%;
	padding: 28rpx;
	background-color: var(--bg-secondary);
	color: var(--text-primary);
	border: 2rpx solid var(--border-color);
	border-radius: 12rpx;
	font-size: 32rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
}

.back-btn:hover {
	background-color: var(--primary-color);
	color: white;
	border-color: var(--primary-color);
	transform: translateY(-4rpx);
	box-shadow: 0 8rpx 24rpx rgba(85, 70, 163, 0.25);
}

.back-btn:active {
	transform: translateY(0);
}
</style>
