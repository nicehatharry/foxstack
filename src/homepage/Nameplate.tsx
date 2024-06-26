import React from 'react'
import { styled } from '@mui/material/styles'
import apexFinch from '../assets/apexFinch.jpg'

export const Landing: React.FC = () => {
	return (
		<LandingStyles>
			<HeroImage src={apexFinch} />
			<Nameplate>
				<Name>Brian J. Fox</Name>
				<Summary>
					Building cloud integrated solutions using React with Typescript,
					Python, SQL and more
				</Summary>
			</Nameplate>
		</LandingStyles>
	)
}

const HeroImage = styled('img')({
	position: 'absolute',
	width: '100%',
})

const LandingStyles = styled('div')({
	display: 'flex',
	position: 'relative',
})

const Name = styled('h1')({
	fontSize: '48px',
	fontWeight: '300',
	letterSpacing: '2.5px',
})

const Nameplate = styled('div')({
	background: 'rgba(0,0,0,0.4)',
	color: '#EEE',
	marginTop: '66vh',
	padding: '48px',
	textAlign: 'center',
	textTransform: 'uppercase',
	width: '100vw',
	zIndex: '1',
})

const Summary = styled('p')({
	letterSpacing: '2.5px',
})
