<template>
	<view class="styled-scroll-view">
		<scroll-view
			:id="scrollId"
			class="scroll-native"
			scroll-y
			:scroll-top="scrollTop"
			:show-scrollbar="false"
			@scroll="handleScroll"
		>
			<slot />
		</scroll-view>
		<view v-if="isScrollable" class="scrollbar-track" aria-hidden="true">
			<view class="scrollbar-thumb" :style="thumbStyle" />
		</view>
	</view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, ref } from 'vue'

const props = defineProps({
	scrollTop: {
		type: Number,
		default: 0
	}
})

const instance = getCurrentInstance()
const scrollId = `styled-scroll-${instance.uid}`
const viewportHeight = ref(0)
const scrollHeight = ref(0)
const currentScrollTop = ref(0)

const isScrollable = computed(() => scrollHeight.value > viewportHeight.value + 1 && viewportHeight.value > 0)
const thumbHeight = computed(() => {
	if (!isScrollable.value) return 0
	return Math.max(34, viewportHeight.value * (viewportHeight.value / scrollHeight.value))
})
const thumbTop = computed(() => {
	if (!isScrollable.value) return 0
	const maxScrollTop = scrollHeight.value - viewportHeight.value
	const maxThumbTop = viewportHeight.value - thumbHeight.value
	return maxScrollTop > 0 ? (currentScrollTop.value / maxScrollTop) * maxThumbTop : 0
})
const thumbStyle = computed(() => ({
	height: `${thumbHeight.value}px`,
	transform: `translateY(${thumbTop.value}px)`
}))

function measureViewport() {
	uni.createSelectorQuery().in(instance.proxy).select(`#${scrollId}`).boundingClientRect((rect) => {
		if (rect) viewportHeight.value = rect.height
	}).exec()
}

function handleScroll(event) {
	currentScrollTop.value = event.detail.scrollTop || 0
	scrollHeight.value = event.detail.scrollHeight || 0
	if (!viewportHeight.value) measureViewport()
}

onMounted(() => nextTick(measureViewport))
</script>

<style scoped>
.styled-scroll-view {
	position: relative;
	min-width: 0;
	min-height: 0;
	box-sizing: border-box;
}

.scroll-native {
	display: block;
	width: 100%;
	height: 100%;
}

.scrollbar-track {
	position: absolute;
	top: 10rpx;
	right: 8rpx;
	bottom: 10rpx;
	width: 10rpx;
	pointer-events: none;
	border-radius: 999rpx;
	background: var(--scrollbar-track, rgba(85, 70, 163, 0.12));
	overflow: hidden;
	transition: background-color 0.2s ease;
}

.scrollbar-thumb {
	width: 100%;
	min-height: 34px;
	border-radius: inherit;
	background: var(--scrollbar-thumb, #7563d6);
	box-shadow: 0 2rpx 8rpx var(--scrollbar-shadow, rgba(85, 70, 163, 0.3));
	transition: transform 0.08s linear, background-color 0.2s ease, box-shadow 0.2s ease;
}
</style>
