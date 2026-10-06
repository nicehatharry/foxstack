import styled from 'styled-components';
import { colors } from './tokens';

export const TopBar = styled.header`
`;

export const TopBarRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

export const AppTitle = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.01em;
`;

export const Progress = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${colors.inkMuted};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;
