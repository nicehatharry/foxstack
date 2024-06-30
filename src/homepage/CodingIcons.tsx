import React from 'react'
import pythonIcon from '../assets/python.svg'
import reactIcon from '../assets/react.svg'
import typescriptIcon from '../assets/typescript.svg'
import postgresqlIcon from '../assets/postgresql.svg'
import awsIcon from '../assets/aws.svg'
import googlecloudIcon from '../assets/googlecloud.svg'
import { codingIcon, codingIconsStyles } from './styles'

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
				src={googlecloudIcon}
				alt='Google Cloud Services Integration'
			/>
			<img
				className={codingIcon}
				src={awsIcon}
				alt='Amazon Web Services Integration'
			/>
		</div>
	)
}
