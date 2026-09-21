import React from 'react';
import { getWordFontSize } from './FlashCards.utils';
import type { Flashcard } from './FlashCards.types';
import { CardStack, Card, PosTag, WordPanel, Word } from './styles/card';

interface CardPromptProps {
  card: Flashcard;
  position: number;
  total: number;
}

/**
 * Prompt side of a flashcard: part of speech + the German word, nothing else.
 * Deliberately omits the article and translation — those belong to the answer.
 */
export const CardPrompt: React.FC<CardPromptProps> = ({ card, position, total }) => (
  <CardStack $hasMore={position < total}>
    <Card aria-label={`Flashcard ${position} of ${total}`}>
      <PosTag>{card.partOfSpeech}</PosTag>
      <WordPanel>
        <Word lang="de" $fontSize={getWordFontSize(card.german)}>
          {card.german}
        </Word>
      </WordPanel>
    </Card>
  </CardStack>
);
