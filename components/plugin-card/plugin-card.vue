<template>
	<view class="plugin-card" @click="handleClick">
		<!-- 头部：图标 + 名称 + 评分 -->
		<view class="card-header">
			<view class="icon-container">
				<view class="category-icon">
					<text>{{ getCategoryIcon(plugin.category) }}</text>
				</view>
			</view>
			
			<view class="header-main">
				<view class="title-row">
					<text class="plugin-name">{{ plugin.shortname || plugin.name }}</text>
					<view v-if="badge" class="badge-icon" :class="badge.type">
						<text>{{ getBadgeIcon(badge.type) }}</text>
					</view>
				</view>
				
				<view class="rating-row">
					<view class="stars">
						<text 
							v-for="i in 5" 
							:key="i" 
							class="star"
							:class="{ filled: i <= Math.round(plugin.rating || 0) }"
						>★</text>
					</view>
					<text class="rating-value">{{ (plugin.rating || 0).toFixed(1) }}</text>
				</view>
			</view>
		</view>
		
		<!-- 描述 -->
		<view class="card-description">
			<text class="description-text">{{ previewDescription }}</text>
		</view>
		
		<!-- 底部：版本、大小、下载量、作者 -->
		<view class="card-footer">
			<view class="footer-top">
				<view v-if="plugin.installSize" class="footer-item">
					<text class="footer-icon">📦</text>
					<text class="footer-text">{{ formatSize(plugin.installSize) }}</text>
				</view>
				
				<view v-if="plugin.downloads" class="footer-item">
					<text class="footer-icon">📥</text>
					<text class="footer-text">{{ plugin.downloads }}</text>
				</view>
			</view>
			
			<view class="footer-bottom">
				<view class="footer-item footer-version">
					<text class="footer-icon">🏷️</text>
					<text class="footer-text">{{ plugin.version }}</text>
				</view>
				
				<view class="author-avatar" v-if="authorEmail" :class="{ 'avatar-loading': avatarLoading }">
					<image 
						class="avatar-img" 
						:class="{ 'avatar-loaded': !avatarLoading }"
						:src="getAvatarUrl(authorEmail)"
						mode="aspectFill"
						@load="onAvatarLoad"
						@error="handleAvatarError"
					/>
				</view>
				<view class="author-avatar" v-else>
					<text class="avatar-text">{{ getAvatarText(plugin.author) }}</text>
				</view>
			</view>
		</view>
</view>
</template><script setup>
import { computed, ref, watch } from 'vue'
import { simpleMd5 } from '@/utils/md5.js'

const props = defineProps({
	plugin: {
		type: Object,
		required: true
	}
})

const emit = defineEmits(['click'])

const avatarError = ref(false)
const avatarLoading = ref(true)

// 获取作者邮箱
const authorEmail = computed(() => {
	if (avatarError.value) return null
	
	const plugin = props.plugin
	
	// 优先从 _raw.package.publisher 获取
	if (plugin._raw?.package?.publisher?.email) {
		return plugin._raw.package.publisher.email
	}
	
	// 从 _raw.package.maintainers 获取
	if (plugin._raw?.package?.maintainers?.length > 0) {
		const email = plugin._raw.package.maintainers[0].email
		if (email) return email
	}
	
	// 兼容旧格式：从 package.publisher 获取
	if (plugin.package?.publisher?.email) {
		return plugin.package.publisher.email
	}
	
	return null
})

watch(authorEmail, () => {
	avatarLoading.value = true
})

// 获取 Gravatar 头像 URL
const getAvatarUrl = (email) => {
	if (!email) return ''
	// 使用 Gravatar 服务
	// d=identicon 会生成几何图案作为默认头像
	// s=48 指定大小为 48x48 像素
	const hash = simpleMd5(email.toLowerCase().trim())
	return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=96`
}

// 处理头像加载成功
const onAvatarLoad = () => {
	avatarLoading.value = false
}

// 处理头像加载错误
const handleAvatarError = () => {
	avatarError.value = true
}

// 获取插件徽章
const badge = computed(() => {
	if (props.plugin.verified) return { type: 'verified', query: 'is:verified' }
	if (props.plugin.insecure) return { type: 'insecure', query: 'is:insecure' }
	if (props.plugin.preview) return { type: 'preview', query: 'is:preview' }
	if (props.plugin.newborn) return { type: 'newborn', query: 'is:newborn' }
	if (props.plugin.portable) return { type: 'portable', query: 'is:portable' }
	return null
})

const previewDescription = computed(() => {
	const rawDescription = typeof props.plugin.description === 'object'
		? (props.plugin.description?.['zh-CN'] || props.plugin.description?.zh || props.plugin.description?.en || '')
		: (props.plugin.description || '')

	return String(rawDescription)
		.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/__([^_]+)__/g, '$1')
		.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
		.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
})

// 获取分类图标
const getCategoryIcon = (category) => {
	const icons = {
		adapter: '🔌',
		extension: '🧩',
		tool: '🔧',
		game: '🎮',
		image: '🖼️',
		manage: '⚙️',
		general: '📦',
		preset: '📋',
		ai: '🤖',
		gametool: '🎯',
		life: '🌟',
		media: '🎬',
		meme: '😄',
		webui: '🌐',
		core: '💎',
		other: '📄'
	}
	return icons[category] || '📦'
}

// 获取徽章图标
const getBadgeIcon = (type) => {
	const icons = {
		verified: '✓',
		preview: '👁',
		insecure: '⚠',
		portable: '📦',
		newborn: '🎉'
	}
	return icons[type] || ''
}

// 格式化大小
const formatSize = (bytes) => {
	if (!bytes) return ''
	if (bytes >= 1024 * 1024 * 1000) {
		return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
	} else if (bytes >= 1024 * 1000) {
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
	} else {
		return (bytes / 1024).toFixed(1) + ' KB'
	}
}

// 获取作者头像文字
const getAvatarText = (author) => {
	if (!author) return '?'
	return author.charAt(0).toUpperCase()
}

const handleClick = () => {
	emit('click', props.plugin)
}


</script>

<style scoped>
.plugin-card {
	width: 100%;
	height: 392rpx;
	background-color: var(--bg-secondary, #fff);
	border-radius: 12rpx;
	padding: 24rpx 22rpx 18rpx 24rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 18rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 0 0 2rpx transparent inset;
	cursor: pointer;
	position: relative;
	overflow: hidden;
}

/* 卡片光泽效果 */
.plugin-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 50%;
	height: 100%;
	background: linear-gradient(
		90deg,
		transparent,
		rgba(255, 255, 255, 0.1),
		transparent
	);
	transition: left 0.5s ease;
	pointer-events: none;
}

.plugin-card:hover::before {
	left: 100%;
}

.plugin-card:hover {
	box-shadow: 0 0 0 2rpx var(--primary-color, #5546a3) inset, 0 12rpx 32rpx rgba(85, 70, 163, 0.2);
	transform: translateY(-6rpx) scale(1.02);
}

/* 点击效果 */
.plugin-card:active {
	transform: translateY(-2rpx) scale(0.98);
	transition: all 0.1s ease;
}

/* 头部 */
.card-header {
	display: flex;
	gap: 32rpx;
	flex-shrink: 0;
}

.icon-container {
	flex-shrink: 0;
}

.category-icon {
	width: 112rpx;
	height: 112rpx;
	border-radius: 16rpx;
	border: 1rpx solid var(--border-color, #e8e8e8);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 56rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.plugin-card:hover .category-icon {
	transform: scale(1.1) rotate(5deg);
	border-color: var(--primary-color, #5546a3);
	box-shadow: 0 4rpx 16rpx rgba(85, 70, 163, 0.2);
}

.header-main {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	min-width: 0;
}

.title-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.plugin-name {
	font-size: 36rpx;
	font-weight: 600;
	color: var(--text-primary, #1f2328);
	line-height: 1.5;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
	min-width: 0;
}

.badge-icon {
	flex-shrink: 0;
	width: 36rpx;
	height: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	position: relative;
	z-index: 1;
}

.badge-icon > text {
	position: relative;
	z-index: 1;
}

.badge-icon.verified {
	color: var(--success-color, #1a7f37);
}

.badge-icon.verified::before,
.badge-icon.insecure::before {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: 50%;
	z-index: 0;
}

.badge-icon.verified::before {
	background-color: rgba(26, 127, 55, 0.14);
}

.badge-icon.preview {
	color: var(--warning-color, #bf8700);
}

.badge-icon.insecure {
	color: var(--danger-color, #d1242f);
}

.badge-icon.insecure::before {
	background-color: rgba(209, 36, 47, 0.14);
}

:global(.dark-mode) .badge-icon.verified::before {
	background-color: rgba(46, 160, 67, 0.22);
}

:global(.dark-mode) .badge-icon.insecure::before {
	background-color: rgba(248, 81, 73, 0.22);
}

.badge-icon.portable {
	color: var(--primary-color, #5546a3);
}

.badge-icon.newborn {
	color: var(--success-color, #1a7f37);
}

.rating-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
	height: 48rpx;
}

.stars {
	display: flex;
	gap: 8rpx;
}

.star {
	font-size: 28rpx;
	color: #d0d7de;
	line-height: 1;
	transition: all 0.3s ease;
	display: inline-block;
}

.star.filled {
	color: var(--warning-color, #bf8700);
}

/* 悬浮时星星依次跳动 */
.plugin-card:hover .star {
	animation: starBounce 0.5s ease forwards;
}

.plugin-card:hover .star:nth-child(1) { animation-delay: 0s; }
.plugin-card:hover .star:nth-child(2) { animation-delay: 0.05s; }
.plugin-card:hover .star:nth-child(3) { animation-delay: 0.1s; }
.plugin-card:hover .star:nth-child(4) { animation-delay: 0.15s; }
.plugin-card:hover .star:nth-child(5) { animation-delay: 0.2s; }

@keyframes starBounce {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.3); }
}

.rating-value {
	font-size: 24rpx;
	color: var(--text-tertiary, #999);
	margin-left: 4rpx;
}

/* 描述 */
.card-description {
	flex: 1;
	font-size: 30rpx;
	line-height: 1.5;
	color: var(--text-secondary, #656d76);
	overflow: hidden;
	position: relative;
	word-break: break-word;
	margin: 0;
	min-height: 0;
	max-height: 3.3em;
}

.description-text {
	display: block;
	white-space: normal;
	word-break: break-word;
}

.card-description::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 1.5em;
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 0),
		var(--bg-secondary, #fff)
	);
	pointer-events: none;
}

/* 底部 */
.card-footer {
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	gap: 8rpx;
	flex-shrink: 0;
	font-size: 28rpx;
	color: var(--text-secondary, #656d76);
	overflow: hidden;
	transition: all 0.3s ease;
}

.footer-top,
.footer-bottom {
	display: flex;
	align-items: center;
	min-width: 0;
}

.footer-top {
	gap: 16rpx;
	min-height: 36rpx;
}

.footer-bottom {
	gap: 12rpx;
}

.footer-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
	min-width: 0;
	overflow: hidden;
	transition: all 0.3s ease;
}

.footer-version {
	flex: 1;
}

.footer-version .footer-text {
	flex: 1;
	min-width: 0;
}

.plugin-card:hover .footer-item {
	color: var(--primary-color, #5546a3);
}

.footer-icon {
	font-size: 24rpx;
	flex-shrink: 0;
	width: 32rpx;
	margin-right: 4rpx;
	vertical-align: -2rpx;
	transition: transform 0.3s ease;
}

.plugin-card:hover .footer-icon {
	transform: scale(1.2);
}

.footer-text {
	font-size: 28rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.author-avatar {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	cursor: pointer;
	vertical-align: middle;
	overflow: hidden;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.plugin-card:hover .author-avatar {
	transform: translate(-5rpx, -5rpx) scale(1.18) rotate(10deg);
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	opacity: 0;
	transition: opacity 0.3s ease;
}

.avatar-loaded {
	opacity: 1;
}

/* 加载中旋转动画 */
.avatar-loading {
	background: transparent !important;
	border: 4rpx solid transparent;
	border-top-color: var(--primary-color, #5546a3);
	animation: avatarSpin 0.8s linear infinite;
}

@keyframes avatarSpin {
	to { transform: rotate(360deg); }
}

.avatar-text {
	color: white;
	font-size: 24rpx;
	font-weight: bold;
}

@media (max-width: 900px) {
	.plugin-card {
		height: auto;
		min-height: 300rpx;
		padding: 20rpx 18rpx 14rpx 20rpx;
		gap: 14rpx;
	}

	.card-header {
		gap: 22rpx;
	}

	.category-icon {
		width: 92rpx;
		height: 92rpx;
		font-size: 46rpx;
	}

	.plugin-name {
		font-size: 31rpx;
		line-height: 1.4;
	}

	.badge-icon {
		width: 32rpx;
		height: 32rpx;
		font-size: 32rpx;
	}

	.stars {
		gap: 5rpx;
	}

	.star {
		font-size: 24rpx;
	}

	.rating-value {
		font-size: 22rpx;
	}

	.card-description {
		font-size: 24rpx;
		line-height: 1.45;
		max-height: 3.05em;
	}

	.card-footer {
		gap: 10rpx;
		height: 40rpx;
		font-size: 22rpx;
		margin-bottom: 0;
	}

	.footer-item {
		gap: 5rpx;
	}

	.footer-icon {
		width: 24rpx;
		font-size: 20rpx;
		margin-right: 0;
	}

	.footer-text {
		font-size: 22rpx;
	}

	.author-avatar {
		width: 40rpx;
		height: 40rpx;
	}

	.avatar-text {
		font-size: 20rpx;
	}
}

@media (max-width: 600px) {
	.plugin-card {
		min-height: 276rpx;
		padding: 18rpx 16rpx 12rpx 18rpx;
		gap: 12rpx;
		border-radius: 10rpx;
	}

	.card-header {
		gap: 20rpx;
	}

	.category-icon {
		width: 84rpx;
		height: 84rpx;
		border-radius: 12rpx;
		font-size: 42rpx;
	}

	.plugin-name {
		font-size: 30rpx;
		line-height: 1.35;
	}

	.badge-icon {
		width: 30rpx;
		height: 30rpx;
		font-size: 30rpx;
	}

	.rating-row {
		gap: 6rpx;
		height: 40rpx;
	}

	.stars {
		gap: 4rpx;
	}

	.star {
		font-size: 24rpx;
	}

	.rating-value {
		font-size: 22rpx;
	}

	.card-description {
		font-size: 25rpx;
		line-height: 1.45;
		max-height: 3.05em;
	}

	.card-footer {
		gap: 10rpx;
		font-size: 22rpx;
	}

	.footer-top {
		gap: 10rpx;
		min-height: 32rpx;
	}

	.footer-bottom {
		gap: 10rpx;
	}

	.footer-item {
		gap: 4rpx;
	}

	.footer-icon {
		width: 24rpx;
		font-size: 20rpx;
		margin-right: 0;
	}

	.footer-text {
		font-size: 22rpx;
	}

	.author-avatar {
		width: 40rpx;
		height: 40rpx;
	}

	.avatar-text {
		font-size: 20rpx;
	}
}

@media (max-width: 375px) {
	.plugin-card {
		min-height: 252rpx;
		padding: 16rpx 14rpx 10rpx 16rpx;
		gap: 10rpx;
	}

	.category-icon {
		width: 76rpx;
		height: 76rpx;
		font-size: 38rpx;
	}

	.plugin-name {
		font-size: 28rpx;
	}

	.card-description {
		font-size: 23rpx;
		max-height: 3.05em;
	}

	.card-footer {
		gap: 8rpx;
	}

	.footer-top,
	.footer-bottom {
		gap: 8rpx;
	}

	.footer-text {
		font-size: 20rpx;
	}

	.author-avatar {
		width: 36rpx;
		height: 36rpx;
	}
}
</style>
