import { ref, computed } from 'vue'

// 全局单例响应式状态
const themeMode = ref('system') // 'system' | 'light' | 'dark'
const _systemChangeKey = ref(0)
let _isListenerRegistered = false

function getSystemIsDark() {
	// #ifdef WEB
	if (typeof window !== 'undefined' && window.matchMedia) {
		return window.matchMedia('(prefers-color-scheme: dark)').matches
	}
	// #endif

	// #ifdef MP
	try {
		const sys = uni.getSystemInfoSync()
		if (sys && sys.theme) {
			return sys.theme === 'dark'
		}
	} catch (e) {}
	// #endif

	return false
}

function refreshTheme() {
	_systemChangeKey.value++
}

function initThemeFromStorage() {
	try {
		const saved = uni.getStorageSync('theme')
		// #ifdef MP
		// 小程序端只在 'light' 和 'dark' 两种模式之间明确切换，避免因系统未上报 theme 导致卡在 false
		if (saved === 'light' || saved === 'dark') {
			themeMode.value = saved
		} else {
			// 若从未设置过或初次进入，尝试读取一次环境主题，默认选 light 或 dark
			const initialDark = getSystemIsDark()
			themeMode.value = initialDark ? 'dark' : 'light'
		}
		// #endif

		// #ifndef MP
		if (['system', 'light', 'dark'].includes(saved)) {
			themeMode.value = saved
		}
		// #endif
	} catch (e) {}
}

function setupGlobalThemeListener() {
	if (_isListenerRegistered) return
	_isListenerRegistered = true

	// #ifdef WEB
	if (typeof window !== 'undefined' && window.matchMedia) {
		const mq = window.matchMedia('(prefers-color-scheme: dark)')
		mq.addEventListener('change', () => {
			if (themeMode.value === 'system') {
				_systemChangeKey.value++
			}
		})
	}
	// #endif

	// #ifdef MP
	if (uni.onThemeChange) {
		uni.onThemeChange((res) => {
			if (res && res.theme) {
				// 当微信端产生真实系统切换事件时，同步当前的主题状态
				themeMode.value = res.theme === 'dark' ? 'dark' : 'light'
				try {
					uni.setStorageSync('theme', themeMode.value)
				} catch (e) {}
			}
			_systemChangeKey.value++
		})
	}
	// #endif
}

// 自动初始化一次
initThemeFromStorage()
setupGlobalThemeListener()

export function useTheme() {
	initThemeFromStorage()

	const isDarkMode = computed(() => {
		void _systemChangeKey.value
		// #ifdef MP
		// 小程序端直接按确定的 dark / light 生效，彻底杜绝系统 undefined 导致的无法变黑
		return themeMode.value === 'dark'
		// #endif

		// #ifndef MP
		if (themeMode.value === 'dark') return true
		if (themeMode.value === 'light') return false
		return getSystemIsDark()
		// #endif
	})

	const themeEmoji = computed(() => {
		// #ifdef MP
		return isDarkMode.value ? '🌙' : '☀️'
		// #endif

		// #ifndef MP
		const map = { system: '🖥️', light: '☀️', dark: '🌙' }
		return map[themeMode.value] || '🖥️'
		// #endif
	})

	const themeLabel = computed(() => {
		// #ifdef MP
		return isDarkMode.value ? '深色模式' : '浅色模式'
		// #endif

		// #ifndef MP
		const map = { system: '跟随系统', light: '浅色模式', dark: '深色模式' }
		return map[themeMode.value] || '跟随系统'
		// #endif
	})

	const toggleTheme = () => {
		// #ifdef MP
		// 小程序端两态切换：白天 ⇋ 黑夜
		const nextMode = isDarkMode.value ? 'light' : 'dark'
		themeMode.value = nextMode
		try {
			uni.setStorageSync('theme', nextMode)
		} catch (e) {}
		_systemChangeKey.value++
		// #endif

		// #ifndef MP
		// Web 端维持三态切换：跟随系统 ➔ 浅色 ➔ 深色
		const modes = ['system', 'light', 'dark']
		const idx = modes.indexOf(themeMode.value)
		themeMode.value = modes[(idx + 1) % 3]
		try {
			uni.setStorageSync('theme', themeMode.value)
		} catch (e) {}
		_systemChangeKey.value++
		// #endif
	}

	const setThemeMode = (mode) => {
		if (['system', 'light', 'dark'].includes(mode)) {
			themeMode.value = mode
			try {
				uni.setStorageSync('theme', mode)
			} catch (e) {}
			_systemChangeKey.value++
		}
	}

	return {
		themeMode,
		isDarkMode,
		themeEmoji,
		themeLabel,
		toggleTheme,
		setThemeMode,
		getSystemIsDark,
		refreshTheme
	}
}
