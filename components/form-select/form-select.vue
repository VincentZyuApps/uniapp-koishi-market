<template>
	<view class="form-select" :class="{ 'is-open': isOpen, disabled }">
		<view class="select-trigger" role="button" :aria-expanded="isOpen" @click="toggle">
			<view class="selected-copy">
				<text class="selected-label">{{ selectedOption ? selectedOption.label : placeholder }}</text>
				<text v-if="selectedOption && selectedOption.description" class="selected-description">{{ selectedOption.description }}</text>
			</view>
			<text class="select-arrow">⌄</text>
		</view>

		<view v-if="isOpen" class="option-menu">
			<view
				v-for="option in options"
				:key="String(option.value)"
				class="option-row"
				:class="{ selected: option.value === modelValue }"
				@click.stop="selectOption(option)"
			>
				<view class="option-copy">
					<text class="option-label">{{ option.label }}</text>
					<text v-if="option.description" class="option-description">{{ option.description }}</text>
				</view>
				<text v-if="option.value === modelValue" class="selected-mark">✓</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
	modelValue: {
		type: [String, Number],
		default: ''
	},
	options: {
		type: Array,
		default: () => []
	},
	placeholder: {
		type: String,
		default: '请选择'
	},
	disabled: {
		type: Boolean,
		default: false
	},
	expanded: {
		type: Boolean,
		default: null
	}
})

const emit = defineEmits(['update:modelValue', 'change', 'open-change'])
const isOpen = ref(false)
const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue))

watch(() => props.expanded, (value) => {
	if (value !== null) isOpen.value = value
})

function toggle() {
	if (props.disabled) return
	isOpen.value = !isOpen.value
	emit('open-change', isOpen.value)
}

function selectOption(option) {
	emit('update:modelValue', option.value)
	emit('change', option.value)
	isOpen.value = false
	emit('open-change', false)
}
</script>

<style scoped>
.form-select {
	position: relative;
	z-index: 1;
	color: var(--text-primary, #1f2328);
	font-family: 'LXGWWenKaiMono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
}

.form-select.is-open {
	z-index: 20;
}

.select-trigger,
.option-row {
	border: 2rpx solid var(--border, #d0d7de);
	background: var(--surface-subtle, #f6f8fa);
}

.select-trigger {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	min-height: 82rpx;
	padding: 16rpx 20rpx;
	box-sizing: border-box;
	border-radius: 6rpx;
	transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

@media (hover: hover) {
	.select-trigger:hover {
		border-color: var(--accent, #5546a3);
		background: var(--surface, #ffffff);
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.1);
		transform: translateY(-2rpx);
	}
}

.select-trigger:active {
	transform: scale(0.985);
}

.is-open .select-trigger {
	border-color: var(--accent, #5546a3);
	box-shadow: 0 0 0 5rpx var(--accent-ring, rgba(85, 70, 163, 0.18));
}

.selected-copy,
.option-copy {
	min-width: 0;
	flex: 1;
}

.selected-label,
.selected-description,
.option-label,
.option-description {
	display: block;
}

.selected-label,
.option-label {
	font-size: 27rpx;
	font-weight: 600;
	color: var(--text-primary, #1f2328);
}

.selected-description,
.option-description {
	margin-top: 5rpx;
	font-size: 21rpx;
	line-height: 1.45;
	color: var(--text-secondary, #656d76);
}

.select-arrow {
	flex: 0 0 auto;
	font-size: 35rpx;
	line-height: 1;
	color: var(--text-secondary, #656d76);
	transition: transform 0.2s ease;
}

.is-open .select-arrow {
	transform: rotate(180deg);
}

.option-menu {
	position: relative;
	margin-top: 8rpx;
	max-height: 480rpx;
	overflow-y: auto;
	padding: 8rpx;
	box-sizing: border-box;
	border: 2rpx solid var(--border, #d0d7de);
	border-radius: 6rpx;
	background: var(--surface, #ffffff);
	box-shadow: 0 16rpx 32rpx rgba(0, 0, 0, 0.2);
	transform-origin: top center;
	animation: option-menu-enter 0.18s ease-out;
	scrollbar-width: thin;
	scrollbar-color: var(--scrollbar-thumb, #6e7681) var(--scrollbar-track, var(--surface, #ffffff));
}

.option-menu::-webkit-scrollbar {
	width: 14rpx;
	height: 14rpx;
}

.option-menu::-webkit-scrollbar-track {
	background: var(--scrollbar-track, var(--surface, #ffffff));
	border-radius: 10rpx;
}

.option-menu::-webkit-scrollbar-thumb {
	background: var(--scrollbar-thumb, #6e7681);
	border: 3rpx solid var(--scrollbar-track, var(--surface, #ffffff));
	border-radius: 10rpx;
}

.option-menu::-webkit-scrollbar-thumb:hover {
	background: var(--accent, #5546a3);
}

.option-menu::-webkit-scrollbar-button {
	display: none;
	width: 0;
	height: 0;
}

.option-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 8rpx;
	padding: 16rpx;
	border-radius: 5rpx;
	transition: border-color 0.16s ease, background-color 0.16s ease, transform 0.16s ease;
}

@media (hover: hover) {
	.option-row:hover {
		border-color: var(--accent, #5546a3);
		background: var(--accent-soft, #edeafa);
		transform: translateX(4rpx);
	}
}

.option-row:active {
	transform: scale(0.985);
}

.option-row:last-child {
	margin-bottom: 0;
}

.option-row.selected {
	border-color: var(--accent, #5546a3);
	background: var(--accent-soft, #edeafa);
}

.selected-mark {
	flex: 0 0 auto;
	font-size: 28rpx;
	font-weight: 700;
	color: var(--accent, #5546a3);
}

.disabled {
	opacity: 0.5;
}

@keyframes option-menu-enter {
	from {
		opacity: 0;
		transform: translateY(-10rpx) scale(0.98);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>
