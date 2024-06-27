import { render, screen } from '@testing-library/react'
import CodingIcons from '../CodingIcons'

it('renders programming icons', () => {
	render(<CodingIcons />)

	expect(screen.getAllByRole('img')).toHaveLength(6)

	expect(screen.getByAltText(/React Javascript/i)).toBeInTheDocument()
	expect(screen.getByAltText(/TypeScript/i)).toBeInTheDocument()
	expect(screen.getByAltText(/Python/i)).toBeInTheDocument()
	expect(screen.getByAltText(/Postgres/i)).toBeInTheDocument()
	expect(screen.getByAltText(/Google Cloud/i)).toBeInTheDocument()
	expect(screen.getByAltText(/Amazon Web Services/i)).toBeInTheDocument()
})
