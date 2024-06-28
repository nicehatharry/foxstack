import React from 'react'
import { styled } from '@mui/material/styles'
import apexFinch from '../assets/apexFinch.jpg'

export const Landing: React.FC = () => {
	return (
		<LandingStyles>
			<Nameplate>
				<Name>Brian J. Fox</Name>
				<Summary>
					Building cloud integrated solutions using React with Typescript,
					Python, SQL and more
				</Summary>
			</Nameplate>
			<TransparencyOut />
		</LandingStyles>
	)
}

const LandingStyles = styled('div')({
	backgroundImage: `url(${apexFinch})`,
	display: 'flex',
	height: '100vh',
	position: 'relative',
})

const Name = styled('h1')({
	marginTop: '3rem',
	fontSize: '3rem',
	fontWeight: '300',
})

const Nameplate = styled('div')({
	background: 'rgba(0,0,0,0.4)',
	bottom: '5rem',
	color: 'rgba(255,255,255,0.85)',
	position: 'absolute',
	width: '100%',
	textAlign: 'center',
})

const Summary = styled('p')({
	fontSize: '1rem',
	margin: '0 1.5rem 3rem',
})

const TransparencyOut = styled('div')({
	position: 'absolute',
	background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))',
	bottom: 0,
	height: '15vh',
	width: '100%',
})
