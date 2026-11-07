import { MARKET_PRESETS } from './market-presets.js'

const REGION_TRACE_URL = 'https://storeluna-cf.vincentzyu233.cn/cdn-cgi/trace'

// Only the two-letter country code is used; the trace and IP address are not stored.
export function detectMarketCountry() {
	let task
	let timer
	let complete
	const result = new Promise((resolve) => {
		let settled = false
		complete = (country) => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			resolve(country)
		}
		timer = setTimeout(() => { task?.abort?.(); complete(null) }, 3000)
		try {
			task = uni.request({
				url: REGION_TRACE_URL,
				method: 'GET', dataType: 'text', responseType: 'text', timeout: 3000,
				success: (res) => {
					const match = res.statusCode === 200 && typeof res.data === 'string'
						? res.data.match(/(?:^|\n)loc=([A-Z]{2})(?:\r?\n|$)/i) : null
					const code = match?.[1]?.toUpperCase()
					complete(code && code !== 'XX' ? code : null)
				},
				fail: () => complete(null)
			})
		} catch (_) { complete(null) }
	})
	result.abort = () => { task?.abort?.(); complete(null) }
	return result
}

// Use stable preset URLs rather than changing their persisted indices.
export function regionalMarketEndpoints(country) {
	const mainland = MARKET_PRESETS[1].url
	const official = MARKET_PRESETS[8].url
	const cloudflare = MARKET_PRESETS[0].url
	return country === 'CN' ? [mainland, official, cloudflare] : [official, cloudflare]
}
