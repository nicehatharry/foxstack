import React from 'react'
import { codingIcon, codingIconsStyles } from './styles'
import {
	awsIcon,
	azureIcon,
	cSharpIcon,
	googleCloudIcon,
	javaIcon,
	postgresqlIcon,
	pythonIcon,
	reactIcon,
	typescriptIcon,
} from '../assets'

export const CodingIcons: React.FC = () => {
	return (
		<div className={codingIconsStyles}>
			<img
				className={codingIcon}
				src={reactIcon}
				alt='React JavaScript Programming Library'
			/>
			<img
				className={codingIcon}
				src={typescriptIcon}
				alt='TypeScript Syntax'
			/>
			<img
				className={codingIcon}
				src={cSharpIcon}
				alt='C-Sharp Coding Language'
			/>
			<img className={codingIcon} src={javaIcon} alt='Java Coding Language' />
			<img
				className={codingIcon}
				src={pythonIcon}
				alt='Python Programming Language'
			/>
			<img
				className={codingIcon}
				src={postgresqlIcon}
				alt='Postgres SQL Language'
			/>
			<img
				className={codingIcon}
				src={googleCloudIcon}
				alt='Google Cloud Services'
			/>
			<img className={codingIcon} src={awsIcon} alt='Amazon Web Services' />
			<img
				className={codingIcon}
				src={azureIcon}
				alt='Microsoft Azure Web Services'
			/>
		</div>
	)
}
