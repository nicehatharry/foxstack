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

const SkillsList: React.FC = () => {
	return (
		<SkillsListStyles>
			<SkillsHeader>ways we can work together</SkillsHeader>
			<CodingIcons />
			{ITEMS.map((item) => (
				<SkillsItem>{item}</SkillsItem>
			))}
		</SkillsListStyles>
	)
}

export default SkillsList

const SkillsHeader = styled('p')({
	margin: '12px ',
})

const SkillsItem = styled('p')({
	fontSize: '18px',
	margin: '12px',
})

const SkillsListStyles = styled('div')({
	alignItems: 'center',
	background: '#FFF',
	display: 'flex',
	flexDirection: 'column',
	fontSize: '24px',
	padding: '24px 0',
})
