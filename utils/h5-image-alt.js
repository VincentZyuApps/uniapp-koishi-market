// uni-app H5 creates an internal img for each uni-image, but does not copy
// the component's alt attribute to it. Keep that img in sync, including when
// an image loads lazily or changes source. Images without a description are
// decorative by default; meaningful images should provide alt on <image>.
export function setupH5ImageAlt() {
	if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return
	if (document.documentElement.dataset.uniImageAltReady === 'true') return
	document.documentElement.dataset.uniImageAltReady = 'true'

	const sync = (image) => {
		const parent = image.parentElement
		if (!parent || parent.tagName !== 'UNI-IMAGE') return
		const alt = parent.getAttribute('alt') || ''
		if (image.getAttribute('alt') !== alt) image.setAttribute('alt', alt)
	}

	const scan = (node) => {
		if (node.nodeType !== 1) return
		if (node.tagName === 'IMG') sync(node)
		node.querySelectorAll?.('uni-image > img').forEach(sync)
	}

	const observer = new MutationObserver((records) => {
		for (const record of records) {
			if (record.type === 'attributes') {
				if (record.target.tagName === 'UNI-IMAGE') {
					record.target.querySelectorAll(':scope > img').forEach(sync)
				}
			} else {
				record.addedNodes.forEach(scan)
			}
		}
	})
	observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['alt'] })
	scan(document.documentElement)
}
