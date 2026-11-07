<template>
	<view v-if="open" class="modal-layer" :class="{ 'drawer-layer': drawer }">
		<view class="modal-backdrop" @click="close" @touchmove.stop.prevent></view>
		<view id="market-workspace-dialog" class="modal-dialog" :class="{ compact, drawer }" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1">
			<button class="modal-close" tabindex="0" role="button" aria-label="关闭" @click="close"><image :src="closeIcon" mode="aspectFit" /></button>
			<slot />
		</view>
	</view>
</template>
<script setup>
import { toRef } from 'vue'
import { useDrawerFocus } from '@/utils/layout.js'
import closeIcon from '@/static/icons/x.png'
const props = defineProps({ open: Boolean, title: { type: String, default: '' }, compact: Boolean, drawer: Boolean, initialFocus: { type: String, default: '' } })
const emit = defineEmits(['close'])
const close = () => emit('close')
useDrawerFocus(toRef(props, 'open'), 'market-workspace-dialog', close, () => props.initialFocus)
</script>
<style scoped>
.modal-layer { position:fixed; inset:0; z-index:1200; display:flex; align-items:center; justify-content:center; padding:24px; box-sizing:border-box; }
.modal-backdrop { position:absolute; inset:0; background:var(--overlay-backdrop); }
.modal-dialog { position:relative; width:min(1080px,100%); height:min(820px,100%); overflow:hidden; border:1px solid var(--border); border-radius:16px; background:var(--bg-primary); box-shadow:0 24px 70px rgba(0,0,0,.25); }
.modal-dialog.compact { width:min(620px,100%); height:auto; max-height:calc(100vh - 48px); overflow-y:auto; }
.modal-layer.drawer-layer { justify-content:flex-end; align-items:stretch; padding:0; }
.modal-dialog.drawer { width:min(680px, 100%); height:100%; padding-top:max(var(--safe-top, 0px), env(safe-area-inset-top, 0px)); box-sizing:border-box; border:0; border-left:1px solid var(--border); border-radius:0; animation:workspace-drawer-enter .25s ease-out; }
.drawer .modal-close { top:calc(16px + max(var(--safe-top, 0px), env(safe-area-inset-top, 0px))); }
@keyframes workspace-drawer-enter { from { transform:translateX(100%); } to { transform:translateX(0); } }
.modal-close { position:absolute; z-index:10; top:16px; right:20px; display:flex; align-items:center; justify-content:center; width:40px; height:40px; margin:0; padding:0; background:var(--surface); border:1px solid var(--border); border-radius:9px; }
.modal-close::after { border:0; }
.modal-close image { width:18px; height:18px; }
.modal-close:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.modal-close { transition:transform .18s ease, border-color .18s ease, background-color .18s ease; }
@media (hover:hover) { .modal-close:hover { border-color:var(--accent); background:var(--accent-soft); } }
.modal-close:active { transform:scale(var(--interaction-press-scale, .99)); }
@media (max-width:600px) { .modal-layer { padding:0; } .modal-dialog { width:100%; height:100%; border:0; border-radius:0; } .modal-dialog.drawer { width:calc(100% - 24px); } .modal-dialog.compact { width:calc(100% - 32px); height:auto; max-height:calc(100% - 32px); border:1px solid var(--border); border-radius:16px; } .modal-close { top:12px; right:16px; } .drawer .modal-close { top:calc(12px + max(var(--safe-top, 0px), env(safe-area-inset-top, 0px))); } }
</style>
