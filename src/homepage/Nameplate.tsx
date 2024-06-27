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
	zIndex: '-1',
})

const LandingStyles = styled('div')({
	display: 'flex',
	position: 'relative',
})

const Name = styled('h1')({
	fontSize: '60px',
	fontWeight: '300',
})

const Nameplate = styled('div')({
	background: 'rgba(0,0,0,0.4)',
	color: 'rgba(255,255,255,0.85)',
	marginTop: '66vh',
	padding: '48px',
	textAlign: 'center',
	width: '100vw',
})

const Summary = styled('p')({})
