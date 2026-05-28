module.exports = {
	mode: 'jit',
	purge: {
		mode: 'all',
		preserveHtmlElements: false,
		content: [
			'./pages/**/*.{js,ts,jsx,tsx}',
			'./components/**/*.{js,ts,jsx,tsx}'
		]
	},
	darkMode: 'class',
	theme: {
		extend: {
			screens: {
				// Sidebar TOC only appears once there's room for it to sit
				// fully to the left of the centered max-w-4xl content column.
				toc: '1360px',
			},
		},
	},
	variants: {
		extend: {
			filter: ['hover'],
		},
	},
	plugins: [
		require('@tailwindcss/typography')
	]
}
