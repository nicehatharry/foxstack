import type { GroceryItem } from './GroceryList.types';

/**
 * Applies the department + status filters and the active column sort
 * to the raw item list. Pure function — no state, no side effects.
 *
 * If you're asked to change sort/filter behavior (e.g. "sort should be
 * case-sensitive", "add a date-added filter"), this is the only file
 * you should need to touch.
 */
export function filterAndSortItems(
  items: GroceryItem[],
  filterDept: string,
  filterStatus: 'All' | 'Acquired' | 'Pending',
  isDeptSort: boolean
): GroceryItem[] {
  return items
    .filter(item => {
      if (filterDept !== 'All' && item.department !== filterDept) return false;
      if (filterStatus === 'Acquired' && !item.acquired) return false;
      if (filterStatus === 'Pending' && item.acquired) return false;
      return true;
    })
    .sort((a, b) => {
      let aDept: string = a[('department')].toLowerCase();
      let aItem: string = a[('item')].toLowerCase();
      let bDept: string = b[('department')].toLowerCase();
      let bItem: string = b[('item')].toLowerCase();
      if (isDeptSort) {
        if (aDept < bDept) return -1;
        if (aDept > bDept) return 1;
      }
      if (aItem < bItem) return -1;
      if (aItem > bItem) return 1;
      return 0;
    });
}
