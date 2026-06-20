import type { GroceryItem, SortConfig } from './GroceryList.types';

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
  sortConfig: SortConfig
): GroceryItem[] {
  return items
    .filter(item => {
      if (filterDept !== 'All' && item.department !== filterDept) return false;
      if (filterStatus === 'Acquired' && !item.acquired) return false;
      if (filterStatus === 'Pending' && item.acquired) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let av: string | number | boolean = toComparable(a[sortConfig.key]);
      let bv: string | number | boolean = toComparable(b[sortConfig.key]);
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
}

/**
 * `store` is an array (multi-select), but every other sortable column is a
 * plain string/number/boolean. Arrays compare unreliably with `<`/`>`
 * (they coerce to a joined string but that's easy to get wrong silently),
 * so make it explicit: join to a sortable string here rather than relying
 * on implicit coercion.
 */
function toComparable(value: unknown): string | number | boolean {
  if (Array.isArray(value)) return value.join(', ');
  return value as string | number | boolean;
}
