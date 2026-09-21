import React from 'react';

import { GlobalStyle } from './GlobalStyle';
import { CardPrompt } from './CardPrompt';
import { sampleDeck, sampleDeckName } from './sampleDeck';

import { AppShell } from './styles/layout';
import { TopBar, TopBarRow, AppTitle, Progress } from './styles/header';
import { Actions, ShowAnswerBtn, EmptyState } from './styles/actions';

const FlashCards: React.FC = () => {
  // Placeholder source — swap for a useStudySession() hook once decks are
  // loaded from S3 (see context-FlashCards.md).
  const deck = sampleDeck;
  const total = deck.length;
  const position = 1;
  const card = deck[position - 1];

  const handleShowAnswer = () => {
    // TODO(next task): flip to the answer side.
  };

  return (
    <>
      <GlobalStyle />
      <AppShell>
        <TopBar>
          <TopBarRow>
            <AppTitle>{sampleDeckName}</AppTitle>
            {card && <Progress>{position} of {total}</Progress>}
          </TopBarRow>
        </TopBar>

        {card ? (
          <>
            <CardPrompt card={card} position={position} total={total} />
            <Actions>
              <ShowAnswerBtn type="button" onClick={handleShowAnswer}>
                Show answer
              </ShowAnswerBtn>
            </Actions>
          </>
        ) : (
          <EmptyState>No cards in this deck yet.</EmptyState>
        )}
      </AppShell>
    </>
  );
};

export default FlashCards;
