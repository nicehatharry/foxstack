import React from 'react'
import pythonIcon from '../assets/python.svg'
import reactIcon from '../assets/react.svg'
import typescriptIcon from '../assets/typescript.svg'
import postgresqlIcon from '../assets/postgresql.svg'
import awsIcon from '../assets/aws.svg'
import googlecloudIcon from '../assets/googlecloud.svg'
import { styled } from '@mui/material'

const CodingIcons: React.FC = () => {
	return (
		<CodingIconsStyles>
			<CodingIcon src={reactIcon} alt='React JavaScript Programming Library' />
			<CodingIcon src={typescriptIcon} alt='TypeScript Syntax' />
			<CodingIcon src={pythonIcon} alt='Python Programming Language' />
			<CodingIcon src={postgresqlIcon} alt='Postgres SQL Language' />
			<CodingIcon
				src={googlecloudIcon}
				alt='Google Cloud Services Integration'
			/>
			<CodingIcon src={awsIcon} alt='Amazon Web Services Integration' />
		</CodingIconsStyles>
	)
}

export default CodingIcons

const CodingIcon = styled('img')({
	height: '5rem',
	margin: '1rem',
	width: '5rem',
})

const CodingIconsStyles = styled('div')({
	background: '#FFF',
	padding: '2rem',
})
