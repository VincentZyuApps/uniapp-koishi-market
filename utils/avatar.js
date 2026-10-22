import { simpleMd5 } from './md5.js'

/**
 * 头像镜像源列表（按优先级排序）
 * 1. WeAvatar: 国内快速镜像，低延迟
 * 2. Cravatar: 国内 Anycast CDN 镜像，高可用
 * 3. 官方 Gravatar: 海外线路兜底
 */
export const AVATAR_MIRRORS = [
	'https://weavatar.com/avatar/',
	'https://cravatar.cn/avatar/',
	'https://s.gravatar.com/avatar/'
]

/**
 * 根据邮箱和当前镜像源索引获取头像 URL
 * @param {string} email
 * @param {number} mirrorIndex
 * @param {number} size
 * @returns {string}
 */
export function getAvatarUrl(email, mirrorIndex = 0, size = 96) {
	if (!email) return ''
	const hash = simpleMd5(email.toLowerCase().trim())
	const safeIndex = Math.max(0, Math.min(mirrorIndex, AVATAR_MIRRORS.length - 1))
	const mirror = AVATAR_MIRRORS[safeIndex]
	return `${mirror}${hash}?d=identicon&s=${size}`
}

/**
 * 获取首字母占位文本
 * @param {string} name
 * @returns {string}
 */
export function getAvatarText(name) {
	if (!name) return '?'
	return name.charAt(0).toUpperCase()
}
