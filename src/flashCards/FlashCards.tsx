import React from 'react';

import { GlobalStyle } from './GlobalStyle';
import { FlipCard } from './FlipCard';
import { useStudySession } from './useStudySession';
import { sampleDeck, sampleDeckName } from './sampleDeck';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle, Progress } from './styles/header';
import { Actions, PrimaryBtn, RevealBtn, EmptyState } from './styles/actions';
import { SummaryState, SummaryTitle, SummaryText } from './styles/summary';

const FlashCards: React.FC = () => {
  // Placeholder deck source — swap for an S3-backed loader (see context-FlashCards.md).
  const {
    currentCard, position, total, isFlipped, isComplete,
    gotCount, missedCount, reveal, grade, restart,
  } = useStudySession(sampleDeck);

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

    if (isComplete) {
      return (
        <>
          <SummaryState>
            <SummaryTitle>Deck complete</SummaryTitle>
            <SummaryText>{gotCount} got it, {missedCount} missed it</SummaryText>
          </SummaryState>
          <Actions>
            <PrimaryBtn type="button" onClick={restart}>Study again</PrimaryBtn>
          </Actions>
        </>
      );
    }

    return <EmptyState>No cards in this deck yet.</EmptyState>;
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
