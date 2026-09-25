import React from 'react';

import { GlobalStyle } from './GlobalStyle';
import { FlipCard } from './FlipCard';
import { useStudySession } from './useStudySession';
import { sampleDeck, sampleDeckName } from './sampleDeck';
import { sampleProgress } from './sampleProgress';
import type { Flashcard, ProgressDocument } from './FlashCards.types';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle, Progress } from './styles/header';
import { Actions, PrimaryBtn, RevealBtn, EmptyState } from './styles/actions';
import { SummaryState, SummaryTitle, SummaryText } from './styles/summary';

export interface FlashCardsProps {
  /** Cards to study. Defaults to the placeholder sample deck. */
  wordBank?: Flashcard[];
  /** Persisted SRS state. Defaults to the placeholder sample progress. */
  progress?: ProgressDocument;
  /** Title shown in the header. */
  deckName?: string;
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
}) => {
  const {
    currentCard, position, total, isFlipped, isComplete,
    gotCount, missedCount, reveal, grade, restart,
  } = useStudySession(wordBank, progress);

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
            <SummaryText>{gotCount} got it, {missedCount} missed it</SummaryText>
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
      <AppShell>
        <TopBar>
          <TopBarRow>
            <AppTitle>{deckName}</AppTitle>
            {currentCard && <Progress>{position} of {total}</Progress>}
          </TopBarRow>
        </TopBar>
        {renderBody()}
      </AppShell>
    </>
  );
};

export default FlashCards;
