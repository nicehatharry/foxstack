import { style } from '@vanilla-extract/css'

export const bottomSpace = style({
	height: '33vh',
})

export const centeredHomepage = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	width: '100vw',
	maxWidth: '1400px',
})

export const personalImageStyles = style({
	borderRadius: '50%',
	width: '10rem',
})
