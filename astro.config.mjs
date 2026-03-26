// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://arova-ai.github.io',
	base: '/arova-nexus-docs',
	integrations: [
		starlight({
			title: 'Arova Nexus',
			description: 'Arova Nexus 使用手冊 — AI 驅動的 IT 維運自動化平台',
			defaultLocale: 'root',
			locales: {
				root: { label: '繁體中文', lang: 'zh-TW' },
			},
			logo: {
				alt: 'Arova Nexus',
				src: './src/assets/logo.svg',
				replacesTitle: false,
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/arova-ai/arova-nexus-docs' },
			],
			sidebar: [
				{
					label: '開始使用',
					items: [
						{ label: '快速入門', slug: 'guide/quick-start' },
					],
				},
				{
					label: '模組操作指南',
					items: [
						{ label: '事件管理', slug: 'guide/incident-management' },
						{ label: '分析報表', slug: 'guide/analytics-reporting' },
						{ label: '知識庫', slug: 'guide/knowledge-base' },
						{ label: '自動化', slug: 'guide/automation' },
					],
				},
				{
					label: '管理與設定',
					items: [
						{ label: '管理員設定指南', slug: 'guide/admin-setup' },
						{ label: 'Graylog + LibreNMS 整合', slug: 'guide/graylog-librenms-integration' },
					],
				},
				{
					label: '支援',
					items: [
						{ label: '常見問題 (FAQ)', slug: 'guide/faq' },
					],
				},
			],
			customCss: ['./src/styles/custom.css'],
			head: [
				{
					tag: 'meta',
					attrs: { name: 'theme-color', content: '#06B6D4' },
				},
			],
		}),
	],
});
