<template>
	<!-- 左上角常态徽标按钮 -->
	<view
		class="brand-badge"
		title="点击查看品牌徽标"
		role="button"
		tabindex="0"
		@click="handleBadgeClick"
	>
		<image
			class="badge-logo"
			src="/static/logo_transparent_bg.png"
			mode="aspectFit"
		/>
	</view>
</template>

<script setup>
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
	justify-content: center;
	width: 38px;
	height: 38px;
	border-radius: 10px;
	cursor: pointer;
	transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
	background: transparent;
	padding: 2px;
	box-sizing: border-box;
	flex-shrink: 0;
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
</style>
