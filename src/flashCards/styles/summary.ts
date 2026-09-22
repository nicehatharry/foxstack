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
