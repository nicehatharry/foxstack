import githubIcon from '../assets/githubIcon.svg'
import linkedinIcon from '../assets/linkedinIcon.svg'
import mailIcon from '../assets/mailIcon.svg'
import { connectIcons } from './styles'

const email = 'mailto:bfox.fullstack@protonmail.com'
const githubUrl = 'https://github.com/nicehatharry'
const linkedinUrl = 'https://www.linkedin.com/in/brian-j-fox-818174a/'

export const ConnectIcons = () => {
	return (
		<div className={connectIcons}>
			<a href={email} target='#'>
				<img src={mailIcon} alt='send Brian an email' />
			</a>
			<a href={githubUrl} target='#'>
				<img src={githubIcon} alt="Brian's Github" />
			</a>
			<a href={linkedinUrl} target='#'>
				<img src={linkedinIcon} alt="Brian's LinkedIn" />
			</a>
		</div>
	)
}
