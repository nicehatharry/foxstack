import '../config/amplify'; // must be first

import React from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useLocation } from 'wouter';

import ManageWords from './ManageWords';
import { LibraryGate } from './LibraryGate';
import { saveLibrary } from './services/s3Storage';
import { useLibrarySync } from './useLibrarySync';
import type { DeckRecord } from './decks';

import { SyncBanner, SyncRetryBtn } from './styles/sync';

const SyncedManage: React.FC<{ initialDecks: DeckRecord[] }> = ({ initialDecks }) => {
  const [, navigate] = useLocation();
  const { status, onLibraryChange, flush } = useLibrarySync(saveLibrary);

  return (
    <>
      <ManageWords
        initialDecks={initialDecks}
        onLibraryChange={onLibraryChange}
        onCheckpoint={flush}
        onBack={() => navigate('/flashcards')}
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
 * Auth + persistence shell for /flashcards/manage. No library in S3 (first run)
 * → empty list, NOT the sample deck, so nothing is written until the user has
 * created a deck in /flashcards.
 */
const ManageWordsRoot: React.FC = () => (
  <LibraryGate>{(decks) => <SyncedManage initialDecks={decks ?? []} />}</LibraryGate>
);

export default withAuthenticator(ManageWordsRoot);
