<template>
	<div
		v-if="visible"
		class="brand-modal-overlay"
		:class="{ 'is-closing': isClosing }"
		@click="handleOverlayClick"
	>
		<div
			class="brand-modal-card"
			:class="{ 'is-closing': isClosing }"
			@click.stop="handleCardClick"
		>
			<div class="modal-header">
				<div class="brand-title-box">
					<span class="brand-name">Koishi 插件市场</span>
					<span class="brand-ver">v{{ version }}</span>
				</div>
				<div class="close-btn" role="button" aria-label="关闭" @click.stop="closeModal">
					<span class="close-text">✕</span>
				</div>
			</div>

			<div class="tab-bar">
				<div
					class="tab-item"
					:class="{ active: currentTab === 'transparent' }"
					@click.stop="setTab('transparent')"
				>
					<span class="tab-icon">✨</span>
					<span class="tab-label">透明矢量</span>
				</div>
				<div
					class="tab-item"
					:class="{ active: currentTab === 'squircle' }"
					@click.stop="setTab('squircle')"
				>
					<span class="tab-icon">📱</span>
					<span class="tab-label">应用徽标</span>
				</div>
			</div>

			<div class="preview-stage" @click.stop="closeModal" title="点击缩回">
				<div class="image-wrapper">
					<image
						class="preview-img"
						:class="currentTab"
						:src="currentTab === 'transparent' ? '/static/logo_transparent_bg.png' : '/static/logo_roundedrectangle_bg.png'"
						mode="aspectFit"
					/>
				</div>
				<div class="stage-tip">
					<span>点击图片或遮罩即可关闭缩回</span>
				</div>
			</div>

			<div class="modal-footer">
				<div class="switch-toggle-btn" role="button" @click.stop="toggleTab">
					<span class="toggle-icon">🔄</span>
					<span class="toggle-text">切换至 {{ currentTab === 'transparent' ? '应用徽标 (圆角)' : '透明矢量 (光晕)' }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	version: {
		type: String,
		default: '0.3.4-beta.15'
	}
})

const emit = defineEmits(['update:visible', 'close'])

const currentTab = ref('transparent') // 'transparent' | 'squircle'
const isClosing = ref(false)

watch(
	() => props.visible,
	(val) => {
		if (val) {
			isClosing.value = false
		}
	}
)

const closeModal = () => {
	if (isClosing.value) return
	isClosing.value = true
	// 优雅渐隐缩退动画持续 200ms 后正式卸载
	setTimeout(() => {
		emit('update:visible', false)
		emit('close')
		isClosing.value = false
	}, 200)
}

const handleOverlayClick = () => {
	closeModal()
}

const handleCardClick = (e) => {
	if (e && typeof e.stopPropagation === 'function') {
		e.stopPropagation()
	}
}

const setTab = (tab) => {
	currentTab.value = tab
}

const toggleTab = () => {
	currentTab.value = currentTab.value === 'transparent' ? 'squircle' : 'transparent'
}
</script>

<style scoped>
/* 模态框全屏遮罩 (最高优先级 z-index: 99999) */
.brand-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(10, 10, 16, 0.78);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	z-index: 99999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	box-sizing: border-box;
	animation: modal-fade-in 0.22s ease-out forwards;
}

.brand-modal-overlay.is-closing {
	animation: modal-fade-out 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	pointer-events: none;
}

@keyframes modal-fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes modal-fade-out {
	from {
		opacity: 1;
	}
	to {
		opacity: 0;
	}
}

/* 模态卡片 */
.brand-modal-card {
	position: relative;
	z-index: 100000;
	width: 100%;
	max-width: 420px;
	background: var(--bg-secondary, #1e1e2d);
	border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
	border-radius: 20px;
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	animation: card-pop-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.brand-modal-card.is-closing {
	animation: card-pop-out 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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

@keyframes card-pop-out {
	from {
		transform: scale(1);
		opacity: 1;
	}
	to {
		transform: scale(0.88);
		opacity: 0;
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
	user-select: none;
}

.close-btn:hover {
	background: rgba(255, 255, 255, 0.1);
	color: #ffffff;
	transform: scale(1.1);
}

.close-btn:active {
	transform: scale(0.92);
}

.close-text {
	font-size: 16px;
	line-height: 1;
}

/* 选项卡栏 */
.tab-bar {
	display: flex;
	background: rgba(0, 0, 0, 0.25);
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
	user-select: none;
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
	cursor: pointer;
}

.image-wrapper {
	position: relative;
	width: 220px;
	height: 220px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.image-wrapper:hover {
	transform: scale(1.05);
}

.preview-img {
	width: 100%;
	height: 100%;
	transition: all 0.35s ease;
}

.preview-img.transparent {
	filter: drop-shadow(0 8px 28px rgba(85, 70, 163, 0.6));
	border-radius: 0;
}

.preview-img.squircle {
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
	border-radius: 48px;
}

.stage-tip {
	margin-top: 16px;
	font-size: 12px;
	color: var(--text-tertiary, #76768a);
	user-select: none;
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
	user-select: none;
	box-sizing: border-box;
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
