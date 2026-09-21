import styled, { css } from 'styled-components';
import { colors, layout } from './tokens';

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
 * Three equal horizontal bands (black / red / gold) via hard-stop gradient.
 * The word panel is centred on the card; the pill is pulled out of flow
 * (absolute) so it doesn't offset that centring.
 */
export const Card = styled.article`
  position: relative; /* sits above the ::before layer */
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding: ${layout.cardPadding}px;
  border-radius: ${layout.cardRadius}px;
  color: ${colors.cardText};
  background: linear-gradient(
    to bottom,
    ${colors.flagBlack} 0 33.333%,
    ${colors.flagRed} 33.333% 66.666%,
    ${colors.flagGold} 66.666% 100%
  );
`;

/** Category marker — it encodes information (part of speech), so it's a pill. Sits on the black band. */
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

/**
 * Translucent ivory band behind the word. Bleeds edge-to-edge (negative
 * margin cancels the card padding) while its own padding restores the text
 * width, so WORD_SIZE_TIERS (tuned for ~313px) still holds. The blur softens
 * the band edges behind the text.
 */
export const WordPanel = styled.div`
  margin: -1px;
  padding: 48px 0px;
  background: ${colors.ivoryOverlay};
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
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
