import { useState, useRef, useCallback, useEffect } from 'react';
// This is a real (function) import, not just types, so it must point at
// the actual service module — unlike every other file in this folder,
// which gets its types from the local GroceryList.types.ts instead.
import { loadList, saveList, getRemoteEtag } from '../services/s3Storage';
import type { GroceryItem, SyncStatus } from './GroceryList.types';
import { POLL_INTERVAL_MS, SAVE_DEBOUNCE_MS } from './GroceryList.constants';

/**
 * Owns the entire S3 sync lifecycle for the grocery list: initial load,
 * debounced + ETag-guarded saves, and background polling for remote
 * changes. This is the file to open for anything related to:
 *   - "list isn't saving" / "saves too often" / "saves feel laggy"
 *   - "conflict banner shows incorrectly" / "Retry button"
 *   - "changes from another device/tab aren't showing up"
 *
 * `items` is the single source of truth, and `updateItems` is the ONLY
 * way callers should mutate it — calling a raw setState directly would
 * skip the debounced S3 save. (There is no raw setItems in the return
 * value on purpose.)
 */
export function useGrocerySync() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [alert, setAlert] = useState<'conflict' | 'error' | null>(null);

  // Refs for S3 coordination — not part of render state
  const etagRef      = useRef<string>('');     // ETag of the version we last read/wrote
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track items in a ref so the debounced save closure always sees the latest value
  const itemsRef    = useRef<GroceryItem[]>([]);
  const isSavingRef = useRef(false);           // guard against overlapping PUTs

  // -------------------------------------------------------------------------
  // S3 load
  // -------------------------------------------------------------------------

  const fetchList = useCallback(async () => {
    setSyncStatus('loading');
    setAlert(null);
    try {
      const { items: loaded, etag } = await loadList();
      etagRef.current = etag;
      setItems(loaded);
      itemsRef.current = loaded;
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
      setAlert('error');
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // -------------------------------------------------------------------------
  // S3 save — debounced, ETag-guarded
  // -------------------------------------------------------------------------

  const persistItems = useCallback((nextItems: GroceryItem[]) => {
    // Always update the ref so the scheduled flush sees the latest list
    itemsRef.current = nextItems;

    // Clear any pending flush and schedule a new one
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus('saving');

    saveTimerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return; // a save is already in flight
      isSavingRef.current = true;
      try {
        const result = await saveList(itemsRef.current, etagRef.current);
        if (result.conflict) {
          // Another user wrote to S3 between our last read and this write.
          // Reload the latest version and surface a conflict banner.
          setSyncStatus('conflict');
          setAlert('conflict');
          await fetchList();
        } else {
          etagRef.current = result.etag;
          setSyncStatus('idle');
        }
      } catch {
        setSyncStatus('error');
        setAlert('error');
      } finally {
        isSavingRef.current = false;
      }
    }, SAVE_DEBOUNCE_MS);
  }, [fetchList]);

  // -------------------------------------------------------------------------
  // Polling — HEAD requests to detect remote changes cheaply
  // -------------------------------------------------------------------------

  useEffect(() => {
    pollTimerRef.current = setInterval(async () => {
      // Skip poll while a save is in flight to avoid a false conflict signal
      if (isSavingRef.current || saveTimerRef.current) return;
      try {
        const remoteEtag = await getRemoteEtag();
        if (remoteEtag && remoteEtag !== etagRef.current) {
          await fetchList();
        }
      } catch {
        // Silently ignore poll errors — the user isn't waiting on a poll
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [fetchList]);

  // -------------------------------------------------------------------------
  // Wrap every state mutation to also trigger a debounced S3 save
  // -------------------------------------------------------------------------

  const updateItems = useCallback((updater: (prev: GroceryItem[]) => GroceryItem[]) => {
    setItems(prev => {
      const next = updater(prev);
      persistItems(next);
      return next;
    });
  }, [persistItems]);

  return { items, syncStatus, alert, setAlert, fetchList, updateItems };
}
