import styled from 'styled-components';
import { colors } from './tokens';

export const Actions = styled.div`
  padding-top: 4px;
`;

/** Primary action lives at the bottom — the thumb zone on a 6.1" phone. */
export const ShowAnswerBtn = styled.button`
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
