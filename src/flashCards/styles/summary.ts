import styled from 'styled-components';
import { colors } from './tokens';

/** End-of-deck screen, shown in place of the card. */
export const SummaryState = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
`;

export const SummaryTitle = styled.h2`
  margin: 0;
  font-size: 44px;
  font-weight: 700;
  line-height: 1.05;
`;

export const SummaryText = styled.p`
  margin: 0;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
  color: ${colors.inkMuted};
`;

/** Missed words under the "missed:" label. Scrolls inside itself so a long list can't push the buttons off-screen. */
export const MissedList = styled.ul`
  max-height: 40vh;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  font-size: 20px;

  li + li { margin-top: 6px; }
`;
