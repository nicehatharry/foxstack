import { render, screen } from '@testing-library/react'
import { Connect } from '../Connect'

test('should render connection links', () => {
	render(<Connect />)

	expect(screen.getByRole('link', { name: 'email link' })).toBeInTheDocument()
	expect(screen.getByRole('link', { name: 'github link' })).toBeInTheDocument()
	expect(
		screen.getByRole('link', { name: 'linkedIn link' })
	).toBeInTheDocument()
})
