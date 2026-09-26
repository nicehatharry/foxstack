import React, { useId, useState } from 'react';
import { getArticle, getWordFontSize, hasForms } from './FlashCards.utils';
import type { Flashcard, Grade } from './FlashCards.types';
import {
  AnswerPosTag, AnswerBody, AnswerGerman, AnswerGermanButton, Translation,
} from './styles/card';
import { GradeRow, PrimaryBtn, SecondaryBtn } from './styles/actions';
import { WordForms } from './WordForms';

interface CardAnswerProps {
  card: Flashcard;
  onGrade: (grade: Grade) => void;
}

/**
 * Answer-face content: part of speech, the German word (small — with its
 * article for nouns, so gender isn't conveyed by colour alone), the
 * translation, and the Missed it / Got it buttons. Background tone is applied
 * by FlipCard's back face.
 *
 * If the card has recorded forms (hasForms), the German word becomes a toggle
 * button: tapping it swaps the translation for a forms panel (WordForms) in
 * place, tapping again swaps back. This is local, ephemeral UI state — not
 * part of the study session — so it isn't subject to the reveal/grade double-
 * tap lockout, and it resets for free on the next card because FlipCard
 * remounts this whole component on every advance (see its key discipline).
 */
export const CardAnswer: React.FC<CardAnswerProps> = ({ card, onGrade }) => {
  const [showForms, setShowForms] = useState(false);
  const formsId = useId();
  const article = getArticle(card);
  const germanDisplay = article ? `${article} ${card.german}` : card.german;
  const canExpand = hasForms(card);

  // The card itself is a tap target (reveal); stop these clicks bubbling to it.
  const grade = (g: Grade) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onGrade(g);
  };
  const toggleForms = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowForms(v => !v);
  };

  return (
    <>
      <AnswerPosTag>{card.partOfSpeech}</AnswerPosTag>
      <AnswerBody>
        {canExpand ? (
          <AnswerGermanButton
            type="button"
            lang="de"
            aria-expanded={showForms}
            aria-controls={formsId}
            onClick={toggleForms}
          >
            {germanDisplay}
          </AnswerGermanButton>
        ) : (
          <AnswerGerman lang="de">{germanDisplay}</AnswerGerman>
        )}
        {showForms ? (
          <WordForms id={formsId} card={card} />
        ) : (
          <Translation lang="en" $fontSize={getWordFontSize(card.english)}>
            {card.english}
          </Translation>
        )}
      </AnswerBody>
      <GradeRow>
        <SecondaryBtn type="button" onClick={grade('missed')}>Missed it</SecondaryBtn>
        <PrimaryBtn type="button" onClick={grade('got')}>Got it</PrimaryBtn>
      </GradeRow>
    </>
  );
};
