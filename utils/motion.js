import { computed, ref } from 'vue'

const MOTION_STORAGE_KEY = 'motion_mode'
const RESPECT_SYSTEM_STORAGE_KEY = 'respect_system_motion'

export const MOTION_OPTIONS = [
	{ value: 'auto', label: '自动', description: '根据设备能力保守选择低或中档' },
	{ value: 'ultra-low', label: '超低', description: '关闭非必要动画，优先流畅与省电' },
	{ value: 'low', label: '低', description: '保留短暂反馈，减少位移与装饰动画' },
	{ value: 'medium', label: '中', description: '平衡反馈速度与视觉层次' },
	{ value: 'high', label: '高', description: '当前完整动画效果' },
	{ value: 'ultra-high', label: '超高', description: '增强入场、悬浮与阴影过渡' }
]

const validModes = new Set(MOTION_OPTIONS.map((option) => option.value))
const motionMode = ref('auto')
const respectSystemMotion = ref(false)
const systemReducedMotion = ref(false)
let initialized = false

function readSystemReducedMotion() {
	// #ifdef WEB
	if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches
	}
	// #endif
	return false
}

function resolveAutomaticMode() {
	let systemInfo = {}
	try {
		systemInfo = uni.getSystemInfoSync() || {}
	} catch (error) {
		console.warn('无法读取设备性能信息，将使用低动画档位', error)
	}

	const benchmarkLevel = Number(systemInfo.benchmarkLevel)
	if (Number.isFinite(benchmarkLevel) && benchmarkLevel >= 30) return 'medium'

	// #ifdef WEB
	const cores = Number(globalThis.navigator?.hardwareConcurrency)
	const memory = Number(globalThis.navigator?.deviceMemory)
	if (cores >= 8 && memory >= 8) return 'medium'
	// #endif

	return 'low'
}

function initialize() {
	if (initialized) return
	initialized = true

	const savedMode = uni.getStorageSync(MOTION_STORAGE_KEY)
	if (validModes.has(savedMode)) motionMode.value = savedMode
	respectSystemMotion.value = uni.getStorageSync(RESPECT_SYSTEM_STORAGE_KEY) === true
	systemReducedMotion.value = readSystemReducedMotion()

	// #ifdef WEB
	if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
		mediaQuery.addEventListener('change', (event) => {
			systemReducedMotion.value = event.matches
		})
	}
	// #endif
}

const resolvedMotionMode = computed(() => {
	if (respectSystemMotion.value && systemReducedMotion.value) return 'ultra-low'
	return motionMode.value === 'auto' ? resolveAutomaticMode() : motionMode.value
})

const motionClass = computed(() => `motion-${resolvedMotionMode.value}`)
const resolvedMotionOption = computed(() => MOTION_OPTIONS.find((option) => option.value === resolvedMotionMode.value) || MOTION_OPTIONS[0])

function setMotionMode(mode) {
	const nextMode = validModes.has(mode) ? mode : 'auto'
	motionMode.value = nextMode
	uni.setStorageSync(MOTION_STORAGE_KEY, nextMode)
}

function setRespectSystemMotion(value) {
	respectSystemMotion.value = value === true
	uni.setStorageSync(RESPECT_SYSTEM_STORAGE_KEY, respectSystemMotion.value)
}

export function useMotionPreferences() {
	initialize()
	return {
		motionMode,
		respectSystemMotion,
		systemReducedMotion,
		resolvedMotionMode,
		resolvedMotionOption,
		motionClass,
		setMotionMode,
		setRespectSystemMotion
	}
}
