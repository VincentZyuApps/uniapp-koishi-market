import { ref } from 'vue'

const STORAGE_KEY = 'show_keyboard_shortcuts'
const showKeyboardShortcuts = ref(false)
const compactMode = ref(false)
const displayMode = ref('paginated')
let hasSavedDisplayMode = false
let initialized = false

function defaultDisplayMode() {
	try {
		const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
		const device = typeof uni.getDeviceInfo === 'function' ? uni.getDeviceInfo() : info
		if (['android', 'ios'].includes(String(device.platform || info.platform || '').toLowerCase())) return 'feed'
		return info.windowWidth <= 600 ? 'feed' : 'paginated'
	} catch (e) { return 'paginated' }
}

function updateDefaultDisplayMode() {
	if (!hasSavedDisplayMode) displayMode.value = defaultDisplayMode()
}

function setDisplayMode(value) {
	if (!['paginated', 'feed'].includes(value)) return
	displayMode.value = value
	hasSavedDisplayMode = true
	try { uni.setStorageSync('plugin_display_mode', value) } catch (e) {}
}

function setShowKeyboardShortcuts(value) {
	showKeyboardShortcuts.value = value === true
	uni.setStorageSync(STORAGE_KEY, showKeyboardShortcuts.value)
}

function setCompactMode(value) {
	compactMode.value = value === true
	try { uni.setStorageSync('compact_mode', compactMode.value) } catch (e) {}
}

export function useDisplayPreferences() {
	if (!initialized) {
		displayMode.value = defaultDisplayMode()
		try {
			showKeyboardShortcuts.value = uni.getStorageSync(STORAGE_KEY) === true
			compactMode.value = uni.getStorageSync('compact_mode') === true
			const savedMode = uni.getStorageSync('plugin_display_mode')
			hasSavedDisplayMode = ['paginated', 'feed'].includes(savedMode)
			displayMode.value = hasSavedDisplayMode ? savedMode : defaultDisplayMode()
		} catch (e) {}
		initialized = true
	}
	return { showKeyboardShortcuts, setShowKeyboardShortcuts, compactMode, setCompactMode, displayMode, setDisplayMode, updateDefaultDisplayMode }
}
