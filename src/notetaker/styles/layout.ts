import styled from 'styled-components';
import { colors } from './tokens';

export const Shell = styled.div`
  display: flex;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: ${colors.stack};
`;
