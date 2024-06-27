import { styled } from '@mui/material/styles'
import { Landing } from './Nameplate'
import SkillsBar from './SkillsBar'

export const Homepage = () => {
	return (
		<>
			<Landing />
			<SkillsBar />
			<BottomSpace />
		</>
	)
}

const BottomSpace = styled('div')({
	height: '25vh',
})
