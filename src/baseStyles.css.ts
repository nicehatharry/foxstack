import { globalStyle } from '@vanilla-extract/css'

// NOTE: These rules used to target bare `html` / `body`, which made them
// apply to every route in the app — including the unrelated grocery-list
// page, which has its own body reset that doesn't account for this file.
// They're scoped to `html.homepage-active` instead: Homepage.tsx toggles
// that class on <html> when it mounts/unmounts, so this styling is only
// ever active while the homepage is actually on screen. font-size and
// letter-spacing stay on the real `html` element (not a wrapper div) so
// the `rem` units used throughout the homepage components keep resolving
// the same way they always have.

globalStyle('html.homepage-active', {
	fontSize: 18,
	letterSpacing: 6,
	'@media': {
		'(max-width: 768px)': {
			fontSize: 16,
			letterSpacing: 4,
		},
		'(max-width: 450px)': {
			fontSize: 12,
			letterSpacing: 3,
		},
	},
})

globalStyle('html.homepage-active body', {
	display: 'flex',
	fontFamily: "'Roboto', sans-serif",
	justifyContent: 'center',
	margin: 0,
	padding: 0,
	textTransform: 'uppercase',
	width: '100%',
})
