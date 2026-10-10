<template>
	<view v-if="visible" class="privacy-modal-overlay" @click="handleOverlayClick">
		<view class="privacy-modal-card" @click.stop>
			<!-- 头部 -->
			<view class="privacy-modal-header">
				<view class="header-title-box">
					<text class="header-icon">📄</text>
					<text class="header-title">隐私政策与数据合规声明</text>
				</view>
				<button class="close-icon-btn" aria-label="关闭" @click="close">
					<text class="close-icon">✕</text>
				</button>
			</view>

			<!-- 可滑动主体内容 -->
			<scroll-view class="privacy-modal-body" scroll-y>
				<view class="markdown-wrapper">
					<rich-text :nodes="privacyHtml" @itemclick="handleRichTextClick" />
				</view>
			</scroll-view>

			<!-- 底部操作区 -->
			<view class="privacy-modal-footer">
				<button class="confirm-btn" @click="close">
					<text>我已充分阅读并知晓</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import { PRIVACY_MARKDOWN } from '@/utils/privacy-content.js'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['update:visible', 'close'])

const privacyHtml = computed(() => {
	try {
		return marked.parse(PRIVACY_MARKDOWN)
	} catch (e) {
		return PRIVACY_MARKDOWN
	}
})

const close = () => {
	emit('update:visible', false)
	emit('close')
}

const handleOverlayClick = () => {
	close()
}

const handleRichTextClick = (e) => {
	if (e?.detail?.href) {
		uni.setClipboardData({
			data: e.detail.href,
			success: () => {
				uni.showToast({
					title: '链接已复制，请在浏览器中打开',
					icon: 'none'
				})
			}
		})
	}
}
</script>

<style scoped>
.privacy-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	background-color: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx;
	box-sizing: border-box;
	animation: modalFadeIn 0.2s ease-out;
}

.privacy-modal-card {
	width: 100%;
	max-width: 680px;
	max-height: 82vh;
	background-color: var(--surface, #ffffff);
	border: 2rpx solid var(--border, #d0d7de);
	border-radius: 16rpx;
	box-shadow: 0 20rpx 48rpx rgba(0, 0, 0, 0.25);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	animation: modalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.privacy-modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 28rpx;
	border-bottom: 2rpx solid var(--border, #d0d7de);
	background-color: var(--surface-subtle, #f6f8fa);
}

.header-title-box {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.header-icon {
	font-size: 32rpx;
}

.header-title {
	font-size: 30rpx;
	font-weight: 600;
	color: var(--text-primary, #1f2328);
}

.close-icon-btn {
	width: 56rpx;
	height: 56rpx;
	padding: 0;
	margin: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: none;
	border-radius: 8rpx;
	transition: background-color 0.15s;
}

.close-icon-btn::after {
	border: none;
}

.close-icon-btn:hover {
	background-color: var(--border, #e1e4e8);
}

.close-icon {
	font-size: 28rpx;
	line-height: 1;
	color: var(--text-secondary, #656d76);
}

.privacy-modal-body {
	flex: 1;
	min-height: 200rpx;
	max-height: 62vh;
	padding: 24rpx 28rpx;
	box-sizing: border-box;
	overflow-y: auto;
}

.markdown-wrapper {
	font-size: 26rpx;
	line-height: 1.65;
	color: var(--text-primary, #1f2328);
}

.privacy-modal-footer {
	padding: 20rpx 28rpx;
	border-top: 2rpx solid var(--border, #d0d7de);
	background-color: var(--surface-subtle, #f6f8fa);
	display: flex;
	justify-content: flex-end;
}

.confirm-btn {
	width: 100%;
	padding: 16rpx 28rpx;
	background-color: var(--primary-color, #5546a3);
	color: #ffffff;
	border: none;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: 500;
	line-height: 1.4;
	transition: opacity 0.2s, transform 0.1s;
}

.confirm-btn::after {
	border: none;
}

.confirm-btn:active {
	opacity: 0.88;
	transform: scale(0.99);
}

@keyframes modalFadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes modalSlideUp {
	from {
		opacity: 0;
		transform: translateY(24rpx) scale(0.97);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>
