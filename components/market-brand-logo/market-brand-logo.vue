<template>
	<!-- 左上角常态徽标按钮 -->
	<view
		class="brand-badge"
		title="点击查看品牌徽标"
		role="button"
		tabindex="0"
		@click="handleBadgeClick"
		@keydown.enter.prevent="handleBadgeClick"
		@keydown.space.prevent="handleBadgeClick"
	>
		<image
			class="badge-logo"
			:src="logoTransparent"
			mode="aspectFit"
		/>
		<view class="brand-copy">
			<text class="brand-name">Koishi 插件市场</text>
		</view>
	</view>
</template>

<script setup>
import logoTransparent from '@/static/logo_transparent_bg.png'

const emit = defineEmits(['click'])

const handleBadgeClick = () => {
	emit('click')
}
</script>

<style scoped>
/* 常态徽标按钮 */
.brand-badge {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 10px;
	height: 44px;
	border-radius: 10px;
	cursor: pointer;
	transition: background-color 0.18s ease;
	background: transparent;
	padding: 2px;
	box-sizing: border-box;
	flex-shrink: 0;
}

.brand-badge:active {
	opacity: 0.8;
}

.badge-logo {
	width: 32px;
	height: 32px;
	display: block;
}
.brand-copy { min-width: 0; }
.brand-name { color: var(--text-primary); font-size: 15px; font-weight: 700; white-space: nowrap; }
.brand-badge:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (max-width: 600px) { .brand-name { font-size: 14px; } }
</style>
