import { style } from '@vanilla-extract/css'
import apexFinch from '../../assets/apexFinch.jpg'

export const landingStyles = style({
	display: 'flex',
	height: '100vh',
	position: 'relative',
	width: '100%',
	'@media': {
		'screen and (min-width: 650px)': {
			backgroundImage: `url(${apexFinch})`,
		},
	},
})

export const littleFinch = style({
	borderRadius: '50%',
	height: '10rem',
})

export const mobileLanding = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	'@media': {
		'screen and (min-width: 650px)': {
			display: 'none',
		},
	},
})

export const name = style({
	marginTop: '3rem',
	fontSize: '3rem',
	fontWeight: '300',
})

export const nameplate = style({
	background: 'rgba(0,0,0,0.4)',
	bottom: '5rem',
	color: 'rgba(255,255,255,0.85)',
	position: 'absolute',
	width: '100%',
	textAlign: 'center',
})

export const summary = style({
	fontSize: '1rem',
	margin: '0 1.5rem 3rem',
})

export const transparencyOut = style({
	position: 'absolute',
	background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))',
	bottom: 0,
	height: '15vh',
	width: '100%',
})
