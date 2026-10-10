import '../config/amplify'; // must be first

import React, { useEffect, useState } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { GlobalStyle } from './GlobalStyle';
import FlashCardsApp from './FlashCardsApp';
import { loadLibrary, saveLibrary } from './services/s3Storage';
import { useLibrarySync } from './useLibrarySync';
import type { DeckRecord } from './decks';

import { AppShell } from './styles/layout';
import { Actions, PrimaryBtn, EmptyState } from './styles/actions';
import { SyncBanner, SyncRetryBtn } from './styles/sync';

type Load =
  | { kind: 'loading' }
  | { kind: 'error' }
  // decks undefined = first run (no library in S3): FlashCardsApp falls back to its sample deck.
  | { kind: 'ready'; decks: DeckRecord[] | undefined };

/** Mounted only once the library is loaded, so the sync hook's state is per loaded library. */
const SyncedApp: React.FC<{ initialDecks: DeckRecord[] | undefined }> = ({ initialDecks }) => {
  const { status, onLibraryChange, flush } = useLibrarySync(saveLibrary);

  return (
    <>
      <FlashCardsApp
        initialDecks={initialDecks}
        onLibraryChange={onLibraryChange}
        onCheckpoint={flush}
      />
      {status === 'error' && (
        <SyncBanner role="alert">
          Couldn&apos;t save your changes.
          <SyncRetryBtn type="button" onClick={() => void flush()}>Retry</SyncRetryBtn>
        </SyncBanner>
      )}
    </>
  );
};

/** Remounted (via `key`) to retry, so each attempt starts from 'loading' without a synchronous setState in an effect. */
const LibraryLoader: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const [state, setState] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadLibrary().then(
      (decks) => { if (!cancelled) setState({ kind: 'ready', decks: decks ?? undefined }); },
      // Never fall back to the sample deck here: the first save would overwrite real data.
      () => { if (!cancelled) setState({ kind: 'error' }); },
    );
    return () => { cancelled = true; };
  }, []);

  if (state.kind === 'ready') return <SyncedApp initialDecks={state.decks} />;

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

/**
 * Auth + persistence shell for /flashcards. The only UI file here that imports
 * AWS config (via config/amplify and services/s3Storage), which is why
 * FlashCardsApp and its tests stay AWS-free. Default export is auth-gated.
 */
const FlashCardsRoot: React.FC = () => {
  const [attempt, setAttempt] = useState(0);
  return <LibraryLoader key={attempt} onRetry={() => setAttempt((a) => a + 1)} />;
};

export default withAuthenticator(FlashCardsRoot);
