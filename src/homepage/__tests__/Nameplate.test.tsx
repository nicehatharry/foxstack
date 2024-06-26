import { render, screen } from '@testing-library/react'
import { Landing } from '../Nameplate'

test('renders header with navigation links', () => {
	render(<Landing />)

	expect(
		screen.getByRole('heading', { name: /Brian J\. Fox/i })
	).toBeInTheDocument()
	expect(
		screen.getByText(/web developer using react with typescript/i)
	).toBeInTheDocument()
})
