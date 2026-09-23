import React from 'react';

import { GlobalStyle } from './GlobalStyle';
import { FlipCard } from './FlipCard';
import { useStudySession } from './useStudySession';
import { sampleDeck, sampleDeckName } from './sampleDeck';
import { sampleProgress } from './sampleProgress';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle, Progress } from './styles/header';
import { Actions, PrimaryBtn, RevealBtn, EmptyState } from './styles/actions';
import { SummaryState, SummaryTitle, SummaryText } from './styles/summary';

const FlashCards: React.FC = () => {
  // Placeholder word bank + progress — swap for an S3-backed loader
  // (words.json + progress.json; see context-FlashCards.md).
  const {
    currentCard, position, total, isFlipped,
    gotCount, missedCount, reveal, grade, restart,
  } = useStudySession(sampleDeck, sampleProgress);

  const renderBody = () => {
    if (currentCard) {
      return (
        <>
          <FlipCard
            key={currentCard.id}
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
    if (total > 0) {
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

    if (sampleDeck.length === 0) {
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
            <AppTitle>{sampleDeckName}</AppTitle>
            {currentCard && <Progress>{position} of {total}</Progress>}
          </TopBarRow>
        </TopBar>
        {renderBody()}
      </AppShell>
    </>
  );
};

export default FlashCards;
