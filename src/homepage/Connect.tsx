import { styled } from '@mui/material/styles'

import personalImage from '../assets/dumpstar.jpg'
import githubIcon from '../assets/githubIcon.svg'
import linkedinIcon from '../assets/linkedinIcon.svg'
import mailIcon from '../assets/mailIcon.svg'

const email = 'mailto:bfox.fullstack@protonmail.com'
const githubUrl = 'https://github.com/nicehatharry'
const linkedinUrl = 'https://www.linkedin.com/in/brian-j-fox-818174a/'

export const Connect = () => {
	return (
		<ConnectStyles>
			<PersonalImage src={personalImage} alt='photo of Brian Fox' />
			<ConnectIcons>
				<a href={email} target='#'>
					<img src={mailIcon} />
				</a>
				<a href={githubUrl} target='#'>
					<img src={githubIcon} />
				</a>
				<a href={linkedinUrl} target='#'>
					<img src={linkedinIcon} />
				</a>
			</ConnectIcons>
		</ConnectStyles>
	)
}

const ConnectIcons = styled('div')({
	display: 'flex',
	columnGap: '1.5rem',
	margin: '1.5rem',
})

const ConnectStyles = styled('div')({
	display: 'flex',
	alignItems: 'center',
	flexDirection: 'column',
})

const PersonalImage = styled('img')({
	borderRadius: '50%',
	width: '10rem',
})
