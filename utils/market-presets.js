// Keep preset order stable for persisted market_preset_index values.
export const MARKET_PRESETS = [
	{
		name: 'VincentZyu StoreLuna（CF CDN 推荐）',
		url: 'https://storeluna-cf.vincentzyu233.cn/storeluna/index.json',
		region: '全球',
		description: '自建 Cloudflare Anycast CDN 镜像源，全球加速防刷'
	},
	{
		name: 'VincentZyu StoreLuna（大陆直连）',
		url: 'https://storeluna.vincentzyu233.cn/storeluna/index.json',
		region: '中国大陆',
		description: '自建深圳阿里云直连镜像源，大陆秒级低延迟'
	},
	{
		name: 'NyanZone',
		url: 'https://registry.nyan.zone/k/market/index.json',
		region: '全球',
		description: '官方推荐源，速度快且稳定'
	},
	{
		name: '上学聚合源(大陆推荐)',
		url: 'https://cdn.jsdmirror.com/gh/shangxueink/koishi-registry-aggregator@gh-pages/market.json',
		region: '全球',
		description: '聚合多个源的数据，插件最全'
	},
	{
		name: 't4wefan（大陆）',
		url: 'https://registry.koishi.t4wefan.pub/index.json',
		region: '中国大陆',
		description: '大陆镜像源，国内访问速度快'
	},
	{
		name: 'Lipraty（大陆）',
		url: 'https://koi.nyan.zone/registry/index.json',
		region: '中国大陆',
		description: '大陆镜像源，备选方案'
	},
	{
		name: 'itzdrli（全球）',
		url: 'https://kp.itzdrli.cc',
		region: '全球',
		description: '全球CDN源'
	},
	{
		name: 'Q78KG（全球）',
		url: 'https://koishi-registry.yumetsuki.moe/index.json',
		region: '全球',
		description: '社区维护源'
	},
	{
		name: 'Koishi官方（全球）',
		url: 'https://registry.koishi.chat/index.json',
		region: '全球',
		description: 'Koishi 官方源'
	},
	{
		name: '自定义',
		url: '',
		region: '自定义',
		description: '使用下方自定义地址'
	}
]
