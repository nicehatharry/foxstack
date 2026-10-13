import React, { useEffect, useState } from 'react';

import { GlobalStyle } from './GlobalStyle';
import { loadLibrary } from './services/s3Storage';
import type { DeckRecord } from './decks';

import { AppShell } from './styles/layout';
import { Actions, PrimaryBtn, EmptyState } from './styles/actions';

type Load =
  | { kind: 'loading' }
  | { kind: 'error' }
  // decks undefined = first run (no library in S3).
  | { kind: 'ready'; decks: DeckRecord[] | undefined };

type RenderLibrary = (decks: DeckRecord[] | undefined) => React.ReactNode;

/** Remounted (via `key`) to retry, so each attempt starts from 'loading' without a synchronous setState in an effect. */
const LibraryLoader: React.FC<{ onRetry: () => void; children: RenderLibrary }> = ({ onRetry, children }) => {
  const [state, setState] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadLibrary().then(
      (decks) => { if (!cancelled) setState({ kind: 'ready', decks: decks ?? undefined }); },
      // Never fall back to a sample deck here: the first save would overwrite real data.
      () => { if (!cancelled) setState({ kind: 'error' }); },
    );
    return () => { cancelled = true; };
  }, []);

  if (state.kind === 'ready') return <>{children(state.decks)}</>;

  return (
    <>
      <GlobalStyle />
      <AppShell>
        {state.kind === 'loading' ? (
          <EmptyState>Loading…</EmptyState>
        ) : (
          <>
            <EmptyState>Couldn&apos;t load your decks.</EmptyState>
            <Actions>
              <PrimaryBtn type="button" onClick={onRetry}>Retry</PrimaryBtn>
            </Actions>
          </>
        )}
      </AppShell>
    </>
  );
};

/** Loads the S3 library once (loading / error + Retry), then renders `children(decks)`. Shared by FlashCardsRoot and ManageWordsRoot. */
export const LibraryGate: React.FC<{ children: RenderLibrary }> = ({ children }) => {
  const [attempt, setAttempt] = useState(0);
  return <LibraryLoader key={attempt} onRetry={() => setAttempt((a) => a + 1)}>{children}</LibraryLoader>;
};
