<template>
	<view class="test-page">
		<view class="test-section">
			<view class="section-title">测试 1: Ruby 标签</view>
			<view class="test-content">
				<rich-text-parser 
					:text="test1"
					:parse-images="true"
					:parse-links="true"
					:show-full-url="true"
				/>
			</view>
		</view>
		
		<view class="test-section">
			<view class="section-title">测试 2: 图片链接组合</view>
			<view class="test-content">
				<rich-text-parser 
					:text="test2"
					:parse-images="true"
					:parse-links="true"
					:show-full-url="true"
				/>
			</view>
		</view>
		
		<view class="test-section">
			<view class="section-title">测试 3: 卡片模式（无完整 URL）</view>
			<view class="test-content">
				<rich-text-parser 
					:text="test2"
					:parse-images="true"
					:parse-links="true"
					:show-full-url="false"
				/>
			</view>
		</view>
	</view>
</template>

<script setup>
import { onLoad } from "@dcloudio/uni-app";
import RichTextParser from '@/components/rich-text-parser/rich-text-parser.vue';

const test1 = '[<ruby>**jrys-prpr**<rp>（</rp><rt>点我查看预览图</rt><rp>）</rp></ruby>](https://i0.hdslb.com/bfs/article/ae33f1b2e9dbc3fe89363a40fbf040703493298333289018.png)😽QQ官方json按钮支持';

const test2 = '[![npm](https://img.shields.io/npm/v/koishi-plugin-noah?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-noah) A tool bot for arcade music games';

onLoad(()=>{
	// #ifdef MP-QQ
	console.log("qq小程序的神秘要求捏");
	qq.showShareMenu({
		showShareItems: ['qq', 'qzone', 'wechatFriends', 'wechatMoment'],
		withShareTicket: true,
	});
	// #endif
	// #ifdef MP-WEIXIN
	wx.showShareMenu({
		withShareTicket: true,
		menus: ['shareAppMessage', 'shareTimeline']
	});
	// #endif
})
</script>

<style scoped>
.test-page {
	padding: 40rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.test-section {
	margin-bottom: 40rpx;
	background-color: white;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	margin-bottom: 20rpx;
	color: #333;
}

.test-content {
	font-size: 28rpx;
	line-height: 1.6;
	color: #666;
}
</style>
