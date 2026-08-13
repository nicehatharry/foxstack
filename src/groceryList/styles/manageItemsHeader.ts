import styled from 'styled-components';

/**
 * Sibling of styles/header.ts's TopBar, themed for the Manage Items page.
 * TopBarRow and AppTitle are reused as-is from header.ts — neither sets
 * its own color, so AppTitle simply inherits whichever TopBar (this one
 * or the main list's) wraps it, which is the only reason this file needs
 * just one new component to get a fully different palette.
 */
export const ManageTopBar = styled.header`
  background: #16232b;
  color: #dce8ef;
  margin-bottom: 14px;
  padding: 18px 20px 4px;
  position: sticky;
  top: 0;
  z-index: 100;
`;