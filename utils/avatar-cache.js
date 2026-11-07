// Cache image data independently of card instances, which are recycled in the feed.
const MAX_ENTRIES = 256
const cache = new Map()
const pending = new Map()

function remember(url, value) {
	cache.delete(url)
	cache.set(url, value)
	while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value)
}

export function forgetAvatar(url) {
	cache.delete(url)
}

export function rememberAvatarUrl(url) {
	remember(url, { source: url })
}

// A cached Blob is shared; each mounted image owns and releases its object URL.
export function avatarSource(entry) {
	if (entry.blob) {
		const source = URL.createObjectURL(entry.blob)
		return { source, release: () => URL.revokeObjectURL(source) }
	}
	return { source: entry.source, release: () => {} }
}

export function loadCachedAvatar(url) {
	if (cache.has(url)) {
		const entry = cache.get(url)
		remember(url, entry)
		return Promise.resolve(entry)
	}
	if (pending.has(url)) return pending.get(url)

	const task = loadImageData(url).then(entry => {
		if (entry) remember(url, entry)
		return entry
	}).catch(() => null).finally(() => pending.delete(url))
	pending.set(url, task)
	return task
}

async function loadImageData(url) {
	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		if (typeof fetch !== 'function' || typeof AbortController === 'undefined' || !URL.createObjectURL) return null
		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), 2500)
		try {
			const response = await fetch(url, { signal: controller.signal })
			if (!response.ok) return null
			const blob = await response.blob()
			return blob.type.startsWith('image/') ? { blob } : null
		} finally {
			clearTimeout(timer)
		}
	}

	// Some mini programs don't allow getImageInfo for an image domain. In that
	// case the caller falls back to the normal image component and its mirrors.
	if (typeof uni === 'undefined' || typeof uni.getImageInfo !== 'function') return null
	return new Promise(resolve => {
		let finished = false
		const finish = value => {
			if (finished) return
			finished = true
			clearTimeout(timer)
			resolve(value)
		}
		const timer = setTimeout(() => finish(null), 2500)
		try {
			uni.getImageInfo({ src: url, success: result => finish(result.path ? { source: result.path } : null), fail: () => finish(null) })
		} catch (_) { finish(null) }
	})
}
