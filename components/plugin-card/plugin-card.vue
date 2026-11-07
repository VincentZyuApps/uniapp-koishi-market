<template>
	<view class="plugin-card" role="button" tabindex="0" @click="handleClick" @keydown.enter.prevent="handleClick" @keydown.space.prevent="handleClick">
		<view class="card-header">
			<view class="category-icon"><image class="category-image" :src="packageIcon" mode="aspectFit" /></view>
			<view class="header-main"><view class="title-row"><text class="plugin-name">{{ plugin.shortname || plugin.name }}</text><image v-if="badge" class="badge-image" :alt="badgeLabel" :src="badgeIcon" mode="aspectFit" /><image class="card-arrow" :src="uiIcons['arrow-right']" mode="aspectFit" /></view><text class="category-label">{{ categoryLabel }}</text></view>
		</view>
		<view class="card-description"><text class="description-text">{{ previewDescription }}</text></view>
		<view class="card-metrics"><view class="metric" :aria-label="'评分 ' + (plugin.rating || 0).toFixed(1)"><image :src="uiIcons.star" mode="aspectFit" /><text>{{ (plugin.rating || 0).toFixed(1) }}</text></view><view class="metric" :aria-label="'下载量 ' + (plugin.downloads || 0)"><image :src="uiIcons.download" mode="aspectFit" /><text>{{ plugin.downloads || 0 }}</text></view><view class="metric" :aria-label="'大小 ' + (formatSize(plugin.installSize) || '未知')"><image :src="uiIcons.box" mode="aspectFit" /><text>{{ formatSize(plugin.installSize) || '—' }}</text></view></view>
		<view class="card-footer"><view class="footer-item"><text class="footer-icon">版本</text><text class="footer-text">{{ plugin.version }}</text></view><view :id="avatarId" class="author-avatar"><image v-if="avatarSrc" :key="avatarSrc" class="avatar-img" :src="avatarSrc" mode="aspectFill" @load="onAvatarLoad" @error="handleAvatarError" /><text v-else class="avatar-text">{{ getAvatarText(plugin.author) }}</text></view></view>
	</view>
</template><script setup>
import { computed, ref, watch, onMounted, onUnmounted, getCurrentInstance, nextTick } from 'vue'
import { AVATAR_MIRRORS, getAvatarUrl, getAvatarText } from '@/utils/avatar.js'
import { avatarSource, forgetAvatar, loadCachedAvatar, rememberAvatarUrl } from '@/utils/avatar-cache.js'
import packageIcon from '@/static/icons/package.png'
import { uiIcons } from '@/utils/ui-icons.js'

const props = defineProps({
	plugin: {
		type: Object,
		required: true
	},
	lazyAvatar: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])

const instance = getCurrentInstance()
const avatarId = 'plugin-avatar-' + instance.uid
const avatarSrc = ref('')
const avatarVisible = ref(!props.lazyAvatar)
const currentMirrorIndex = ref(0)
let avatarTimeoutTimer = null
let avatarObserver = null
let releaseAvatar = () => {}
let avatarRequest = 0
let disposed = false

const clearAvatarTimeout = () => {
	if (avatarTimeoutTimer) {
		clearTimeout(avatarTimeoutTimer)
		avatarTimeoutTimer = null
	}
}

const startAvatarTimeout = () => {
	clearAvatarTimeout()
	avatarTimeoutTimer = setTimeout(() => {
		handleAvatarError()
	}, 2500)
}

// 获取作者邮箱
const authorEmail = computed(() => {
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

function setAvatarSource(source, release = () => {}) {
	clearAvatarTimeout()
	releaseAvatar()
	releaseAvatar = release
	avatarSrc.value = source
	if (source) startAvatarTimeout()
}

async function loadAvatar() {
	const email = authorEmail.value
	if (!email || !avatarVisible.value) return
	const request = ++avatarRequest
	const url = getAvatarUrl(email, currentMirrorIndex.value)
	if (props.lazyAvatar) {
		const entry = await loadCachedAvatar(url)
		if (disposed || request !== avatarRequest) return
		if (entry) {
			const { source, release } = avatarSource(entry)
			setAvatarSource(source, release)
			return
		}
	}
	if (!disposed && request === avatarRequest) setAvatarSource(url)
}

watch([authorEmail, avatarVisible], () => {
	avatarRequest++
	currentMirrorIndex.value = 0
	setAvatarSource('')
	loadAvatar()
}, { immediate: true })

onMounted(async () => {
	if (!props.lazyAvatar) return
	await nextTick()
	if (disposed) return
	const showAvatar = () => {
		avatarVisible.value = true
		avatarObserver?.disconnect()
		avatarObserver = null
	}
	// #ifdef H5
	const element = document.getElementById(avatarId)
	if (element && typeof IntersectionObserver !== 'undefined') {
		avatarObserver = new IntersectionObserver(entries => {
			if (entries.some(entry => entry.isIntersecting)) showAvatar()
		}, { rootMargin: '200px 0px' })
		avatarObserver.observe(element)
		return
	}
	// #endif
	// #ifndef H5
	if (typeof uni.createIntersectionObserver === 'function') {
		try {
			avatarObserver = uni.createIntersectionObserver(instance.proxy)
			avatarObserver.relativeToViewport({ top: 200, bottom: 200 }).observe('#' + avatarId, result => {
				if (result.intersectionRatio > 0) showAvatar()
			})
			return
		} catch (_) { avatarObserver?.disconnect(); avatarObserver = null }
	}
	// #endif
	showAvatar()
})

onUnmounted(() => {
	disposed = true
	avatarRequest++
	avatarObserver?.disconnect()
	clearAvatarTimeout()
	releaseAvatar()
})

// 处理头像加载成功
const onAvatarLoad = () => {
	clearAvatarTimeout()
	if (props.lazyAvatar && authorEmail.value) {
		const url = getAvatarUrl(authorEmail.value, currentMirrorIndex.value)
		if (avatarSrc.value === url) rememberAvatarUrl(url)
	}
}

// 处理头像加载错误 / 超时，按优先级 fallback
const handleAvatarError = () => {
	clearAvatarTimeout()
	if (!authorEmail.value || !avatarSrc.value) return
	const url = getAvatarUrl(authorEmail.value, currentMirrorIndex.value)
	forgetAvatar(url)
	// A temporary path may have expired. Retry the original URL before changing mirrors.
	if (avatarSrc.value !== url) {
		setAvatarSource(url)
		return
	}
	if (currentMirrorIndex.value < AVATAR_MIRRORS.length - 1) {
		currentMirrorIndex.value++
		setAvatarSource('')
		loadAvatar()
	} else {
		setAvatarSource('')
	}
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

const categoryLabel = computed(() => {
	const labels = { adapter: '适配器', extension: '扩展功能', tool: '实用工具', game: '娱乐玩法', image: '图片服务', manage: '管理工具', general: '通用功能', other: '其他' }
	return labels[props.plugin.category] || props.plugin.category || '其他'
})

const badgeLabel = computed(() => ({ verified: '官方认证', preview: '预览版', insecure: '不安全', portable: '可移植', newborn: '新发布' })[badge.value?.type] || '')
const badgeIcon = computed(() => uiIcons[({ verified: 'shield-check', preview: 'eye', insecure: 'triangle-alert', portable: 'box', newborn: 'sparkles' })[badge.value?.type]] || uiIcons.box)

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

// getAvatarText 已由 @/utils/avatar.js 统一提供

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
	display: block;
}

.avatar-text {
	color: white;
	font-size: 24rpx;
	font-weight: bold;
}

.plugin-card {
	height: auto;
	min-height: 160px;
	padding: 12px;
	gap: 8px;
	border-radius: 10px;
}
.card-header {
	gap: 8px;
	align-items: flex-start;
	min-width: 0;
}
.icon-container {
	flex: 0 0 auto;
}
.category-icon {
	width: 40px;
	height: 40px;
	font-size: 26px;
	border-radius: 8px;
	box-sizing: border-box;
}
.title-row {
	gap: 4px;
	align-items: flex-start;
}
.plugin-name {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	white-space: normal;
	overflow-wrap: anywhere;
	font-size: var(--font-card, 16px);
	line-height: 1.5;
}
.badge-icon {
	width: 18px;
	height: 24px;
	font-size: 18px;
}
.rating-row {
	height: auto;
	min-height: 20px;
	flex-wrap: wrap;
	gap: 4px;
}
.stars {
	gap: 2px;
	flex-shrink: 0;
}
.star {
	font-size: 15px;
}
.rating-value {
	font-size: var(--font-caption, 13px);
}
.card-description {
	flex: 1;
	font-size: var(--font-body, 14px);
	line-height: 1.5;
	max-height: none;
	overflow-wrap: anywhere;
}
.description-text {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	overflow: hidden;
}
.card-description::after {
	display: none;
}
.card-footer {
	height: auto;
	min-height: 24px;
	gap: 4px;
	overflow: visible;
	margin: 0;
	font-size: var(--font-caption, 13px);
}
.footer-top, .footer-bottom {
	flex-wrap: wrap;
	gap: 4px 8px;
	min-height: 0;
}
.footer-top:empty {
	display: none;
}
.footer-item {
	gap: 4px;
	max-width: 100%;
}
.footer-icon {
	width: 16px;
	font-size: 13px;
	margin: 0;
}
.footer-text {
	font-size: var(--font-caption, 13px);
}
.author-avatar {
	width: 24px;
	height: 24px;
}
.avatar-text {
	font-size: 12px;
}
@media (max-width: 600px) {
	.plugin-card {
		min-height: 0;
	}
}

/* Shared catalogue surface: light workstation and dark connected grid. */
.plugin-card {
	min-height: 176px;
	padding: 18px;
	gap: 14px;
	border: 1px solid var(--border);
	border-radius: 14px;
	background: var(--surface);
	box-shadow: none;
	transition: border-color 0.18s ease, background-color 0.18s ease;
}
.plugin-card::before, .card-description::after { display: none; }
.plugin-card:hover { transform: none; box-shadow: none; border-color: var(--accent); }
.plugin-card:active { transform: scale(0.99); }
.plugin-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.card-header { gap: 12px; align-items: center; }
.category-icon { width: 42px; height: 42px; border: 0; border-radius: 11px; background: var(--accent-soft); }
.category-image { width: 21px; height: 21px; }
.plugin-card:hover .category-icon, .plugin-card:hover .author-avatar { transform: none; box-shadow: none; }
.plugin-name { font-size: var(--font-card); font-weight: 700; line-height: 1.35; }
.category-label { color: var(--text-tertiary); font-size: 12px; line-height: 1.4; }
.star { color: var(--border); }
.plugin-card:hover .star { animation: none; }
.card-description { color: var(--text-secondary); }
.card-footer { border-top: 1px solid var(--border); padding-top: 10px; }
.footer-top, .footer-bottom { gap: 6px 12px; }
.footer-icon { width: auto; color: var(--text-tertiary); font-size: 12px; }
.plugin-card:hover .footer-item { color: var(--text-secondary); }
.plugin-card:hover .footer-icon { transform: none; }
.author-avatar { background: var(--accent-soft); }
.avatar-text { color: var(--accent); }
:global(.compact-mode) .plugin-card { border-radius: 4px; }
@media (max-width: 600px) { .plugin-card { min-height: 150px; padding: 16px; } }

/* Catalogue card: identity, description, then compact package metadata. */
.plugin-card { display:flex; flex-direction:column; min-height:205px; padding:20px; gap:14px; border:1px solid var(--border); border-radius:14px; background:var(--surface); box-shadow:none; box-sizing:border-box; }
.plugin-card:hover { transform:translateY(-2px); border-color:var(--accent); }
.card-header { display:flex; align-items:center; gap:12px; }
.category-icon { display:flex; align-items:center; justify-content:center; width:42px; height:42px; flex:none; background:var(--accent-soft); border-radius:11px; }
.category-image { width:21px; height:21px; }
.header-main { flex:1; min-width:0; }
.title-row { display:flex; align-items:center; gap:6px; min-width:0; }
.plugin-name { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:15px; line-height:1.4; font-weight:700; }
.badge-image, .card-arrow { width:16px; height:16px; flex:none; }
.category-label { display:block; font-size:12px; color:var(--text-tertiary); }
.card-description { flex:1; min-height:40px; color:var(--text-secondary); font-size:14px; line-height:1.5; }
.description-text { display:-webkit-box; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
.card-metrics { display:flex; gap:16px; flex-wrap:wrap; color:var(--text-secondary); font-size:12px; }
.metric { display:flex; align-items:center; gap:5px; }
.metric image { width:14px; height:14px; }
.card-footer { display:flex; flex-direction:row; align-items:center; justify-content:space-between; min-height:26px; padding-top:12px; border-top:1px solid var(--border); }
.footer-item { display:flex; align-items:center; gap:6px; color:var(--text-secondary); }
.author-avatar { flex:none; width:25px; height:25px; }
:global(.compact-mode) .plugin-card { border-radius:4px; }

.card-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; align-items:center; }
.metric { min-width:0; white-space:nowrap; }
.metric text { overflow:hidden; text-overflow:ellipsis; }
.card-header { min-height:42px; }
.card-footer { margin-top:auto; }

/* Only the card being operated receives press feedback. */
.plugin-card { transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease; }
.plugin-card:active { transform: scale(var(--interaction-press-scale, 0.99)); }
</style>
