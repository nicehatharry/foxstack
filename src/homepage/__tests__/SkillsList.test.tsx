import { render, screen } from '@testing-library/react'
import SkillsList, { ITEMS } from '../SkillsList'

test('renders list items correctly', () => {
	const items = ITEMS
	render(<SkillsList />)

	const allItems = screen.getAllByRole('paragraph')
	const header = allItems[0]
	const listItems = allItems.slice(1)

	expect(header).toHaveTextContent(/ways we can work together/i)

	expect(listItems).toHaveLength(items.length)

	items.forEach((item, index) => {
		expect(listItems[index]).toHaveTextContent(item)
	})
})
