import { globalStyle } from '@vanilla-extract/css'

globalStyle('html', {
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

globalStyle('body', {
	display: 'flex',
	fontFamily: "'Roboto', sans-serif",
	justifyContent: 'center',
	margin: 0,
	padding: 0,
	textTransform: 'uppercase',
	width: '100%',
})
