import { render, screen } from '@testing-library/react'
import { Homepage } from '../homepage'

describe('Homepage', () => {
	it('should show name', () => {
		render(<Homepage />)

		expect(screen.getByRole('heading').textContent).toMatch(/Brian J. Fox/i)
	})
})
