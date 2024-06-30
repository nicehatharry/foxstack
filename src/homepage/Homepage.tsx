import personalImage from '../assets/dumpstar.jpg'
import { Landing } from './Landing'
import { ConnectIcons } from './ConnectIcons'
import { SkillsList } from './SkillsList'
import { bottomSpace, centeredHomepage, personalImageStyles } from './styles'

export const Homepage = () => {
	return (
		<div className={centeredHomepage}>
			<Landing />
			<SkillsList />
			<img
				className={personalImageStyles}
				src={personalImage}
				alt='photo of Brian Fox'
			/>
			<ConnectIcons />
			<div className={bottomSpace} />
		</div>
	)
}
