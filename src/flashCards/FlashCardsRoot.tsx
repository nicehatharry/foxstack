import '../config/amplify'; // must be first

import React from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useLocation } from 'wouter';

import FlashCardsApp from './FlashCardsApp';
import { LibraryGate } from './LibraryGate';
import { saveLibrary } from './services/s3Storage';
import { useLibrarySync } from './useLibrarySync';
import type { DeckRecord } from './decks';

import { SyncBanner, SyncRetryBtn } from './styles/sync';

/** Mounted only once the library is loaded, so the sync hook's state is per loaded library. */
const SyncedApp: React.FC<{ initialDecks: DeckRecord[] | undefined; onManage: () => void }> = ({ initialDecks, onManage }) => {
  const { status, onLibraryChange, flush } = useLibrarySync(saveLibrary);

  return (
    <>
      <FlashCardsApp
        initialDecks={initialDecks}
        onLibraryChange={onLibraryChange}
        onCheckpoint={flush}
        onManage={onManage}
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

/**
 * Auth + persistence shell for /flashcards. The only UI file here that imports
 * AWS config (via config/amplify and services/s3Storage), which is why
 * FlashCardsApp and its tests stay AWS-free. Default export is auth-gated.
 * `decks` undefined = first run (no library in S3): FlashCardsApp falls back to its sample deck.
 */
const FlashCardsRoot: React.FC = () => {
  const [, navigate] = useLocation();
  return (
    <LibraryGate>
      {(decks) => <SyncedApp initialDecks={decks} onManage={() => navigate('/flashcards/manage')} />}
    </LibraryGate>
  );
};

export default withAuthenticator(FlashCardsRoot);
