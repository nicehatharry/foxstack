import { style } from '@vanilla-extract/css'

export const stickyHeader = style({
	display: 'flex',
	flexDirection: 'row-reverse',
	position: 'fixed',
	top: 0,
	width: '100%',
	zIndex: 1,
	'@media': {
		'screen and (min-width: 1400px)': {
			width: 1400,
		},
		'screen and (max-width: 650px)': {
			backgroundColor: 'white',
		},
	},
})
