import { render, screen } from '@testing-library/react'
import { Homepage } from '..'

test('it should have a photo', () => {
	render(<Homepage />)

	expect(
		screen.getByRole('img', { name: /photo of Brian/i })
	).toBeInTheDocument()
})
