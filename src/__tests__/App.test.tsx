import { render, screen } from '@testing-library/react'
import App from '../App'

it('loads homepage header', () => {
	render(<App />)

	expect(screen.getByRole('heading')).toBeDefined()
})
