import { Landing } from './Nameplate'
import { Connect } from './Connect'
import { SkillsList } from './SkillsList'
import { bottomSpace, centeredHomepage } from './styles'

export const Homepage = () => {
	return (
		<div className={centeredHomepage}>
			<Landing />
			<SkillsList />
			<Connect />
			<div className={bottomSpace} />
		</div>
	)
}
