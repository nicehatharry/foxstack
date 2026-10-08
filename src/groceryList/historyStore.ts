/**
 * src/groceryList/historyStore.ts
 *
 * Session-scoped cache for the item history document
 * (grocery-lists/history.json), shared between the add/edit sheet's
 * autocomplete (useItemForm.ts) and the Manage Items page
 * (useHistoryManager.ts).
 *
 * This used to be module-level state inside useItemForm.ts. It's pulled
 * out here so both consumers read and write through the exact same
 * cached object — an edit or delete made on the Manage Items page is
 * picked up by the autocomplete dropdown the next time the add/edit
 * sheet opens, with no page reload, because getHistory() below returns
 * the same mutated cache rather than a stale copy.
 */
import { loadHistory, saveHistory } from './services/s3Storage';
import type { ItemHistory } from './services/s3Storage';

let historyCache: ItemHistory | null = null;
let historyLoadPromise: Promise<ItemHistory> | null = null;

/** Fetch history from S3 once per session; later calls return the cache. */
export async function getHistory(): Promise<ItemHistory> {
  if (historyCache !== null) return historyCache;
  if (!historyLoadPromise) {
    historyLoadPromise = loadHistory().then(h => {
      historyCache = h;
      return h;
    });
  }
  return historyLoadPromise;
}

/** Synchronous read of whatever's cached right now — null if not yet loaded. */
export function getCachedHistory(): ItemHistory | null {
  return historyCache;
}

/**
 * Overwrite the cache (optimistic local update) and persist to S3 in the
 * background. Returns the save promise so callers can react to failure;
 * history writes are best-effort (see s3Storage.ts), so a failed save is
 * non-fatal — callers typically just console.warn.
 */
export function setHistory(updated: ItemHistory): Promise<void> {
  historyCache = updated;
  return saveHistory(updated);
}

/** Derive a history map key from a display name: trim + lowercase. */
export function historyKey(name: string): string {
  return name.trim().toLowerCase();
}