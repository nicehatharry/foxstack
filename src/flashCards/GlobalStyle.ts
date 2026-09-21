import { createGlobalStyle } from 'styled-components';
import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/700.css';
import { colors, fontFamily } from './styles/tokens';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html {
    -webkit-text-size-adjust: 100%;
    min-height: 100%;
  }

  body {
    margin: 0;
    min-height: 100%;
    background: ${colors.page};
    color: ${colors.ink};
    font-family: ${fontFamily};
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior-y: none;
  }

  button { font: inherit; }
`;
