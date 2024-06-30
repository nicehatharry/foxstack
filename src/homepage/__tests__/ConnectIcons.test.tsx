import { render, screen } from '@testing-library/react'
import { ConnectIcons } from '../ConnectIcons'

test('should render connection links', () => {
	render(<ConnectIcons />)

	expect(screen.getByRole('link', { name: /email/i })).toBeInTheDocument()
	expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument()
	expect(screen.getByRole('link', { name: /linkedIn/i })).toBeInTheDocument()
})
