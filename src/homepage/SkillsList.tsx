import { styled } from '@mui/material/styles'
import React from 'react'
import CodingIcons from './CodingIcons'

export const ITEMS = [
	'React with Typescript, Python, SQL',
	'GCS and other Cloud Services Integration',
	'Web UI Architecture and Development',
	'API Architecture and Development',
	'Test-Driven Development',
	'Documentation and DX',
	'Culture Building and Communication',
]

export const SkillsList: React.FC = () => {
	return (
		<SkillsListStyles>
			<SkillsHeader>ways we can work together</SkillsHeader>
			<CodingIcons />
			{ITEMS.map((item) => (
				<SkillsItem key={item}>{item}</SkillsItem>
			))}
		</SkillsListStyles>
	)
}

const SkillsHeader = styled('p')({
	margin: '1rem ',
})

const SkillsItem = styled('p')({
	fontSize: '1rem',
	margin: '1.5rem',
})

const SkillsListStyles = styled('div')({
	textAlign: 'center',
	fontSize: '1.5rem',
	padding: '2rem 0',
})
