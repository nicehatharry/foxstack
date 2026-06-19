import { keyframes } from 'styled-components';

export const slideUp = keyframes`
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
`;

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const strikeThrough = keyframes`
  from { width: 0%; }
  to   { width: 100%; }
`;
