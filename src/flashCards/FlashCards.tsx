import React, { useEffect, useRef, useState } from 'react';

import { GlobalStyle } from './GlobalStyle';
import { FlipCard } from './FlipCard';
import { useStudySession } from './useStudySession';
import { sampleDeck, sampleDeckName } from './sampleDeck';
import { sampleProgress } from './sampleProgress';
import type { CompletedSession, Flashcard, ProgressDocument } from './FlashCards.types';
import type { CardDraft } from './decks';
import { AddWordSheet } from './AddWordSheet';

import { AppShell } from './styles/layout';
import { TopBarRow, AppTitle, Progress } from './styles/header';
import { HeaderEnd, AddWordBtn } from './styles/addWord';
import { BackBtn, TitleGroup } from './styles/decks';
import { Actions, ActionStack, PrimaryBtn, SecondaryBtn, RevealBtn, EmptyState } from './styles/actions';
import { SummaryState, SummaryTitle, SummaryText, MissedList } from './styles/summary';

/** Lemma as listed in the summary: nouns with their article ("das Fernweh"), everything else bare. */
const displayGerman = (card: Flashcard): string =>
  card.partOfSpeech === 'noun' ? `${card.article} ${card.german}` : card.german;

export interface FlashCardsProps {
  /** Cards to study. Defaults to the placeholder sample deck. */
  wordBank?: Flashcard[];
  /** Persisted SRS state. Defaults to the placeholder sample progress. */
  progress?: ProgressDocument;
  /** Title shown in the header. */
  deckName?: string;
  /**
   * Called with the updated progress each time it changes (i.e. on a card's
   * first grade of the session). Never called on mount. The owner of the deck
   * stores it and passes it back as `progress` on the next mount.
   */
  onProgressChange?: (progress: ProgressDocument) => void;
  /**
   * Fires each time the session reaches its summary (queue worked through),
   * including after a "Study again" replay. In the same effect pass as the
   * final `onProgressChange`, so an owner that persists should defer its write
   * until after its own re-render (see FlashCardsApp's checkpoint). Receives
   * the finished session (id + card ids) so the owner can offer a replay later.
   */
  onSessionComplete?: (session: CompletedSession) => void;
  /**
   * The owner's record of the previous finished session. When present and its
   * cards are still in `wordBank`, the "Nothing due" state offers "Replay
   * Session". Read once at mount. In-memory only; never persisted.
   */
  lastSession?: CompletedSession;
  /** When provided, a back button is shown in the header. */
  onBack?: () => void;
  /**
   * When provided, a "+" in the header opens an add-word form. The new word is
   * the owner's to store; it joins the NEXT session (this one's queue is fixed
   * at mount, so `wordBank` changes are still ignored).
   */
  onAddCard?: (draft: CardDraft) => void;
}

/**
 * Inputs are read ONCE, at mount (see useStudySession) — changing the props
 * later does nothing. To load a different deck, remount with a new `key`.
 * Defaults are the sample data; the S3-backed library is loaded by
 * FlashCardsRoot and arrives through FlashCardsApp. Tests pass their own data
 * through these props instead of mocking the sample modules.
 */
const FlashCards: React.FC<FlashCardsProps> = ({
  wordBank = sampleDeck,
  progress = sampleProgress,
  deckName = sampleDeckName,
  onProgressChange,
  onSessionComplete,
  lastSession,
  onBack,
  onAddCard,
}) => {
  const {
    currentCard, position, total, isFlipped, isComplete,
    missedCards, reveal, grade, progressDraft,
    currentSession, canReplay, replaySession, newSession,
  } = useStudySession(wordBank, progress, lastSession);

  const reportedProgress = useRef(progressDraft);
  useEffect(() => {
    if (reportedProgress.current === progressDraft) return;
    reportedProgress.current = progressDraft;
    onProgressChange?.(progressDraft);
  }, [progressDraft, onProgressChange]);

  const wasComplete = useRef(false);
  useEffect(() => {
    if (isComplete && !wasComplete.current) onSessionComplete?.(currentSession);
    wasComplete.current = isComplete;
  }, [isComplete, currentSession, onSessionComplete]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const wasAddOpen = useRef(false);
  useEffect(() => {
    // Return focus to the "+" once the sheet closes (it is inert while open).
    if (wasAddOpen.current && !isAddOpen) addBtnRef.current?.focus();
    wasAddOpen.current = isAddOpen;
  }, [isAddOpen]);

  /** "Study again" (same cards, new order; hidden if there are none) + "New Session". Shared by the summary and "Nothing due". */
  const renderSessionOptions = () => (
    <ActionStack>
      {canReplay && (
        <SecondaryBtn type="button" onClick={replaySession}>Study again</SecondaryBtn>
      )}
      <PrimaryBtn type="button" onClick={newSession}>New Session</PrimaryBtn>
    </ActionStack>
  );

  const renderBody = () => {
    if (currentCard) {
      return (
        <>
          <FlipCard
            key={`${currentCard.id}-${position}`}
            card={currentCard}
            position={position}
            total={total}
            isFlipped={isFlipped}
            onReveal={reveal}
            onGrade={grade}
          />
          <Actions>
            <RevealBtn type="button" $flipped={isFlipped} onClick={reveal}>
              Show answer
            </RevealBtn>
          </Actions>
        </>
      );
    }

    // Session queue was non-empty and has been worked through.
    if (isComplete) {
      return (
        <>
          <SummaryState>
            <SummaryTitle>Session complete</SummaryTitle>
            {missedCards.length > 0 ? (
              <>
                <SummaryText>missed:</SummaryText>
                <MissedList>
                  {missedCards.map(c => <li key={c.id}>{displayGerman(c)}</li>)}
                </MissedList>
              </>
            ) : (
              <SummaryText>No words missed.</SummaryText>
            )}
          </SummaryState>
          {renderSessionOptions()}
        </>
      );
    }

    if (wordBank.length === 0) {
      return <EmptyState>No cards in this deck yet.</EmptyState>;
    }

    // Word bank has cards, but nothing is due and no new words are queued.
    return (
      <>
        <EmptyState>Nothing due right now — check back later.</EmptyState>
        {renderSessionOptions()}
      </>
    );
  };

  return (
    <>
      <GlobalStyle />
      {/* inert: while the add-word sheet is open, nothing behind it is focusable or tappable. */}
      <AppShell inert={isAddOpen}>
          <TopBarRow>
            {onBack ? (
              <TitleGroup>
                <BackBtn type="button" aria-label="Back to decks" onClick={onBack}>‹ Decks</BackBtn>
                <AppTitle>{deckName}</AppTitle>
              </TitleGroup>
            ) : (
              <AppTitle>{deckName}</AppTitle>
            )}
            <HeaderEnd>
              {currentCard && <Progress>{position} of {total}</Progress>}
              {onAddCard && (
                <AddWordBtn
                  ref={addBtnRef}
                  type="button"
                  aria-label="Add word"
                  aria-haspopup="dialog"
                  onClick={() => setIsAddOpen(true)}
                >
                  +
                </AddWordBtn>
              )}
            </HeaderEnd>
          </TopBarRow>

        {renderBody()}
      </AppShell>
      {onAddCard && isAddOpen && (
        <AddWordSheet onAdd={onAddCard} onClose={() => setIsAddOpen(false)} />
      )}
    </>
  );
};

export default FlashCards;
