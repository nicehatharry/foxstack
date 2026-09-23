import React from 'react';
import { getAnswerTone } from './FlashCards.utils';
import type { Flashcard, Grade } from './FlashCards.types';
import { CardPrompt } from './CardPrompt';
import { CardAnswer } from './CardAnswer';
import { CardStack, Scene, Flipper, CardFront, CardBack } from './styles/card';

interface FlipCardProps {
  card: Flashcard;
  position: number;
  total: number;
  isFlipped: boolean;
  onReveal: () => void;
  onGrade: (grade: Grade) => void;
}

/**
 * Two-sided card. Tapping anywhere on it reveals the answer (one-way); the
 * Missed it / Got it buttons live on the answer face.
 *
 * Render with a key that changes on EVERY advance (card id + queue position),
 * so advancing remounts it un-flipped instead of animating back — otherwise
 * the next card's answer would flash mid-flip. A bare `key={card.id}` is not
 * enough: a missed card can be the very next card (last card in the queue,
 * or a one-card queue), giving the same id twice in a row and no remount.
 *
 * The tap is a pointer convenience; the page's "Show answer" button is the
 * keyboard/screen-reader path. The hidden face is kept out of the tab order
 * and hit-testing (front: aria-hidden; back: visibility, see CardBack).
 */
export const FlipCard: React.FC<FlipCardProps> = ({
  card, position, total, isFlipped, onReveal, onGrade,
}) => (
  <CardStack $hasMore={position < total}>
    <Scene role="presentation" onClick={onReveal}>
      <Flipper $flipped={isFlipped}>
        <CardFront
          aria-hidden={isFlipped}
          aria-label={`Flashcard ${position} of ${total}, prompt`}
        >
          <CardPrompt card={card} />
        </CardFront>
        <CardBack
          $tone={getAnswerTone(card)}
          $flipped={isFlipped}
          aria-label={`Flashcard ${position} of ${total}, answer`}
        >
          <CardAnswer card={card} onGrade={onGrade} />
        </CardBack>
      </Flipper>
    </Scene>
  </CardStack>
);
