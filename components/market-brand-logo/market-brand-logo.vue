<template>
	<view class="market-brand-container">
		<!-- 左上角常态徽标 -->
		<view
			class="brand-badge"
			title="点击查看品牌徽标"
			role="button"
			tabindex="0"
			@click="openModal"
		>
			<image
				class="badge-logo"
				src="/static/logo_transparent_bg.png"
				mode="aspectFit"
			/>
		</view>

		<!-- 居中放大模态预览层 -->
		<view
			v-if="isOpen"
			class="brand-modal-overlay"
			:class="{ 'is-entering': isAnimating }"
			@click="closeModal"
			@touchmove.stop.prevent
		>
			<view class="brand-modal-card" @click.stop>
				<!-- 模态框顶部控制条 -->
				<view class="modal-header">
					<view class="brand-title-box">
						<text class="brand-name">Koishi 插件市场</text>
						<text class="brand-ver">v{{ version }}</text>
					</view>
					<button class="close-btn" aria-label="关闭" @click="closeModal">
						<text class="close-text">✕</text>
					</button>
				</view>

				<!-- 形态切换 Tab 控制栏 (选项 C: Tab 切换与按钮切换适配移动端与桌面端) -->
				<view class="tab-bar">
					<view
						class="tab-item"
						:class="{ active: currentTab === 'transparent' }"
						@click="setTab('transparent')"
					>
						<text class="tab-icon">✨</text>
						<text class="tab-label">透明矢量</text>
					</view>
					<view
						class="tab-item"
						:class="{ active: currentTab === 'squircle' }"
						@click="setTab('squircle')"
					>
						<text class="tab-icon">📱</text>
						<text class="tab-label">应用徽标</text>
					</view>
				</view>

				<!-- Logo 展示与缩放视口（点击大图本体也可关闭/缩回） -->
				<view class="preview-stage" @click="closeModal" title="点击缩回">
					<view class="image-wrapper" :class="currentTab">
						<!-- 透明模式 -->
						<image
							class="preview-img transparent-img"
							:class="{ active: currentTab === 'transparent' }"
							src="/static/logo_transparent_bg.png"
							mode="aspectFit"
						/>
						<!-- 圆角应用徽标模式 -->
						<image
							class="preview-img squircle-img"
							:class="{ active: currentTab === 'squircle' }"
							src="/static/logo_roundedrectangle_bg.png"
							mode="aspectFit"
						/>
					</view>
					<view class="stage-tip">
						<text>点击任意区域缩回</text>
					</view>
				</view>

				<!-- 底部快速切换按钮 & 操作栏（适配移动端大按钮触控） -->
				<view class="modal-footer">
					<button class="switch-toggle-btn" @click="toggleTab">
						<text class="toggle-icon">🔄</text>
						<text class="toggle-text">切换至 {{ currentTab === 'transparent' ? '应用徽标 (圆角)' : '透明矢量 (光晕)' }}</text>
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	version: {
		type: String,
		default: '0.3.4-beta.14'
	}
})

const isOpen = ref(false)
const isAnimating = ref(false)
const currentTab = ref('transparent') // 'transparent' | 'squircle'

const openModal = () => {
	isOpen.value = true
	isAnimating.value = true
}

const closeModal = () => {
	isOpen.value = false
	isAnimating.value = false
}

const setTab = (tab) => {
	currentTab.value = tab
}

const toggleTab = () => {
	currentTab.value = currentTab.value === 'transparent' ? 'squircle' : 'transparent'
}
</script>

<style scoped>
.market-brand-container {
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

/* 常态徽标 */
.brand-badge {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 38px;
	height: 38px;
	border-radius: 10px;
	cursor: pointer;
	transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	background: transparent;
	padding: 2px;
	box-sizing: border-box;
}

.brand-badge:hover {
	transform: scale(1.1) rotate(4deg);
	background: rgba(85, 70, 163, 0.15);
}

.brand-badge:active {
	transform: scale(0.95);
}

.badge-logo {
	width: 32px;
	height: 32px;
	display: block;
	filter: drop-shadow(0 2px 6px rgba(85, 70, 163, 0.35));
}

/* 模态框全屏遮罩 */
.brand-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(10, 10, 16, 0.72);
	backdrop-filter: blur(12px) saturate(180%);
	-webkit-backdrop-filter: blur(12px) saturate(180%);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	animation: modal-fade-in 0.25s ease-out;
}

@keyframes modal-fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* 模态卡片 */
.brand-modal-card {
	width: 100%;
	max-width: 420px;
	background: var(--bg-secondary, #1e1e2d);
	border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
	border-radius: 20px;
	box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	animation: card-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes card-pop-in {
	from {
		transform: scale(0.85);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

/* 头部 */
.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
}

.brand-title-box {
	display: flex;
	align-items: center;
	gap: 10px;
}

.brand-name {
	font-size: 17px;
	font-weight: 700;
	color: var(--text-primary, #ffffff);
	letter-spacing: -0.2px;
}

.brand-ver {
	font-size: 11px;
	padding: 2px 7px;
	border-radius: 12px;
	background: rgba(85, 70, 163, 0.25);
	color: #9d8cee;
	border: 1px solid rgba(157, 140, 238, 0.3);
	font-weight: 600;
}

.close-btn {
	background: transparent;
	border: none;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: var(--text-secondary, #a0a0b0);
	transition: all 0.2s;
	padding: 0;
}

.close-btn:hover {
	background: rgba(255, 255, 255, 0.1);
	color: #ffffff;
	transform: scale(1.1);
}

.close-text {
	font-size: 16px;
	line-height: 1;
}

/* 选项卡栏 */
.tab-bar {
	display: flex;
	background: rgba(0, 0, 0, 0.2);
	margin: 14px 20px 0;
	border-radius: 10px;
	padding: 3px;
	gap: 4px;
}

.tab-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 8px 0;
	border-radius: 8px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	color: var(--text-secondary, #9a9ab0);
	transition: all 0.2s ease;
}

.tab-item.active {
	background: var(--bg-tertiary, #2c2b3e);
	color: #ffffff;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
	font-weight: 600;
}

.tab-icon {
	font-size: 14px;
}

/* 大图预览展示台 */
.preview-stage {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 28px 20px 20px;
	cursor: zoom-out;
}

.image-wrapper {
	position: relative;
	width: 200px;
	height: 200px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-wrapper:hover {
	transform: scale(1.05);
}

.preview-img {
	position: absolute;
	width: 100%;
	height: 100%;
	object-fit: contain;
	transition: opacity 0.35s ease, transform 0.35s ease;
	opacity: 0;
	pointer-events: none;
}

.preview-img.active {
	opacity: 1;
	pointer-events: auto;
}

.transparent-img.active {
	filter: drop-shadow(0 8px 24px rgba(85, 70, 163, 0.55));
}

.squircle-img.active {
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
	border-radius: 44px;
}

.stage-tip {
	margin-top: 16px;
	font-size: 12px;
	color: var(--text-tertiary, #76768a);
}

/* 底部操作 */
.modal-footer {
	padding: 12px 20px 18px;
	display: flex;
	justify-content: center;
}

.switch-toggle-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 100%;
	padding: 10px 16px;
	background: var(--bg-tertiary, #2c2b3e);
	border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
	border-radius: 12px;
	color: var(--text-primary, #ffffff);
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
}

.switch-toggle-btn:hover {
	background: rgba(85, 70, 163, 0.3);
	border-color: rgba(157, 140, 238, 0.4);
}

.switch-toggle-btn:active {
	transform: scale(0.98);
}

.toggle-icon {
	font-size: 14px;
}
</style>
