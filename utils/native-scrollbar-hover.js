// H5 原生滚动容器共用边缘悬停检测；不拦截滚轮、触摸或滚动条交互。
let initialized = false

export function setupNativeScrollbarHover() {
	if (initialized || typeof document === 'undefined') return
	initialized = true

	const visible = new Set()
	let frame = 0
	let pointer = null

	function updateVisible(next) {
		for (const element of visible) {
			if (!next.has(element)) element.classList.remove('native-scrollbar-edge-visible')
		}
		for (const element of next) {
			if (!visible.has(element)) element.classList.add('native-scrollbar-edge-visible')
		}
		visible.clear()
		for (const element of next) visible.add(element)
	}

	function update() {
		frame = 0
		const next = new Set()
		if (pointer) {
			let element = pointer.target
			while (element && element.nodeType === 1) {
				const rect = element.getBoundingClientRect()
				const inside = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom
				if (inside && (pointer.x >= rect.right - 36 || pointer.y >= rect.bottom - 36)) {
					const style = getComputedStyle(element)
					const vertical = pointer.x >= rect.right - 36 && /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1
					const horizontal = pointer.y >= rect.bottom - 36 && /(auto|scroll)/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1
					if (vertical || horizontal) next.add(element)
				}
				element = element.parentElement
			}
		}
		updateVisible(next)
	}

	document.addEventListener('mousemove', (event) => {
		pointer = { x: event.clientX, y: event.clientY, target: event.target }
		if (!frame) frame = requestAnimationFrame(update)
	}, { passive: true })

	function clear() {
		pointer = null
		if (frame) cancelAnimationFrame(frame)
		frame = 0
		updateVisible(new Set())
	}
	document.addEventListener('mouseleave', clear)
	window.addEventListener('blur', clear)
}
