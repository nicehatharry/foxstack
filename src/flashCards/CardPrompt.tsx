import React from 'react';
import { getWordFontSize } from './FlashCards.utils';
import type { Flashcard } from './FlashCards.types';
import { PosTag, WordPanel, Word } from './styles/card';

/**
 * Prompt-face content: part of speech + the German word, nothing else.
 * Deliberately omits the article and translation — those belong to the answer.
 * Rendered inside FlipCard's front face.
 */
export const CardPrompt: React.FC<{ card: Flashcard }> = ({ card }) => (
  <>
    <PosTag>{card.partOfSpeech}</PosTag>
    <WordPanel>
      <Word lang="de" $fontSize={getWordFontSize(card.german)}>
        {card.german}
      </Word>
    </WordPanel>
  </>
);
