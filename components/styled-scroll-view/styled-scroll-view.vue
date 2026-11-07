<template>
	<view class="styled-scroll-view" :class="{ 'scrollbar-hover-edge': scrollbarHoverEdge, 'scrollbar-edge-visible': edgeHovered }">
		<scroll-view :id="scrollId" class="scroll-native" :scroll-y="scrollEnabled" :scroll-top="scrollTop" :lower-threshold="600" :show-scrollbar="false" @scroll="handleScroll" @scrolltolower="emit('reach-end')">
			<view :id="contentId" class="scroll-content"><slot /></view>
		</scroll-view>
		<view v-if="isScrollable" class="scrollbar-track" aria-hidden="true"><view class="scrollbar-thumb" :style="thumbStyle" /></view>
	</view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'

const props = defineProps({
	scrollTop: { type: Number, default: 0 },
	scrollEnabled: { type: Boolean, default: true },
	scrollbarHoverEdge: { type: Boolean, default: true }
})
const emit = defineEmits(['resize', 'scroll', 'reach-end'])
const instance = getCurrentInstance()
const scrollId = 'styled-scroll-' + instance.uid
const contentId = scrollId + '-content'
const viewportHeight = ref(0)
const scrollHeight = ref(0)
const currentScrollTop = ref(0)
const edgeHovered = ref(false)
let viewportWidth = 0
let pending = false
let disposed = false
let observer = null
// #ifdef WEB
let hoverTarget = null
// #endif

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
	emit('scroll', { scrollTop: currentScrollTop.value, scrollHeight: scrollHeight.value, viewportHeight: viewportHeight.value })
	if (!viewportHeight.value) refresh()
}

function handlePointerMove(event) {
	// #ifdef WEB
	if (!props.scrollbarHoverEdge) return
	const rect = event.currentTarget.getBoundingClientRect()
	edgeHovered.value = event.clientX >= rect.right - 36
	// #endif
}

function handlePointerLeave() {
	edgeHovered.value = false
}

watch(() => props.scrollTop, (value) => { currentScrollTop.value = value })
watch(() => props.scrollEnabled, refresh)
onUpdated(refresh)
onMounted(async () => {
	refresh()
	uni.onWindowResize?.(refresh)
	// #ifdef WEB
	await nextTick()
	if (!disposed && props.scrollbarHoverEdge) {
		hoverTarget = document.getElementById(scrollId)?.parentElement
		hoverTarget?.addEventListener('mousemove', handlePointerMove)
		hoverTarget?.addEventListener('mouseleave', handlePointerLeave)
	}
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
	// #ifdef WEB
	hoverTarget?.removeEventListener('mousemove', handlePointerMove)
	hoverTarget?.removeEventListener('mouseleave', handlePointerLeave)
	// #endif
	uni.offWindowResize?.(refresh)
})

defineExpose({ refresh })
</script>

<script>
export default {
	options: {
		virtualHost: true
	}
}
</script>

<style scoped>
:host {
	display: flex;
	flex-direction: column;
	flex: 1 1 auto;
	min-height: 0;
	min-width: 0;
	height: 100%;
	width: 100%;
	overflow: hidden;
	box-sizing: border-box;
}

.styled-scroll-view {
	position: relative;
	display: flex;
	flex-direction: column;
	flex: 1 1 auto;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	box-sizing: border-box;
	overflow: hidden;
}

.scroll-native {
	display: block;
	width: 100%;
	height: 100%;
	flex: 1 1 0%;
	min-height: 0;
	min-width: 0;
	overscroll-behavior: contain;
	-webkit-overflow-scrolling: touch;
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

@media (hover: hover) and (min-width: 601px) {
	.scrollbar-hover-edge .scrollbar-track { opacity: 0; transition: opacity 0.16s ease; }
	.scrollbar-hover-edge.scrollbar-edge-visible .scrollbar-track { opacity: 1; }
}

.scrollbar-thumb {
	width: 100%;
	border-radius: inherit;
	background: var(--scrollbar-thumb, #7563d6);
	transition: transform 0.08s linear;
}
</style>
