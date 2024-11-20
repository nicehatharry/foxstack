import React from 'react'
import { CodingIcons } from './CodingIcons'
import { skillsList, skillsListHeader, skillsListItem } from './styles'

export const ITEMS = [
	'React with Typescript, C#, Java, Python, SQL',
	'Cloud Services Integration',
	'Web UI Architecture and Development',
	'API Design and Construction',
	'Test-Driven Development',
	'Documentation and DX',
	'Culture Building and Communication',
]

export const SkillsList: React.FC = () => {
	return (
		<ul className={skillsList}>
			<p className={skillsListHeader}>ways we can work together</p>
			<CodingIcons />
			{ITEMS.map((item) => (
				<li className={skillsListItem} key={item}>
					{item}
				</li>
			))}
		</ul>
	)
}
