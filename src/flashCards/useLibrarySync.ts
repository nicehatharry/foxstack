import { useCallback, useEffect, useRef, useState } from 'react';

import type { DeckRecord } from './decks';

export type SyncStatus = 'idle' | 'unsaved' | 'saving' | 'error';

/** Must have a stable identity (pass a module-level function). */
export type SaveLibrary = (decks: DeckRecord[], options: { unloading: boolean }) => Promise<void>;

/**
 * Persistence policy for the deck library. Keeps this folder's UI free of S3.
 *
 * - `onLibraryChange` (wire to FlashCardsApp) only records the newest snapshot
 *   and marks it dirty. It NEVER writes: per-card grades must not hit S3.
 * - `flush` writes the newest dirty snapshot. Callers: FlashCardsApp's
 *   `onCheckpoint` (session complete, card added, deck created, leaving a
 *   deck) plus this hook's own pagehide / visibilitychange→hidden / online /
 *   unmount listeners.
 * - Writes are serialized (one in flight). A flush requested mid-write queues
 *   exactly one follow-up, which sends the newest snapshot.
 * - A failed write keeps the library dirty and sets status 'error'; the next
 *   flush trigger retries. `flush` never rejects.
 */
export function useLibrarySync(save: SaveLibrary) {
  const [status, setStatus] = useState<SyncStatus>('idle');

  const latest = useRef<DeckRecord[] | null>(null);
  const dirty = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const queued = useRef(false);
  const unloadingNext = useRef(false);

  const drain = useCallback(async () => {
    setStatus('saving');
    do {
      queued.current = false;
      const snapshot = latest.current;
      if (!dirty.current || !snapshot) break;

      const unloading = unloadingNext.current;
      unloadingNext.current = false;
      dirty.current = false;
      try {
        await save(snapshot, { unloading });
      } catch {
        dirty.current = true;
        setStatus('error');
        return;
      }
    } while (queued.current);
    // Changes that arrived during the write are unsaved until the next trigger.
    setStatus(dirty.current ? 'unsaved' : 'idle');
  }, [save]);

  const flush = useCallback((unloading = false): Promise<void> => {
    if (unloading) unloadingNext.current = true;
    if (inFlight.current) {
      queued.current = true;
      return inFlight.current;
    }
    if (!dirty.current) {
      unloadingNext.current = false;
      return Promise.resolve();
    }
    const run = drain().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = run;
    return run;
  }, [drain]);

  const onLibraryChange = useCallback((decks: DeckRecord[]) => {
    latest.current = decks;
    dirty.current = true;
    setStatus((s) => (s === 'idle' ? 'unsaved' : s));
  }, []);

  useEffect(() => {
    const onPageHide = () => { void flush(true); };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void flush(true);
    };
    const onOnline = () => { void flush(); };

    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      void flush(); // leaving the route
    };
  }, [flush]);

  return { status, onLibraryChange, flush };
}
