<template>
	<view class="styled-scroll-view">
		<scroll-view :id="scrollId" class="scroll-native" :scroll-y="scrollEnabled" :scroll-top="scrollTop" :show-scrollbar="false" @scroll="handleScroll">
			<view :id="contentId" class="scroll-content"><slot /></view>
		</scroll-view>
		<view v-if="isScrollable" class="scrollbar-track" aria-hidden="true"><view class="scrollbar-thumb" :style="thumbStyle" /></view>
	</view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'

const props = defineProps({
	scrollTop: { type: Number, default: 0 },
	scrollEnabled: { type: Boolean, default: true }
})
const emit = defineEmits(['resize'])
const instance = getCurrentInstance()
const scrollId = 'styled-scroll-' + instance.uid
const contentId = scrollId + '-content'
const viewportHeight = ref(0)
const scrollHeight = ref(0)
const currentScrollTop = ref(0)
let viewportWidth = 0
let pending = false
let disposed = false
let observer = null

const isScrollable = computed(() => scrollHeight.value > viewportHeight.value + 1 && viewportHeight.value > 0)
const trackHeight = computed(() => Math.max(0, viewportHeight.value - 12))
const thumbHeight = computed(() => {
	if (!isScrollable.value) return 0
	return Math.min(trackHeight.value, Math.max(34, trackHeight.value * viewportHeight.value / scrollHeight.value))
})
const thumbStyle = computed(() => {
	const maxScroll = Math.max(0, scrollHeight.value - viewportHeight.value)
	const progress = maxScroll ? Math.min(1, Math.max(0, currentScrollTop.value / maxScroll)) : 0
	return {
		height: thumbHeight.value + 'px',
		transform: 'translateY(' + progress * (trackHeight.value - thumbHeight.value) + 'px)'
	}
})

function refresh() {
	if (disposed || pending) return
	pending = true
	nextTick(() => {
		pending = false
		if (disposed) return
		const query = uni.createSelectorQuery().in(instance.proxy)
		query.select('#' + scrollId).boundingClientRect()
		query.select('#' + contentId).boundingClientRect()
		query.exec((results) => {
			if (disposed) return
			const [viewport, content] = results || []
			if (!viewport) return
			const changed = viewportWidth !== viewport.width || viewportHeight.value !== viewport.height
			viewportWidth = viewport.width
			viewportHeight.value = viewport.height
			if (content) scrollHeight.value = content.height
			if (changed) emit('resize', { width: viewport.width, height: viewport.height })
		})
	})
}

function handleScroll(event) {
	currentScrollTop.value = event.detail.scrollTop || 0
	scrollHeight.value = event.detail.scrollHeight || 0
	if (!viewportHeight.value) refresh()
}

watch(() => props.scrollTop, (value) => { currentScrollTop.value = value })
watch(() => props.scrollEnabled, refresh)
onUpdated(refresh)
onMounted(async () => {
	refresh()
	uni.onWindowResize?.(refresh)
	// #ifdef WEB
	await nextTick()
	if (!disposed && typeof ResizeObserver !== 'undefined') {
		observer = new ResizeObserver(refresh)
		for (const targetId of [scrollId, contentId]) {
			const element = document.getElementById(targetId)
			if (element) observer.observe(element)
		}
	}
	// #endif
})
onUnmounted(() => {
	disposed = true
	observer?.disconnect()
	uni.offWindowResize?.(refresh)
})
defineExpose({ refresh })
</script>

<style scoped>
.styled-scroll-view {
	position: relative;
	min-width: 0;
	min-height: 0;
	box-sizing: border-box;
	overflow: hidden;
}
.scroll-native {
	display: block;
	width: 100%;
	height: 100%;
	min-width: 0;
	overscroll-behavior: contain;
}
.scroll-content {
	padding: var(--scroll-padding, 0);
	display: flow-root;
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
}
.scrollbar-track {
	position: absolute;
	top: 6px;
	right: 3px;
	bottom: 6px;
	width: 4px;
	pointer-events: none;
	border-radius: 999px;
	background: var(--scrollbar-track, rgba(85, 70, 163, 0.12));
	overflow: hidden;
}
.scrollbar-thumb {
	width: 100%;
	border-radius: inherit;
	background: var(--scrollbar-thumb, #7563d6);
	transition: transform 0.08s linear;
}
</style>
