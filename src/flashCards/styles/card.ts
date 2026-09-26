import styled, { css } from 'styled-components';
import { cardIn } from '../animations';
import { FLIP_DURATION_MS } from '../FlashCards.constants';
import type { AnswerTone } from '../FlashCards.types';
import { answerText, answerTones, colors, layout } from './tokens';

/**
 * Wrapper that owns the card's flex sizing and the "more cards below" hint.
 * The hint is a slightly smaller, darker layer peeking out beneath the card —
 * it tells the learner there's a deck behind this card without any extra UI.
 */
export const CardStack = styled.div<{ $hasMore: boolean }>`
  position: relative;
  display: flex;
  flex: 1;
  min-height: 320px;
  margin-bottom: ${({ $hasMore }) => ($hasMore ? 24 : 16)}px;

  ${({ $hasMore }) => $hasMore && css`
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateY(10px) scale(0.93);
      border-radius: ${layout.cardRadius}px;
      background: ${colors.cardUnder};
    }
  `}
`;

/**
 * Flip scene: gives the child a 3D viewpoint and is the tap target. The
 * entrance animation lives here so a remounted card (new `key`) slides in
 * already un-flipped — no flip-back animation that could leak the next answer.
 */
export const Scene = styled.div`
  position: relative; /* paints above CardStack::before */
  display: flex;
  flex: 1;
  perspective: 1200px;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  animation: ${cardIn} 240ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Flipper = styled.div<{ $flipped: boolean }>`
  position: relative;
  flex: 1;
  transform-style: preserve-3d;
  transform: rotateY(${({ $flipped }) => ($flipped ? 180 : 0)}deg);
  transition: transform ${FLIP_DURATION_MS}ms cubic-bezier(0.3, 0.7, 0.2, 1);
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * One side of the card. Both faces are stacked at inset 0 with
 * backface-visibility hidden; the Flipper's rotation decides which shows.
 * The pill is absolute (top-left) so it doesn't offset the centred content.
 */
const Face = styled.article`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding: ${layout.cardPadding}px;
  border-radius: ${layout.cardRadius}px;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
`;

/** Prompt side: three equal horizontal bands (black / red / gold), hard-stop gradient. */
export const CardFront = styled(Face)`
  color: ${colors.cardText};
  background: linear-gradient(
    to bottom,
    ${colors.flagBlack} 0 33.333%,
    ${colors.flagRed} 33.333% 66.666%,
    ${colors.flagGold} 66.666% 100%
  );
`;

/**
 * Answer side: soft tone by noun gender (or orange for non-nouns).
 *
 * `visibility` keeps this face — and the grade buttons on it — untappable and
 * out of the tab order until the card is flipped. It flips to visible in the
 * same frame the rotation starts, so the animation is unaffected.
 */
export const CardBack = styled(Face)<{ $tone: AnswerTone; $flipped: boolean }>`
  transform: rotateY(180deg);
  color: ${colors.ink};
  background: ${({ $tone }) => answerTones[$tone]};
  visibility: ${({ $flipped }) => ($flipped ? 'visible' : 'hidden')};
`;

/** Category marker — it encodes information (part of speech), so it's a pill. */
export const PosTag = styled.span`
  position: absolute;
  top: ${layout.cardPadding}px;
  left: ${layout.cardPadding}px;
  padding: 5px 12px 6px;
  border: 1.5px solid ${colors.cardOutline};
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  color: ${colors.cardText};
`;

/** Same pill, inked for the light answer side. */
export const AnswerPosTag = styled(PosTag)`
  border-color: ${answerText.outline};
  color: ${colors.ink};
`;

/**
 * Translucent ivory panel behind the prompt word. A contained panel: it spans
 * the card's inner width (margin -1px) with vertical padding only, so the text
 * is ~313px wide and WORD_SIZE_TIERS still holds. It does not bleed to the
 * card edges.
 *
 * No backdrop-filter on purpose: Safari mishandles it inside preserve-3d
 * (flip) contexts. The 88% opacity carries legibility on its own.
 */
export const WordPanel = styled.div`
  margin: -1px;
  padding: 48px 0px;
  background: ${colors.ivoryOverlay};
  border-radius: 25px;
`;

/**
 * The prompt word. `lang="de"` (set in JSX) lets iOS Safari hyphenate German
 * compounds correctly if one still overflows its size tier.
 */
export const Word = styled.h2<{ $fontSize: number }>`
  margin: 0;
  font-size: ${({ $fontSize }) => $fontSize}px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
  text-align: center;
  color: ${colors.ink};
  -webkit-hyphens: auto;
  hyphens: auto;
  overflow-wrap: break-word;
`;

/**
 * Fills the space between the pill (top) and the grade buttons (bottom) and
 * centres the German word + translation (or the forms panel, once expanded)
 * in it. Top padding clears the absolutely positioned pill.
 *
 * `min-height: 0` overrides flexbox's default `min-height: auto`, which would
 * otherwise force this box to grow to fit its content (the forms panel, on a
 * long verb) instead of letting FormsScroll's own `overflow-y: auto` do the
 * scrolling. Without it, a long panel would push past the card's bottom edge
 * and get hard-clipped by Face's `overflow: hidden` instead of scrolling.
 */
export const AnswerBody = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 0 16px;
  text-align: center;
`;

/** The prompt word, small, as a reminder of what was asked (with article for nouns). Not tappable — see AnswerGermanButton. */
export const AnswerGerman = styled.p`
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  color: ${answerText.muted};
`;

/**
 * Same look as AnswerGerman, as a real `<button>` — used instead of it when
 * the card has a forms panel to open (see hasForms in FlashCards.utils.ts).
 * The dotted underline is the only visual cue that it's tappable; deliberately
 * not link-blue, which would clash with the answer-tone backgrounds.
 */
export const AnswerGermanButton = styled.button`
  margin: 0 0 12px;
  padding: 0 0 1px;
  border: 0;
  border-bottom: 1px dotted currentColor;
  background: none;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  color: ${answerText.muted};
  cursor: pointer;
  touch-action: manipulation;

  &:focus-visible {
    outline: 3px solid ${colors.flagRed};
    outline-offset: 3px;
  }
`;

export const Translation = styled.h2<{ $fontSize: number }>`
  margin: 0;
  font-size: ${({ $fontSize }) => $fontSize}px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
  -webkit-hyphens: auto;
  hyphens: auto;
  overflow-wrap: break-word;
`;
