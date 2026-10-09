import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { onResize, onShow } from '@dcloudio/uni-app'

export function usePageLayout() {
	const topInset = ref(0)
	const bottomInset = ref(0)
	function measure() {
		const info = typeof uni.getWindowInfo === 'function' ? uni.getWindowInfo() : uni.getSystemInfoSync()
		bottomInset.value = info.safeAreaInsets?.bottom || 0
		// #ifdef MP-WEIXIN || MP-QQ
		topInset.value = info.statusBarHeight || 0
		try {
			const capsule = uni.getMenuButtonBoundingClientRect?.()
			if (capsule?.height > 0 && capsule.bottom > 0) topInset.value = Math.max(topInset.value, capsule.bottom + 8)
		} catch {}
		// #endif
	}

	const pageStyle = computed(() => ({
		'--safe-top': topInset.value + 'px',
		'--safe-bottom': bottomInset.value + 'px',
		paddingTop: 'max(' + topInset.value + 'px, env(safe-area-inset-top, 0px))'
	}))

	measure()
	onMounted(measure)
	onShow(measure)
	onResize(measure)
	return { pageStyle }
}

export function useDrawerFocus(open, dialogId, close) {
	// #ifdef WEB
	let previousFocus = null
	let previousOverflow = null
	let previousRootOverflow = null

	function release() {
		if (previousOverflow === null) return
		document.body.style.overflow = previousOverflow
		document.documentElement.style.overflow = previousRootOverflow
		previousOverflow = null
		previousRootOverflow = null
		previousFocus?.focus?.({ preventScroll: true })
		previousFocus = null
	}

	function handleKeydown(event) {
		if (!open.value) return
		if (event.key === 'Escape') {
			event.preventDefault()
			event.stopPropagation()
			close()
			return
		}
		if ((event.key === 'Enter' || event.key === ' ') && event.target?.tagName === 'UNI-BUTTON') {
			event.preventDefault()
			if (!event.target.hasAttribute('disabled')) event.target.click()
			return
		}
		if (event.key !== 'Tab') return
		const dialog = document.getElementById(dialogId)
		const controls = [...(dialog?.querySelectorAll('button, uni-button, [href], input, [tabindex="0"]') || [])]
			.filter(control => !control.disabled && !control.hasAttribute('disabled') && control.getClientRects().length)
		const first = controls[0]
		const last = controls[controls.length - 1]
		if (!first) {
			event.preventDefault()
			dialog?.focus()
		} else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
			event.preventDefault()
			last.focus()
		} else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
			event.preventDefault()
			first.focus()
		}
	}

	watch(open, async (visible) => {
		if (!visible) {
			await nextTick()
			if (!open.value) release()
			return
		}
		if (previousOverflow === null) {
			previousFocus = document.activeElement
			previousOverflow = document.body.style.overflow
			previousRootOverflow = document.documentElement.style.overflow
		}
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'
		await nextTick()
		if (open.value) document.getElementById(dialogId)?.querySelector('button, uni-button, [tabindex="0"]')?.focus()
	})

	onMounted(() => document.addEventListener('keydown', handleKeydown, true))
	onUnmounted(() => {
		document.removeEventListener('keydown', handleKeydown, true)
		release()
	})
	// #endif
}
