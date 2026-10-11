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

	// #ifdef MP-WEIXIN || MP-QQ
	try {
		const appBase = typeof uni.getAppBaseInfo === 'function' ? uni.getAppBaseInfo() : null
		if (appBase && appBase.theme) {
			return appBase.theme === 'dark'
		}
		const sys = uni.getSystemInfoSync()
		if (sys && sys.theme) {
			return sys.theme === 'dark'
		}
	} catch (e) {
		console.warn('获取系统主题失败:', e)
	}
	// #endif

	return false
}

function initThemeFromStorage() {
	try {
		const saved = uni.getStorageSync('theme')
		if (['system', 'light', 'dark'].includes(saved)) {
			themeMode.value = saved
		}
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

	// #ifdef MP-WEIXIN || MP-QQ
	if (uni.onThemeChange) {
		uni.onThemeChange((res) => {
			if (themeMode.value === 'system') {
				_systemChangeKey.value++
			}
		})
	}
	// #endif
}

// 自动初始化一次
initThemeFromStorage()
setupGlobalThemeListener()

export function useTheme() {
	// 每次调用尝试从缓存同步一次（保证多端/页面加载时不漏掉最新值）
	initThemeFromStorage()

	const isDarkMode = computed(() => {
		void _systemChangeKey.value
		if (themeMode.value === 'dark') return true
		if (themeMode.value === 'light') return false
		return getSystemIsDark()
	})

	const themeEmoji = computed(() => {
		const map = { system: '🖥️', light: '☀️', dark: '🌙' }
		return map[themeMode.value] || '🖥️'
	})

	const themeLabel = computed(() => {
		const map = { system: '跟随系统', light: '浅色模式', dark: '深色模式' }
		return map[themeMode.value] || '跟随系统'
	})

	const toggleTheme = () => {
		const modes = ['system', 'light', 'dark']
		const idx = modes.indexOf(themeMode.value)
		themeMode.value = modes[(idx + 1) % 3]
		try {
			uni.setStorageSync('theme', themeMode.value)
		} catch (e) {}
	}

	const setThemeMode = (mode) => {
		if (['system', 'light', 'dark'].includes(mode)) {
			themeMode.value = mode
			try {
				uni.setStorageSync('theme', mode)
			} catch (e) {}
		}
	}

	return {
		themeMode,
		isDarkMode,
		themeEmoji,
		themeLabel,
		toggleTheme,
		setThemeMode,
		getSystemIsDark
	}
}
