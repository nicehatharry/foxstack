import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background: #f0ede8;
    font-family: 'Georgia', 'Times New Roman', serif;
    overscroll-behavior: none;
  }
`;
