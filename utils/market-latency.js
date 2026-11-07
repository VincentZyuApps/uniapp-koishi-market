import { onUnmounted, ref } from 'vue'

// Measure the final HTTPS response after redirects, not the market JSON download.
export function useMarketLatency() {
	const results = ref({})
	const active = new Set()
	let generation = 0

	function stop() {
		generation++
		for (const cancel of active) cancel()
		active.clear()
	}

	function probe(url) {
		// #ifdef WEB
		const controller = new AbortController()
		const cancel = () => controller.abort()
		active.add(cancel)
		const timer = setTimeout(cancel, 10000)
		const fetchResponse = async (method) => {
			const started = performance.now()
			const response = await fetch(url, { method, cache: 'no-store', signal: controller.signal })
			return { response, elapsed: Math.max(1, Math.round(performance.now() - started)) }
		}
		return (async () => {
			try {
				let result
				let usedGet = false
				try { result = await fetchResponse('HEAD') }
				catch (error) {
					if (controller.signal.aborted) throw error
					// A server may reject HEAD without exposing its response to the browser.
					usedGet = true
					result = await fetchResponse('GET')
				}
				// Some registries support GET but reject HEAD. Fetch resolves as soon as headers arrive.
				if (!usedGet && (result.response.status === 405 || result.response.status === 501)) result = await fetchResponse('GET')
				if (!result.response.ok || !/^https:\/\//i.test(result.response.url)) return null
				return result.elapsed
			} catch (_) {
				return null
			} finally {
				clearTimeout(timer)
				controller.abort() // Do not download a potentially large GET response body.
				active.delete(cancel)
			}
		})()
		// #endif
		// #ifndef WEB
		return new Promise((resolve) => {
			const started = Date.now()
			let task
			let settled = false
			const finish = (result) => {
				if (settled) return
				settled = true
				active.delete(cancel)
				resolve(result)
			}
			const cancel = () => { task?.abort?.(); finish(null) }
			active.add(cancel)
			try {
				task = uni.request({
					url, method: 'HEAD', timeout: 10000,
					success: (response) => finish(response.statusCode >= 200 && response.statusCode < 300 ? Math.max(1, Date.now() - started) : null),
					fail: () => finish(null)
				})
			} catch (_) { finish(null) }
		})
		// #endif
	}

	async function start(urls) {
		stop()
		const run = generation
		const queue = []
		const initial = {}
		urls.forEach((url, index) => {
			if (!url) initial[index] = { text: '未配置', state: 'muted' }
			else if (!/^https:\/\//i.test(url)) initial[index] = { text: '需 HTTPS', state: 'muted' }
			else { initial[index] = { text: '测量中…', state: 'muted' }; queue.push({ url, index }) }
		})
		results.value = initial
		async function worker() {
			while (queue.length && run === generation) {
				const { url, index } = queue.shift()
				const ms = await probe(url)
				if (run !== generation) return
				results.value = { ...results.value, [index]: ms === null
					? { text: '不可测', state: 'muted' }
					: { text: `${ms} ms`, state: ms < 300 ? 'fast' : ms < 1000 ? 'medium' : 'slow' } }
			}
		}
		await Promise.all(Array.from({ length: Math.min(4, queue.length) }, () => worker()))
	}

	onUnmounted(stop)
	return { results, start, stop }
}
