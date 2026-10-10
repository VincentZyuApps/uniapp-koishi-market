<template>
	<view class="market-page" :class="[{ 'dark-mode': isDarkMode }, motionClass]" :style="pageStyle">
		<view class="market-background" :inert="drawerOpen || undefined" :aria-hidden="drawerOpen || undefined">
			<!-- 顶部搜索栏和信息栏 -->
			<view class="top-section">
				<view class="search-row">
					<search-header
						:model-value="searchWords"
						@update:model-value="searchWords = $event"
						@search="handleSearch"
						@clear="handleClearSearch"
					/>
					<!-- 顶部右侧按钮组 -->
					<view class="top-actions">
						<!-- #ifdef WEB -->
						<view class="github-link" @click="openGithub">
							<image
								class="github-icon"
								:src="isDarkMode ? '/static/github-mark-white.png' : '/static/github-mark.png'"
								mode="aspectFit"
							/>
							<text class="top-action-label">GitHub</text>
						</view>
						<!-- #endif -->
						<view class="top-privacy-btn" @click="isPrivacyModalVisible = true">
							<text class="top-privacy-icon">📄</text>
							<text class="top-action-label">隐私</text>
						</view>
						<view class="top-theme-btn" @click="toggleTheme">
							<text class="top-theme-icon">{{ themeEmoji }}</text>
							<text class="top-action-label">{{ themeLabel }}</text>
						</view>
					</view>

				</view>

				<!-- 市场信息 -->
				<view class="market-info" v-if="marketInfo && marketInfo.total">
					<view class="info-tag">
						<text class="info-icon">🌐</text>
						<text class="info-label">当前源:</text>
						<text class="info-value copyable" @click.stop="copyMarketValue(currentSourceUrl, '当前源地址')">{{ currentSourceUrl }}</text>
					</view>
					<view class="info-tag">
						<text class="info-icon">📦</text>
						<text class="info-label">插件总数:</text>
						<text class="info-value copyable" @click.stop="copyMarketValue(String(marketInfo.total), '插件总数')">{{ marketInfo.total }}</text>
					</view>
					<view class="info-tag" v-if="searchWords.length > 0" :class="{ 'search-result': true }">
						<text class="info-icon">🔍</text>
						<text class="info-label">搜索结果:</text>
						<text class="info-value highlight">{{ filteredPlugins.length }}</text>
					</view>
				</view>
			</view>

			<!-- 主体内容区域 -->
			<view class="content">
				<!-- 插件列表 -->
				<view class="plugin-list">
					<!-- 操作按钮 -->
					<view class="result-header">
						<view class="header-actions">
							<!-- 翻页按钮组 -->
							<view class="pagination-actions">
								<button tabindex="0" role="button"
									class="page-nav-btn prev-btn"
									:class="{ disabled: currentPage === 1 }" :disabled="currentPage === 1"
									@click="prevPage"
						>
									<text class="page-nav-icon">←</text>
									<text class="page-nav-text">上一页</text>
								</button>
								<text class="page-status">{{ currentPage }} / {{ totalPages }}</text>
								<button tabindex="0" role="button"
									class="page-nav-btn next-btn"
									:class="{ disabled: currentPage === totalPages }" :disabled="currentPage >= totalPages"
									@click="nextPage"
						>
									<text class="page-nav-text">下一页</text>
									<text class="page-nav-icon">→</text>
								</button>
							</view>

							<!-- 功能按钮组 -->
							<view class="function-actions">
								<button tabindex="0" role="button" class="settings-btn filter-trigger" aria-controls="market-filter-dialog" :aria-expanded="drawerOpen" @click="drawerOpen = true">
									<text class="settings-icon">☰</text><text class="settings-text">筛选</text><text v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</text>
								</button>
								<button tabindex="0" role="button" class="settings-btn" @click="goToAgentPluginSearch" @mouseenter="startIconMotion" @mouseleave="settleIconMotion">
									<text class="settings-icon" data-hover-spin-icon>🤖</text>
									<text class="settings-text">Agent</text>
								</button>
								<button tabindex="0" role="button" class="settings-btn" @click="goToSettings" @mouseenter="startIconMotion" @mouseleave="settleIconMotion">
									<text class="settings-icon" data-hover-spin-icon>⚙️</text>
									<text class="settings-text">设置</text>
								</button>
								<button tabindex="0" role="button" class="refresh-btn" @click="handleRefreshClick" @mouseenter="startRefreshIconMotion" @mouseleave="settleIconMotion" :class="{ loading: isLoading }">
									<text class="refresh-icon" data-hover-spin-icon>{{ isLoading ? '✕' : '🔄' }}</text>
									<text class="refresh-text">{{ isLoading ? '取消' : '刷新' }}</text>
								</button>
							</view>
						</view>
					</view>
					<!-- 加载状态 -->
					<view v-if="isLoading && plugins.length === 0" class="loading-state">
						<view class="loading-spinner"></view>
						<text class="loading-text">正在加载插件数据...</text>
						<view class="loading-actions">
							<view class="loading-action-btn loading-cancel-btn" @click="cancelPluginLoad()">
								<text class="loading-action-icon">✕</text>
								<text>取消加载</text>
							</view>
							<view class="loading-action-btn loading-settings-btn" @click="goToSettings">
								<text class="loading-action-icon">⚙️</text>
								<text>前往设置</text>
							</view>
						</view>
					</view>
					<view v-else-if="loadError && plugins.length === 0" class="load-error-state">
						<text class="load-error-icon">⚠️</text>
						<text class="load-error-title">加载插件数据失败</text>
						<text class="load-error-message">{{ loadError }}</text>
						<view class="load-error-actions">
							<view class="loading-action-btn loading-retry-btn" @click="retryLoad">
								<text>重试</text>
							</view>
							<view class="loading-action-btn loading-default-source-btn" @click="useDefaultSourceAndRetry">
								<text>更换默认源重试</text>
							</view>
						</view>
					</view>

					<!-- 插件卡片列表 -->
					<styled-scroll-view
						id="plugin-scroll-view"
						:scroll-enabled="!drawerOpen"
						@resize="calculatePageSize"
						class="plugin-scroll"
						:scroll-top="scrollTop"
						v-show="!isLoading || plugins.length > 0"
			>
						<view v-if="loadError" class="load-error-banner">
							<text class="load-error-message">加载失败：{{ loadError }}</text>
							<view class="load-error-actions compact">
								<view class="loading-action-btn loading-retry-btn" @click="retryLoad">
									<text>重试</text>
								</view>
								<view class="loading-action-btn loading-default-source-btn" @click="useDefaultSourceAndRetry">
									<text>更换默认源重试</text>
								</view>
							</view>
						</view>
						<view class="plugin-grid">
							<plugin-card
								v-for="plugin in paginatedPlugins"
								:key="plugin.id"
								:plugin="plugin"
								@click="openPlugin"
							/>
						</view>
						<!-- 空状态 -->
						<view v-if="filteredPlugins.length === 0" class="empty-state">
							<text class="empty-icon">📦</text>
							<text class="empty-text">没有找到相关插件</text>
						</view>

						<!-- 分页 -->
						<view v-if="totalPages > 1" class="pagination">
							<view class="pagination-group">
								<button tabindex="0" role="button"
									class="page-btn"
									:class="{ disabled: currentPage === 1 }" :disabled="currentPage === 1"
									@click="prevPage"
								>上一页</button>
								<view class="page-hint">← ↑ PgUp</view>
							</view>
							<view class="page-info">{{ currentPage }} / {{ totalPages }}</view>
							<view class="pagination-group">
								<button tabindex="0" role="button"
									class="page-btn"
									:class="{ disabled: currentPage === totalPages }" :disabled="currentPage >= totalPages"
									@click="nextPage"
								>下一页</button>
								<view class="page-hint">→ ↓ PgDn</view>
							</view>
						</view>
					</styled-scroll-view>
				</view>
			</view>
		</view>
		<market-sidebar
			:open="drawerOpen"
			:market-info="marketInfo"
			:sort-options="sortOptions"
			:active-sort="activeSort"
			:sort-order="sortOrder"
			:badges="badges"
			:active-badges="activeBadges"
			:categories="categories"
			:active-category="activeCategory"
			@close="drawerOpen = false"
			@sort-change="toggleSort"
			@badge-change="toggleBadge"
			@category-change="toggleCategory"
		/>

		<!-- 隐私政策弹窗 -->
		<privacy-modal v-model:visible="isPrivacyModalVisible" />
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, getCurrentInstance } from 'vue'
import { onLoad, onResize, onHide, onShow } from "@dcloudio/uni-app";
import { DEFAULT_MARKET_SEARCH_ENDPOINT, fetchMarketData, getCurrentEndpoint } from '@/utils/request.js'
import { setPlugin } from '@/utils/plugin-store.js'
import PluginCard from '@/components/plugin-card/plugin-card.vue'
import MarketSidebar from '@/components/market-sidebar/market-sidebar.vue'
import SearchHeader from '@/components/search-header/search-header.vue'
import StyledScrollView from '@/components/styled-scroll-view/styled-scroll-view.vue'
import PrivacyModal from '@/components/privacy-modal/privacy-modal.vue'
import { useMotionPreferences } from '@/utils/motion.js'
import { createHoverIconMotion } from '@/utils/hover-icon-motion.js'
import { usePageLayout } from '@/utils/layout.js'

// 小程序状态栏适配
const { pageStyle } = usePageLayout()
const { motionClass, resolvedMotionMode } = useMotionPreferences()
const { start: startIconMotion, settle: settleIconMotion, clear: clearHoverIconMotion } = createHoverIconMotion(resolvedMotionMode)

// 隐私弹窗可见性
const isPrivacyModalVisible = ref(false)

// 搜索相关
const searchWords = ref([])

// 滚动位置
const scrollTop = ref(0)

// 侧边栏状态
const drawerOpen = ref(false)
const pageVisible = ref(true)
const instance = getCurrentInstance()

// 主题模式（默认跟随系统）
const themeMode = ref('system')
let _cleanupSystemTheme = null

const getSystemIsDark = () => {
	// #ifdef WEB
	return window.matchMedia('(prefers-color-scheme: dark)').matches
	// #endif
	// #ifdef MP-WEIXIN || MP-QQ
	return (uni.getSystemInfoSync().theme || 'light') === 'dark'
	// #endif
	return true
}

const _systemChangeKey = ref(0)

const setupSystemThemeListener = () => {
	// #ifdef WEB
	const mq = window.matchMedia('(prefers-color-scheme: dark)')
	const handler = () => { if (themeMode.value === 'system') _systemChangeKey.value++ }
	mq.addEventListener('change', handler)
	_cleanupSystemTheme = () => mq.removeEventListener('change', handler)
	// #endif
	// #ifdef MP-WEIXIN || MP-QQ
	if (uni.onThemeChange) {
		const handler = () => { if (themeMode.value === 'system') _systemChangeKey.value++ }
		uni.onThemeChange(handler)
		_cleanupSystemTheme = () => { if (uni.offThemeChange) uni.offThemeChange(handler) }
	}
	// #endif
}

const isDarkMode = computed(() => {
	void _systemChangeKey.value
	if (themeMode.value === 'dark') return true
	if (themeMode.value === 'light') return false
	return getSystemIsDark()
})

const themeEmoji = computed(() => {
	const map = { system: '🖥️', light: '☀️', dark: '🌙' }
	return map[themeMode.value]
})

const themeLabel = computed(() => {
	const map = { system: '跟随系统', light: '浅色模式', dark: '深色模式' }
	return map[themeMode.value]
})

// 加载状态
const isLoading = ref(false)
const loadError = ref(null)
let activeMarketRequest = null
let loadRequestId = 0

const startRefreshIconMotion = (event) => {
	if (!isLoading.value) startIconMotion(event)
}

watch(isLoading, (loading) => {
	if (loading) clearHoverIconMotion()
})

// 当前使用的源 URL
const currentSourceUrl = computed(() => getCurrentEndpoint())

// 排序相关
const activeSort = ref('default')
const sortOrder = ref('desc')

const sortOptions = [
	{ key: 'default', label: '默认排序', icon: '⭐' },
	{ key: 'download', label: '下载量', icon: '📥' },
	{ key: 'rating', label: '评分', icon: '❤️' },
	{ key: 'updated', label: '更新时间', icon: '🕐' },
	{ key: 'created', label: '发布时间', icon: '📅' }
]

// 筛选徽章
const activeBadges = ref([])
const badges = ref([
	{ key: 'verified', label: '官方认证', icon: '✓', count: 0 },
	{ key: 'preview', label: '预览版本', icon: '👁', count: 0 },
	{ key: 'insecure', label: '不安全', icon: '⚠', count: 0 },
	{ key: 'portable', label: '便携版本', icon: '📦', count: 0 },
	{ key: 'newborn', label: '新发布', icon: '🎉', count: 0 }
])

// 分类
const activeCategory = ref('')
const categories = ref([
	{ key: 'adapter', label: '适配器', icon: '🔌', count: 0 },
	{ key: 'extension', label: '扩展功能', icon: '🧩', count: 0 },
	{ key: 'tool', label: '实用工具', icon: '🔧', count: 0 },
	{ key: 'game', label: '娱乐玩法', icon: '🎮', count: 0 },
	{ key: 'image', label: '图片服务', icon: '🖼', count: 0 },
	{ key: 'manage', label: '管理工具', icon: '⚙️', count: 0 },
	{ key: 'general', label: '通用功能', icon: '📦', count: 0 },
	{ key: 'other', label: '其他', icon: '📋', count: 0 }
])

// 插件数据
const plugins = ref([])
const marketInfo = ref({})
const currentPage = ref(1)
const pageSize = ref(5) // 初始值，将根据视口高度动态调整
const gridColumns = ref(1) // 当前 grid 列数

// 计算属性
const filteredPlugins = computed(() => {
	let result = plugins.value
	
	// 按搜索词筛选
	if (searchWords.value.length > 0) {
		result = result.filter(plugin => {
			return searchWords.value.every(word => {
				const lowerWord = word.toLowerCase()
				const name = (plugin.name || plugin.shortname || '').toLowerCase()
				
				// 处理可能是对象的 description
				let description = plugin.description || ''
				if (typeof description === 'object') {
					description = description['zh-CN'] || description['zh'] || description['en'] || ''
				}
				description = String(description).toLowerCase()
				
				const packageName = (plugin.package?.name || '').toLowerCase()
				const author = (plugin.author || plugin.package?.publisher?.username || '').toLowerCase()
				
				return name.includes(lowerWord) ||
					   description.includes(lowerWord) ||
					   packageName.includes(lowerWord) ||
					   author.includes(lowerWord)
			})
		})
	}
	
	// 按分类筛选
	if (activeCategory.value) {
		result = result.filter(plugin => plugin.category === activeCategory.value)
	}
	
	// 按徽章筛选
	if (activeBadges.value.length > 0) {
		result = result.filter(plugin => {
			return activeBadges.value.every(badge => plugin[badge])
		})
	}
	
	// 排序
	result = [...result].sort((a, b) => {
		let aVal, bVal
		switch (activeSort.value) {
			case 'download':
				aVal = a.downloads || 0
				bVal = b.downloads || 0
				break
			case 'rating':
				aVal = a.rating || 0
				bVal = b.rating || 0
				break
			case 'updated':
				aVal = new Date(a.updatedAt || 0).getTime()
				bVal = new Date(b.updatedAt || 0).getTime()
				break
			case 'created':
				aVal = new Date(a.createdAt || 0).getTime()
				bVal = new Date(b.createdAt || 0).getTime()
				break
			default:
				return 0
		}
		return sortOrder.value === 'desc' ? bVal - aVal : aVal - bVal
	})
	
	return result
})

const totalPages = computed(() => {
	return Math.max(1, Math.ceil(filteredPlugins.value.length / pageSize.value))
})

const paginatedPlugins = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value
	const end = start + pageSize.value
	return filteredPlugins.value.slice(start, end)
})

// 方法
const activeFilterCount = computed(() => activeBadges.value.length + (activeCategory.value ? 1 : 0))
watch(totalPages, (pages) => { currentPage.value = Math.min(currentPage.value, pages) })
onHide(() => {
	drawerOpen.value = false
	pageVisible.value = false
})

const toggleTheme = () => {
	const modes = ['system', 'light', 'dark']
	const idx = modes.indexOf(themeMode.value)
	themeMode.value = modes[(idx + 1) % 3]
	uni.setStorageSync('theme', themeMode.value)
}

const resetScrollTop = () => {
	nextTick(() => {
		scrollTop.value = Math.random()
	})
}

const handleSearch = (word) => {
	currentPage.value = 1
	resetScrollTop()
}

const handleClearSearch = () => {
	currentPage.value = 1
	resetScrollTop()
}

const toggleSort = (key) => {
	if (activeSort.value === key) {
		sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
	} else {
		activeSort.value = key
		sortOrder.value = 'desc'
	}
	currentPage.value = 1
	resetScrollTop()
}

const toggleBadge = (key) => {
	const index = activeBadges.value.indexOf(key)
	if (index > -1) {
		activeBadges.value.splice(index, 1)
	} else {
		activeBadges.value.push(key)
	}
	currentPage.value = 1
	resetScrollTop()
}

const toggleCategory = (key) => {
	if (activeCategory.value === key) {
		activeCategory.value = ''
	} else {
		activeCategory.value = key
	}
	currentPage.value = 1
	resetScrollTop()
}

const openPlugin = (plugin) => {
	const name = plugin.package?.name || plugin.name || plugin.shortname
	setPlugin(name, plugin)
	uni.navigateTo({
		url: `/pages/plugin-detail/plugin-detail?name=${encodeURIComponent(name)}`
	})
}

const goToSettings = () => {
	cancelPluginLoad(false)
	uni.navigateTo({
		url: '/pages/settings/settings'
	})
}

const goToAgentPluginSearch = () => {
	cancelPluginLoad(false)
	uni.navigateTo({
		url: '/pages/agent-plugin-search/agent-plugin-search'
	})
}

const openGithub = () => {
	// #ifdef H5
	window.open('https://github.com/VincentZyu233/uniapp-koishi-market', '_blank')
	// #endif
	
	// #ifndef H5
	uni.setClipboardData({
		data: 'https://github.com/VincentZyu233/uniapp-koishi-market',
		success: () => {
			uni.showToast({
				title: 'GitHub 链接已复制',
				icon: 'success'
			})
		}
	})
	// #endif
}

const prevPage = () => {
	if (currentPage.value > 1) {
		currentPage.value--
		resetScrollTop()
	}
}

const nextPage = () => {
	if (currentPage.value < totalPages.value) {
		currentPage.value++
		resetScrollTop()
	}
}

// 键盘快捷键处理
const handleKeyDown = (e) => {
	if (!pageVisible.value || drawerOpen.value || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
	if ((e.key === 'Enter' || e.key === ' ') && e.target?.tagName === 'UNI-BUTTON') {
		e.preventDefault()
		if (!e.target.hasAttribute('disabled')) e.target.click()
		return
	}
	if (e.target?.closest?.('input, textarea, select, button, uni-button, [contenteditable], [role="dialog"]')) return
	// 右箭头、下箭头、PageDown - 下一页
	if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
		e.preventDefault()
		nextPage()
	}
	// 左箭头、上箭头、PageUp - 上一页
	else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
		e.preventDefault()
		prevPage()
	}
}

// 加载插件数据
const loadPlugins = async () => {
	if (isLoading.value) return

	const requestId = ++loadRequestId
	isLoading.value = true
	loadError.value = null

	try {
		console.log('开始加载 Koishi 插件市场数据...')
		
		activeMarketRequest = fetchMarketData({
			isConsoleOutput: true,
			isShowToast: false
		})
		const data = await activeMarketRequest

		if (requestId !== loadRequestId) return
		
		console.log('数据加载成功:', data)
		
		// 设置插件列表
		plugins.value = data.plugins || []
		
		// 调试：打印第一个插件的完整数据结构
		if (plugins.value.length > 0) {
			console.log('=== 第一个插件的数据结构 ===')
			console.log(JSON.stringify(plugins.value[0], null, 2))
			console.log('===========================')
		}
		
		// 保存市场信息
		marketInfo.value = {
			forceTime: data.forceTime,
			mirror: data.mirror,
			total: data.total
		}
		
		// 更新统计数据
		updateCounts(data)
		
		console.log(`成功加载 ${plugins.value.length} 个插件`)
		
	} catch (error) {
		if (requestId !== loadRequestId || error?.name === 'AbortError') return

		console.error('加载插件数据失败:', error)
		loadError.value = error.message || '加载失败'
		
	} finally {
		if (requestId === loadRequestId) {
			activeMarketRequest = null
			isLoading.value = false
		}
	}
}

const copyMarketValue = (value, label) => {
	if (!value) return
	uni.setClipboardData({
		data: String(value),
		success: () => uni.showToast({ title: `已复制${label}`, icon: 'success' }),
		fail: () => uni.showToast({ title: `复制${label}失败`, icon: 'none' })
	})
}

function cancelPluginLoad(showFeedback = true) {
	if (!isLoading.value || !activeMarketRequest) return

	const request = activeMarketRequest
	activeMarketRequest = null
	loadRequestId++
	isLoading.value = false
	loadError.value = null
	request.abort?.()

	if (showFeedback) {
		uni.showToast({
			title: '已取消加载',
			icon: 'none',
			duration: 1200
		})
	}
}

function retryLoad() {
	loadPlugins()
}

function useDefaultSourceAndRetry() {
	cancelPluginLoad(false)
	uni.setStorageSync('market_preset_index', 0)
	uni.setStorageSync('market_endpoint', DEFAULT_MARKET_SEARCH_ENDPOINT)
	loadError.value = null
	loadPlugins()
}

const updateCounts = (data) => {
	// 更新徽章计数（从返回的数据中获取）
	if (data.badges) {
		badges.value.forEach(badge => {
			badge.count = data.badges[badge.key] || 0
		})
	}
	
	// 更新分类计数（从返回的数据中获取）
	if (data.categories) {
		categories.value.forEach(category => {
			category.count = data.categories[category.key] || 0
		})
	}
	
	// 如果没有返回统计数据，则手动计算
	if (!data.badges || !data.categories) {
		badges.value.forEach(badge => {
			badge.count = plugins.value.filter(p => p[badge.key]).length
		})
		
		categories.value.forEach(category => {
			category.count = plugins.value.filter(p => p.category === category.key).length
		})
	}
}

// 刷新数据
const handleRefreshClick = () => {
	if (isLoading.value) {
		cancelPluginLoad()
		return
	}

	loadPlugins()
}

// 动态计算每页显示的插件数量
const calculatePageSize = () => {
	nextTick(() => {
		uni.createSelectorQuery().in(instance.proxy).select('.plugin-grid').boundingClientRect((rect) => {
			if (!rect?.width) return
			const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
			const columns = info.windowWidth <= 600 ? 1 : Math.max(1, Math.min(9, Math.floor((rect.width + 12) / 292)))
			const firstItem = (currentPage.value - 1) * pageSize.value
			gridColumns.value = columns
			pageSize.value = columns * 5
			currentPage.value = Math.min(totalPages.value, Math.floor(firstItem / pageSize.value) + 1)
		}).exec()
	})
}

onResize(calculatePageSize)
onShow(() => {
	pageVisible.value = true
	calculatePageSize()
})

onMounted(() => {
	
	// 从本地存储加载主题设置
	const savedTheme = uni.getStorageSync('theme')
	if (['system', 'light', 'dark'].includes(savedTheme)) {
		themeMode.value = savedTheme
	}
	
	// 计算每页显示数量
	calculatePageSize()

	// #ifdef WEB
	
	
	// 添加键盘事件监听
	window.addEventListener('keydown', handleKeyDown)

	// #endif
	
	// 系统主题变化监听（全平台）
	setupSystemThemeListener()
	
	loadPlugins()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
	cancelPluginLoad(false)
	clearHoverIconMotion()
	// #ifdef WEB
	window.removeEventListener('keydown', handleKeyDown)
	// #endif
	_cleanupSystemTheme?.()
})

onLoad(()=>{
	// #ifdef MP-QQ
	console.log("qq小程序的神秘要求捏");
	console.log("set qq.showShareMenu in index.vue");
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

// QQ小程序分享给好友
function onShareAppMessage() {
	return {
		title: 'Koishi 插件市场 - 浏览和搜索 Koishi 机器人插件',
		path: '/pages/index/index',
		imageUrl: '/static/koishi_market_mp.png'  // 分享图片
	}
}

// QQ小程序分享到朋友圈/QQ空间
function onShareTimeline() {
	return {
		title: 'Koishi 插件市场',
		query: ''
	}
}
	
</script>

<style scoped>
/* 顶部右侧按钮组 */
.top-actions {
	position: fixed;
	top: 20rpx;
	right: 20rpx;
	display: flex;
	align-items: center;
	gap: 16rpx;
	z-index: 999;
}

.github-link {
	min-height: 60rpx;
	padding: 3rpx 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	background: rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(10rpx) saturate(180%);
	-webkit-backdrop-filter: blur(10rpx) saturate(180%);
	border: 2rpx solid rgba(255, 255, 255, 0.1);
	border-radius: 32rpx;
	cursor: pointer;
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
}

.github-link::before {
	content: '';
	position: absolute;
	width: 100%;
	height: 100%;
	background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
	opacity: 0;
	transition: opacity 0.3s ease;
}

.github-link:hover::before {
	opacity: 1;
}

.github-link:hover {
	transform: translateY(-3rpx);
	background: rgba(255, 255, 255, 0.2);
	border-color: rgba(255, 255, 255, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(255, 255, 255, 0.2);
}

.github-link:active {
	transform: scale(0.97);
}

.github-icon {
	width: 40rpx;
	height: 40rpx;
	transition: transform 0.3s ease;
}

.github-link:hover .github-icon {
	animation: market-github-icon-spin 0.6s ease;
}

@keyframes market-github-icon-spin {
	from { transform: rotate(0) scale(1); }
	60% { transform: rotate(300deg) scale(1.12); }
	to { transform: rotate(360deg) scale(1); }
}

/* 顶部隐私与主题按钮 */
.top-privacy-btn,
.top-theme-btn {
	min-height: 60rpx;
	padding: 3rpx 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	background: rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(10rpx) saturate(180%);
	-webkit-backdrop-filter: blur(10rpx) saturate(180%);
	border: 2rpx solid rgba(255, 255, 255, 0.1);
	border-radius: 32rpx;
	cursor: pointer;
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
}

.top-privacy-btn:hover,
.top-theme-btn:hover {
	transform: translateY(-3rpx);
	background: rgba(255, 255, 255, 0.2);
	border-color: rgba(255, 255, 255, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(255, 255, 255, 0.2);
}

.top-privacy-btn:active,
.top-theme-btn:active {
	transform: scale(1.05);
}

.top-privacy-icon {
	font-size: 28rpx;
	line-height: 1;
}

.top-theme-btn::before {
	content: '';
	position: absolute;
	width: 100%;
	height: 100%;
	background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
	opacity: 0;
	transition: opacity 0.3s ease;
}

.top-theme-btn:hover::before {
	opacity: 1;
}

.top-theme-btn:hover {
	transform: translateY(-3rpx);
	background: rgba(255, 255, 255, 0.2);
	border-color: rgba(255, 255, 255, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(255, 255, 255, 0.2);
}

.top-theme-btn:active {
	transform: scale(1.05);
}

.top-theme-icon {
	font-size: 32rpx;
	transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-theme-btn:hover .top-theme-icon {
	transform: rotate(180deg) scale(1.1);
}

.top-theme-btn:active .top-theme-icon {
	transform: rotate(180deg) scale(0.92);
}

.top-action-label {
	position: relative;
	z-index: 1;
	font-size: 22rpx;
	line-height: 1;
	white-space: nowrap;
	color: var(--text-primary);
}

/* CSS变量 - 浅色模式 */
.market-page {
	width: 100vw;
	height: 100vh;
	display: flex;
	flex-direction: column;
	
	background-color: var(--bg-primary);
	color: var(--text-primary);
	transition: background-color 0.3s, color 0.3s;
}

/* 顶部区域 */
.top-section {
	background: rgba(13, 17, 23, 0.08);
	backdrop-filter: blur(10rpx) saturate(180%);
	-webkit-backdrop-filter: blur(10rpx) saturate(180%);
	border-bottom: 1rpx solid rgba(48, 54, 61, 0.08);
}

/* 市场信息 */
.market-info {
	display: flex;
	gap: 9rpx;
	padding: 9rpx 50rpx;
	flex-wrap: wrap;
	align-items: center;
}

.info-tag {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 9rpx 13rpx;
	background-color: rgba(22, 27, 34, 0.15);
	border: 2rpx solid rgba(48, 54, 61, 0.15);
	border-radius: 20rpx;
	font-size: 24rpx;
	white-space: nowrap;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: default;
}

.info-tag:hover {
	transform: translateY(-2rpx);
	background-color: rgba(22, 27, 34, 0.25);
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.info-icon {
	font-size: 28rpx;
	transition: transform 0.3s ease;
}

.info-tag:hover .info-icon {
	transform: scale(1.2);
}

.info-label {
	flex-shrink: 0;
	white-space: nowrap;
	color: var(--text-tertiary);
	font-weight: 500;
}

.info-value {
	color: var(--primary-color);
	font-weight: 600;
}

.info-value.copyable {
	cursor: pointer;
	text-decoration: underline;
	text-decoration-color: transparent;
	text-underline-offset: 5rpx;
	transition: color 0.18s ease, text-decoration-color 0.18s ease, transform 0.18s ease;
}

@media (hover: hover) {
	.info-value.copyable:hover {
		color: var(--accent);
		text-decoration-color: currentColor;
		transform: translateY(-1rpx);
	}
}

.info-value.copyable:active {
	transform: scale(0.96);
}

.info-tag:first-child .info-value {
	font-size: 20rpx;
	max-width: min(400rpx, calc(100vw - 600rpx));
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 响应式调整当前源 URL 显示宽度 */
@media (min-width: 1200px) {
	.info-tag:first-child .info-value {
		max-width: min(800rpx, calc(100vw - 800rpx));
	}
}

@media (min-width: 1600px) {
	.info-tag:first-child .info-value {
		max-width: min(1200rpx, calc(100vw - 1000rpx));
	}
}

@media (min-width: 2000px) {
	.info-tag:first-child .info-value {
		max-width: 1600rpx;
	}
}

/* 搜索结果高亮 */
.info-tag.search-result {
	animation: fadeIn 0.3s ease;
}

.info-value.highlight {
	color: #667eea;
	font-weight: 700;
	font-size: 32rpx;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateX(-10rpx);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

/* 黑暗模式下的玻璃效果 */
.market-page.dark-mode .result-header {
	/* 黑暗模式已经在 .result-header 中默认设置 */
}

/* 浅色模式下的玻璃效果覆盖 */
.market-page:not(.dark-mode) .result-header {
	background: rgba(255, 255, 255, 0.12);
	border-bottom-color: rgba(208, 215, 222, 0.08);
}

.market-page:not(.dark-mode) .top-section {
	background: rgba(255, 255, 255, 0.12);
	border-bottom-color: rgba(208, 215, 222, 0.08);
}

.market-page:not(.dark-mode) .info-tag {
	background-color: rgba(248, 248, 249, 0.2);
	border-color: rgba(208, 215, 222, 0.15);
}

/* 黑暗模式下的按钮玻璃效果 */
.market-page.dark-mode .settings-btn,
.market-page.dark-mode .theme-toggle-btn {
	background-color: rgba(22, 27, 34, 0.3);
	border-color: rgba(48, 54, 61, 0.3);
}

.market-page.dark-mode .refresh-btn {
	background-color: rgba(124, 107, 206, 0.6);
}

/* 搜索区域包装 */
::v-deep .search-header {
	padding: 9.9rpx 60rpx 0;
	background: transparent;
}

/* 主体内容 */
.content {
	flex: 1;
	display: flex;
	overflow: hidden;
	position: relative;
}

/* 插件列表 */
.plugin-list {
	flex: 1;
	display: flex;
	flex-direction: column;
	background-color: var(--bg-primary);
	transition: all 0.3s;
	overflow: hidden;
	min-width: 0;
	position: relative;
}

.result-header {
	padding: 8rpx 30rpx;
	/* 半透明玻璃效果 */
	background: rgba(13, 17, 23, 0.08);
	backdrop-filter: blur(10rpx) saturate(180%);
	-webkit-backdrop-filter: blur(10rpx) saturate(180%);
	border-bottom: 1rpx solid rgba(48, 54, 61, 0.08);
	display: flex;
	justify-content: center;
	align-items: center;
	flex-shrink: 0;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	z-index: 10;
}

.header-actions {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	align-items: center;
	width: 100%;
}

/* 翻页按钮组 */
.pagination-actions {
	display: flex;
	gap: 8rpx;
	width: 100%;
	justify-content: center;
}

.page-nav-btn {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 8rpx 20rpx;
	background-color: rgba(124, 107, 206, 0.15);
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
	color: var(--text-primary);
	border: 2rpx solid rgba(124, 107, 206, 0.3);
	border-radius: 20rpx;
	font-size: 24rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	font-weight: 500;
	position: relative;
	overflow: hidden;
}

/* 按钮波纹效果 */
.page-nav-btn::after {
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

.page-nav-btn:active::after {
	width: 300rpx;
	height: 300rpx;
}

.page-nav-btn:hover:not(.disabled) {
	background-color: var(--primary-color);
	color: #fff;
	border-color: var(--primary-color);
	transform: translateY(-4rpx) scale(1.02);
	box-shadow: 0 8rpx 20rpx rgba(124, 107, 206, 0.3);
}

.page-nav-btn:active:not(.disabled) {
	transform: translateY(0) scale(0.98);
}

.page-nav-btn.disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.page-nav-icon {
	font-size: 28rpx;
	font-weight: bold;
	transition: transform 0.3s ease;
}

.page-nav-btn:hover:not(.disabled) .page-nav-icon {
	animation: arrowBounce 0.6s ease infinite;
}

.prev-btn:hover:not(.disabled) .page-nav-icon {
	animation: arrowBounceLeft 0.6s ease infinite;
}

@keyframes arrowBounce {
	0%, 100% { transform: translateX(0); }
	50% { transform: translateX(6rpx); }
}

@keyframes arrowBounceLeft {
	0%, 100% { transform: translateX(0); }
	50% { transform: translateX(-6rpx); }
}

.page-nav-text {
	white-space: nowrap;
}

/* 功能按钮组 */
.function-actions {
	display: flex;
	gap: 8rpx;
	width: 100%;
	justify-content: center;
}

.settings-btn {
	display: flex;
	align-items: center;
	padding: 8rpx 20rpx;
	background-color: rgba(248, 248, 249, 0.2);
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
	color: var(--text-primary);
	border: 2rpx solid rgba(208, 215, 222, 0.3);
	border-radius: 20rpx;
	font-size: 24rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	font-weight: 500;
}

.settings-btn:hover {
	background-color: var(--primary-color);
	color: #fff;
	border-color: var(--primary-color);
	transform: translateY(-4rpx) scale(1.02);
	box-shadow: 0 8rpx 20rpx rgba(85, 70, 163, 0.25);
}

.settings-btn:active {
	transform: translateY(0) scale(0.98);
}

.settings-icon {
	margin-right: 8rpx;
	font-size: 28rpx;
	will-change: transform;
}

.settings-text {
	white-space: nowrap;
}

.refresh-btn {
	display: flex;
	align-items: center;
	padding: 8rpx 20rpx;
	background-color: rgba(64, 158, 255, 0.5);
	backdrop-filter: blur(10rpx);
	-webkit-backdrop-filter: blur(10rpx);
	color: #fff;
	border-radius: 20rpx;
	font-size: 24rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
}

.refresh-btn:hover {
	background-color: rgba(64, 158, 255, 0.8);
	transform: translateY(-4rpx) scale(1.02);
	box-shadow: 0 8rpx 20rpx rgba(64, 158, 255, 0.35);
}

.refresh-btn:active {
	transform: translateY(0) scale(0.98);
}

.refresh-btn.loading {
	background-color: rgba(248, 81, 73, 0.72);
	opacity: 1;
}

.market-page:not(.dark-mode) {
	--scrollbar-track: rgba(85, 70, 163, 0.14);
	--scrollbar-thumb: #6d5bd0;
	--scrollbar-shadow: rgba(85, 70, 163, 0.3);
}

.refresh-btn.loading:hover {
	background-color: rgba(248, 81, 73, 0.9);
	box-shadow: 0 8rpx 20rpx rgba(248, 81, 73, 0.3);
}

.refresh-icon {
	margin-right: 8rpx;
	display: inline-block;
	will-change: transform;
}

.refresh-btn.loading .refresh-icon {
	transform: none !important;
}

.refresh-text {
	white-space: nowrap;
}

/* 加载状态 */
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 20rpx;
	flex: 1;
	animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
	from { opacity: 0; transform: translateY(20rpx); }
	to { opacity: 1; transform: translateY(0); }
}

.loading-spinner {
	width: 60rpx;
	height: 60rpx;
	border: 4rpx solid #e8e8e8;
	border-top-color: #409eff;
	border-radius: 50%;
	animation: spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
	margin-bottom: 20rpx;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.loading-text {
	font-size: 28rpx;
	color: var(--text-tertiary);
	animation: pulse 1.5s ease infinite;
}

.loading-actions {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	margin-top: 32rpx;
	width: 100%;
	max-width: 560rpx;
}

.load-error-state {
	display: flex;
	flex: 1;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 20rpx;
	animation: fadeIn 0.3s ease;
}

.load-error-icon {
	font-size: 64rpx;
	margin-bottom: 20rpx;
}

.load-error-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.load-error-message {
	margin-top: 12rpx;
	font-size: 24rpx;
	color: var(--text-secondary);
	text-align: center;
	word-break: break-all;
}

.load-error-actions {
	display: flex;
	gap: 16rpx;
	width: 100%;
	max-width: 560rpx;
	margin-top: 32rpx;
}

.load-error-banner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin-bottom: 24rpx;
	padding: 20rpx 24rpx;
	background-color: rgba(248, 81, 73, 0.1);
	border: 2rpx solid rgba(248, 81, 73, 0.45);
	border-radius: 8rpx;
}

.load-error-banner .load-error-message {
	margin: 0;
	flex: 1;
	min-width: 0;
	text-align: left;
}

.load-error-actions.compact {
	width: auto;
	margin-top: 0;
	flex-shrink: 0;
}

.loading-action-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	min-width: 0;
	min-height: 72rpx;
	padding: 12rpx 20rpx;
	border: 2rpx solid var(--border-color);
	border-radius: 16rpx;
	font-size: 24rpx;
	font-weight: 500;
	cursor: pointer;
	box-sizing: border-box;
	transition: background-color 0.2s ease, border-color 0.2s ease;
}

.loading-action-icon {
	margin-right: 8rpx;
}

.loading-cancel-btn {
	color: #fff;
	background-color: rgba(248, 81, 73, 0.78);
	border-color: rgba(248, 81, 73, 0.9);
}

.loading-cancel-btn:hover {
	background-color: rgba(248, 81, 73, 0.95);
}

.loading-settings-btn {
	color: var(--text-primary);
	background-color: var(--bg-secondary);
}

.loading-settings-btn:hover {
	border-color: var(--primary-color);
	color: var(--primary-color);
}

.loading-retry-btn {
	color: #fff;
	background-color: var(--primary-color);
	border-color: var(--primary-color);
}

.loading-default-source-btn {
	color: var(--text-primary);
	background-color: var(--bg-secondary);
}

.loading-default-source-btn:hover {
	border-color: var(--primary-color);
	color: var(--primary-color);
}

@keyframes loadingPulse {
	0%, 100% { opacity: 0.6; }
	50% { opacity: 1; }
}

.plugin-scroll {
	flex: 1;
	padding: 100rpx 30rpx 30rpx 30rpx;
	overflow-x: hidden;
	width: 100%;
	box-sizing: border-box;
}

.plugin-grid {
	display: grid;
	grid-template-columns: repeat(v-bind(gridColumns), 336px);
	gap: 24rpx;
	width: 100%;
	justify-content: center;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 20rpx;
	animation: fadeIn 0.5s ease;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 20rpx;
	animation: float 3s ease-in-out infinite;
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-16rpx); }
}

.empty-text {
	font-size: 28rpx;
	color: var(--text-tertiary);
}

/* 分页 */
.pagination {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 48rpx 30rpx;
	gap: 16rpx;
	background-color: var(--bg-primary);
}

.pagination-group {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.page-btn {
	min-width: 80rpx;
	height: 64rpx;
	padding: 0 24rpx;
	background-color: var(--bg-secondary);
	color: var(--text-primary);
	border: 2rpx solid var(--border-color);
	border-radius: 8rpx;
	font-size: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
}

.page-btn::after {
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

.page-btn:active::after {
	width: 200rpx;
	height: 200rpx;
}

.page-btn:hover:not(.disabled) {
	background-color: var(--primary-color);
	color: white;
	border-color: var(--primary-color);
	transform: translateY(-4rpx);
	box-shadow: 0 6rpx 16rpx rgba(85, 70, 163, 0.25);
}

.page-btn:active:not(.disabled) {
	transform: translateY(0);
}

.page-btn.disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.page-hint {
	font-size: 20rpx;
	color: var(--text-tertiary);
	opacity: 0.6;
	font-weight: 400;
	letter-spacing: 1rpx;
}

.page-info {
	font-size: 28rpx;
	color: var(--text-secondary);
	font-weight: 500;
}

.market-page {
	width: 100%;
	height: 100vh;
	height: 100dvh;
	box-sizing: border-box;
	overflow: hidden;
	padding-bottom: max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px));
}
.market-background {
	flex: 1;
	min-height: 0;
	min-width: 0;
	display: flex;
	flex-direction: column;
}
.top-section {
	flex-shrink: 0;
	background: var(--bg-primary);
	border-bottom: 1px solid var(--border);
}
.search-row {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 8px 16px 0;
}
.search-row :deep(.search-header) {
	flex: 1;
	min-width: 0;
	padding: 0;
}
.top-actions {
	position: static;
	flex: 0 0 auto;
	gap: 6px;
	z-index: auto;
}
.github-link, .top-theme-btn {
	min-height: 36px;
	padding: 0 10px;
	gap: 6px;
	box-sizing: border-box;
	border-radius: 8px;
}
.github-icon {
	width: 20px;
	height: 20px;
}
.top-theme-icon {
	font-size: 20px;
}
.top-action-label {
	font-size: var(--font-caption);
}
.market-info {
	padding: 6px 16px 8px;
	gap: 6px;
	min-width: 0;
}
.info-tag {
	min-width: 0;
	max-width: 100%;
	box-sizing: border-box;
	padding: 2px 6px;
	gap: 6px;
	font-size: var(--font-caption);
	border-radius: 8px;
}
.info-tag:first-child {
	max-width: min(100%, 360px);
}
.info-value {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}
.info-icon {
	flex-shrink: 0;
	font-size: 16px;
}
.content, .plugin-list {
	min-height: 0;
	min-width: 0;
}
.result-header {
	position: relative;
	inset: auto;
	padding: 6px 16px;
	background: var(--surface);
	border-bottom: 1px solid var(--border);
	z-index: 2;
	box-sizing: border-box;
}
.header-actions {
	flex-direction: row;
	justify-content: space-between;
	gap: 10px;
}
.function-actions {
	order: 0;
	width: auto;
	gap: 6px;
}
.pagination-actions {
	order: 1;
	width: auto;
	align-items: center;
	gap: 6px;
}
.page-status {
	flex-shrink: 0;
	font-size: var(--font-caption);
	font-variant-numeric: tabular-nums;
	text-align: center;
}
.settings-btn, .refresh-btn, .page-nav-btn, .page-btn {
	min-height: 36px;
	height: auto;
	min-width: 0;
	margin: 0;
	padding: 6px 10px;
	gap: 6px;
	border-radius: 8px;
	font-family: inherit;
	font-size: var(--font-caption);
	line-height: 1.5;
	box-sizing: border-box;
	justify-content: center;
	white-space: normal;
}
.settings-btn::after, .refresh-btn::after, .page-nav-btn::after, .page-btn::after {
	border: none;
}
.settings-icon, .refresh-icon, .page-nav-icon {
	font-size: 16px;
}
.settings-text, .refresh-text, .page-nav-text {
	font-size: var(--font-caption);
}
.filter-count {
	min-width: 16px;
	text-align: center;
	font-size: var(--font-caption);
	color: var(--accent);
}
.plugin-scroll {
	flex: 1;
	min-height: 0;
	height: 0;
	padding: 0;
	--scroll-padding: 12px 16px;
}
.plugin-grid {
	grid-template-columns: repeat(v-bind(gridColumns), minmax(0, 1fr));
	gap: 12px;
}
.pagination {
	flex-wrap: wrap;
	padding: 12px 0 2px;
	gap: 8px;
}
.page-info {
	font-size: var(--font-caption);
}
.page-hint {
	font-size: 12px;
}
.loading-state, .load-error-state {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}
.loading-text, .load-error-title, .load-error-message, .empty-text {
	font-size: var(--font-body);
	overflow-wrap: anywhere;
}
.loading-actions, .load-error-actions {
	flex-wrap: wrap;
}
.loading-action-btn {
	min-height: 36px;
	box-sizing: border-box;
	font-size: var(--font-caption);
}
.settings-btn:focus-visible,
.refresh-btn:focus-visible,
.page-nav-btn:focus-visible,
.page-btn:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}
@media (max-width: 900px) {
.header-actions {
	flex-direction: column;
	gap: 6px;
}
.function-actions {
	width: 100%;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
}
.pagination-actions {
	width: 100%;
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
}
}
@media (max-width: 600px) {
.search-row {
	flex-wrap: wrap;
	padding: 8px 12px 0;
	gap: 6px;
}
.search-row :deep(.search-header) {
	flex-basis: 100%;
}
.top-actions {
	margin-left: auto;
}
.market-info {
	padding: 6px 12px;
}
.info-label {
	display: none;
}
.result-header {
	padding: 6px 12px;
}
.settings-btn, .refresh-btn {
	padding: 6px 4px;
	gap: 4px;
}
.filter-trigger .settings-icon {
	display: none;
}
.plugin-scroll {
	--scroll-padding: 10px 12px;
}
.page-hint {
	display: none;
}
.load-error-banner {
	flex-direction: column;
	align-items: stretch;
}
.load-error-actions.compact {
	width: 100%;
}
}
</style>
