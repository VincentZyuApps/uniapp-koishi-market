<template>
	<view class="agent-page" :class="[{ 'dark-mode': isDarkMode }, motionClass]" :style="{ paddingTop: statusBarOffset + 'px' }">
		<view class="agent-header">
			<button class="home-button" @click="returnToMarket">
				<text class="home-icon">←</text>
				<text class="home-label">返回插件市场</text>
			</button>
			<view class="header-copy">
				<view class="header-title">
					<text>🤖 </text>
					<text class="agent-wiki-link" @click="openAgentWiki">Agent</text>
					<text> 找插件</text>
				</view>
				<text class="header-subtitle">生成提示词，交给你的 AI 助手检索 Koishi 插件</text>
			</view>
			<view class="theme-toggle" @click="toggleTheme">
				<text class="theme-icon">{{ isDarkMode ? '🌙' : '☀️' }}</text>
				<text class="theme-label">{{ themeLabel }}</text>
			</view>
		</view>

		<styled-scroll-view class="agent-content">
			<view class="tool-section" :class="{ 'select-open': openSelectKey === 'document' }">
				<view class="section-title">
					<text>📖 Agent 指南</text>
				</view>
				<form-select v-model="docPresetIndex" :options="docSelectOptions" :expanded="openSelectKey === 'document'" @change="persistPreferences" @open-change="onSelectOpenChange('document', $event)" />
				<text class="field-hint">可选择 GitHub、GitLab、Codeberg 镜像，或填写自定义公开文档 URL</text>
				<textarea v-if="isCustomDocPreset" v-model="customDocUrl" class="text-input compact-input" placeholder="输入 Agent 指南的公开 URL" auto-height @blur="persistPreferences" />
				<view class="url-display">
					<text class="url-preview" selectable>{{ documentUrl || '请先输入文档 URL' }}</text>
					<button class="url-copy-button" :disabled="!documentUrl" @click="copyUrl(documentUrl, 'Agent 指南地址')">复制</button>
				</view>
			</view>

			<view class="tool-section" :class="{ 'select-open': openSelectKey === 'market' }">
				<view class="section-title">
					<text>🌐 插件市场数据源</text>
				</view>
				<form-select v-model="marketPresetIndex" :options="marketSelectOptions" :expanded="openSelectKey === 'market'" @change="persistPreferences" @open-change="onSelectOpenChange('market', $event)" />
				<textarea v-if="isCustomMarketPreset" v-model="customMarketEndpoint" class="text-input compact-input" placeholder="输入插件市场 JSON 数据源" auto-height @blur="persistPreferences" />
				<text class="field-hint">此处独立于设置页配置，默认使用 Bluerosion 市场代理源</text>
				<view class="url-display">
					<text class="url-preview" selectable>{{ marketEndpoint || '请先输入市场数据源 URL' }}</text>
					<button class="url-copy-button" :disabled="!marketEndpoint" @click="copyUrl(marketEndpoint, '插件市场数据源')">复制</button>
				</view>
			</view>

			<view class="tool-section">
				<view class="section-title inline-title">
					<text>🔌 网络代理</text>
					<form-toggle :model-value="proxyEnabled" @update:model-value="setProxyEnabled" />
				</view>
				<textarea v-if="proxyEnabled" v-model="proxyUrl" class="text-input compact-input" placeholder="例如：http://127.0.0.1:7890" auto-height @blur="persistPreferences" />
				<text class="field-hint">仅在提示词中建议 Agent 遇到网络问题时使用，不会改变本应用的网络请求</text>
			</view>

			<view class="tool-section" :class="{ 'select-open': openSelectKey === 'category' }">
				<view class="section-title">
					<text>🎯 你的需求</text>
				</view>
				<form-select v-model="categoryIndex" :options="categorySelectOptions" :expanded="openSelectKey === 'category'" @change="persistPreferences" @open-change="onSelectOpenChange('category', $event)" />
				<textarea v-model="requirement" class="text-input requirement-input" placeholder="补充你希望实现的功能、适用平台、约束条件或偏好" auto-height @blur="persistPreferences" />
				<text class="field-hint">选择分类或填写具体需求后即可生成提示词</text>
			</view>

			<view class="tool-section">
				<view class="section-title">
					<text>📋 希望 Agent 输出</text>
				</view>
				<form-checkbox-group v-model="selectedOutputOptions" :options="outputOptions" @change="persistPreferences" />
			</view>

			<view class="prompt-section">
				<view class="section-title inline-title">
					<text>✨ 生成的提示词</text>
					<button class="reset-button" @click="resetPreferences">恢复默认</button>
				</view>
				<textarea class="prompt-preview" :value="promptText" :disabled="true" auto-height />
				<button class="copy-button" :disabled="!canCopy" @click="copyPrompt">
					<text>📋 复制提示词</text>
				</button>
				<view class="agent-boundary-note">
					<text class="agent-boundary-title">💡 使用方式</text>
					<text class="agent-boundary-copy">本页仅生成可复制提示词，不提供 AI/LLM 后端，也不提供 API Key 或 BYOK 配置；请复制后在你自己的本地 Agent 中运行。</text>
				</view>
			</view>

			<view class="back-section">
				<button class="back-button" @click="returnToMarket">← 返回插件市场</button>
			</view>
		</styled-scroll-view>
	</view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FormCheckboxGroup from '@/components/form-checkbox-group/form-checkbox-group.vue'
import FormSelect from '@/components/form-select/form-select.vue'
import FormToggle from '@/components/form-toggle/form-toggle.vue'
import StyledScrollView from '@/components/styled-scroll-view/styled-scroll-view.vue'
import { useMotionPreferences } from '@/utils/motion.js'
// #ifdef MP-WEIXIN || MP-QQ
import { getStatusBarHeight } from '@/utils/system.js'
// #endif

const DEFAULT_MARKET_ENDPOINT = 'https://bluerosion.vincentzyu233.cn/koishi-market-proxy/market'
const DEFAULT_PROXY_URL = 'http://127.0.0.1:7890'
const STORAGE_PREFIX = 'agent_plugin_'

const docPresets = [
	{
		name: 'GitHub（推荐）',
		url: 'https://raw.githubusercontent.com/VincentZyu233/uniapp-koishi-market/main/doc/agent/plugin-discovery.md',
		description: 'GitHub Raw 主仓库文档'
	},
	{
		name: 'GitLab',
		url: 'https://gitlab.com/VincentZyu233/uniapp-koishi-market/-/raw/main/doc/agent/plugin-discovery.md',
		description: 'GitLab 镜像文档'
	},
	{
		name: 'Codeberg',
		url: 'https://codeberg.org/VincentZyu/uniapp-koishi-market/raw/branch/main/doc/agent/plugin-discovery.md',
		description: 'Codeberg 镜像文档'
	},
	{
		name: '自定义 URL',
		url: '',
		description: '手动填写公开可访问的 Markdown 地址'
	}
]

const marketPresets = [
	{ name: 'Bluerosion FastAPI 代理（推荐）', url: DEFAULT_MARKET_ENDPOINT, description: '自建代理源，适合跨域访问' },
	{ name: 'NyanZone', url: 'https://registry.nyan.zone/k/market/index.json', description: '社区推荐镜像' },
	{ name: '上学聚合源（大陆推荐）', url: 'https://cdn.jsdmirror.com/gh/shangxueink/koishi-registry-aggregator@gh-pages/market.json', description: '聚合市场数据源' },
	{ name: 't4wefan（大陆）', url: 'https://registry.koishi.t4wefan.pub/index.json', description: '大陆镜像源' },
	{ name: 'Koishi 官方（全球）', url: 'https://registry.koishi.chat/index.json', description: '官方市场源' },
	{ name: '自定义 URL', url: '', description: '手动填写市场 JSON 数据源' }
]

const categoryPresets = ['不限', '娱乐互动', '实用工具', '群聊与社区', '管理与运维', 'AI 与大模型', '游戏与积分', '媒体与内容', '跨平台与适配器', '开发与调试']
const outputOptions = [
	{ key: 'list', label: '推荐清单', description: '列出匹配插件、版本、用途和链接' },
	{ key: 'install', label: '安装命令', description: '给出 Koishi 项目的安装与必要配置提示' },
	{ key: 'compare', label: '候选对比表', description: '比较多个候选的能力、维护情况和注意事项' },
	{ key: 'evidence', label: '检索依据与排除理由', description: '说明检索字段、匹配原因和未推荐原因' }
]

const isDarkMode = ref(true)
const themeLabel = computed(() => isDarkMode.value ? '深色模式' : '浅色模式')
const { motionClass } = useMotionPreferences()
const statusBarOffset = ref(0)
const docPresetIndex = ref(0)
const customDocUrl = ref('')
const marketPresetIndex = ref(0)
const customMarketEndpoint = ref('')
const proxyEnabled = ref(false)
const proxyUrl = ref(DEFAULT_PROXY_URL)
const categoryIndex = ref(0)
const requirement = ref('')
const selectedOutputOptions = ref(['list', 'install'])
const openSelectKey = ref('')

const customDocPresetIndex = docPresets.length - 1
const customMarketPresetIndex = marketPresets.length - 1
const docSelectOptions = docPresets.map((preset, index) => ({ value: index, label: preset.name, description: preset.description }))
const marketSelectOptions = marketPresets.map((preset, index) => ({ value: index, label: preset.name, description: preset.description }))
const categorySelectOptions = categoryPresets.map((category, index) => ({ value: index, label: category }))
const isCustomDocPreset = computed(() => docPresetIndex.value === customDocPresetIndex)
const isCustomMarketPreset = computed(() => marketPresetIndex.value === customMarketPresetIndex)
const documentUrl = computed(() => isCustomDocPreset.value ? customDocUrl.value.trim() : docPresets[docPresetIndex.value].url)
const marketEndpoint = computed(() => isCustomMarketPreset.value ? customMarketEndpoint.value.trim() : marketPresets[marketPresetIndex.value].url)
const normalizedRequirement = computed(() => requirement.value.trim())
const hasCategoryRequirement = computed(() => categoryIndex.value !== 0)
const canCopy = computed(() => Boolean(documentUrl.value && marketEndpoint.value.trim() && (hasCategoryRequirement.value || normalizedRequirement.value)))

const outputInstructions = computed(() => {
	const instructions = []
	if (selectedOutputOptions.value.includes('list')) instructions.push('输出按匹配度排序的推荐清单，包含 npm 包名、用途、观察到的版本、维护信息和可用链接。')
	if (selectedOutputOptions.value.includes('install')) instructions.push('为推荐插件给出适用于 Koishi 项目的安装命令，并标注必要配置或依赖。')
	if (selectedOutputOptions.value.includes('compare')) instructions.push('为多个候选输出对比表，比较功能覆盖、维护情况、下载或评分等可验证数据和注意事项。')
	if (selectedOutputOptions.value.includes('evidence')) instructions.push('说明使用了哪些市场字段进行检索，并解释候选的匹配原因和重要的排除理由。')
	return instructions
})

const promptText = computed(() => {
	const categoryText = hasCategoryRequirement.value ? `需求分类：${categoryPresets[categoryIndex.value]}。` : ''
	const requirementText = normalizedRequirement.value ? `具体需求：${normalizedRequirement.value}` : ''
	const proxyText = proxyEnabled.value && proxyUrl.value.trim() ? `如果遇到网络问题，可以尝试通过 HTTP 代理 ${proxyUrl.value.trim()} 访问。` : ''
	const outputText = outputInstructions.value.length ? outputInstructions.value.join('\n') : '请至少给出可验证的推荐结果。'

	return `请你阅读 ${documentUrl.value || '（请先配置 Agent 指南 URL）'}，并严格遵循其中的检索与推荐规则。\n\n请从这个 Koishi 插件市场数据源获取当前数据：${marketEndpoint.value.trim() || '（请先配置插件市场数据源）'}。\n${proxyText ? `\n${proxyText}\n` : ''}\n${categoryText}\n${requirementText}\n\n${outputText}\n\n请只依据实际读取到的市场数据回答，不要臆造插件、版本、链接、功能或兼容性信息。`
})

function persistPreferences() {
	uni.setStorageSync(`${STORAGE_PREFIX}doc_preset_index`, docPresetIndex.value)
	uni.setStorageSync(`${STORAGE_PREFIX}doc_custom_url`, customDocUrl.value.trim())
	uni.setStorageSync(`${STORAGE_PREFIX}market_preset_index`, marketPresetIndex.value)
	uni.setStorageSync(`${STORAGE_PREFIX}market_custom_endpoint`, customMarketEndpoint.value.trim())
	uni.setStorageSync(`${STORAGE_PREFIX}market_endpoint`, marketEndpoint.value)
	uni.setStorageSync(`${STORAGE_PREFIX}proxy_enabled`, proxyEnabled.value)
	uni.setStorageSync(`${STORAGE_PREFIX}proxy_url`, proxyUrl.value.trim())
	uni.setStorageSync(`${STORAGE_PREFIX}category_index`, categoryIndex.value)
	uni.setStorageSync(`${STORAGE_PREFIX}requirement`, requirement.value)
	uni.setStorageSync(`${STORAGE_PREFIX}output_options`, selectedOutputOptions.value)
}

function setProxyEnabled(value) {
	proxyEnabled.value = value
	persistPreferences()
}

function onSelectOpenChange(key, isOpen) {
	openSelectKey.value = isOpen ? key : (openSelectKey.value === key ? '' : openSelectKey.value)
}

function copyUrl(value, label) {
	if (!value) return
	uni.setClipboardData({
		data: value,
		success: () => uni.showToast({ title: `已复制${label}`, icon: 'success' })
	})
}

function copyPrompt() {
	if (!canCopy.value) {
		uni.showToast({ title: '请先填写需求与有效地址', icon: 'none' })
		return
	}

	uni.setClipboardData({
		data: promptText.value,
		success: () => uni.showToast({ title: '提示词已复制', icon: 'success' })
	})
}

function resetPreferences() {
	uni.showModal({
		title: '恢复默认',
		content: '确定要清除本页保存的配置吗？',
		success: (result) => {
			if (!result.confirm) return

			docPresetIndex.value = 0
			customDocUrl.value = ''
			marketPresetIndex.value = 0
			customMarketEndpoint.value = ''
			proxyEnabled.value = false
			proxyUrl.value = DEFAULT_PROXY_URL
			categoryIndex.value = 0
			requirement.value = ''
			selectedOutputOptions.value = ['list', 'install']
			uni.removeStorageSync(`${STORAGE_PREFIX}doc_preset_index`)
			uni.removeStorageSync(`${STORAGE_PREFIX}doc_custom_url`)
			uni.removeStorageSync(`${STORAGE_PREFIX}market_preset_index`)
			uni.removeStorageSync(`${STORAGE_PREFIX}market_custom_endpoint`)
			uni.removeStorageSync(`${STORAGE_PREFIX}market_endpoint`)
			uni.removeStorageSync(`${STORAGE_PREFIX}proxy_enabled`)
			uni.removeStorageSync(`${STORAGE_PREFIX}proxy_url`)
			uni.removeStorageSync(`${STORAGE_PREFIX}category_index`)
			uni.removeStorageSync(`${STORAGE_PREFIX}requirement`)
			uni.removeStorageSync(`${STORAGE_PREFIX}output_options`)
			uni.showToast({ title: '已恢复默认', icon: 'success' })
		}
	})
}

function toggleTheme() {
	isDarkMode.value = !isDarkMode.value
	uni.setStorageSync('theme', isDarkMode.value ? 'dark' : 'light')
}

function returnToMarket() {
	uni.reLaunch({ url: '/pages/index/index' })
}

function openAgentWiki() {
	const url = 'https://en.wikipedia.org/wiki/AI_agent'
	// #ifdef WEB
	window.open(url, '_blank', 'noopener,noreferrer')
	// #endif
	// #ifndef WEB
	uni.setClipboardData({
		data: url,
		success: () => uni.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' })
	})
	// #endif
}

onMounted(() => {
	// #ifdef MP-WEIXIN || MP-QQ
	statusBarOffset.value = getStatusBarHeight() + 10
	// #endif

	const savedTheme = uni.getStorageSync('theme')
	if (savedTheme) isDarkMode.value = savedTheme === 'dark'

	const savedDocPreset = Number(uni.getStorageSync(`${STORAGE_PREFIX}doc_preset_index`))
	if (Number.isInteger(savedDocPreset) && savedDocPreset >= 0 && savedDocPreset < docPresets.length) docPresetIndex.value = savedDocPreset

	const savedCategory = Number(uni.getStorageSync(`${STORAGE_PREFIX}category_index`))
	if (Number.isInteger(savedCategory) && savedCategory >= 0 && savedCategory < categoryPresets.length) categoryIndex.value = savedCategory

	customDocUrl.value = uni.getStorageSync(`${STORAGE_PREFIX}doc_custom_url`) || ''
	const savedMarketEndpoint = uni.getStorageSync(`${STORAGE_PREFIX}market_endpoint`) || DEFAULT_MARKET_ENDPOINT
	const savedMarketPreset = Number(uni.getStorageSync(`${STORAGE_PREFIX}market_preset_index`))
	if (Number.isInteger(savedMarketPreset) && savedMarketPreset >= 0 && savedMarketPreset < marketPresets.length) {
		marketPresetIndex.value = savedMarketPreset
		customMarketEndpoint.value = uni.getStorageSync(`${STORAGE_PREFIX}market_custom_endpoint`) || ''
	} else {
		const matchingMarketPreset = marketPresets.findIndex((preset) => preset.url === savedMarketEndpoint)
		marketPresetIndex.value = matchingMarketPreset >= 0 ? matchingMarketPreset : customMarketPresetIndex
		customMarketEndpoint.value = matchingMarketPreset >= 0 ? '' : savedMarketEndpoint
	}
	proxyEnabled.value = uni.getStorageSync(`${STORAGE_PREFIX}proxy_enabled`) === true
	proxyUrl.value = uni.getStorageSync(`${STORAGE_PREFIX}proxy_url`) || DEFAULT_PROXY_URL
	requirement.value = uni.getStorageSync(`${STORAGE_PREFIX}requirement`) || ''
	const savedOutputOptions = uni.getStorageSync(`${STORAGE_PREFIX}output_options`)
	if (Array.isArray(savedOutputOptions)) selectedOutputOptions.value = savedOutputOptions.filter((key) => outputOptions.some((option) => option.key === key))
})
</script>

<style scoped>
.agent-page {
	width: 100vw;
	height: 100vh;
	box-sizing: border-box;
	padding: 40rpx 48rpx 0;
	background: var(--bg-secondary);
	color: var(--text-primary);
}

.agent-page.dark-mode {
	background: var(--bg-primary);
	color: var(--text-primary);
}

.agent-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	padding: 12rpx 4rpx 32rpx;
}

.header-copy {
	min-width: 0;
	flex: 1;
}

.home-button {
	flex: 0 0 auto;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8rpx;
	min-height: 64rpx;
	padding: 0 16rpx;
	box-sizing: border-box;
	border: 2rpx solid var(--border);
	border-radius: 6rpx;
	background: var(--surface);
	color: var(--text-primary);
	transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.home-button::after {
	border: none;
}

@media (hover: hover) {
	.home-button:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.12);
		transform: translateX(-3rpx);
	}
}

.home-button:active {
	transform: scale(0.94);
}

.home-icon {
	font-size: 34rpx;
	line-height: 1;
}

.home-label {
	font-size: 23rpx;
	font-weight: 600;
}

.header-title,
.header-subtitle,
.url-preview {
	display: block;
}

.header-title {
	font-size: 44rpx;
	font-weight: 700;
	color: var(--text-primary);
}

.agent-wiki-link {
	color: inherit;
	text-decoration: underline;
	text-decoration-color: var(--accent);
	text-decoration-thickness: 3rpx;
	text-underline-offset: 6rpx;
	transition: color 0.18s ease, text-decoration-color 0.18s ease;
}

@media (hover: hover) {
	.agent-wiki-link:hover {
		color: var(--accent);
		text-decoration-color: currentColor;
	}
}

.agent-wiki-link:active {
	color: var(--accent);
}

.header-subtitle {
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: var(--text-secondary);
}

.theme-toggle {
	min-height: 64rpx;
	padding: 0 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	border: 2rpx solid var(--border);
	border-radius: 32rpx;
	background: var(--surface);
	transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.25s ease, box-shadow 0.2s ease;
}

@media (hover: hover) {
	.theme-toggle:hover {
		border-color: var(--accent);
		box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.14);
		transform: translateY(-2rpx);
	}
}

.theme-toggle:active {
	transform: scale(0.97);
}

.theme-icon {
	font-size: 34rpx;
	transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle:hover .theme-icon {
	transform: rotate(180deg) scale(1.1);
}

.theme-toggle:active .theme-icon {
	transform: rotate(180deg) scale(0.92);
}

.theme-label {
	font-size: 22rpx;
	line-height: 1;
	white-space: nowrap;
	color: var(--text-primary);
}

.agent-content {
	height: calc(100vh - 150rpx);
	box-sizing: border-box;
}

.tool-section,
.prompt-section {
	position: relative;
	z-index: 0;
	margin-bottom: 24rpx;
	padding: 28rpx;
	box-sizing: border-box;
	border: 2rpx solid var(--border);
	border-radius: 8rpx;
	background: var(--surface);
	animation: section-enter 0.36s ease both;
}

.tool-section.select-open {
	z-index: 40;
}

.tool-section:nth-child(2) { animation-delay: 0.04s; }
.tool-section:nth-child(3) { animation-delay: 0.08s; }
.tool-section:nth-child(4) { animation-delay: 0.12s; }
.tool-section:nth-child(5) { animation-delay: 0.16s; }
.prompt-section { animation-delay: 0.2s; }

.section-title {
	margin-bottom: 20rpx;
	font-size: 30rpx;
	font-weight: 650;
	color: var(--text-primary);
}

.inline-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
}

.field-hint {
	margin-top: 6rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: var(--text-secondary);
}

.text-input,
.prompt-preview {
	width: 100%;
	box-sizing: border-box;
	border: 2rpx solid var(--border);
	border-radius: 6rpx;
	background: var(--surface-subtle);
	color: var(--text-primary);
	font-size: 25rpx;
	line-height: 1.55;
	font-family: 'LXGWWenKaiMono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
}

.compact-input {
	min-height: 76rpx;
	margin-top: 18rpx;
	padding: 16rpx 20rpx;
}

.requirement-input {
	min-height: 136rpx;
	margin-top: 18rpx;
	padding: 18rpx 20rpx;
}

.url-preview {
	font-family: 'LXGWWenKaiMono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	font-size: 21rpx;
	line-height: 1.45;
	word-break: break-all;
	color: var(--accent);
	min-width: 0;
	flex: 1;
}

.url-display {
	display: flex;
	align-items: flex-start;
	gap: 14rpx;
	margin-top: 14rpx;
	padding: 14rpx 16rpx;
	box-sizing: border-box;
	border: 2rpx solid var(--border);
	border-radius: 6rpx;
	background: var(--surface-subtle);
}

.url-copy-button {
	min-width: 86rpx;
	margin: 0;
	padding: 9rpx 14rpx;
	flex: 0 0 auto;
	border: 2rpx solid var(--border);
	border-radius: 5rpx;
	background: var(--surface);
	color: var(--text-primary);
	font-size: 21rpx;
	line-height: 1.35;
	transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.url-copy-button::after {
	border: none;
}

@media (hover: hover) {
	.url-copy-button:hover:not(:disabled) {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		transform: translateY(-2rpx);
	}
}

.url-copy-button:active:not(:disabled) {
	transform: scale(0.94);
}

.url-copy-button:disabled {
	opacity: 0.45;
}

.prompt-preview {
	min-height: 300rpx;
	padding: 18rpx 20rpx;
	font-family: 'LXGWWenKaiMono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
	font-size: 22rpx;
}

.copy-button,
.back-button,
.reset-button {
	border: none;
	border-radius: 6rpx;
	font-size: 26rpx;
}

.copy-button {
	width: 100%;
	margin-top: 22rpx;
	padding: 24rpx;
	background: var(--accent);
	color: #ffffff;
	transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
}

@media (hover: hover) {
	.copy-button:hover:not(:disabled) {
		box-shadow: 0 10rpx 20rpx rgba(85, 70, 163, 0.3);
		transform: translateY(-2rpx);
	}
}

.copy-button:active:not(:disabled) {
	transform: scale(0.98);
}

.copy-button:disabled {
	opacity: 0.45;
}

.agent-boundary-note {
	margin-top: 20rpx;
	padding-top: 18rpx;
	border-top: 2rpx solid var(--border);
}

.agent-boundary-title,
.agent-boundary-copy {
	display: block;
}

.agent-boundary-title {
	font-size: 22rpx;
	font-weight: 650;
	color: var(--text-primary);
}

.agent-boundary-copy {
	margin-top: 6rpx;
	font-size: 20rpx;
	line-height: 1.55;
	color: var(--text-secondary);
}

.copy-button::after,
.back-button::after,
.reset-button::after {
	border: none;
}

.reset-button {
	margin: 0;
	padding: 8rpx 16rpx;
	background: transparent;
	color: var(--text-secondary);
	border: 2rpx solid var(--border);
	font-size: 22rpx;
	transition: border-color 0.18s ease, color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

@media (hover: hover) {
	.reset-button:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
	}
}

.reset-button:active {
	transform: scale(0.94);
}

.back-section {
	padding: 8rpx 0 48rpx;
}

.back-button {
	width: 100%;
	padding: 22rpx;
	background: var(--surface);
	color: var(--text-primary);
	border: 2rpx solid var(--border);
	transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

@media (hover: hover) {
	.back-button:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
		transform: translateX(-3rpx);
	}
}

.back-button:active {
	transform: scale(0.98);
}

@keyframes section-enter {
	from {
		opacity: 0;
		transform: translateY(16rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (min-width: 900px) {
	.agent-page {
		padding-right: max(48rpx, calc((100vw - 1200rpx) / 2));
		padding-left: max(48rpx, calc((100vw - 1200rpx) / 2));
	}
}

@media (max-width: 560px) {
	.header-title {
		font-size: 38rpx;
	}
}
</style>
