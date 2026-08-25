<template>
	<view class="form-toggle" :class="{ checked: modelValue }" role="switch" :aria-checked="modelValue" @click="toggle">
		<view class="toggle-track">
			<view class="toggle-thumb"></view>
		</view>
		<text class="toggle-label">{{ modelValue ? onLabel : offLabel }}</text>
	</view>
</template>

<script setup>
const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false
	},
	onLabel: {
		type: String,
		default: '已启用'
	},
	offLabel: {
		type: String,
		default: '未启用'
	}
})

const emit = defineEmits(['update:modelValue', 'change'])

function toggle() {
	const nextValue = !props.modelValue
	emit('update:modelValue', nextValue)
	emit('change', nextValue)
}
</script>

<style scoped>
.form-toggle {
	display: inline-flex;
	align-items: center;
	gap: 10rpx;
	color: var(--text-secondary, #656d76);
	transition: transform 0.18s ease;
}

@media (hover: hover) {
	.form-toggle:hover {
		transform: translateY(-1rpx);
	}
}

.form-toggle:active {
	transform: scale(0.94);
}

.toggle-track {
	width: 76rpx;
	height: 42rpx;
	padding: 4rpx;
	box-sizing: border-box;
	border: 2rpx solid var(--border, #d0d7de);
	border-radius: 24rpx;
	background: var(--surface-subtle, #f6f8fa);
	transition: border-color 0.2s ease, background-color 0.2s ease;
}

.toggle-thumb {
	width: 30rpx;
	height: 30rpx;
	border-radius: 50%;
	background: var(--text-secondary, #656d76);
	transition: transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1), background-color 0.2s ease;
}

.checked .toggle-track {
	border-color: var(--accent, #5546a3);
	background: var(--accent, #5546a3);
}

.checked .toggle-thumb {
	transform: translateX(32rpx);
	background: #ffffff;
}

.toggle-label {
	font-size: 22rpx;
	color: var(--text-secondary, #656d76);
	transition: color 0.2s ease;
}

.checked .toggle-label {
	color: var(--accent, #5546a3);
}
</style>
