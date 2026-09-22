import { keyframes } from 'styled-components';

/** New card entering after a grade (or on first load / restart). */
export const cardIn = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;
