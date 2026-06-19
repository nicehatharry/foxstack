// Centralized type definitions for the GroceryList feature.
//
// Every other file in this folder imports GroceryItem/SyncStatus from
// HERE rather than reaching into the service layer directly. That means
// this is the only file (besides GroceryList.tsx's amplify import and
// useGrocerySync.ts's function imports) that needs to know the real
// relative path to `services/s3Storage` — if this folder ever moves,
// fix the path below and everything else still works.
import type { GroceryItem, SyncStatus } from '../services/s3Storage';
export type { GroceryItem, SyncStatus };

/**
 * Controlled state for the add/edit bottom sheet form.
 * Note: this name shadows the built-in DOM `FormData` type within this
 * module. That's pre-existing behavior from the original single-file
 * version, not a mistake — just be aware if you ever need the real DOM
 * FormData in a file that imports this one.
 */
export interface FormData {
  item: string;
  store: string;
  department: string;
  quantity: string;
  acquired: boolean;
}

/** Current column + direction for the item list sort. `key: null` means unsorted. */
export interface SortConfig {
  key: keyof GroceryItem | null;
  direction: 'asc' | 'desc';
}
