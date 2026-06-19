import type { GroceryItem } from './GroceryList.types';

/**
 * Department options — drives BOTH the department filter pills in the
 * header bar and the <select> in the add/edit form. Add/remove/reorder
 * here to change both at once.
 */
export const departments = [
  'Produce', 'Dairy', 'Bakery', 'Meat', 'Fish', 'Frozen', 'Pantry', 'Household',
];

/** How often to poll S3 for changes from other users (milliseconds). */
export const POLL_INTERVAL_MS = 30_000;

/**
 * Debounce delay before flushing local changes to S3 (milliseconds).
 * Prevents a PUT per keystroke during rapid edits.
 */
export const SAVE_DEBOUNCE_MS = 600;

/** Columns available in the status+sort bar, in display order. */
export const sortKeys: { key: keyof GroceryItem; label: string }[] = [
  { key: 'item', label: 'Name' },
  { key: 'department', label: 'Dept' },
  { key: 'store', label: 'Store' },
  { key: 'quantity', label: 'Qty' },
];
