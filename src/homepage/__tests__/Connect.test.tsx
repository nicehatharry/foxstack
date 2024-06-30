import { render, screen } from '@testing-library/react'
import { Connect } from '../Connect'

test('should render connection links', () => {
	render(<Connect />)

	expect(
		screen.getByRole('img', { name: /photo of Brian/i })
	).toBeInTheDocument()
	expect(screen.getByRole('link', { name: /email/i })).toBeInTheDocument()
	expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument()
	expect(screen.getByRole('link', { name: /linkedIn/i })).toBeInTheDocument()
})
