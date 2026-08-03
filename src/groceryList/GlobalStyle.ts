import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background: #f0ede8;
    font-family: 'Roboto', sans-serif;
    overscroll-behavior: none;
	  text-transform: uppercase;
  }
`;
