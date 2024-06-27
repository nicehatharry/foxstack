import { styled } from '@mui/material/styles'
import { SkillsList } from './SkillsList'

export const SkillsBar = () => {
	return (
		<>
			<TransparencyOut />
			<SkillsList />
		</>
	)
}

const TransparencyOut = styled('div')({
	background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,1))',
	height: '15vh',
})
