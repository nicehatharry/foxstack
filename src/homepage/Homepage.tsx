import { styled } from '@mui/material/styles'
import { Landing } from './Nameplate'
import { Connect } from './Connect'
import { SkillsList } from './SkillsList'

export const Homepage = () => {
	return (
		<StyledColumn>
			<Landing />
			<SkillsList />
			<Connect />
			<BottomSpace />
		</StyledColumn>
	)
}

const BottomSpace = styled('div')({
	height: '25vh',
})

const StyledColumn = styled('div')({
	width: '100vw',
	maxWidth: '1400px',
})
