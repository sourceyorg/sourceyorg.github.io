import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			favicon: '/images/favicon.ico',
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'apple-touch-icon',
						href: '/apple-touch-icon.png',
						sizes: '180x180',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'icon',
						href: '/favicon-32x32.png',
						sizes: '32x32',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'icon',
						href: '/favicon-16x16.png',
						sizes: '16x16',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'manifest',
						href: '/site.webmanifest'
					},
				}
			],
			title: 'Sourcey Docs',
			customCss: [
				'./src/styles/custom.css',
			],
			social: {
				github: 'https://github.com/sourceyorg/sourcey',
			},
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Getting started', link: '/guides/getting-started/' },
					],
				},
				{
					label: 'Data providers',
					items: [
						{ label: 'Entity framework core', link: '/data-providers/entityframeworkcore/' },
					],
				},
				{
					label: 'Aggregates',
					items: [
						{ label: 'Creating and updating', link: '/aggregates/creating-updating/' },
						// { label: 'Conflict resolution', link: '/aggregates/conflict-resolution/' },
					],
				},
				{
					label: 'Projections',
					items: [
						{ label: 'Reading', link: '/projections/reading/' }
					],
				},
				// {
				// 	label: 'Advanced topics',
				// 	items: [
				// 		// Each item here is one entry in the navigation menu.
				// 		{ label: 'Aggregate conflict resolution', link: '/advanced-topics/aggregate-conflict-resolution/' },
				// 		{ label: 'Aggregate snapshots', link: '/advanced-topics/aggregate-snapshots/' },
				// 		{ label: 'Reading projections', link: '/advanced-topics/projection-reading/' },
				// 		{ label: 'Eventual consistency', link: '/advanced-topics/eventual-consistency/' },
				// 	],
				// }
			],
		}),
	],

	// Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
	image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
