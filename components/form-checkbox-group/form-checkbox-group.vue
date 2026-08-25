<template>
	<view class="form-checkbox-group">
		<view
			v-for="option in options"
			:key="option.key"
			class="checkbox-row"
			:class="{ checked: isChecked(option.key) }"
			role="checkbox"
			:aria-checked="isChecked(option.key)"
			@click="toggleOption(option.key)"
		>
			<view class="checkbox-box">
				<text v-if="isChecked(option.key)" class="checkbox-mark">✓</text>
			</view>
			<view class="checkbox-copy">
				<text class="checkbox-label">{{ option.label }}</text>
				<text v-if="option.description" class="checkbox-description">{{ option.description }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	modelValue: {
		type: Array,
		default: () => []
	},
	options: {
		type: Array,
		default: () => []
	}
})

const emit = defineEmits(['update:modelValue', 'change'])

function isChecked(key) {
	return props.modelValue.includes(key)
}

function toggleOption(key) {
	const nextValue = isChecked(key)
		? props.modelValue.filter((value) => value !== key)
		: [...props.modelValue, key]
	emit('update:modelValue', nextValue)
	emit('change', nextValue)
}
</script>

<style scoped>
.form-checkbox-group {
	display: grid;
	gap: 14rpx;
}

.checkbox-row {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	padding: 18rpx;
	box-sizing: border-box;
	border: 2rpx solid var(--border, #d0d7de);
	border-radius: 6rpx;
	background: var(--surface-subtle, #f6f8fa);
	color: var(--text-primary, #1f2328);
	transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

@media (hover: hover) {
	.checkbox-row:hover {
		border-color: var(--accent, #5546a3);
		box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);
		transform: translateY(-2rpx);
	}
}

.checkbox-row:active {
	transform: scale(0.985);
}

.checkbox-row.checked {
	border-color: var(--accent, #5546a3);
	background: var(--accent-soft, #edeafa);
}

.checkbox-box {
	width: 34rpx;
	height: 34rpx;
	flex: 0 0 34rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 2rpx;
	box-sizing: border-box;
	border: 2rpx solid var(--border, #d0d7de);
	border-radius: 4rpx;
	background: var(--surface, #ffffff);
	transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.checked .checkbox-box {
	border-color: var(--accent, #5546a3);
	background: var(--accent, #5546a3);
}

.checkbox-mark {
	font-size: 25rpx;
	font-weight: 700;
	line-height: 1;
	color: #ffffff;
	animation: checkbox-mark-enter 0.18s ease-out;
}

.checkbox-copy {
	min-width: 0;
	flex: 1;
}

.checkbox-label,
.checkbox-description {
	display: block;
}

.checkbox-label {
	font-size: 26rpx;
	font-weight: 600;
	color: var(--text-primary, #1f2328);
}

.checkbox-description {
	margin-top: 5rpx;
	font-size: 22rpx;
	line-height: 1.45;
	color: var(--text-secondary, #656d76);
}

@keyframes checkbox-mark-enter {
	from {
		opacity: 0;
		transform: scale(0.35) rotate(-24deg);
	}
	to {
		opacity: 1;
		transform: scale(1) rotate(0);
	}
}
</style>
