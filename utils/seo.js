const HOME = {
	title: 'Koishi 插件市场 | 搜索与发现 Koishi 插件',
	description: '基于 uni-app 与 Vue 3 的 Koishi 插件市场，支持插件搜索、分类筛选、详情浏览、多数据源切换与 AI Agent 找插件。',
	keywords: 'Koishi,插件市场,uni-app,Vue,QQ机器人,AI Agent',
	socialTitle: 'Koishi 插件市场',
	socialDescription: '搜索、筛选和浏览 Koishi 插件，支持多数据源与 AI Agent 找插件。'
}

function plain(value) {
	if (value && typeof value === 'object') value = value['zh-CN'] || value.zh || value.en || ''
	if (typeof value !== 'string') return ''
	return value.replace(/<[^>]*>/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[`*_#~]/g, '').replace(/\s+/g, ' ').trim()
}

function person(value) {
	if (value && typeof value === 'object') value = value.username || value.name || ''
	const name = plain(value).replace(/\s*<[^>]*>/g, '').replace(/\s*\(https?:\/\/[^)]*\)/g, '').trim()
	return /^(unknown|暂无|unknown author)$/i.test(name) ? '' : name
}

function unique(values) {
	const seen = new Set()
	return values.filter(value => {
		const key = value.toLowerCase()
		if (!key || seen.has(key)) return false
		seen.add(key)
		return true
	})
}

function people(value) {
	return unique((Array.isArray(value) ? value : [value]).map(person))
}

export function pluginSeo(plugin = {}) {
	const raw = plugin._raw || plugin
	const pkg = raw.package || plugin.package || {}
	const display = plain(plugin.shortname || raw.shortname || plugin.name || pkg.name) || 'Koishi 插件'
	const text = plain(raw.manifest?.description) || plain(plugin.description) || plain(pkg.description)
	const intro = text === '暂无描述' ? '' : text
	// A publisher can be an automation account, so don't call it the developer.
	const authors = people(pkg.author || raw.author || (!plugin._raw && plugin.author))
	const publishers = people(pkg.publisher || raw.publisher)
	const maintainers = people(pkg.maintainers || raw.maintainers || [])
	const samePeople = (a, b) => a.length > 0 && a.length === b.length && a.every(name => b.some(other => name.toLowerCase() === other.toLowerCase()))
	let credits = ''
	if (samePeople(authors, maintainers)) {
		credits = `由${authors.join('、')}开发与维护`
	} else {
		const publishing = authors.length ? `由${authors.join('、')}开发` : (publishers.length ? `由${publishers.join('、')}发布` : '')
		if (!authors.length && samePeople(publishers, maintainers)) {
			credits = `由${publishers.join('、')}发布与维护`
		} else {
			credits = [publishing, maintainers.length && `由${maintainers.join('、')}维护`].filter(Boolean).join('，')
		}
	}
	let description = intro
	if (Array.from(intro).length < 80) {
		const prefix = intro ? `${display}，${intro.replace(/[，。；;\s]+$/u, '')}` : `${display} 是一款 Koishi 插件`
		description = prefix + (credits ? `，${credits}` : '') + '。'
	}
	description = Array.from(description).slice(0, 170).join('')
	const terms = Array.isArray(pkg.keywords) ? pkg.keywords : (Array.isArray(plugin.keywords) ? plugin.keywords : [])
	const keywords = unique(terms.map(plain)).join(', ')
	const title = `${display} - Koishi 插件详情`
	return { title, description, keywords, socialTitle: title, socialDescription: description }
}

function applySeo(data) {
	if (typeof document === 'undefined') return
	document.title = data.title
	for (const [selector, value] of [
		['meta[name="description"]', data.description], ['meta[name="keywords"]', data.keywords],
		['meta[property="og:title"]', data.socialTitle], ['meta[property="og:description"]', data.socialDescription],
		['meta[name="twitter:title"]', data.socialTitle], ['meta[name="twitter:description"]', data.socialDescription]
	]) {
		const tag = document.querySelector(selector)
		if (tag) tag.setAttribute('content', value)
	}
}

export function setPluginSeo(plugin) { applySeo(pluginSeo(plugin)) }
export function resetHomepageSeo() { applySeo(HOME) }
