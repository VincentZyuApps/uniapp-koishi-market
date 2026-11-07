<template>
	<view ref="searchRoot" class="search-header">
		<view class="search-bar">
			<view class="search-icon">
				<image class="search-image" :src="searchIcon" mode="aspectFit" />
			</view>
			<input 
				class="search-input" 
				aria-label="搜索插件"
				type="text" 
				v-model="inputValue"
				:placeholder="placeholder"
				placeholder-class="search-input-placeholder"
				confirm-type="search"
				@confirm="handleSearch"
			/>
			<view v-if="inputValue || searchWords.length" class="clear-icon" role="button" tabindex="0" aria-label="清除搜索" @click="handleClear" @keydown.enter.prevent="handleClear" @keydown.space.prevent="handleClear">
				<image class="clear-image" :src="closeIcon" mode="aspectFit" />
			</view>
		</view>
		
		<!-- 搜索标签 -->
		<scroll-view class="search-tags" scroll-x v-if="searchWords.length > 0">
			<view class="tag-list">
				<view 
					v-for="(word, index) in searchWords" 
					:key="index" 
					class="search-tag"
					role="button" tabindex="0" :aria-label="'移除搜索词 '+word" @click="handleRemoveTag(index)" @keydown.enter.prevent="handleRemoveTag(index)" @keydown.space.prevent="handleRemoveTag(index)"
				>
					{{ word }}
					<image class="clear-image tag-close" :src="closeIcon" mode="aspectFit" />
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import searchIcon from '@/static/icons/search.png'
import closeIcon from '@/static/icons/x.png'

const props = defineProps({
	modelValue: {
		type: Array,
		default: () => []
	},
	placeholder: {
		type: String,
		default: '搜索插件 for koishi...'
	}
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

const inputValue = ref('')
const searchWords = ref([...props.modelValue])
const searchRoot = ref(null)
let lastPublished = JSON.stringify(props.modelValue)
let syncingExternalValue = false

const publishSearch = () => {
	if (syncingExternalValue) return
	const draft = inputValue.value.trim()
	const words = draft ? [...searchWords.value, draft] : [...searchWords.value]
	const serialized = JSON.stringify(words)
	if (serialized === lastPublished) return
	lastPublished = serialized
	emit('update:modelValue', words)
	emit('search', draft)
}

watch(() => props.modelValue, (newVal) => {
	const serialized = JSON.stringify(newVal)
	if (serialized === lastPublished) return
	syncingExternalValue = true
	searchWords.value = [...newVal]
	inputValue.value = ''
	lastPublished = serialized
	syncingExternalValue = false
}, { deep: true })

watch(inputValue, publishSearch, { flush: 'sync' })

const handleSearch = () => {
	if (inputValue.value.trim()) {
		searchWords.value = [...searchWords.value, inputValue.value.trim()]
		inputValue.value = ''
		publishSearch()
	}
}

const handleClear = () => {
	searchWords.value = []
	inputValue.value = ''
	publishSearch()
	emit('clear')
}

const handleRemoveTag = (index) => {
	searchWords.value.splice(index, 1)
	publishSearch()
}

// #ifdef H5
let wheelRoot = null
let searchDisposed = false
const handleTagWheel = (event) => {
	if (!event.cancelable || event.defaultPrevented || event.ctrlKey || event.metaKey) return
	const tags = event.target?.closest?.('.search-tags')
	if (!tags) return
	const scroller = Array.from(tags.querySelectorAll('.uni-scroll-view'))
		.find(element => element.scrollWidth > element.clientWidth + 1 && getComputedStyle(element).overflowX !== 'visible')
	if (!scroller) return
	const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
	if (!delta) return
	const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1
	const next = Math.max(0, Math.min(scroller.scrollWidth - scroller.clientWidth, scroller.scrollLeft + delta * scale))
	if (next === scroller.scrollLeft) return
	event.preventDefault()
	scroller.scrollLeft = next
}

onMounted(async () => {
	await nextTick()
	if (searchDisposed) return
	wheelRoot = searchRoot.value?.$el || searchRoot.value
	wheelRoot?.addEventListener('wheel', handleTagWheel, { passive: false })
})

onUnmounted(() => {
	searchDisposed = true
	wheelRoot?.removeEventListener('wheel', handleTagWheel)
})
// #endif

defineExpose({ handleSearch })
</script>

<style scoped>
.search-header {
	background-color: transparent;
	padding: 0;
	z-index: 100;
	width: 100%;
}

.search-bar {
	display: flex;
	align-items: center;
	background-color: var(--bg-secondary, #f8f8f9);
	border-radius: 48rpx;
	padding: 24rpx 40rpx;
	margin: 0 auto;
	max-width: 1200rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border: 2rpx solid transparent;
}

.search-bar:focus-within {
	box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.25);
	border-color: var(--primary-color, #667eea);
	transform: scale(1.01);
}

.search-icon {
	font-size: 32rpx;
	color: var(--text-tertiary, #8c959f);
	margin-right: 16rpx;
	opacity: 0.5;
	transition: all 0.3s ease;
}

.search-bar:focus-within .search-icon {
	opacity: 1;
	transform: scale(1.1);
	color: var(--primary-color, #667eea);
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	border: none;
	background: transparent;
	color: var(--text-primary, #333);
}

.clear-icon {
	font-size: 32rpx;
	color: var(--text-tertiary, #999);
	padding: 0 10rpx;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	border-radius: 50%;
}

.clear-icon:hover {
	color: var(--danger-color, #f85149);
	transform: rotate(90deg) scale(1.2);
	background: rgba(248, 81, 73, 0.1);
}

.clear-icon:active {
	transform: rotate(90deg) scale(0.9);
}

.search-tags {
	margin-top: 20rpx;
	white-space: nowrap;
	max-width: 1200rpx;
	margin-left: auto;
	margin-right: auto;
	padding: 0 40rpx;
}

.tag-list {
	display: flex;
	gap: 16rpx;
	flex-wrap: wrap;
	align-items: center;
}

.search-tag {
	display: inline-flex;
	align-items: center;
	padding: 12rpx 24rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-radius: 24rpx;
	font-size: 26rpx;
	font-weight: 500;
	white-space: nowrap;
	cursor: pointer;
	user-select: none;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
	animation: tagPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	position: relative;
	overflow: hidden;
}

/* 标签光泽效果 */
.search-tag::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
	transition: left 0.5s ease;
}

.search-tag:hover::before {
	left: 100%;
}

@keyframes tagPopIn {
	0% {
		opacity: 0;
		transform: scale(0.5) translateY(-20rpx);
	}
	60% {
		transform: scale(1.1) translateY(0);
	}
	100% {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.search-tag:hover {
	transform: translateY(-4rpx) scale(1.05);
	box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.4);
}

.search-tag:active {
	transform: translateY(0) scale(0.95);
}

.tag-close {
	margin-left: 12rpx;
	font-weight: bold;
	font-size: 28rpx;
	opacity: 0.8;
	transition: all 0.3s ease;
}

.search-tag:hover .tag-close {
	opacity: 1;
	transform: rotate(90deg);
}
.search-header {
	min-width: 0;
	box-sizing: border-box;
}
.search-bar {
	width: 100%;
	max-width: none;
	box-sizing: border-box;
	min-height: 40px;
	padding: 6px 12px;
	border-radius: 12px;
}
.search-bar:focus-within {
	transform: none;
}
.search-icon {
	font-size: 18px;
	margin-right: 6px;
	flex-shrink: 0;
}
.search-input {
	min-width: 0;
	height: 24px;
	font-size: var(--font-body, 16px);
	line-height: 24px;
	font-family: 'Cascadia Mono', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Source Han Sans CN', 'MiSans', 'OPPOSans', 'HarmonyOS Sans SC', 'Microsoft YaHei', sans-serif;
}
.search-input-placeholder {
	font-family: 'Cascadia Mono', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Source Han Sans CN', 'MiSans', 'OPPOSans', 'HarmonyOS Sans SC', 'Microsoft YaHei', sans-serif;
	color: var(--text-tertiary);
}
.clear-icon {
	font-size: 16px;
	min-width: 24px;
	text-align: center;
}
.search-tags {
	width: 100%;
	max-width: 100%;
	margin-top: 6px;
	padding: 0;
	box-sizing: border-box;
}
.tag-list {
	flex-wrap: nowrap;
	gap: 6px;
}
.search-tag {
	flex-shrink: 0;
	max-width: 240px;
	padding: 4px 8px;
	font-size: var(--font-caption, 13px);
	border-radius: 8px;
	background: var(--accent);
	color: var(--on-accent);
	overflow: hidden;
	text-overflow: ellipsis;
}
.tag-close {
	margin-left: 4px;
	font-size: 14px;
}
.search-bar {
	min-height: 48px;
	border: 1px solid var(--border);
	background: var(--surface);
	box-shadow: none;
}
.search-bar:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
.search-icon { opacity: 1; display: flex; align-items: center; }
.search-image { width: 20px; height: 20px; }
.search-bar:focus-within .search-icon, .clear-icon:hover, .search-tag:hover, .search-tag:hover .tag-close { transform: none; box-shadow: none; }
.search-input, .search-input-placeholder { font-family: inherit; }
.search-tag { background: var(--accent-soft); color: var(--accent); }
.clear-image { width: 16px; height: 16px; vertical-align: middle; }
.search-bar { max-width: none; }
.search-header { max-width: none; }
/* Keep committed search terms anchored below the input without resizing the header. */
.search-header { position: relative; }
.search-tags { position: absolute; top: 100%; left: -8px; z-index: 1; width: calc(100% + 16px); max-width: none; }
/* The scroll viewport clips overflow, so leave room for each tag's shadow. */
.tag-list { box-sizing: border-box; padding: 6px 8px 12px; }
</style>
