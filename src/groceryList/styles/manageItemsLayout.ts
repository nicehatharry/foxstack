import styled, { createGlobalStyle } from 'styled-components';

/**
 * Sibling of styles/layout.ts's AppShell — same layout, different
 * palette, so it's visually obvious this isn't the grocery list. Only
 * the background changes; item cards, swipe reveals, and form fields all
 * reuse the grocery list's existing styled components unchanged.
 */
export const ManageAppShell = styled.div`
  max-width: 390px;     /* within Pixel 7 (412px) and iPhone 15 (393px) */
  margin: 0 auto;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: #dbe6ec; /* cool blue-grey — distinct from the list's warm cream (#f0ede8) */
  position: relative;
`;

/**
 * Body-background override, scoped to the Manage Items route by only
 * being rendered while ManageItems.tsx is mounted — same technique
 * GroceryList.tsx uses for its own <GlobalStyle />. Doesn't leak onto
 * the main list route.
 */
export const ManageGlobalStyle = createGlobalStyle`
  body {
    background: #dbe6ec;
  }
`;