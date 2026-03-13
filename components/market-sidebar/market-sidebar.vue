<template>
	<view class="sidebar" :class="{ collapsed: collapsed }">
		<!-- 折叠按钮 -->
		<view class="collapse-btn" @click="toggleCollapse">
			<text class="iconfont">{{ collapsed ? '►' : '◄' }}</text>
		</view>
		
		<scroll-view class="sidebar-content" scroll-y v-if="!collapsed">
			<!-- 排序方式 -->
			<view class="filter-group">
				<view class="filter-title">排序方式</view>
				<view 
					v-for="sort in sortOptions" 
					:key="sort.key"
					class="filter-item"
					:class="{ active: activeSort === sort.key }"
					@click="handleSortClick(sort.key)"
				>
					<text class="filter-icon">{{ sort.icon }}</text>
					<text class="filter-text">{{ sort.label }}</text>
					<view class="spacer"></view>
					<text v-if="activeSort === sort.key" class="order-icon">
						{{ sortOrder === 'desc' ? '↓' : '↑' }}
					</text>
				</view>
			</view>
			
			<!-- 筛选条件 -->
			<view class="filter-group">
				<view class="filter-title">筛选条件</view>
				<view 
					v-for="badge in badges" 
					:key="badge.key"
					class="filter-item"
					:class="{ 
						active: activeBadges.includes(badge.key),
						[badge.key]: true 
					}"
					@click="handleBadgeClick(badge.key)"
				>
					<text class="filter-icon">{{ badge.icon }}</text>
					<text class="filter-text">{{ badge.label }}</text>
					<view class="spacer"></view>
					<text class="filter-count">{{ badge.count || 0 }}</text>
				</view>
			</view>
			
			<!-- 分类 -->
			<view class="filter-group">
				<view class="filter-title">插件分类</view>
				<view 
					v-for="category in categories" 
					:key="category.key"
					class="filter-item"
					:class="{ active: activeCategory === category.key }"
					@click="handleCategoryClick(category.key)"
				>
					<text class="filter-icon">{{ category.icon }}</text>
					<text class="filter-text">{{ category.label }}</text>
					<view class="spacer"></view>
					<text class="filter-count">{{ category.count || 0 }}</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
const props = defineProps({
	collapsed: {
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

const emit = defineEmits(['toggle', 'sort-change', 'badge-change', 'category-change'])

const toggleCollapse = () => {
	emit('toggle')
}

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
.sidebar {
	width: 400rpx;
	background-color: var(--bg-secondary, #f8f8f9);
	border-right: 2rpx solid var(--border-color, #d0d7de);
	position: relative;
	transition: width 0.3s ease;
	flex-shrink: 0;
}

.sidebar.collapsed {
	width: 80rpx;
}

/* 移动端样式 - 侧边栏占满整个页面 */
@media (max-width: 768rpx) {
	.sidebar {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 100vw !important;
		z-index: 1000;
		transform: translateX(-100%);
		transition: transform 0.3s ease;
		box-shadow: 4rpx 0 24rpx rgba(0, 0, 0, 0.2);
	}
	
	.sidebar:not(.collapsed) {
		transform: translateX(0);
	}
	
	.sidebar.collapsed {
		width: 100rpx !important;
		transform: translateX(-100%);
	}
	
	.collapse-btn {
		right: 20rpx;
		top: 20rpx;
		width: 80rpx;
		height: 80rpx;
		font-size: 32rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
	}
	
	.sidebar-content {
		padding: 40rpx;
		padding-top: 120rpx;
	}
}


.collapse-btn {
	position: absolute;
	right: 10rpx;
	top: 20rpx;
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--bg-primary, #ffffff);
	border-radius: 50%;
	font-size: 24rpx;
	z-index: 10;
	cursor: pointer;
	color: var(--text-primary, #1f2328);
	border: 2rpx solid var(--border-color, #d0d7de);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapse-btn:hover {
	background-color: var(--primary-color, #5546a3);
	color: #fff;
	border-color: var(--primary-color, #5546a3);
	transform: scale(1.1);
	box-shadow: 0 4rpx 16rpx rgba(85, 70, 163, 0.3);
}

.collapse-btn:active {
	transform: scale(0.95);
}

.sidebar-content {
	height: 100%;
	padding: 32rpx;
	padding-top: 100rpx;
	overflow-y: auto;
}

.filter-group {
	margin-bottom: 48rpx;
}

.filter-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary, #1f2328);
	margin-bottom: 24rpx;
	line-height: 1;
}

.filter-item {
	display: flex;
	align-items: center;
	padding: 0 16rpx;
	margin: 8rpx 0;
	border-radius: 8rpx;
	font-size: 28rpx;
	color: var(--k-text-normal, #656d76);
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	min-width: 0;
	overflow: hidden;
	height: 48rpx;
	z-index: 2;
	gap: 8rpx;
	position: relative;
}

/* 悬浮背景效果 */
.filter-item::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	width: 0;
	height: 100%;
	background: var(--primary-color, #5546a3);
	opacity: 0.1;
	border-radius: 8rpx;
	transition: width 0.3s ease;
}

.filter-item:hover::before {
	width: 100%;
}

.filter-item:hover {
	color: var(--k-text-dark, #1f2328);
	transform: translateX(8rpx);
}

.filter-item:active {
	transform: translateX(4rpx) scale(0.98);
}

.filter-item.active {
	color: var(--k-text-active, #5546a3);
	font-weight: 600;
}

.filter-item.active::before {
	width: 100%;
	opacity: 0.15;
}

.filter-item.verified.active {
	color: var(--success-color, #1a7f37);
}

.filter-item.newborn.active {
	color: var(--success-color, #1a7f37);
}

.filter-item.preview.active {
	color: var(--warning-color, #bf8700);
}

.filter-item.portable.active {
	color: var(--warning-color, #bf8700);
}

.filter-item.insecure.active {
	color: var(--danger-color, #d1242f);
}

.filter-item.disabled {
	opacity: 0.5;
	text-decoration: line-through 4rpx;
}

.filter-icon {
	margin-right: 8rpx;
	font-size: 32rpx;
	display: inline-flex;
	width: 56rpx;
	align-items: center;
	justify-content: center;
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-item:hover .filter-icon {
	transform: scale(1.2) rotate(10deg);
}

.filter-text {
	flex: 0 1 auto;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	line-height: 40rpx;
	font-size: 28rpx;
	font-weight: 500;
}

.spacer {
	flex: 0 0 auto;
	width: auto;
}

.filter-count {
	font-size: 32rpx;
	line-height: 40rpx;
	color: var(--text-tertiary, #8c959f);
	font-weight: 500;
	flex-shrink: 0;
	min-width: 40rpx;
	text-align: left;
}

.order-icon {
	display: inline-flex;
	width: 56rpx;
	align-items: center;
	justify-content: center;
}

/* 移动端优化 */
@media (max-width: 768rpx) {
	.market-sidebar.show {
		width: 85vw;
		max-width: 600rpx;
		box-shadow: 4rpx 0 16rpx rgba(0, 0, 0, 0.2);
	}

	.collapse-btn {
		position: fixed;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10001;
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		transition: all 0.3s ease, left 0.3s ease, right 0.3s ease;
	}

	.market-sidebar:not(.show) .collapse-btn {
		left: -80rpx;
	}

	.market-sidebar.show .collapse-btn {
		right: -30rpx;
		left: auto;
	}
}
</style>
