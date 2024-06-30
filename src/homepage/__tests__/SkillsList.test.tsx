import { render, screen } from '@testing-library/react'
import { SkillsList, ITEMS } from '../SkillsList'

test('renders list items correctly', () => {
	const items = ITEMS
	render(<SkillsList />)

	const header = screen.getByRole('paragraph')
	const listItems = screen.getAllByRole('listitem')

	expect(header).toHaveTextContent(/ways we can work together/i)

	expect(listItems).toHaveLength(items.length)

	items.forEach((item, index) => {
		expect(listItems[index]).toHaveTextContent(item)
	})
})
