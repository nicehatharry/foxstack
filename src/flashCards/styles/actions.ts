import styled from 'styled-components';
import { colors } from './tokens';

export const Actions = styled.div`
  position: relative; /* anchors RevealBtn when it's visually hidden on touch */
  padding-top: 4px;
`;

/** Primary action lives at the bottom — the thumb zone on a 6.1" phone. */
export const PrimaryBtn = styled.button`
  display: block;
  width: 100%;
  height: 56px;
  border: 0;
  border-radius: 18px;
  background: ${colors.ink};
  color: ${colors.cardText};
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  touch-action: manipulation; /* no double-tap-zoom delay */
  transition: transform 80ms ease-out;

  &:active { transform: scale(0.98); }

  &:focus-visible {
    outline: 3px solid ${colors.flagRed};
    outline-offset: 3px;
  }
`;

/**
 * "Show answer" — the keyboard / screen-reader way to flip the card. On touch
 * devices the card itself is the control, so the button is visually hidden
 * there but stays in the accessibility tree (VoiceOver users can still flip).
 * Once flipped it's `visibility: hidden` rather than unmounted, so the card
 * doesn't resize on desktop.
 */
export const RevealBtn = styled(PrimaryBtn)<{ $flipped: boolean }>`
  visibility: ${({ $flipped }) => ($flipped ? 'hidden' : 'visible')};

  @media (hover: none) and (pointer: coarse) {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;

/**
 * Outlined counterpart to PrimaryBtn. Neutral ink on purpose: red/green here
 * would collide with the feminine/neuter answer backgrounds.
 */
export const SecondaryBtn = styled(PrimaryBtn)`
  background: transparent;
  color: ${colors.ink};
  box-shadow: inset 0 0 0 2px ${colors.ink};
`;

/** Missed it (left) / Got it (right); sits at the bottom of the card's answer face. */
export const GradeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  font-size: 18px;
  color: ${colors.inkMuted};
`;
