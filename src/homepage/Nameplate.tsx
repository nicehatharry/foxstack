import React from 'react'
import {
	landingStyles,
	name,
	nameplate,
	summary,
	transparencyOut,
} from './styles'

export const Landing: React.FC = () => {
	return (
		<div className={landingStyles}>
			<div className={nameplate}>
				<h1 className={name}>Brian J. Fox</h1>
				<p className={summary}>
					Building cloud integrated solutions using React with Typescript,
					Python, SQL and more
				</p>
			</div>
			<div className={transparencyOut} />
		</div>
	)
}
