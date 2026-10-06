import React, { useEffect, useRef, useState } from 'react';

import { GlobalStyle } from './GlobalStyle';
import { FlipCard } from './FlipCard';
import { useStudySession } from './useStudySession';
import { sampleDeck, sampleDeckName } from './sampleDeck';
import { sampleProgress } from './sampleProgress';
import type { Flashcard, ProgressDocument } from './FlashCards.types';
import type { CardDraft } from './decks';
import { AddWordSheet } from './AddWordSheet';

import { AppShell } from './styles/layout';
import { TopBarRow, AppTitle, Progress } from './styles/header';
import { HeaderEnd, AddWordBtn } from './styles/addWord';
import { BackBtn, TitleGroup } from './styles/decks';
import { Actions, PrimaryBtn, RevealBtn, EmptyState } from './styles/actions';
import { SummaryState, SummaryTitle, SummaryText } from './styles/summary';

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
 * Defaults are the sample data until the S3-backed loader exists (words.json +
 * progress.json; see context-FlashCards.md). Tests pass their own data through
 * these props instead of mocking the sample modules.
 */
const FlashCards: React.FC<FlashCardsProps> = ({
  wordBank = sampleDeck,
  progress = sampleProgress,
  deckName = sampleDeckName,
  onProgressChange,
  onBack,
  onAddCard,
}) => {
  const {
    currentCard, position, total, isFlipped, isComplete,
    gotCount, missedCount, reveal, grade, restart, progressDraft,
  } = useStudySession(wordBank, progress);

  const reportedProgress = useRef(progressDraft);
  useEffect(() => {
    if (reportedProgress.current === progressDraft) return;
    reportedProgress.current = progressDraft;
    onProgressChange?.(progressDraft);
  }, [progressDraft, onProgressChange]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const wasAddOpen = useRef(false);
  useEffect(() => {
    // Return focus to the "+" once the sheet closes (it is inert while open).
    if (wasAddOpen.current && !isAddOpen) addBtnRef.current?.focus();
    wasAddOpen.current = isAddOpen;
  }, [isAddOpen]);

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
            <SummaryText>got {gotCount}, missed {missedCount}</SummaryText>
          </SummaryState>
          <Actions>
            <PrimaryBtn type="button" onClick={restart}>Study again</PrimaryBtn>
          </Actions>
        </>
      );
    }

    if (wordBank.length === 0) {
      return <EmptyState>No cards in this deck yet.</EmptyState>;
    }

    // Word bank has cards, but nothing is due and no new words are queued.
    return <EmptyState>Nothing due right now — check back later.</EmptyState>;
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
