<template>
	<view class="rich-text-container">
		<template v-for="(segment, index) in parsedSegments" :key="index">
			<!-- 普通文本 -->
			<text v-if="segment.type === 'text'" class="normal-text">{{ segment.content }}</text>
			
			<!-- 加粗文本 -->
			<text v-else-if="segment.type === 'bold'" class="bold-text">{{ segment.content }}</text>
			
			<!-- 斜体文本 -->
			<text v-else-if="segment.type === 'italic'" class="italic-text">{{ segment.content }}</text>
			
			<!-- 代码文本 -->
			<text v-else-if="segment.type === 'code'" class="code-text">{{ segment.content }}</text>
			
			<!-- Ruby 注音 -->
			<view v-else-if="segment.type === 'ruby'" class="ruby-container">
				<view class="ruby-base">
					<text class="ruby-text">{{ segment.base }}</text>
				</view>
				<view class="ruby-annotation">
					<text class="ruby-rt">{{ segment.rt }}</text>
				</view>
			</view>
			
			<!-- 图片 (npm shields, badges 等) -->
			<image 
				v-else-if="segment.type === 'image'" 
				:src="segment.src" 
				:alt="segment.alt"
				class="inline-image"
				mode="widthFix"
				@error="handleImageError(index)"
				@tap.stop="handleImageClick(segment)"
			/>
			
			<!-- 链接 - 同时显示文本和URL -->
			<text v-else-if="segment.type === 'link'" class="link-text" @tap.stop="handleLinkClick(segment.url)">
				{{ segment.content }}
			</text>
			<text v-else-if="segment.type === 'link-url'" class="link-url">
				({{ segment.content }})
			</text>
			
			<!-- Emoji -->
			<text v-else-if="segment.type === 'emoji'" class="emoji-text">{{ segment.content }}</text>
		</template>
	</view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
	text: {
		type: String,
		default: ''
	},
	// 是否解析图片
	parseImages: {
		type: Boolean,
		default: true
	},
	// 是否解析链接
	parseLinks: {
		type: Boolean,
		default: true
	},
	// 是否显示完整 URL（用于卡片简化显示）
	showFullUrl: {
		type: Boolean,
		default: true
	}
});

const parsedSegments = computed(() => {
	if (!props.text) return [];
	return parseRichText(props.text);
});

// 解析富文本
const parseRichText = (text) => {
	if (!text) return [];
	
	// 第一步：预处理 HTML 标签（Ruby 等）
	text = preprocessHtmlTags(text);
	
	const segments = [];
	let currentIndex = 0;
	
	// 正则表达式模式 - 注意顺序：图片和链接必须在 ruby 之前检测
	const patterns = [
		// 图片: ![alt](url) - 最高优先级
		{ type: 'image', regex: /!\[([^\]]*)\]\(([^)]+)\)/g, priority: 0 },
		// 链接: [text](url) - 第二优先级，使用非贪婪匹配支持嵌套括号
		{ type: 'link', regex: /\[([^\[\]]*(?:\[[^\]]*\][^\[\]]*)*)\]\(([^)]+)\)/g, priority: 1 },
		// Ruby 标签: [RUBY:base|rt] - 第三优先级
		{ type: 'ruby', regex: /\[RUBY:([^|]+)\|([^\]]+)\]/g, priority: 2 },
		// 加粗: **text** 或 __text__
		{ type: 'bold', regex: /\*\*([^*]+)\*\*|__([^_]+)__/g, priority: 3 },
		// 斜体: *text* 或 _text_ (单个)
		{ type: 'italic', regex: /(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!_)_([^_\n]+)_(?!_)/g, priority: 4 },
		// 行内代码: `code`
		{ type: 'code', regex: /`([^`]+)`/g, priority: 5 }
	];
	
	// 找到所有匹配项
	const matches = [];
	patterns.forEach(pattern => {
		if ((pattern.type === 'image' && !props.parseImages) || 
			(pattern.type === 'link' && !props.parseLinks)) {
			return;
		}
		
		let match;
		const regex = new RegExp(pattern.regex);
		while ((match = regex.exec(text)) !== null) {
			matches.push({
				type: pattern.type,
				priority: pattern.priority,
				start: match.index,
				end: regex.lastIndex,
				match: match
			});
		}
	});
	
	// 按位置排序
	matches.sort((a, b) => a.start - b.start);
	
	// 处理重叠的匹配（按优先级）
	const filteredMatches = [];
	for (let i = 0; i < matches.length; i++) {
		const current = matches[i];
		let isOverlapped = false;
		
		for (let j = 0; j < filteredMatches.length; j++) {
			const existing = filteredMatches[j];
			// 检查是否重叠
			if (!(current.end <= existing.start || current.start >= existing.end)) {
				// 有重叠，比较优先级（数字越小优先级越高）
				if (current.priority < existing.priority) {
					// 当前优先级更高，替换
					filteredMatches.splice(j, 1);
					j--;
				} else {
					isOverlapped = true;
					break;
				}
			}
		}
		
		if (!isOverlapped) {
			filteredMatches.push(current);
		}
	}
	
	// 重新排序
	filteredMatches.sort((a, b) => a.start - b.start);
	
	// 构建结果
	filteredMatches.forEach(item => {
		// 添加前面的普通文本
		if (currentIndex < item.start) {
			const normalText = text.substring(currentIndex, item.start);
			if (normalText) {
				segments.push({ type: 'text', content: normalText });
			}
		}
		
		// 添加特殊元素
		switch (item.type) {
			case 'ruby':
				segments.push({
					type: 'ruby',
					base: item.match[1],
					rt: item.match[2]
				});
				break;
			case 'image':
				segments.push({
					type: 'image',
					src: item.match[2],
					alt: item.match[1] || ''
				});
				break;
			case 'link':
				// 递归解析链接内容，支持嵌套格式
				const linkContent = parseNestedContent(item.match[1]);
				segments.push({
					type: 'link',
					content: linkContent,
					url: item.match[2]
				});
				// 如果需要显示完整URL，添加URL segment
				if (props.showFullUrl) {
					segments.push({
						type: 'link-url',
						content: item.match[2]
					});
				}
				break;
			case 'bold':
				segments.push({
					type: 'bold',
					content: item.match[1] || item.match[2]
				});
				break;
			case 'italic':
				segments.push({
					type: 'italic',
					content: item.match[1] || item.match[2]
				});
				break;
			case 'code':
				segments.push({
					type: 'code',
					content: item.match[1]
				});
				break;
		}
		
		currentIndex = item.end;
	});
	
	// 添加剩余的普通文本
	if (currentIndex < text.length) {
		const remaining = text.substring(currentIndex);
		if (remaining) {
			segments.push({ type: 'text', content: remaining });
		}
	}
	
	return segments;
};

// 预处理 HTML 标签
const preprocessHtmlTags = (text) => {
	// 处理 <ruby> 标签: <ruby>base<rp>（</rp><rt>annotation</rt><rp>）</rp></ruby>
	// 使用非贪婪匹配，支持 base 中包含其他标签
	text = text.replace(/<ruby>(.*?)<rp>.*?<\/rp><rt>(.*?)<\/rt><rp>.*?<\/rp><\/ruby>/g, '[RUBY:$1|$2]');
	
	// 简化版 ruby: <ruby>base<rt>annotation</rt></ruby>
	text = text.replace(/<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/g, '[RUBY:$1|$2]');
	
	return text;
};

// 解析嵌套内容（用于链接内的加粗等格式）
const parseNestedContent = (text) => {
	// 移除 ruby 标记符，保留基础文本
	text = text.replace(/\[RUBY:([^|]+)\|[^\]]+\]/g, '$1');
	// 移除HTML ruby标签
	text = text.replace(/<ruby>([^<]+)<rp>[^<]*<\/rp><rt>[^<]+<\/rt><rp>[^<]*<\/rp><\/ruby>/g, '$1');
	text = text.replace(/<ruby>([^<]+)<rt>[^<]+<\/rt><\/ruby>/g, '$1');
	// 移除加粗
	text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
	text = text.replace(/__([^_]+)__/g, '$1');
	return text;
};

// 处理图片加载错误
const handleImageError = (index) => {
	console.warn('Image load failed:', parsedSegments.value[index]);
};

// 处理图片点击（特别是 npm shield 等带链接的图片）
const handleImageClick = (segment) => {
	console.log('Image clicked:', segment);
	
	// 尝试从原始文本中查找图片周围的链接
	// 格式1: [![alt](image)](link) - markdown 链接包裹图片
	// 格式2: [!\[alt\](image)](link) - 转义版本
	const text = props.text;
	
	// 查找包含这个图片的完整模式
	const escapedAlt = segment.alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const escapedSrc = segment.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	
	// 尝试匹配 [![alt](src)](url) 格式
	const pattern1 = new RegExp(`\\[!\\[${escapedAlt}\\]\\(${escapedSrc}\\)\\]\\(([^)]+)\\)`);
	const match1 = text.match(pattern1);
	
	if (match1) {
		const url = match1[1];
		console.log('Found link wrapping image (format 1):', url);
		handleLinkClick(url);
		return;
	}
	
	// 尝试更宽松的匹配：查找图片后面紧跟的 ](url)
	const imagePattern = `![${segment.alt}](${segment.src})`;
	const imageIndex = text.indexOf(imagePattern);
	
	if (imageIndex !== -1) {
		const afterImage = text.substring(imageIndex + imagePattern.length);
		const linkMatch = afterImage.match(/^\]\(([^)]+)\)/);
		
		if (linkMatch) {
			const url = linkMatch[1];
			console.log('Found link wrapping image (format 2):', url);
			handleLinkClick(url);
			return;
		}
	}
	
	// 如果图片 src 包含 npmjs.com，从 src 中提取包名
	if (segment.src && segment.src.includes('npmjs.com')) {
		const match = segment.src.match(/\/badge\/([^\/\?]+)/);
		if (match) {
			const packageName = decodeURIComponent(match[1]);
			const npmUrl = `https://www.npmjs.com/package/${packageName}`;
			handleLinkClick(npmUrl);
			return;
		}
	}
	
	// 如果 alt 是 'npm'，尝试从原始文本中查找包名
	if (segment.alt === 'npm') {
		const packageMatch = text.match(/koishi-plugin-[a-z0-9-]+/);
		if (packageMatch) {
			const npmUrl = `https://www.npmjs.com/package/${packageMatch[0]}`;
			handleLinkClick(npmUrl);
			return;
		}
	}
	
	// 其他情况，显示提示
	uni.showToast({
		title: '这是一个徽章图片',
		icon: 'none',
		duration: 1500
	});
};

// 处理链接点击
const handleLinkClick = (url) => {
	console.log('Link clicked:', url);
	
	// 复制链接到剪贴板（适配小程序平台）
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
</script>

<style scoped>
.rich-text-container {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	line-height: 1.6;
}

.normal-text {
	color: inherit;
	font-size: inherit;
}

.bold-text {
	font-weight: 600;
	color: inherit;
}

.italic-text {
	font-style: italic;
	color: inherit;
}

.code-text {
	font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	background-color: rgba(150, 150, 150, 0.1);
	padding: 2rpx 8rpx;
	border-radius: 6rpx;
	font-size: 0.9em;
	color: #e83e8c;
}

.ruby-container {
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	margin: 0 4rpx;
	vertical-align: bottom;
}

.ruby-base {
	display: flex;
	align-items: center;
}

.ruby-text {
	font-size: 1em;
	font-weight: 600;
	color: inherit;
}

.ruby-annotation {
	display: flex;
	align-items: center;
	margin-top: -8rpx;
}

.ruby-rt {
	font-size: 0.6em;
	color: #909399;
	white-space: nowrap;
}

.inline-image {
	max-width: 180rpx;
	max-height: 40rpx;
	height: auto;
	vertical-align: middle;
	margin: 0 6rpx;
	display: inline-block;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.inline-image:hover {
	opacity: 0.8;
	transform: scale(1.05);
}

.link-text {
	color: #409eff;
	font-weight: 600;
	text-decoration: underline;
	cursor: pointer;
	display: inline;
}

.link-text:active {
	opacity: 0.7;
}

.link-url {
	color: #909399;
	font-size: 0.85em;
	font-style: italic;
	margin-left: 4rpx;
	text-decoration: none;
	display: inline;
}

.emoji-text {
	font-size: 1.2em;
	line-height: 1;
	vertical-align: middle;
}
.rich-text-container {
	display: block;
	min-width: 0;
	overflow-wrap: anywhere;
}
.normal-text, .code-text, .link-text, .link-url {
	overflow-wrap: anywhere;
}
.inline-image {
	max-width: 100%;
}
.code-text {
	background: var(--bg-tertiary);
	color: var(--accent);
	box-decoration-break: clone;
}
.link-text {
	color: var(--accent);
}
.link-url, .ruby-rt {
	color: var(--text-secondary);
}
</style>
