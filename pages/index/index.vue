<template>
	<view class="market-page" :class="[{ 'dark-mode': isDarkMode, 'compact-mode': compactMode }, motionClass, paletteClass]" :style="pageStyle">
		<view class="market-background" :inert="backgroundBlocked || undefined" :aria-hidden="backgroundBlocked || undefined">
			<!-- 顶部搜索栏和信息栏 -->
			<view class="top-section">
				<view class="search-row">
					<market-brand-logo @click="isBrandModalVisible = true" />
					<view class="top-actions">
						<search-header class="header-search-field" :model-value="searchWords" placeholder="搜索插件" @update:model-value="searchWords = $event" @search="handleSearch" @clear="handleClearSearch" />
						<button class="header-action header-agent" tabindex="0" role="button" aria-label="Agent 找插件" @click="goToAgentPluginSearch" @mouseenter="startIconMotion" @mouseleave="settleIconMotion"><image class="ui-icon" :src="botIcon" mode="aspectFit" data-hover-spin-icon /><text>Agent</text></button>
						<button class="header-action" tabindex="0" role="button" aria-label="设置" @click="goToSettings" @mouseenter="startIconMotion" @mouseleave="settleIconMotion"><image class="ui-icon" :src="settingsIcon" mode="aspectFit" data-hover-spin-icon /><text>设置</text></button>
						<button class="header-action" tabindex="0" role="button" aria-label="刷新" @click="handleRefreshClick" @mouseenter="startRefreshIconMotion" @mouseleave="settleIconMotion"><image class="ui-icon" :src="refreshIcon" mode="aspectFit" data-hover-spin-icon /><text>刷新</text></button>
						<button class="header-action header-theme" tabindex="0" role="button" :aria-label="'切换主题，当前' + themeLabel" @click="toggleTheme"><image class="ui-icon" :src="isDarkMode ? sunIcon : moonIcon" mode="aspectFit" /><text>{{ themeLabel }}</text></button>
					</view>
				</view>


			</view>

			<!-- 主体内容区域 -->
			<view class="content">
				<scroll-view class="market-navigation" scroll-y>
					<text class="navigation-label">浏览市场</text>
					<button class="navigation-item" :class="{ selected: !activeCategory }" @click="activeCategory && toggleCategory(activeCategory)">全部插件</button>
					<button v-for="category in categories" :key="category.key" class="navigation-item" :class="{ selected: activeCategory === category.key }" :aria-pressed="activeCategory === category.key" @click="toggleCategory(category.key)">
						<view class="navigation-item-title"><image class="ui-icon" :src="category.icon" mode="aspectFit" /><text>{{ category.label }}</text></view><text class="navigation-count">{{ category.count || 0 }}</text>
					</button>
					<view class="navigation-filters"><text class="navigation-label">筛选条件</text><button v-for="badge in badges" :key="badge.key" class="navigation-item" :class="{ selected: activeBadges.includes(badge.key) }" :aria-pressed="activeBadges.includes(badge.key)" @click="toggleBadge(badge.key)"><view class="navigation-item-title"><image class="ui-icon" :src="badge.icon" mode="aspectFit" /><text>{{ badge.label }}</text></view><text class="navigation-count">{{ badge.count || 0 }}</text></button></view>

				</scroll-view>
				<!-- 插件列表 -->
				<view class="plugin-list">
					<view class="catalogue-heading"><text class="catalogue-title">插件列表</text><text class="catalogue-meta">{{ filteredPlugins.length }} 个结果</text></view>
					<!-- 操作按钮 -->
					<view class="result-header">
						<view class="header-actions">
							<!-- 翻页按钮组 -->
							<view v-if="displayMode === 'paginated'" class="pagination-actions">
								<button tabindex="0" role="button"
									class="page-nav-btn prev-btn"
									:class="{ disabled: currentPage === 1 }" :disabled="currentPage === 1"
									@click="prevPage"
						>

									<text class="page-nav-text">上一页</text>
									<!-- #ifdef WEB --><view v-if="showKeyboardShortcuts" class="shortcut-keys"><ui-kbd>←</ui-kbd><ui-kbd>↑</ui-kbd><ui-kbd>PgUp</ui-kbd></view><!-- #endif -->
								</button>
								<text class="page-status">{{ currentPage }} / {{ totalPages }}</text>
								<button tabindex="0" role="button"
									class="page-nav-btn next-btn"
									:class="{ disabled: currentPage === totalPages }" :disabled="currentPage >= totalPages"
									@click="nextPage"
						>
									<text class="page-nav-text">下一页</text>
									<!-- #ifdef WEB --><view v-if="showKeyboardShortcuts" class="shortcut-keys"><ui-kbd>→</ui-kbd><ui-kbd>↓</ui-kbd><ui-kbd>PgDn</ui-kbd></view><!-- #endif -->

								</button>
							</view>

							<!-- 功能按钮组 -->
							<view class="function-actions">
								<button tabindex="0" role="button" class="settings-btn filter-trigger" aria-controls="market-filter-dialog" :aria-expanded="drawerOpen" @click="drawerOpen = true">
									<image class="ui-icon settings-icon" :src="filterIcon" mode="aspectFit" /><text class="settings-text filter-label-desktop">筛选</text><text class="settings-text filter-label-mobile">分类与筛选</text><text v-if="activeFilterCount" class="filter-count">{{ activeFilterCount }}</text>
								</button>

							</view>
						</view>
					</view>
					<!-- 加载状态 -->
					<view v-if="isLoading && plugins.length === 0" class="loading-state" role="status" aria-live="polite">
						<view class="loading-logo" aria-hidden="true">
							<!-- #ifdef WEB -->
							<svg class="loading-logo-svg" viewBox="0 0 200 200" focusable="false" aria-hidden="true">
								<path d="M41 115C18 100 52 65 94 51s78-10 77 10c-1 11-13 22-31 32" fill="none" stroke="#29C7D7" stroke-width="11" stroke-linecap="round" />
								<path class="loading-logo-pulse" d="M41 115C18 100 52 65 94 51s78-10 77 10c-1 11-13 22-31 32" pathLength="100" fill="none" stroke="#d2fff8" stroke-width="5" stroke-linecap="round" />
								<circle class="loading-logo-planet" cx="100" cy="100" r="43" fill="#7158C5" />
								<path d="m153 102 6 11 12 3-12 3-6 11-3-11-11-3 11-3Z" fill="#32C893" />
							</svg>
							<!-- #endif -->
							<!-- #ifndef WEB -->
							<image class="loading-logo-image loading-logo-layer" src="/static/loading-logo-orbit.png" mode="aspectFit" />
							<view class="loading-logo-mobile-pulse"></view>
							<image class="loading-logo-image loading-logo-layer loading-logo-planet" src="/static/loading-logo-planet.png" mode="aspectFit" />
							<image class="loading-logo-image loading-logo-layer" src="/static/loading-logo-star.png" mode="aspectFit" />
							<!-- #endif -->
						</view>
						<text class="loading-text">正在加载插件数据...</text>
						<view class="loading-actions">
							<view class="loading-action-btn loading-cancel-btn" @click="cancelPluginLoad()">
								<image class="ui-icon" :src="uiIcons.x" mode="aspectFit" />
								<text>取消加载</text>
							</view>
							<view class="loading-action-btn loading-settings-btn" @click="goToSettings">
								<image class="ui-icon" :src="uiIcons.settings" mode="aspectFit" />
								<text>前往设置</text>
							</view>
						</view>
					</view>
					<view v-else-if="loadError && plugins.length === 0" class="load-error-state">
						<image class="state-icon" :src="uiIcons['circle-alert']" mode="aspectFit" />
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
						@scroll="handleListScroll"
						@reach-end="loadMoreFeed"
						class="plugin-scroll"
						:scroll-top="scrollTop"
						v-if="!isLoading || plugins.length > 0"
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
						<view v-if="displayMode === 'paginated'" class="plugin-grid">
							<plugin-card
								v-for="plugin in paginatedPlugins"
								:key="plugin.id"
								:plugin="plugin"
								@click="openPlugin"
							/>
						</view>
						<view v-else class="feed-list">
							<view v-if="feedWindow.before" aria-hidden="true" :style="{ height: feedWindow.before + 'px' }"></view>
							<view v-for="chunk in feedWindow.chunks" :id="'feed-chunk-' + chunk.index" :key="chunk.index" class="feed-chunk">
								<view class="plugin-grid">
										<plugin-card v-for="plugin in chunk.plugins" :key="plugin.id" :plugin="plugin" lazy-avatar @click="openPlugin" />
								</view>
							</view>
							<view v-if="feedWindow.after" aria-hidden="true" :style="{ height: feedWindow.after + 'px' }"></view>
							<view v-if="filteredPlugins.length && feedLoadedCount < filteredPlugins.length" class="feed-progress" role="status">继续向下滚动，查看更多插件</view>
							<view v-else-if="filteredPlugins.length" class="feed-progress">已展示全部插件</view>
						</view>
						<!-- 空状态 -->
						<view v-if="!isLoading && filteredPlugins.length === 0" class="empty-state">
							<image class="state-icon" :src="uiIcons.package" mode="aspectFit" />
							<text class="empty-text">没有找到相关插件</text>
						</view>
						<view class="market-footer">
							<text class="footer-brand">Koishi 插件市场</text>
							<view class="footer-links">
								<!-- #ifdef WEB --><button class="footer-link" tabindex="0" role="button" @click="openGithub"><image class="footer-icon" :src="isDarkMode ? githubMarkDark : githubMarkLight" mode="aspectFit" /><text>GitHub</text></button><!-- #endif -->
								<button class="footer-link" tabindex="0" role="button" @click="isPrivacyModalVisible = true"><image class="footer-icon" :src="uiIcons['file-text']" mode="aspectFit" /><text>隐私政策</text></button>
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

		<market-modal :open="activeModal !== ''" :title="activeModal === 'settings' ? '设置' : 'Agent 找插件'" drawer @close="activeModal = ''">
			<settings-page v-if="activeModal === 'settings'" :active-source="currentSourceUrl" embedded @close="activeModal = ''" @source-change="syncSourceAndReload" @source-reset="resetToRegionalSource" />
			<agent-page v-if="activeModal === 'agent'" embedded @close="activeModal = ''" />
		</market-modal>
		<!-- #ifdef WEB --><Toaster :theme="isDarkMode ? 'dark' : 'light'" position="top-right" rich-colors /><!-- #endif -->
		<!-- #ifndef WEB --><view v-if="mobileToast.message" class="mobile-toast" role="status"><text>{{ mobileToast.message }}</text></view><!-- #endif -->
		<!-- 隐私政策弹窗 -->
		<privacy-modal v-model:visible="isPrivacyModalVisible" />

		<!-- 品牌徽标大图模态预览弹窗 (根节点挂载，不受顶部栏层级限制) -->
		<brand-modal
			v-model:visible="isBrandModalVisible"
			@close="isBrandModalVisible = false"
			version="0.3.6-rc.2"
		/>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, getCurrentInstance } from 'vue'
import { uiIcons } from '@/utils/ui-icons.js'
import { detectMarketCountry, regionalMarketEndpoints } from '@/utils/market-region.js'
import MarketModal from '@/components/market-modal/market-modal.vue'
import UiKbd from '@/components/ui-kbd/ui-kbd.vue'
import SettingsPage from '@/pages/settings/settings.vue'
import AgentPage from '@/pages/agent-plugin-search/agent-plugin-search.vue'
// #ifdef WEB
import { Toaster, toast } from 'vue-sonner'
import 'vue-sonner/style.css'
// #endif
import { useDisplayPreferences } from '@/utils/display-preferences.js'
import { onLoad, onResize, onHide, onShow } from "@dcloudio/uni-app";
import { fetchMarketData, getCurrentEndpoint, getManualMarketEndpoint } from '@/utils/request.js'
import { setPlugin } from '@/utils/plugin-store.js'
import PluginCard from '@/components/plugin-card/plugin-card.vue'
import MarketSidebar from '@/components/market-sidebar/market-sidebar.vue'
import SearchHeader from '@/components/search-header/search-header.vue'
import StyledScrollView from '@/components/styled-scroll-view/styled-scroll-view.vue'
import PrivacyModal from '@/components/privacy-modal/privacy-modal.vue'
import MarketBrandLogo from '@/components/market-brand-logo/market-brand-logo.vue'
import BrandModal from '@/components/brand-modal/brand-modal.vue'
import githubMarkDark from '@/static/github-mark-white.png'
import githubMarkLight from '@/static/github-mark.png'
import filterIcon from '@/static/icons/sliders-horizontal.png'
import botIcon from '@/static/icons/bot.png'
import settingsIcon from '@/static/icons/settings.png'
import refreshIcon from '@/static/icons/refresh-cw.png'
import closeIcon from '@/static/icons/x.png'
import sunIcon from '@/static/icons/sun.png'
import moonIcon from '@/static/icons/moon.png'
import { useMotionPreferences } from '@/utils/motion.js'
import { createHoverIconMotion } from '@/utils/hover-icon-motion.js'
import { usePageLayout } from '@/utils/layout.js'

// 小程序状态栏适配
const { pageStyle } = usePageLayout()
const { motionClass, resolvedMotionMode } = useMotionPreferences()
const { showKeyboardShortcuts, compactMode, displayMode, updateDefaultDisplayMode } = useDisplayPreferences()
const { start: startIconMotion, settle: settleIconMotion, clear: clearHoverIconMotion } = createHoverIconMotion(resolvedMotionMode)

// 隐私弹窗可见性
const isPrivacyModalVisible = ref(false)

// 品牌徽标大图弹窗可见性
const isBrandModalVisible = ref(false)

// 搜索相关
const searchWords = ref([])

// 滚动位置
const scrollTop = ref(0)

// 侧边栏状态
const drawerOpen = ref(false)
const pageVisible = ref(true)
const instance = getCurrentInstance()

import { useTheme } from '@/utils/theme.js'

// 主题模式（统一由 useTheme 管理）
const { themeMode, isDarkMode, themeLabel, toggleTheme, refreshTheme, paletteClass } = useTheme()

// 加载状态
const isLoading = ref(true)
const loadError = ref(null)
let activeMarketRequest = null
let loadRequestId = 0
let regionChecked = false
let marketCountry = null
let currentLoadAutomatic = false

const startRefreshIconMotion = (event) => {
	if (!isLoading.value) startIconMotion(event)
}

watch(isLoading, (loading) => {
	if (loading) clearHoverIconMotion()
})

// 当前使用的源 URL
const currentSourceUrl = ref(getCurrentEndpoint())
const activeModal = ref('')
const mobileToast = ref({ message: '' })
let mobileToastTimer = null
const backgroundBlocked = computed(() => drawerOpen.value || !!activeModal.value || isPrivacyModalVisible.value || isBrandModalVisible.value)
function syncSourceSelection() {
 currentSourceUrl.value = getCurrentEndpoint()
}
syncSourceSelection()
function updateRefreshToast(status, message) {
 // #ifdef WEB
 if (status === 'loading') toast.loading(message, { id: 'market-refresh' })
 else if (status === 'success') toast.success(message, { id: 'market-refresh', duration: 2400 })
 else if (status === 'error') toast.error(message, { id: 'market-refresh', duration: 4000 })
 else toast.dismiss('market-refresh')
 // #endif
 // #ifndef WEB
 clearTimeout(mobileToastTimer)
 mobileToast.value = { message: status === 'dismiss' ? '' : message }
 if (status !== 'loading' && status !== 'dismiss') mobileToastTimer = setTimeout(() => { mobileToast.value = { message: '' } }, status === 'error' ? 4000 : 2400)
 // #endif
}
function syncSourceAndReload() {
 const previous = currentSourceUrl.value
 syncSourceSelection()
 if (currentSourceUrl.value === previous && !(currentLoadAutomatic && getManualMarketEndpoint())) return
 cancelPluginLoad(false)
 plugins.value = []
 marketInfo.value = {}
 currentPage.value = 1
 resetScrollTop()
 loadPlugins({ notify: true, switching: true })
}

// 排序相关
const activeSort = ref('default')
const sortOrder = ref('desc')

const sortOptions = [
	{ key: 'default', label: '默认排序', icon: uiIcons['star'] },
	{ key: 'download', label: '下载量', icon: uiIcons['download'] },
	{ key: 'rating', label: '评分', icon: uiIcons['star'] },
	{ key: 'updated', label: '更新时间', icon: uiIcons['clock'] },
	{ key: 'created', label: '发布时间', icon: uiIcons['calendar'] }
]

// 筛选徽章
const activeBadges = ref([])
const badges = ref([
	{ key: 'verified', label: '官方认证', icon: uiIcons['shield-check'], count: 0 },
	{ key: 'preview', label: '预览版本', icon: uiIcons['eye'], count: 0 },
	{ key: 'insecure', label: '不安全', icon: uiIcons['triangle-alert'], count: 0 },
	{ key: 'portable', label: '便携版本', icon: uiIcons['box'], count: 0 },
	{ key: 'newborn', label: '新发布', icon: uiIcons['sparkles'], count: 0 }
])

// 分类
const activeCategory = ref('')
const categories = ref([
	{ key: 'adapter', label: '适配器', icon: uiIcons['plug'], count: 0 },
	{ key: 'extension', label: '扩展功能', icon: uiIcons['puzzle'], count: 0 },
	{ key: 'tool', label: '实用工具', icon: uiIcons['wrench'], count: 0 },
	{ key: 'game', label: '娱乐玩法', icon: uiIcons['gamepad-2'], count: 0 },
	{ key: 'image', label: '图片服务', icon: uiIcons['image'], count: 0 },
	{ key: 'manage', label: '管理工具', icon: uiIcons['settings'], count: 0 },
	{ key: 'general', label: '通用功能', icon: uiIcons['box'], count: 0 },
	{ key: 'other', label: '其他', icon: uiIcons['list'], count: 0 }
])

// 插件数据
const plugins = ref([])
const marketInfo = ref({})
const currentPage = ref(1)
const pageSize = ref(5) // 初始值，将根据视口高度动态调整
const gridColumns = ref(1) // 当前 grid 列数
const feedBatchCount = ref(1)
const feedScrollTop = ref(0)
const feedViewportHeight = ref(0)
const feedChunkHeights = ref({})
let feedMeasurePending = false
let feedLoadPending = false
let feedGeneration = 0
let feedDisposed = false

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

// 一批为八行；已离开视口的批次用占位高度保留位置，避免长期滚动时卡片持续累积。
const feedBatchSize = computed(() => Math.max(1, gridColumns.value) * 8)
const feedLoadedCount = computed(() => Math.min(filteredPlugins.value.length, feedBatchCount.value * feedBatchSize.value))
const feedWindow = computed(() => {
	const count = Math.ceil(feedLoadedCount.value / feedBatchSize.value)
	const viewport = Math.max(feedViewportHeight.value, 600)
	const startY = Math.max(0, feedScrollTop.value - viewport * 2)
	const endY = feedScrollTop.value + viewport * 3
	const chunks = []
	const positions = []
	let offset = 0
	let before = 0
	let after = 0
	let first = count
	let last = -1
	for (let index = 0; index < count; index++) {
		const start = index * feedBatchSize.value
		const length = Math.min(feedBatchSize.value, feedLoadedCount.value - start)
		const measured = feedChunkHeights.value[index]
		const height = measured || Math.ceil(length / gridColumns.value) * (compactMode.value ? 180 : 245)
		positions.push({ index, start, length, height })
		// 未测量到实际高度时保留卡片，避免跨端测量失败后出现错位或遗漏。
		if (!measured || (offset + height >= startY && offset <= endY)) {
			first = Math.min(first, index)
			last = index
		}
		offset += height
	}
	for (const position of positions) {
		if (position.index < first) before += position.height
		else if (position.index > last) after += position.height
		else chunks.push({ index: position.index, plugins: filteredPlugins.value.slice(position.start, position.start + position.length) })
	}
	return { before, after, chunks, height: offset }
})

// 方法
const activeFilterCount = computed(() => activeBadges.value.length + (activeCategory.value ? 1 : 0))
watch(totalPages, (pages) => { currentPage.value = Math.min(currentPage.value, pages) })
onHide(() => {
	drawerOpen.value = false
	pageVisible.value = false
})

const resetScrollTop = () => {
	nextTick(() => {
		scrollTop.value = Math.random()
	})
}

function resetFeed() {
	feedGeneration++
	feedBatchCount.value = 1
	feedLoadPending = false
	feedScrollTop.value = 0
	feedChunkHeights.value = {}
	if (displayMode.value === 'feed') scheduleFeedMeasure()
}

function scheduleFeedMeasure() {
	if (displayMode.value !== 'feed' || feedMeasurePending || feedDisposed) return
	feedMeasurePending = true
	nextTick(() => {
		feedMeasurePending = false
		if (displayMode.value !== 'feed' || feedDisposed) return
		const generation = feedGeneration
		const chunks = feedWindow.value.chunks
		if (!chunks.length) { feedLoadPending = false; return }
		const query = uni.createSelectorQuery().in(instance.proxy)
		for (const chunk of chunks) query.select('#feed-chunk-' + chunk.index).boundingClientRect()
		query.exec((results) => {
			if (generation !== feedGeneration || feedDisposed || displayMode.value !== 'feed') return
			feedLoadPending = false
			const heights = { ...feedChunkHeights.value }
			let changed = false
			chunks.forEach((chunk, index) => {
				const height = results?.[index]?.height
				if (height > 0 && Math.abs((heights[chunk.index] || 0) - height) > 0.5) {
					heights[chunk.index] = height
					changed = true
				}
			})
			if (changed) feedChunkHeights.value = heights
			if (feedViewportHeight.value && feedScrollTop.value + feedViewportHeight.value + 600 >= feedWindow.value.height) loadMoreFeed()
		})
	})
}

function loadMoreFeed() {
	if (displayMode.value !== 'feed' || feedLoadPending || feedLoadedCount.value >= filteredPlugins.value.length) return
	feedLoadPending = true
	feedBatchCount.value++
	scheduleFeedMeasure()
}

function handleListScroll({ scrollTop: top, scrollHeight: height, viewportHeight }) {
	if (displayMode.value !== 'feed') return
	feedScrollTop.value = top
	if (viewportHeight) feedViewportHeight.value = viewportHeight
	if (height - top - viewportHeight <= 600) loadMoreFeed()
}

watch(() => feedWindow.value.chunks.map(chunk => chunk.index).join(','), scheduleFeedMeasure)
watch(filteredPlugins, () => {
	if (displayMode.value === 'feed') { resetFeed(); resetScrollTop() }
	nextTick(calculatePageSize)
})
watch(displayMode, () => {
	resetFeed()
	currentPage.value = 1
	resetScrollTop()
	nextTick(calculatePageSize)
})
watch(compactMode, () => {
	if (displayMode.value === 'feed') { resetFeed(); resetScrollTop() }
})

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

const goToSettings = () => { activeModal.value = 'settings' }
const goToAgentPluginSearch = () => { activeModal.value = 'agent' }

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
	if (!pageVisible.value || backgroundBlocked.value || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
	if ((e.key === 'Enter' || e.key === ' ') && e.target?.tagName === 'UNI-BUTTON') {
		e.preventDefault()
		if (!e.target.hasAttribute('disabled')) e.target.click()
		return
	}
	if (e.target?.closest?.('input, textarea, select, [contenteditable], [role="dialog"]')) return
	if (displayMode.value !== 'paginated') return
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
const loadPlugins = async ({ notify = false, switching = false } = {}) => {
	if (activeMarketRequest) return

	const requestId = ++loadRequestId
	isLoading.value = true
	loadError.value = null
	if (notify) updateRefreshToast('loading', switching ? '正在切换数据源…' : '正在刷新插件数据…')

	try {
		console.log('开始加载 Koishi 插件市场数据...')
		
		const manualEndpoint = getManualMarketEndpoint()
		currentLoadAutomatic = !manualEndpoint
		if (!manualEndpoint && !regionChecked) {
			activeMarketRequest = detectMarketCountry()
			const country = await activeMarketRequest
			if (requestId !== loadRequestId) return
			marketCountry = country
			regionChecked = true
		}
		const endpoints = manualEndpoint ? [manualEndpoint] : regionalMarketEndpoints(marketCountry)
		let data
		let lastError
		for (const endpoint of endpoints) {
			if (!manualEndpoint) {
				const previousEndpoint = currentSourceUrl.value
				uni.setStorageSync('market_auto_endpoint', endpoint)
				syncSourceSelection()
				if (previousEndpoint !== endpoint && plugins.value.length) {
					plugins.value = []
					marketInfo.value = {}
					currentPage.value = 1
					resetScrollTop()
				}
			}
			try {
				activeMarketRequest = fetchMarketData({
					endpoint,
					timeout: manualEndpoint ? 60000 : 20000,
					isConsoleOutput: false,
					isShowToast: false
				})
				data = await activeMarketRequest
				break
			} catch (error) {
				if (requestId !== loadRequestId || error?.name === 'AbortError') throw error
				lastError = error
			}
		}
		if (!data) throw lastError || new Error('加载失败')

		if (requestId !== loadRequestId) return
		
		
		// 设置插件列表
		plugins.value = data.plugins || []
		
		// 保存市场信息
		marketInfo.value = {
			forceTime: data.forceTime,
			mirror: data.mirror,
			total: data.total
		}
		
		// 更新统计数据
		updateCounts(data)
		
		console.log(`成功加载 ${plugins.value.length} 个插件`)
		if (notify) updateRefreshToast('success', switching ? '数据源已切换' : '插件数据刷新成功')
		
	} catch (error) {
		if (requestId !== loadRequestId || error?.name === 'AbortError') return

		console.error('加载插件数据失败:', error)
		loadError.value = error.message || '加载失败'
		if (notify) updateRefreshToast('error', switching ? '数据源加载失败' : '插件数据刷新失败')
		
	} finally {
		if (requestId === loadRequestId) {
			activeMarketRequest = null
			currentLoadAutomatic = false
			isLoading.value = false
		}
	}
}

function cancelPluginLoad(showFeedback = true) {
	if (!isLoading.value && !activeMarketRequest) return

	const request = activeMarketRequest
	activeMarketRequest = null
	currentLoadAutomatic = false
	loadRequestId++
	isLoading.value = false
	loadError.value = null
	request?.abort?.()
	updateRefreshToast('dismiss')

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

function resetToRegionalSource() {
	cancelPluginLoad(false)
	uni.removeStorageSync('market_endpoint')
	uni.removeStorageSync('market_preset_index')
	uni.removeStorageSync('market_auto_endpoint')
	regionChecked = false
	marketCountry = null
	plugins.value = []
	marketInfo.value = {}
	currentPage.value = 1
	resetScrollTop()
	syncSourceSelection()
	loadPlugins({ notify: true, switching: true })
}

function useDefaultSourceAndRetry() {
	resetToRegionalSource()
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
 if (!isLoading.value) loadPlugins({ notify: true })
}

// 动态计算每页显示的插件数量
const calculatePageSize = (size) => {
	if (size?.height) feedViewportHeight.value = size.height
	nextTick(() => {
		uni.createSelectorQuery().in(instance.proxy).select('.plugin-grid').boundingClientRect((rect) => {
			if (!rect?.width) return
			const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
			const columns = info.windowWidth <= 600 ? 1 : Math.max(1, Math.min(9, Math.floor((rect.width + 12) / 292)))
			const firstItem = (currentPage.value - 1) * pageSize.value
			if (gridColumns.value !== columns && displayMode.value === 'feed') {
				gridColumns.value = columns
				resetFeed()
				resetScrollTop()
			} else gridColumns.value = columns
			pageSize.value = columns * 5
			currentPage.value = Math.min(totalPages.value, Math.floor(firstItem / pageSize.value) + 1)
			scheduleFeedMeasure()
		}).exec()
	})
}

onResize(() => { updateDefaultDisplayMode(); calculatePageSize() })
onShow(() => {
	pageVisible.value = true
	refreshTheme()
	calculatePageSize()
	if (plugins.value.length === 0 && !activeMarketRequest) {
		loadPlugins()
	}
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
	
	loadPlugins()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
	feedDisposed = true
	feedGeneration++
	cancelPluginLoad(false)
	clearHoverIconMotion()
	clearTimeout(mobileToastTimer)
	// #ifdef WEB
	window.removeEventListener('keydown', handleKeyDown)
	// #endif
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
		imageUrl: '/static/logo_roundedrectangle_bg.png'  // 分享图片
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
/* 品牌 Logo 徽标 */
.market-brand {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	padding-right: 4rpx;
	transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	cursor: pointer;
}

.market-brand:hover {
	transform: scale(1.08) rotate(3deg);
}

.market-brand-logo {
	width: 54rpx;
	height: 54rpx;
	display: block;
	filter: drop-shadow(0 2rpx 8rpx rgba(85, 70, 163, 0.35));
}

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

.github-link,
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
	border-radius: 16rpx;
	cursor: pointer;
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
}

.github-link::before,
.top-theme-btn::before {
	content: '';
	position: absolute;
	width: 100%;
	height: 100%;
	background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
	opacity: 0;
	transition: opacity 0.3s ease;
}

.github-link:hover::before,
.top-theme-btn:hover::before {
	opacity: 1;
}

.github-link:hover,
.top-privacy-btn:hover,
.top-theme-btn:hover {
	transform: translateY(-3rpx);
	background: rgba(255, 255, 255, 0.2);
	border-color: rgba(255, 255, 255, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(255, 255, 255, 0.2);
}

.github-link:active,
.top-privacy-btn:active,
.top-theme-btn:active {
	transform: scale(0.97);
}

.github-icon {
	width: 36rpx;
	height: 36rpx;
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
	font-size: 11px;
	font-weight: 500;
	max-width: min(520rpx, calc(100vw - 420rpx));
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* 响应式调整当前源 URL 显示宽度，尽量展示更长完整 URL */
@media (min-width: 768px) {
	.info-tag:first-child .info-value {
		max-width: min(720px, calc(100vw - 360px));
	}
}

@media (min-width: 1200px) {
	.info-tag:first-child .info-value {
		max-width: min(1000px, calc(100vw - 480px));
	}
}

@media (min-width: 1600px) {
	.info-tag:first-child .info-value {
		max-width: min(1400px, calc(100vw - 600px));
	}
}

@media (min-width: 2000px) {
	.info-tag:first-child .info-value {
		max-width: 1800px;
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
}

@keyframes fadeIn {
	from { opacity: 0; transform: translateY(20rpx); }
	to { opacity: 1; transform: translateY(0); }
}

.loading-logo { position: relative; width: 96px; height: 96px; margin-bottom: 12px; flex-shrink: 0; }
.loading-logo-svg, .loading-logo-image { display: block; width: 100%; height: 100%; }
.loading-logo-layer { position: absolute; inset: 0; }
.loading-logo-pulse { stroke-dasharray: 12 88; stroke-dashoffset: 12; opacity: 0; animation: loading-logo-trace 2.8s linear infinite, loading-logo-fade 2.8s ease-in-out infinite; }
.loading-logo-mobile-pulse { position: absolute; left: -3px; top: -3px; width: 6px; height: 6px; border-radius: 50%; background: #d2fff8; opacity: 0; animation: loading-logo-mobile-trace 2.8s linear infinite; }
.loading-logo-planet { animation: loading-logo-float 4.8s ease-in-out infinite; }
.motion-low .loading-logo-pulse, .motion-low .loading-logo-mobile-pulse { animation-duration: 4s; }
.motion-low .loading-logo-planet { animation: none; }
.motion-ultra-low .loading-logo-pulse, .motion-ultra-low .loading-logo-mobile-pulse { opacity: 0; }
@keyframes loading-logo-trace { from { stroke-dashoffset: 12; } to { stroke-dashoffset: -100; } }
@keyframes loading-logo-fade { 0%, 100% { opacity: 0; } 12%, 82% { opacity: .95; } }
@keyframes loading-logo-float { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-5px); } 75% { transform: translateY(5px); } }
@keyframes loading-logo-mobile-trace {
	0% { transform: translate(19.68px, 55.2px); opacity: 0; }
	10% { transform: translate(16.91px, 45.49px); opacity: .95; }
	20% { transform: translate(23.6px, 36.72px); opacity: .95; }
	30% { transform: translate(32.58px, 30.2px); opacity: .95; }
	40% { transform: translate(42.59px, 25.38px); opacity: .95; }
	50% { transform: translate(53.23px, 22.2px); opacity: .95; }
	60% { transform: translate(64.21px, 20.58px); opacity: .95; }
	70% { transform: translate(75.23px, 21.55px); opacity: .95; }
	80% { transform: translate(82.08px, 29.17px); opacity: .95; }
	90% { transform: translate(76.37px, 38.39px); opacity: .95; }
	100% { transform: translate(67.2px, 44.64px); opacity: 0; }
}

.loading-text {
	font-size: 28rpx;
	color: var(--text-tertiary);
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
.loading-action-btn > .ui-icon {
	margin-right: 8px;
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
	align-items: center;
	gap: 10px;
	padding: 8px 16px 0;
}
.market-brand {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	padding-right: 2px;
	height: 38px;
}
.market-brand-logo {
	width: 34px;
	height: 34px;
	object-fit: contain;
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
.github-link, .top-privacy-btn, .top-theme-btn {
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
	max-width: min(100%, 540px);
}
.info-tag:first-child .info-value {
	font-size: 11px;
}
.info-value {
	min-width: 0;
	font-size: var(--font-caption, 13px);
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
	pointer-events: none;
}
.settings-text, .refresh-text, .page-nav-text {
	font-size: var(--font-caption);
	pointer-events: none;
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
/* 2026年10月11日 2026年10月11日17:44:22， 希望所有平台都显示
.filter-trigger .settings-icon {
	display: none;
}
*/
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

/* Catalogue layout shared by H5 and mini programs. */
.market-page, .plugin-list { background: var(--bg-primary); }
.top-section, .market-page:not(.dark-mode) .top-section {
	background: var(--surface);
	border-color: var(--border);
	backdrop-filter: none;
	-webkit-backdrop-filter: none;
}
.search-row { max-width: 1500px; margin: 0 auto; padding: 14px 24px 6px; gap: 20px; }
.search-row :deep(.search-header) { max-width: 680px; }
.top-actions { margin-left: auto; }
.market-info { max-width: 1500px; margin: 0 auto; padding: 2px 24px 12px; }
.info-tag, .market-page:not(.dark-mode) .info-tag {
	background: var(--surface-subtle); border: 1px solid var(--border); border-radius: 8px;
}
.info-tag:hover, .info-tag:hover .info-icon { transform: none; box-shadow: none; }
.info-value.highlight { color: var(--accent); font-size: var(--font-caption); }
.ui-icon { width: 18px; height: 18px; flex-shrink: 0; }
.content { width: 100%; max-width: 1500px; margin: 0 auto; }
.market-navigation { display: none; }
.market-heading { display: flex; flex-direction: column; gap: 4px; padding: 28px 24px 14px; flex-shrink: 0; }
.market-title { color: var(--text-primary); font-size: 26px; line-height: 1.25; font-weight: 700; }
.market-subtitle { color: var(--text-secondary); font-size: var(--font-caption); }
.market-page.dark-mode .market-heading { margin: 22px 24px 8px; padding: 22px 24px; border: 1px solid var(--border); border-radius: 16px; background: var(--bg-tertiary); }
.result-header, .market-page:not(.dark-mode) .result-header { background: transparent; border: 0; padding: 8px 24px; backdrop-filter: none; -webkit-backdrop-filter: none; }
.settings-btn, .refresh-btn, .page-nav-btn, .page-btn,
.market-page.dark-mode .settings-btn, .market-page.dark-mode .refresh-btn {
	background: var(--surface); border: 1px solid var(--border); color: var(--text-primary); box-shadow: none;
}
.settings-btn:hover, .refresh-btn:hover, .page-nav-btn:hover, .page-btn:hover { box-shadow: none; transform: none; border-color: var(--accent); }
.plugin-scroll { --scroll-padding: 12px 24px 24px; }
.plugin-grid { gap: 14px; }
.market-page.compact-mode .plugin-grid { gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.market-page.compact-mode .plugin-grid :deep(.plugin-card) { border: 0; border-radius: 0; }
.empty-icon { animation: none; }
@media (min-width: 901px) {
	.market-navigation { display: block; flex: 0 0 220px; width: 220px; height: 100%; box-sizing: border-box; padding: 28px 12px 24px 24px; }
	.navigation-label, .navigation-source-title { display: block; color: var(--text-secondary); font-size: 12px; margin: 0 10px 10px; }
	.navigation-item { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 39px; margin: 0; padding: 8px 10px; border: 0; border-radius: 8px; background: transparent; color: var(--text-secondary); font-size: 14px; line-height: 1.5; text-align: left; }
	.navigation-item::after { border: 0; }
	.navigation-item.selected { color: var(--accent); background: var(--accent-soft); font-weight: 700; }
	.navigation-item:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
	.navigation-count { color: var(--text-tertiary); font-size: 12px; }
	.navigation-source { margin: 28px 10px 0; padding-top: 18px; border-top: 1px solid var(--border); }
	.navigation-source-title { margin: 0 0 6px; color: var(--text-primary); font-weight: 600; }
	.navigation-source-url { display: block; color: var(--text-secondary); font-size: 12px; overflow-wrap: anywhere; }
}
@media (max-width: 600px) {
	.search-row { padding: 10px 16px 4px; gap: 8px; }
	.search-row :deep(.search-header) { order: 3; max-width: none; }
	.market-info { padding: 6px 16px 10px; }
	.market-heading { padding: 20px 16px 10px; }
	.market-title { font-size: 23px; }
	.market-page.dark-mode .market-heading { margin: 16px 16px 4px; padding: 18px; }
	.result-header, .market-page:not(.dark-mode) .result-header { padding: 8px 16px; }
	.plugin-scroll { --scroll-padding: 10px 16px 20px; }
}

/* Market workbench: a stable navigation rail and a search-led catalogue. */
.top-section, .market-page:not(.dark-mode) .top-section { background:var(--surface); }
.search-row { max-width: none; min-height:72px; padding:0 32px; gap:40px; }
.primary-navigation { display:flex; align-items:center; gap:28px; flex:1; color:var(--text-secondary); font-size:14px; }
.primary-navigation button { margin:0; padding:0; border:0; background:transparent; color:inherit; font-size:14px; line-height:1.5; }
.primary-navigation button::after { border:0; }
.primary-navigation-active { color:var(--text-primary); font-weight:700; }
.market-info { display:flex; max-width:none; margin:0; padding:0; gap:6px; }
.info-tag, .market-page:not(.dark-mode) .info-tag { padding:2px 6px; border:0; background:transparent; }
.info-tag:first-child { max-width:min(100%, 560px); }
.info-tag .ui-icon { width:14px; height:14px; }
.content { max-width:none; }
.market-navigation { background:var(--bg-primary); }
.navigation-item-title { display:flex; align-items:center; min-width:0; gap:10px; }
.navigation-item-title .ui-icon { width:16px; height:16px; }
.navigation-filters { margin-top:28px; }
.plugin-list { position:relative; }
.market-heading { padding:32px 32px 14px; gap:24px; }
.heading-copy { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; }
.market-title { display:block; font-size:30px; letter-spacing:-0.03em; }
.market-subtitle { display:block; margin-top:5px; font-size:14px; }
.heading-count { display:flex; flex-direction:column; align-items:flex-end; color:var(--text-secondary); font-size:12px; white-space:nowrap; }
.heading-count-number { color:var(--text-primary); font-size:22px; line-height:1.15; font-weight:700; font-variant-numeric:tabular-nums; }
.market-heading :deep(.search-header) { max-width:none; padding:0; }
.market-heading :deep(.search-bar) { min-height:54px; background:var(--surface); }
.market-page.dark-mode .market-heading { margin:24px 32px 12px; padding:24px; border:1px solid var(--border); border-radius:12px; background:var(--bg-tertiary); }
.catalogue-heading { display:flex; align-items:baseline; gap:10px; padding:14px 32px 0; }
.catalogue-title { color:var(--text-primary); font-size:17px; font-weight:700; }
.catalogue-meta { color:var(--text-tertiary); font-size:12px; }
.result-header, .market-page:not(.dark-mode) .result-header { padding:8px 32px 12px; }
.header-actions { justify-content:space-between; }
.function-actions { order:0; }
.pagination-actions { order:1; }
.plugin-scroll { --scroll-padding: 8px 32px 32px; }
.plugin-grid { gap:14px; align-items:stretch; }
.market-page.compact-mode .plugin-grid { gap:1px; }
.state-icon { width:38px; height:38px; margin-bottom:16px; }
@media (min-width:901px) {
 .market-navigation { flex-basis:240px; width:240px; padding:32px 12px 24px 24px; border-right:1px solid var(--border); }
 .navigation-item { min-height:38px; }
}
@media (max-width:900px) {
 .search-row { min-height:64px; padding:8px 20px; gap:16px; }
 .primary-navigation { gap:14px; }
 .header-actions { flex-direction:row; flex-wrap:wrap; }
 .function-actions { display:flex; width:auto; flex-wrap:wrap; }
 .pagination-actions { display:flex; width:auto; }
}
@media (max-width:600px) {
 .search-row { flex-wrap:nowrap; padding:8px 16px; }
 .primary-navigation { display:none; }
 .top-actions { margin-left:auto; }
 .market-heading { padding:22px 16px 10px; gap:16px; }
 .market-title { font-size:24px; }
 .market-page.dark-mode .market-heading { margin:16px 16px 4px; padding:18px; }
 .heading-count-number { font-size:18px; }
 .catalogue-heading { padding:12px 16px 0; }
 .result-header, .market-page:not(.dark-mode) .result-header { padding:8px 16px; }
 .header-actions { gap:8px; }
 .function-actions { display:grid; width:100%; grid-template-columns:repeat(4,minmax(0,1fr)); }
 .pagination-actions { display:flex; width:100%; justify-content:center; }
 .plugin-scroll { --scroll-padding:8px 16px 24px; }
}


.quick-source { display:flex; align-items:center; gap:12px; position:relative; z-index:5; }
.quick-source.select-open { z-index:50; }
.quick-source-label { flex:none; color:var(--text-secondary); font-size:13px; }
.quick-source :deep(.form-select) { flex:1; max-width:430px; }
.quick-source :deep(.select-trigger) { min-height:40px; padding:6px 12px; border-radius:8px; background:var(--surface); }
.quick-source :deep(.option-menu) { position:absolute; top:100%; left:0; width:100%; max-height: min(45vh, 360px); z-index:60; }
.quick-source :deep(.selected-label), .quick-source :deep(.option-label) { font-size:13px; }
.shortcut-keys { display:flex; align-items:center; gap:3px; }
.mobile-toast { position:fixed; z-index:2000; top:max(24px, var(--safe-top)); left:50%; transform:translateX(-50%); max-width:calc(100% - 32px); padding:12px 18px; border:1px solid var(--border); border-radius:10px; background:var(--surface); color:var(--text-primary); box-shadow:0 10px 28px rgba(0,0,0,.15); }
@media (max-width:600px) { .quick-source-label { font-size:12px; } .shortcut-keys { gap:2px; } }

/* Compact navigation, independent search dialog and catalogue footer. */
.search-row { gap:24px; }
.top-actions { display:flex; align-items:center; gap:8px; margin-left:auto; min-width:0; }
.header-search, .header-action { display:flex; align-items:center; justify-content:center; gap:8px; height:40px; min-height:40px; margin:0; padding:0 12px; border:1px solid var(--border); border-radius:9px; background:var(--surface); color:var(--text-secondary); font-size:13px; line-height:1.4; box-sizing:border-box; }
.header-search::after, .header-action::after, .footer-link::after, .search-dialog-done::after { border:0; }
.header-search { justify-content:flex-start; width:240px; min-width:0; background:var(--bg-primary); text-align:left; }
.header-search-label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.header-search:hover, .header-action:hover, .footer-link:hover { color:var(--text-primary); border-color:var(--accent); }
.header-search:focus-visible, .header-action:focus-visible, .footer-link:focus-visible, .search-dialog-done:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.source-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:12px 24px; padding:24px 32px 8px; }
.source-toolbar .market-info { flex:1; min-width:0; }
.catalogue-heading { padding-top:18px; }
.market-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-top:28px; padding:18px 0 8px; border-top:1px solid var(--border); color:var(--text-tertiary); font-size:12px; }
.feed-chunk { padding-bottom:14px; }
.feed-list, .plugin-scroll :deep(.uni-scroll-view) { overflow-anchor:none; }
.compact-mode .feed-chunk { padding-bottom:1px; }
.feed-progress { padding:12px 0; color:var(--text-tertiary); font-size:var(--font-caption); text-align:center; }
.footer-links { display:flex; align-items:center; gap:18px; }
.footer-link { display:flex; align-items:center; gap:6px; margin:0; padding:4px; border:0; background:transparent; color:var(--text-secondary); font-size:12px; line-height:1.5; }
.footer-icon { width:16px; height:16px; }
.search-dialog { display:flex; flex-direction:column; gap:24px; padding:32px; box-sizing:border-box; }
.search-dialog-heading { display:flex; flex-direction:column; gap:6px; padding-right:48px; }
.search-dialog-eyebrow { color:var(--accent); font-size:11px; font-weight:700; letter-spacing:.1em; }
.search-dialog-title { color:var(--text-primary); font-size:25px; font-weight:700; line-height:1.3; }
.search-dialog-subtitle, .search-dialog-count { color:var(--text-secondary); font-size:13px; }
.search-dialog-bottom { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:4px; }
.search-dialog-done { margin:0; padding:9px 16px; border:0; border-radius:8px; background:var(--accent); color:var(--on-accent); font-size:13px; line-height:1.4; }
.filter-label-mobile { display:none; }
@media (max-width:900px) { .search-row { gap:12px; } .header-search { width:180px; } .header-action { width:40px; padding:0; } .header-action text { display:none; } }
@media (max-width:600px) {
 .search-row { flex-wrap:wrap; gap:8px; padding:8px 16px 12px; }
 .top-actions { display:contents; }
 .header-action { order:1; width:36px; height:36px; min-height:36px; }
 .header-agent { margin-left:auto; }
 .header-search { order:2; width:100%; height:40px; }
 .source-toolbar { padding:18px 16px 4px; gap:8px; }
 .source-toolbar .quick-source { width:100%; }
 .source-toolbar .market-info { flex-basis:100%; }
 .function-actions { display:flex; width:auto; }
 .pagination-actions { position:fixed; left:50%; bottom:calc(12px + max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px))); z-index:10; display:flex; width:max-content; max-width:calc(100vw - 32px); margin:0; padding:6px; gap:8px; transform:translateX(-50%); border:1px solid var(--border); border-radius:12px; background:var(--surface); box-shadow:0 8px 24px rgba(0,0,0,.18); }
 .pagination-actions .page-nav-btn { min-height:40px; padding:8px 14px; }
 .pagination-actions .page-status { min-width:48px; }
 .shortcut-keys, .filter-label-desktop { display:none; }
 .filter-label-mobile { display:inline; }
 .plugin-scroll { --scroll-padding:8px 16px calc(96px + max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px))); }
 .header-actions { flex-wrap:wrap; }
 .search-dialog { padding:28px 20px; }
 .search-dialog-title { font-size:22px; }
}

/* Inline search remains available alongside the header actions. */
.search-row .top-actions :deep(.header-search-field) { flex:0 1 240px; width:240px; max-width:240px; min-width:0; padding:0; }
.header-search-field :deep(.search-bar) { min-height:40px; height:40px; border-radius:9px; background:var(--bg-primary); }
.header-search-field :deep(.search-input) { font-size:13px; }
.header-search-field :deep(.search-tags) { margin-top:6px; }
@media (max-width:900px) {
 .search-row .top-actions :deep(.header-search-field) { flex-basis:180px; width:180px; max-width:180px; }
}
@media (max-width:600px) {
 .search-row { column-gap:4px; }
 .search-row :deep(.brand-badge) { gap:5px; padding:0; }
 .search-row :deep(.badge-logo) { width:26px; height:26px; }
 .search-row :deep(.brand-name) { font-size:12px; }
 .search-row .top-actions :deep(.header-search-field) { order:2; flex:0 0 100%; width:100%; max-width:none; }
}
@media (max-width:360px) {
 .search-row :deep(.brand-badge) { position:relative; }
 .search-row :deep(.brand-copy) { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0, 0, 0, 0); white-space:nowrap; }
}

</style>
