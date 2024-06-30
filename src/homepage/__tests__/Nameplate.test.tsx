import { render, screen } from '@testing-library/react'
import { Landing } from '../Landing'

test('renders header with navigation links', () => {
	render(<Landing />)

	expect(
		screen.getByRole('heading', { name: /Brian J\. Fox/i })
	).toBeInTheDocument()
	expect(
		screen.getByText(/building cloud integrated solutions/i)
	).toBeInTheDocument()
})
