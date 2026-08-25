const profiles = {
	low: { type: 'nudge', angle: 24, scale: 1.03, duration: 180 },
	medium: { type: 'spin', duration: 1600, scale: 1 },
	high: { type: 'spin', duration: 1000, scale: 1 },
	'ultra-high': { type: 'spin', duration: 650, scale: 1.08 }
}

function canAnimate(element) {
	// #ifdef WEB
	return Boolean(element && typeof element.animate === 'function' && typeof window !== 'undefined')
	// #endif
	return false
}

function normalizeAngle(angle) {
	return ((angle % 360) + 360) % 360
}

function getCurrentAngle(element) {
	// #ifdef WEB
	const transform = window.getComputedStyle(element).transform
	if (!transform || transform === 'none') return 0

	const Matrix = window.DOMMatrixReadOnly || window.DOMMatrix || window.WebKitCSSMatrix
	if (Matrix) {
		try {
			const matrix = new Matrix(transform)
			return normalizeAngle(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI)
		} catch (error) {
			console.warn('无法读取图标旋转角度，将从初始角度归位', error)
		}
	}
	// #endif
	return 0
}

function closestResetAngle(angle) {
	const normalized = normalizeAngle(angle)
	const delta = normalized > 180 ? 360 - normalized : -normalized
	return angle + delta
}

function getIcon(event) {
	const target = event?.currentTarget
	return target?.querySelector?.('[data-hover-spin-icon]') || null
}

/**
 * 让按钮内的图标在悬浮时旋转，并在离开时从当前角度按最短路径自然归位。
 * 仅 H5 使用 Web Animations API；其他平台静默降级为普通按钮反馈。
 */
export function createHoverIconMotion(resolvedMotionMode) {
	const states = new Map()

	function getState(element) {
		if (!states.has(element)) {
			states.set(element, { animation: null, scale: 1 })
		}
		return states.get(element)
	}

	function stopAnimation(element, state) {
		const angle = getCurrentAngle(element)
		state.animation?.cancel()
		state.animation = null
		return angle
	}

	function start(event) {
		const element = getIcon(event)
		if (!canAnimate(element)) return

		const profile = profiles[resolvedMotionMode.value]
		if (!profile) {
			clearElement(element)
			return
		}

		const state = getState(element)
		const startAngle = stopAnimation(element, state)
		state.scale = profile.scale
		element.style.transform = `rotate(${startAngle}deg) scale(${profile.scale})`

		const endAngle = profile.type === 'nudge' ? startAngle + profile.angle : startAngle + 360
		state.animation = element.animate([
			{ transform: `rotate(${startAngle}deg) scale(${profile.scale})` },
			{ transform: `rotate(${endAngle}deg) scale(${profile.scale})` }
		], {
			duration: profile.duration,
			iterations: profile.type === 'spin' ? Infinity : 1,
			easing: profile.type === 'spin' ? 'linear' : 'cubic-bezier(0.16, 1, 0.3, 1)',
			fill: 'both'
		})
	}

	function settle(event) {
		const element = getIcon(event)
		if (!canAnimate(element)) return
		if (resolvedMotionMode.value === 'ultra-low') {
			clearElement(element)
			return
		}

		const state = getState(element)
		const angle = stopAnimation(element, state)
		const targetAngle = closestResetAngle(angle)
		const distance = Math.abs(targetAngle - angle)
		const duration = Math.min(420, Math.max(180, Math.round(150 + distance * 1.5)))

		element.style.transform = `rotate(${angle}deg) scale(${state.scale})`
		const animation = element.animate([
			{ transform: `rotate(${angle}deg) scale(${state.scale})` },
			{ transform: `rotate(${targetAngle}deg) scale(1)` }
		], {
			duration,
			easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
			fill: 'forwards'
		})
		state.animation = animation
		state.scale = 1

		animation.finished.catch(() => undefined).then(() => {
			if (state.animation !== animation) return
			element.style.transform = ''
			state.animation = null
		})
	}

	function clearElement(element) {
		const state = states.get(element)
		state?.animation?.cancel()
		if (state) state.animation = null
		element.style.transform = ''
	}

	function clear() {
		for (const element of states.keys()) clearElement(element)
		states.clear()
	}

	return { start, settle, clear }
}
