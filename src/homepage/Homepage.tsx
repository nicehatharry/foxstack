import { styled } from '@mui/material/styles'
import { Landing } from './Nameplate'
import { SkillsBar } from './SkillsBar'
import { Connect } from './Connect'

export const Homepage = () => {
	return (
		<>
			<Landing />
			<SkillsBar />
			<Connect />
			{/* Goodreads Widget */}
			<BottomSpace />
		</>
	)
}

const BottomSpace = styled('div')({
	height: '25vh',
})
