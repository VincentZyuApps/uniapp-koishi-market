<template>
	<view class="drawer-layer" :class="{ 'is-open': open }" :aria-hidden="!open" :inert="!open || undefined">
		<view class="drawer-backdrop" @click="close" @touchmove.stop.prevent></view>
		<view id="market-filter-dialog" class="sidebar" role="dialog" aria-modal="true" aria-labelledby="filter-heading" tabindex="-1">
			<view class="drawer-header">
				<text id="filter-heading" class="drawer-title">筛选与排序</text>
				<button tabindex="0" role="button" class="drawer-close" aria-label="关闭筛选面板" @click="close">✕</button>
			</view>
			<styled-scroll-view class="sidebar-content" :scroll-enabled="open">
				<view class="filter-group">
					<view class="filter-title">排序方式</view>
					<button tabindex="0" role="button" v-for="sort in sortOptions" :key="sort.key" class="filter-item" :class="{ active: activeSort === sort.key }" :aria-pressed="activeSort === sort.key" @click="handleSortClick(sort.key)">
						<text class="filter-icon">{{ sort.icon }}</text>
						<text class="filter-text">{{ sort.label }}</text>
						<text v-if="activeSort === sort.key" class="order-icon">{{ sortOrder === 'desc' ? '↓' : '↑' }}</text>
					</button>
				</view>
				<view class="filter-group">
					<view class="filter-title">筛选条件</view>
					<button tabindex="0" role="button" v-for="badge in badges" :key="badge.key" class="filter-item" :class="{ active: activeBadges.includes(badge.key), [badge.key]: true }" :aria-pressed="activeBadges.includes(badge.key)" @click="handleBadgeClick(badge.key)">
						<text class="filter-icon">{{ badge.icon }}</text>
						<text class="filter-text">{{ badge.label }}</text>
						<text class="filter-count">{{ badge.count || 0 }}</text>
					</button>
				</view>
				<view class="filter-group">
					<view class="filter-title">插件分类</view>
					<button tabindex="0" role="button" v-for="category in categories" :key="category.key" class="filter-item" :class="{ active: activeCategory === category.key }" :aria-pressed="activeCategory === category.key" @click="handleCategoryClick(category.key)">
						<text class="filter-icon">{{ category.icon }}</text>
						<text class="filter-text">{{ category.label }}</text>
						<text class="filter-count">{{ category.count || 0 }}</text>
					</button>
				</view>
			</styled-scroll-view>
			<view class="drawer-footer"><button tabindex="0" role="button" class="drawer-done" @click="close">完成</button></view>
		</view>
	</view>
</template>
<script setup>
import { toRef } from 'vue'
import { useDrawerFocus } from '@/utils/layout.js'
import StyledScrollView from '@/components/styled-scroll-view/styled-scroll-view.vue'

const props = defineProps({
	open: {
		type: Boolean,
		default: false
	},
	marketInfo: {
		type: Object,
		default: () => ({})
	},
	sortOptions: {
		type: Array,
		required: true
	},
	activeSort: {
		type: String,
		default: 'default'
	},
	sortOrder: {
		type: String,
		default: 'desc'
	},
	badges: {
		type: Array,
		required: true
	},
	activeBadges: {
		type: Array,
		default: () => []
	},
	categories: {
		type: Array,
		required: true
	},
	activeCategory: {
		type: String,
		default: ''
	}
})

const emit = defineEmits(['close', 'sort-change', 'badge-change', 'category-change'])

const close = () => emit('close')
useDrawerFocus(toRef(props, 'open'), 'market-filter-dialog', close)

const handleSortClick = (key) => {
	emit('sort-change', key)
}

const handleBadgeClick = (key) => {
	emit('badge-change', key)
}

const handleCategoryClick = (key) => {
	emit('category-change', key)
}
</script>

<style scoped>
.drawer-layer {
	position: fixed;
	inset: 0;
	z-index: 1000;
	visibility: hidden;
	pointer-events: none;
	transition: visibility 0.25s;
}
.drawer-layer.is-open {
	visibility: visible;
	pointer-events: auto;
}
.drawer-backdrop {
	position: absolute;
	inset: 0;
	background: var(--overlay-backdrop);
	opacity: 0;
	transition: opacity 0.25s;
}
.is-open .drawer-backdrop {
	opacity: 1;
}
.sidebar {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	width: 320px;
	max-width: calc(100vw - 64px);
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	padding-top: max(var(--safe-top, 0px), env(safe-area-inset-top, 0px));
	padding-bottom: max(var(--safe-bottom, 0px), env(safe-area-inset-bottom, 0px));
	background: var(--surface);
	color: var(--text-primary);
	transform: translateX(-100%);
	transition: transform 0.25s ease;
	overscroll-behavior: contain;
}
.is-open .sidebar {
	transform: translateX(0);
}
.drawer-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 8px 16px;
	border-bottom: 1px solid var(--border);
	flex-shrink: 0;
}
.drawer-title {
	font-size: var(--font-section);
	font-weight: 600;
}
.drawer-close, .drawer-done, .filter-item {
	margin: 0;
	font: inherit;
	border: 0;
	border-radius: 8px;
}
.drawer-close::after, .drawer-done::after, .filter-item::after {
	border: 0;
}
.drawer-close {
	width: 36px;
	height: 36px;
	padding: 0;
	line-height: 36px;
	background: var(--bg-secondary);
	color: var(--text-primary);
	flex-shrink: 0;
}
.sidebar-content {
	flex: 1;
	min-height: 0;
	height: 0;
	--scroll-padding: 2px 16px 10px;
}
.filter-group {
	padding: 10px 0;
	border-bottom: 1px solid var(--border);
}
.filter-group:last-child {
	border-bottom: 0;
}
.filter-title {
	font-size: var(--font-caption);
	line-height: 1.5;
	font-weight: 600;
	color: var(--text-secondary);
	margin-bottom: 4px;
}
.filter-item {
	display: flex;
	width: 100%;
	min-height: 34px;
	padding: 4px 8px;
	gap: 8px;
	align-items: center;
	background: transparent;
	color: var(--text-secondary);
	text-align: left;
	box-sizing: border-box;
	transition: color 0.2s, background-color 0.2s;
}
.filter-item.active {
	background: var(--accent-soft);
	color: var(--accent);
	font-weight: 600;
}
.filter-item.verified.active, .filter-item.newborn.active {
	color: var(--success-color);
}
.filter-item.preview.active, .filter-item.portable.active {
	color: var(--warning-color);
}
.filter-item.insecure.active {
	color: var(--danger-color);
}
.filter-icon {
	flex: 0 0 24px;
	width: 24px;
	font-size: 20px;
	line-height: 24px;
	text-align: center;
}
.filter-text {
	flex: 1;
	min-width: 0;
	overflow-wrap: anywhere;
	font-size: var(--font-body);
	line-height: 1.5;
}
.spacer {
	display: none;
}
.filter-count, .order-icon {
	flex-shrink: 0;
	min-width: 32px;
	font-size: var(--font-caption);
	text-align: right;
	font-variant-numeric: tabular-nums;
}
.drawer-footer {
	padding: 8px 16px;
	border-top: 1px solid var(--border);
	flex-shrink: 0;
}
.drawer-done {
	min-height: 36px;
	line-height: 1.5;
	padding: 6px 12px;
	background: var(--accent);
	color: var(--on-accent);
}
.drawer-close:focus-visible,
.drawer-done:focus-visible,
.filter-item:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}
@media (hover: hover) {
	.filter-item:hover {
		background: var(--accent-soft);
		color: var(--accent);
	}
}
</style>
