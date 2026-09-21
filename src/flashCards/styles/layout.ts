import styled from 'styled-components';
import { layout } from './tokens';

/**
 * Full-height column. `100dvh` (with a `100vh` fallback) tracks Safari's
 * collapsing toolbar so the button never hides under it. Padding uses
 * max(safe-area, gutter): needs `viewport-fit=cover` in index.html.
 */
export const AppShell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${layout.maxWidth}px;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding:
    max(env(safe-area-inset-top), 8px)
    max(env(safe-area-inset-right), ${layout.gutter}px)
    max(env(safe-area-inset-bottom), ${layout.gutter}px)
    max(env(safe-area-inset-left), ${layout.gutter}px);
`;
