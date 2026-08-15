import styled, { createGlobalStyle } from 'styled-components';
import { colors } from './tokens';

// iOS rubber-band overscroll fix.
export const NotetakerGlobalStyle = createGlobalStyle`
  html, body {
    background: ${colors.stack};
    overscroll-behavior-y: none;
  }
`;

export const Shell = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: ${colors.stack};
`;
