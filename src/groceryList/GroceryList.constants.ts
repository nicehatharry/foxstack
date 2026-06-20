import type { GroceryItem } from './GroceryList.types';
import { STORE_OPTIONS } from '../services/s3Storage';

/**
 * Department options — drives BOTH the department filter pills in the
 * header bar and the <select> in the add/edit form. Add/remove/reorder
 * here to change both at once.
 */
export const departments = [
  'Produce',
  'Dairy/Eggs',
  'Meat/Fish',
  'Baby',
  'Beverage',
  'Snacks',
  'Condiments',
  'Baking',
  'Pantry',
  'Refrigerated',
  'Frozen',
  'Household',
  'Non-food',
];

/**
 * Store options — fixed list, drives the multi-select chips in the
 * add/edit form. Canonical source is services/s3Storage.ts (STORE_OPTIONS)
 * since that's also where the GroceryItem.store array type lives;
 * re-exported here so callers only need to import from GroceryList.constants.
 */
export const storeOptions = STORE_OPTIONS;

/** How often to poll S3 for changes from other users (milliseconds). */
export const POLL_INTERVAL_MS = 30_000;

/**
 * Debounce delay before flushing local changes to S3 (milliseconds).
 * Prevents a PUT per keystroke during rapid edits.
 */
export const SAVE_DEBOUNCE_MS = 600;

/** Columns available in the status+sort bar, in display order. */
export const sortKeys: { key: keyof GroceryItem; label: string }[] = [
  { key: 'department', label: 'Dept' },
];
