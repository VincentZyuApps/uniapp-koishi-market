<template>
<view class="plugin-detail-page" :class="[{ 'dark-mode': isDarkMode }, motionClass, paletteClass]" :style="pageStyle">
 <view class="detail-header"><view class="header-inner">
  <view class="header-identity">
   <view class="back-btn" role="button" tabindex="0" aria-label="返回" @click="goBack" @keydown.enter.prevent="goBack" @keydown.space.prevent="goBack"><image class="ui-lucide" :src="uiIcons['arrow-left']" mode="aspectFit" /><text class="back-text">返回</text></view>
   <view class="header-title">插件详情</view>
  </view>
  <view class="header-actions">
   <!-- #ifdef WEB -->
   <view class="github-link" role="button" tabindex="0" aria-label="打开 GitHub" @click="openGithub" @keydown.enter.prevent="openGithub" @keydown.space.prevent="openGithub"><image class="github-icon" :src="isDarkMode ? githubMarkDark : githubMarkLight" mode="aspectFit" /><text class="header-action-label">GitHub</text></view>
   <!-- #endif -->
   <view class="theme-toggle" role="button" tabindex="0" :aria-label="'切换主题，当前' + themeLabel" @click="toggleTheme" @keydown.enter.prevent="toggleTheme" @keydown.space.prevent="toggleTheme"><image class="ui-lucide" :src="isDarkMode ? uiIcons.sun : uiIcons.moon" mode="aspectFit" /><text class="header-action-label">{{ themeLabel }}</text></view>
  </view>
 </view></view>
 <view v-if="isLoading" class="loading-container"><view class="loading-spinner"></view><text class="loading-text">加载中…</text></view>
 <styled-scroll-view v-else class="detail-content"><view class="content-wrapper">
  <view class="plugin-header">
   <view class="plugin-icon"><image v-if="authorEmail" class="author-avatar" :src="getAvatarUrl(authorEmail, currentMirrorIndex)" mode="aspectFill" @error="handleAvatarError" /><view v-else class="icon-fallback"><image class="detail-fallback-icon" :src="uiIcons.package" mode="aspectFit" /></view></view>
   <view class="plugin-basic-info"><view class="identity-title"><view class="plugin-name">{{ plugin.shortname || plugin.name }}</view>
<!-- 徽章信息 -->
				<view class="identity-badges" v-if="plugin.insecure || plugin.verified || plugin.portable">

					<view class="badges-container">
						<view class="badge verified" v-if="plugin.verified">
							<image class="ui-lucide badge-icon" :src="uiIcons.check" mode="aspectFit" />
							<text class="badge-text">官方认证</text>
						</view>
						<view class="badge portable" v-if="plugin.portable">
							<image class="ui-lucide badge-icon" :src="uiIcons['smartphone']" mode="aspectFit" />
							<text class="badge-text">可移植</text>
						</view>
						<view class="badge insecure" v-if="plugin.insecure">
							<image class="ui-lucide badge-icon" :src="uiIcons['triangle-alert']" mode="aspectFit" />
							<text class="badge-text">不安全</text>
						</view>
					</view>
				</view>

				</view>
    <view class="plugin-package clickable" role="button" tabindex="0" aria-label="复制 npm 插件链接" @click="copyNpmPackageLink" @keydown.enter.prevent="copyNpmPackageLink" @keydown.space.prevent="copyNpmPackageLink"><text>{{ plugin._raw?.package?.name || plugin.name }}</text><image class="ui-lucide copy-hint" :src="uiIcons.copy" mode="aspectFit" /></view>
    <view class="plugin-author" v-if="plugin.author"><image class="ui-lucide author-icon" :src="uiIcons['user-round']" mode="aspectFit" /><text>{{ plugin.author }}</text></view>
   </view>
  </view>
<!-- 统计信息 -->
				<view class="stats-section" :class="{ 'has-quality': !!plugin._raw?.score }">

					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">下载量</text>
							<text class="info-value">{{ formatNumber(plugin.downloads || plugin._raw?.downloads?.lastMonth) }}/月</text>
						</view>
						<view class="info-item">
							<text class="info-label">评分</text>
							<view class="rating-value">
								<image class="ui-lucide" :src="uiIcons.star" mode="aspectFit" />
								<text class="rating-number">{{ plugin.rating?.toFixed(1) || '0.0' }}</text>
							</view>
						</view>
						<view class="info-item">
							<text class="info-label">安装大小</text>
							<text class="info-value">{{ formatSize(plugin.installSize || plugin._raw?.installSize) }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">发布大小</text>
							<text class="info-value">{{ formatSize(plugin.publishSize || plugin._raw?.publishSize) }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">依赖数</text>
							<text class="info-value">{{ plugin.dependents || plugin._raw?.dependents || 0 }}</text>
						</view>
						<view class="info-item" v-if="plugin._raw?.score">
							<text class="info-label">质量评分</text>
							<text class="info-value">{{ plugin._raw.score.quality?.toFixed(1) || 'N/A' }}</text>
						</view>
					</view>
				</view>

				<view class="detail-columns"><view class="detail-main"><!-- 插件描述 -->
				<view class="section">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['file-text']" mode="aspectFit" /> 描述</view>
					<view class="section-content">
						<rich-text-parser
							class="description-text"
							:text="getDescription(plugin.description || plugin._raw?.manifest?.description)"
							:parse-images="true"
							:parse-links="true"
						/>
					</view>
				</view>

				<!-- 服务实现 -->
				<view class="section" v-if="plugin._raw?.manifest?.service">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['settings']" mode="aspectFit" /> 服务</view>
					<view class="service-info">
						<view class="service-item" v-if="plugin._raw.manifest.service.implements?.length">
							<text class="service-label">实现：</text>
							<view class="service-tags">
								<text class="service-tag" v-for="(impl, index) in plugin._raw.manifest.service.implements" :key="index">
									{{ impl }}
								</text>
							</view>
						</view>
						<view class="service-item" v-if="plugin._raw.manifest.service.required?.length">
							<text class="service-label">依赖：</text>
							<view class="service-tags">
								<text class="service-tag required" v-for="(req, index) in plugin._raw.manifest.service.required" :key="index">
									{{ req }}
								</text>
							</view>
						</view>
						<view class="service-item" v-if="plugin._raw.manifest.service.optional?.length">
							<text class="service-label">可选：</text>
							<view class="service-tags">
								<text class="service-tag optional" v-for="(opt, index) in plugin._raw.manifest.service.optional" :key="index">
									{{ opt }}
								</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 关键词 -->
				<view class="section" v-if="plugin._raw?.package?.keywords?.length">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['bookmark']" mode="aspectFit" /> 关键词</view>
					<view class="keywords-container">
						<view class="keyword-tag" v-for="(keyword, index) in plugin._raw.package.keywords" :key="index">
							{{ keyword }}
						</view>
					</view>
				</view>

				<!-- 发布者信息 -->
				<view class="section" v-if="plugin._raw?.package?.publisher">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['user-round']" mode="aspectFit" /> 发布者</view>
					<view class="publisher-card clickable" role="button" tabindex="0" aria-label="复制发布者链接" @click="copyNpmAuthorLink(plugin._raw.package.publisher.username)" @keydown.enter.prevent="copyNpmAuthorLink(plugin._raw.package.publisher.username)" @keydown.space.prevent="copyNpmAuthorLink(plugin._raw.package.publisher.username)">
						<image
							class="publisher-avatar"
							:src="getAvatarUrl(plugin._raw.package.publisher.email)"
							mode="aspectFill"
						/>
						<view class="publisher-info">
							<text class="publisher-name">{{ plugin._raw.package.publisher.username }}</text>
							<text class="publisher-email">{{ plugin._raw.package.publisher.email }}</text>
						</view>
						<image class="ui-lucide copy-hint" :src="uiIcons['copy']" mode="aspectFit" />
					</view>
				</view>

				<!-- 维护者信息 -->
				<view class="section" v-if="plugin._raw?.package?.maintainers?.length">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['wrench']" mode="aspectFit" /> 维护者 ({{ plugin._raw.package.maintainers.length }})</view>
					<view class="maintainers-list">
						<view class="maintainer-card clickable" v-for="(maintainer, index) in plugin._raw.package.maintainers" :key="index" role="button" tabindex="0" aria-label="复制维护者链接" @click="copyNpmAuthorLink(maintainer.username)" @keydown.enter.prevent="copyNpmAuthorLink(maintainer.username)" @keydown.space.prevent="copyNpmAuthorLink(maintainer.username)">
							<image
								class="maintainer-avatar"
								:src="getAvatarUrl(maintainer.email)"
								mode="aspectFill"
							/>
							<view class="maintainer-info">
								<text class="maintainer-name">{{ maintainer.username }}</text>
								<text class="maintainer-email">{{ maintainer.email }}</text>
							</view>
							<image class="ui-lucide copy-hint" :src="uiIcons['copy']" mode="aspectFit" />
						</view>
					</view>
				</view>

				</view><view class="detail-aside"><!-- 版本信息 -->
				<view class="section">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['tag']" mode="aspectFit" /> 版本信息</view>
					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">当前版本</text>
							<text class="info-value">{{ plugin.version || 'N/A' }}</text>
						</view>
						<view class="info-item" v-if="plugin.package?.peerDependencies?.koishi">
							<text class="info-label">Koishi 版本</text>
							<text class="info-value">{{ plugin.package.peerDependencies.koishi }}</text>
						</view>
					</view>
				</view>

				<!-- #ifdef WEB -->
				<!-- 链接信息 -->
				<view class="section" v-if="plugin._raw?.package?.links">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['link']" mode="aspectFit" /> 相关链接</view>
					<view class="links-container">
						<view class="link-item" v-if="plugin._raw.package.links.npm" role="link" tabindex="0" aria-label="在新页面打开 NPM 链接" @click="openExternalLink(plugin._raw.package.links.npm)" @keydown.enter.prevent="openExternalLink(plugin._raw.package.links.npm)" @keydown.space.prevent="openExternalLink(plugin._raw.package.links.npm)">
							<image class="ui-lucide link-icon" :src="uiIcons['package']" mode="aspectFit" />
							<text class="link-text">NPM</text>
							<text class="link-url">{{ decodeLink(plugin._raw.package.links.npm) }}</text>
						</view>
						<view class="link-item" v-if="plugin._raw.package.links.homepage" role="link" tabindex="0" aria-label="在新页面打开主页链接" @click="openExternalLink(plugin._raw.package.links.homepage)" @keydown.enter.prevent="openExternalLink(plugin._raw.package.links.homepage)" @keydown.space.prevent="openExternalLink(plugin._raw.package.links.homepage)">
							<image class="ui-lucide link-icon" :src="uiIcons['house']" mode="aspectFit" />
							<text class="link-text">主页</text>
							<text class="link-url">{{ decodeLink(plugin._raw.package.links.homepage) }}</text>
						</view>
						<view class="link-item" v-if="plugin._raw.package.links.repository" role="link" tabindex="0" aria-label="在新页面打开仓库链接" @click="openExternalLink(plugin._raw.package.links.repository)" @keydown.enter.prevent="openExternalLink(plugin._raw.package.links.repository)" @keydown.space.prevent="openExternalLink(plugin._raw.package.links.repository)">
							<image class="ui-lucide link-icon" :src="uiIcons['code']" mode="aspectFit" />
							<text class="link-text">仓库</text>
							<text class="link-url">{{ decodeLink(plugin._raw.package.links.repository) }}</text>
						</view>
						<view class="link-item" v-if="plugin._raw.package.links.bugs" role="link" tabindex="0" aria-label="在新页面打开问题反馈链接" @click="openExternalLink(plugin._raw.package.links.bugs)" @keydown.enter.prevent="openExternalLink(plugin._raw.package.links.bugs)" @keydown.space.prevent="openExternalLink(plugin._raw.package.links.bugs)">
							<image class="ui-lucide link-icon" :src="uiIcons['bug']" mode="aspectFit" />
							<text class="link-text">问题反馈</text>
							<text class="link-url">{{ decodeLink(plugin._raw.package.links.bugs) }}</text>
						</view>
					</view>
				</view>
				<!-- #endif -->

				<!-- 时间信息 -->
				<view class="section">
					<view class="section-title"><image class="ui-lucide" :src="uiIcons['clock']" mode="aspectFit" /> 时间信息</view>
					<view class="info-grid">
						<view class="info-item" v-if="plugin.createdAt">
							<text class="info-label">创建时间</text>
							<text class="info-value">{{ formatDate(plugin.createdAt) }}</text>
						</view>
						<view class="info-item" v-if="plugin.updatedAt">
							<text class="info-label">更新时间</text>
							<text class="info-value">{{ formatDate(plugin.updatedAt) }}</text>
						</view>
						<view class="info-item" v-if="plugin.license">
							<text class="info-label">开源协议</text>
							<text class="info-value">{{ plugin.license }}</text>
						</view>
						<view class="info-item" v-if="plugin.category">
							<text class="info-label">分类</text>
							<text class="info-value">{{ getCategoryName(plugin.category) }}</text>
						</view>
					</view>
				</view></view></view>
 </view></styled-scroll-view>
</view>
</template>

<script setup>
import { uiIcons } from '@/utils/ui-icons.js'
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPlugin } from '@/utils/plugin-store.js';
import RichTextParser from '@/components/rich-text-parser/rich-text-parser.vue';
import { AVATAR_MIRRORS, getAvatarUrl } from '@/utils/avatar.js';
import StyledScrollView from '@/components/styled-scroll-view/styled-scroll-view.vue';
import { useMotionPreferences } from '@/utils/motion.js';
import { usePageLayout } from '@/utils/layout.js'

import { useTheme } from '@/utils/theme.js'
import { loadFonts } from '@/utils/fonts.js'
import githubMarkDark from '@/static/github-mark-white.png'
import githubMarkLight from '@/static/github-mark.png'

// 主题模式（统一由 useTheme 管理）
const { themeMode, isDarkMode, themeEmoji, themeLabel, toggleTheme, paletteClass } = useTheme()
const isLoading = ref(true);
const plugin = ref({});
const avatarError = ref(false);
const currentMirrorIndex = ref(0);
const { pageStyle } = usePageLayout()
const { motionClass } = useMotionPreferences();

// 从上一页接收插件数据
onLoad((options) => {
	// #ifdef MP-QQ
	loadFonts()
	// #endif
	try {
		
		// 从localStorage读取主题设置
		const savedTheme = uni.getStorageSync('theme');
		if (['system', 'light', 'dark'].includes(savedTheme)) {
			themeMode.value = savedTheme;
		}
		
		// 接收插件数据
		const pluginName = options.name
		const pluginRaw = options.plugin

		if (pluginName) {
			const name = decodeURIComponent(pluginName)
			const data = getPlugin(name)
			
			if (data) {
				plugin.value = data
			} else {
				console.error('插件数据未找到:', name)
				uni.showToast({
					title: '插件数据丢失，请返回重试',
					icon: 'error',
					duration: 2000
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 2000)
				return
			}
			
			// 调试：打印当前插件的完整数据结构
			console.log('=== 插件详情页 - 当前插件数据结构 ===')
			console.log('插件名称:', plugin.value.shortname || plugin.value.name)
			console.log('=======================================')
			
			isLoading.value = false;
		} else if (pluginRaw) {
			// 兼容旧版 URL 格式（直接传递 JSON）
			plugin.value = JSON.parse(decodeURIComponent(pluginRaw))
			isLoading.value = false
		} else {
			// 如果没有数据，显示错误并返回
			uni.showToast({
				title: '插件数据错误',
				icon: 'error',
				duration: 2000
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 2000);
		}
	} catch (error) {
		console.error('加载插件详情失败:', error);
		uni.showToast({
			title: '加载失败',
			icon: 'error',
			duration: 2000
		});
		setTimeout(() => {
			uni.navigateBack();
		}, 2000);
	}
});

// 返回上一页
const goBack = () => {
	uni.navigateBack();
};

// 获取描述文本（中文优先）
const getDescription = (description) => {
	if (typeof description === 'object') {
		return description['zh-CN'] || description['zh'] || description['en'] || JSON.stringify(description);
	}
	return description || '暂无描述';
};

// 获取作者邮箱（用于 Gravatar）
const authorEmail = computed(() => {
	if (avatarError.value) return null
	
	const p = plugin.value
	
	// 优先从 _raw.package.publisher 获取
	if (p._raw?.package?.publisher?.email) {
		return p._raw.package.publisher.email
	}
	
	// 从 _raw.package.maintainers 获取
	if (p._raw?.package?.maintainers?.length > 0) {
		const email = p._raw.package.maintainers[0].email
		if (email) return email
	}
	
	return null
});

// 头像加载失败/错误处理（三级 Fallback）
const handleAvatarError = () => {
	if (currentMirrorIndex.value < AVATAR_MIRRORS.length - 1) {
		currentMirrorIndex.value++;
	} else {
		avatarError.value = true;
	}
};

// 获取分类名称
const getCategoryName = (category) => {
	const names = {
		adapter: '适配器',
		extension: '扩展功能',
		tool: '实用工具',
		game: '娱乐玩法',
		image: '图片服务',
		manage: '管理工具',
		general: '通用功能',
		webui: 'Web界面',
		other: '其他'
	};
	return names[category] || category;
};

// 获取贡献者列表
const getContributors = () => {
	const contributors = plugin.value.contributors || [];
	const maintainers = plugin.value.maintainers || [];
	return [...contributors, ...maintainers];
};

// 格式化数字
const formatNumber = (num) => {
	if (!num) return '0';
	if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
	if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
	return num.toString();
};

// 格式化大小
const formatSize = (bytes) => {
	if (!bytes) return '0 B';
	if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
	if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return bytes + ' B';
};

// 格式化日期
const formatDate = (dateString) => {
	const date = new Date(dateString);
	return date.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
};

// 显示解码后的链接，打开时保留原始编码以避免改变 URL 的含义。
const decodeLink = (value) => {
	const url = String(value || '')
	try {
		return decodeURIComponent(url)
	} catch {
		return url
	}
}

// #ifdef WEB
const openExternalLink = (value) => {
	try {
		const url = new URL(value)
		if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported protocol')
		window.open(url.href, '_blank', 'noopener,noreferrer')
	} catch {
		uni.showToast({ title: '链接地址无效', icon: 'none' })
	}
}
// #endif

// 复制链接
const copyLink = (url) => {
	uni.setClipboardData({
		data: url,
		success: () => {
			uni.showToast({
				title: '链接已复制',
				icon: 'success',
				duration: 1500
			});
		}
	});
};

// 复制 npm 包链接
const copyNpmPackageLink = () => {
	const packageName = plugin.value._raw?.package?.name || plugin.value.name;
	const npmUrl = `https://www.npmjs.com/package/${packageName}`;
	copyLink(npmUrl);
};

// 复制 npm 作者主页链接
const copyNpmAuthorLink = (username) => {
	if (!username) {
		uni.showToast({
			title: '用户名不存在',
			icon: 'none',
			duration: 1500
		});
		return;
	}
	const npmAuthorUrl = `https://www.npmjs.com/~${username}`;
	copyLink(npmAuthorUrl);
};

// 打开 GitHub 链接
const openGithub = () => {
	// #ifdef H5
	window.open('https://github.com/VincentZyu233/uniapp-koishi-market', '_blank')
	// #endif
	
	// #ifndef H5
	uni.setClipboardData({
		data: 'https://github.com/VincentZyu233/uniapp-koishi-market',
		success: () => {
			uni.showToast({
				title: 'GitHub 链接已复制',
				icon: 'success'
			})
		}
	})
	// #endif
};

onLoad(()=>{
	// #ifdef MP-QQ
	console.log("qq小程序的神秘要求捏");
	qq.showShareMenu({
		showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment'],
		withShareTicket: true,
	});
	// #endif
	// #ifdef MP-WEIXIN
	wx.showShareMenu({
		withShareTicket: true,
		menus: ['shareAppMessage', 'shareTimeline']
	});
	// #endif
})



onUnmounted(() => {
	
})
</script>

<style lang="scss" scoped>

.plugin-detail-page { display:flex; flex-direction:column; width:100%; height:100vh; min-height:0; background:var(--bg-primary); color:var(--text-primary); }
.detail-header { flex-shrink:0; background:var(--surface); border-bottom:1px solid var(--border); }
.header-inner { box-sizing:border-box; max-width:1180px; min-height:64px; padding:10px 28px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.header-identity, .header-actions { display:flex; align-items:center; gap:12px; min-width:0; }
.header-title { font-size:15px; font-weight:700; white-space:nowrap; }
.back-btn, .github-link, .theme-toggle { display:flex; align-items:center; justify-content:center; gap:7px; box-sizing:border-box; min-height:38px; padding:8px 11px; border:1px solid var(--border); border-radius:10px; color:var(--text-secondary); background:var(--surface); cursor:pointer; font-size:13px; }
.back-btn:hover, .github-link:hover, .theme-toggle:hover, .plugin-package:hover, .publisher-card:hover, .maintainer-card:hover, .link-item:hover { color:var(--accent); background:var(--accent-soft); }
.back-btn:focus-visible, .github-link:focus-visible, .theme-toggle:focus-visible, .plugin-package:focus-visible, .publisher-card:focus-visible, .maintainer-card:focus-visible, .link-item:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.ui-lucide, .github-icon { width:17px; height:17px; flex-shrink:0; }
.detail-content { flex:1; height:0; min-height:0; overflow:hidden; }
.content-wrapper { box-sizing:border-box; width:100%; max-width:1180px; margin:0 auto; padding:36px 28px 72px; }
.plugin-header { display:flex; align-items:flex-start; gap:22px; min-width:0; padding:4px 0 30px; }
.plugin-icon { display:flex; align-items:center; justify-content:center; flex:0 0 76px; width:76px; height:76px; overflow:hidden; border:1px solid var(--border); border-radius:22px; background:var(--accent-soft); }
.author-avatar { display:block; width:100%; height:100%; }
.icon-fallback { display:flex; align-items:center; justify-content:center; width:100%; height:100%; }
.detail-fallback-icon { width:32px; height:32px; }
.plugin-basic-info { flex:1; min-width:0; }
.identity-title { display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; }
.plugin-name { min-width:0; font-size:30px; line-height:1.2; font-weight:700; overflow-wrap:anywhere; }
.plugin-package { display:inline-flex; align-items:center; gap:8px; max-width:100%; box-sizing:border-box; margin:8px 0 0 -6px; padding:4px 6px; border-radius:7px; color:var(--text-secondary); font-size:14px; cursor:pointer; }
.plugin-package text { min-width:0; overflow-wrap:anywhere; }
.copy-hint { width:15px; height:15px; opacity:.7; }
.plugin-author { display:flex; align-items:center; gap:7px; margin-top:7px; color:var(--text-secondary); font-size:13px; overflow-wrap:anywhere; }
.author-icon { width:15px; height:15px; }
.identity-badges, .badges-container { display:flex; flex-wrap:wrap; align-items:center; gap:7px; }
.badge { display:inline-flex; align-items:center; gap:5px; padding:5px 8px; border-radius:7px; background:var(--accent-soft); color:var(--accent); font-size:12px; line-height:1.2; }
.badge.verified { color:var(--success-color); }
.badge.insecure { color:var(--danger-color); }
.badge-icon { width:14px; height:14px; }
.stats-section { padding:0 24px; border:1px solid var(--border); border-radius:16px; background:var(--surface); }
.stats-section .info-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); }
.stats-section.has-quality .info-grid { grid-template-columns:repeat(6,minmax(0,1fr)); }
.stats-section .info-item { min-width:0; padding:19px 16px; border-left:1px solid var(--border); }
.stats-section .info-item:first-child { border-left:0; padding-left:0; }
.info-item { display:flex; flex-direction:column; gap:8px; min-width:0; }
.info-label { color:var(--text-tertiary); font-size:12px; line-height:1.4; }
.info-value, .rating-number { color:var(--text-primary); font-size:14px; font-weight:700; line-height:1.4; overflow-wrap:anywhere; font-variant-numeric:tabular-nums; }
.stats-section .info-value, .stats-section .rating-number { font-size:17px; }
.rating-value { display:flex; align-items:center; gap:5px; }
.rating-value .ui-lucide { width:15px; height:15px; }
.detail-columns { display:grid; grid-template-columns:minmax(0,1fr) minmax(270px,340px); gap:56px; align-items:start; margin-top:38px; }
.detail-main, .detail-aside { min-width:0; }
.section { min-width:0; padding:0 0 26px; margin:0 0 26px; border-bottom:1px solid var(--border); }
.section:last-child { margin-bottom:0; }
.section-title { display:flex; align-items:center; gap:9px; margin-bottom:16px; color:var(--text-primary); font-size:16px; font-weight:700; line-height:1.4; }
.section-title .ui-lucide { width:17px; height:17px; }
.section-content, .description-text { color:var(--text-secondary); font-size:15px; line-height:1.8; overflow-wrap:anywhere; }
.detail-aside { padding:24px; border:1px solid var(--border); border-radius:16px; background:var(--surface); }
.detail-aside .section:last-child { border-bottom:0; padding-bottom:0; }
.detail-aside .info-grid { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; }
.detail-aside .info-item { gap:5px; }
.service-info { display:flex; flex-direction:column; gap:12px; }
.service-item { display:flex; align-items:flex-start; gap:10px; color:var(--text-secondary); font-size:13px; }
.service-label { flex-shrink:0; padding-top:5px; }
.service-tags, .keywords-container { display:flex; flex-wrap:wrap; gap:8px; min-width:0; }
.service-tag, .keyword-tag { display:inline-flex; box-sizing:border-box; max-width:100%; padding:5px 9px; border:1px solid var(--border); border-radius:7px; background:var(--surface); color:var(--text-secondary); font-size:12px; line-height:1.4; overflow-wrap:anywhere; }
.service-tag.required { color:var(--accent); border-color:var(--accent); }
.service-tag.optional { color:var(--warning-color); }
.publisher-card, .maintainer-card { display:flex; align-items:center; gap:12px; box-sizing:border-box; min-width:0; padding:10px; margin-left:-10px; border-radius:10px; cursor:pointer; }
.maintainers-list { display:flex; flex-direction:column; gap:2px; }
.publisher-avatar, .maintainer-avatar { flex-shrink:0; width:40px; height:40px; border-radius:50%; background:var(--accent-soft); }
.publisher-info, .maintainer-info { display:flex; flex:1; flex-direction:column; gap:3px; min-width:0; }
.publisher-name, .maintainer-name { color:var(--text-primary); font-size:14px; font-weight:700; overflow-wrap:anywhere; }
.publisher-email, .maintainer-email { color:var(--text-tertiary); font-size:12px; overflow-wrap:anywhere; }
.links-container { display:flex; flex-direction:column; gap:3px; }
.link-item { display:grid; grid-template-columns:17px minmax(0,1fr); gap:4px 9px; min-width:0; padding:10px; margin:0 -10px; border-radius:9px; cursor:pointer; }
.link-icon { grid-row:1; }
.link-text { color:var(--text-primary); font-size:13px; font-weight:700; }
.link-url { grid-column:2; min-width:0; color:var(--text-tertiary); font-size:12px; line-height:1.5; overflow-wrap:anywhere; word-break:break-all; }
.loading-container { display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; gap:14px; color:var(--text-secondary); }
.loading-spinner { width:26px; height:26px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:detail-spin .8s linear infinite; }
.loading-text { font-size:14px; }
@keyframes detail-spin { to { transform:rotate(360deg); } }
.motion-ultra-low .loading-spinner { animation:none; }
@media (max-width:900px) {
 .detail-columns { grid-template-columns:minmax(0,1fr) minmax(240px,300px); gap:28px; }
 .stats-section .info-grid, .stats-section.has-quality .info-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
 .stats-section .info-item:nth-child(4) { border-left:0; padding-left:0; }
 .stats-section .info-item:nth-child(n+4) { border-top:1px solid var(--border); }
}
@media (max-width:640px) {
 .header-inner { min-height:56px; padding:8px 16px; }
 .header-identity, .header-actions { gap:8px; }
 .header-action-label, .back-text { display:none; }
 .back-btn, .github-link, .theme-toggle { width:38px; padding:8px; }
 .content-wrapper { padding:24px 16px 56px; }
 .plugin-header { gap:15px; padding:0 0 24px; }
 .plugin-icon { flex-basis:58px; width:58px; height:58px; border-radius:16px; }
 .detail-fallback-icon { width:27px; height:27px; }
 .plugin-name { font-size:23px; }
 .plugin-package { font-size:13px; }
 .stats-section { padding:0 16px; }
 .stats-section .info-grid, .stats-section.has-quality .info-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
 .stats-section .info-item { padding:15px 12px; }
 .stats-section .info-item:nth-child(odd) { border-left:0; padding-left:0; }
 .stats-section .info-item:nth-child(even) { border-left:1px solid var(--border); padding-left:16px; }
 .stats-section .info-item:nth-child(n+3) { border-top:1px solid var(--border); }
 .detail-columns { display:flex; flex-direction:column; gap:26px; margin-top:30px; }
 .detail-main, .detail-aside { box-sizing:border-box; width:100%; }
 .detail-aside { padding:20px; }
 .section { padding-bottom:22px; margin-bottom:22px; }
}
</style>
