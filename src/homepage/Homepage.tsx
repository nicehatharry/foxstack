import { useEffect } from 'react'
import personalImage from '../assets/dumpstar.jpg'
import '../baseStyles.css'
import { Landing } from './Landing'
import { ConnectIcons } from './ConnectIcons'
import { SkillsList } from './SkillsList'
import { bottomSpace, centeredHomepage, personalImageStyles } from './styles'
import { StickyHeader } from './StickyHeader'

const HOMEPAGE_ACTIVE_CLASS = 'homepage-active'

export const Homepage = () => {
	// baseStyles.css.ts scopes its html/body rules behind this class so they
	// only apply while the homepage is mounted — otherwise they'd bleed into
	// unrelated routes (e.g. the grocery list) since they're global selectors.
	useEffect(() => {
		document.documentElement.classList.add(HOMEPAGE_ACTIVE_CLASS)
		return () => {
			document.documentElement.classList.remove(HOMEPAGE_ACTIVE_CLASS)
		}
	}, [])

	return (
		<div className={centeredHomepage}>
			<StickyHeader />
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
