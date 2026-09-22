import React from 'react';
import { getWordFontSize } from './FlashCards.utils';
import type { Flashcard, Grade } from './FlashCards.types';
import { AnswerPosTag, AnswerBody, AnswerGerman, Translation } from './styles/card';
import { GradeRow, PrimaryBtn, SecondaryBtn } from './styles/actions';

interface CardAnswerProps {
  card: Flashcard;
  onGrade: (grade: Grade) => void;
}

/**
 * Answer-face content: part of speech, the German word (small — with its
 * article for nouns, so gender isn't conveyed by colour alone), the
 * translation, and the Missed it / Got it buttons. Background tone is applied
 * by FlipCard's back face.
 */
export const CardAnswer: React.FC<CardAnswerProps> = ({ card, onGrade }) => {
  // The card itself is a tap target (reveal); stop grade clicks bubbling to it.
  const grade = (g: Grade) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onGrade(g);
  };

  return (
    <>
      <AnswerPosTag>{card.partOfSpeech}</AnswerPosTag>
      <AnswerBody>
        <AnswerGerman lang="de">
          {card.article ? `${card.article} ${card.german}` : card.german}
        </AnswerGerman>
        <Translation lang="en" $fontSize={getWordFontSize(card.english)}>
          {card.english}
        </Translation>
      </AnswerBody>
      <GradeRow>
        <SecondaryBtn type="button" onClick={grade('missed')}>Missed it</SecondaryBtn>
        <PrimaryBtn type="button" onClick={grade('got')}>Got it</PrimaryBtn>
      </GradeRow>
    </>
  );
};
