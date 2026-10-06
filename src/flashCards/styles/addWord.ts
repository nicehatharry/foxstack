import styled from 'styled-components';
import { Actions } from './actions';
import { AddCardForm } from './decks';
import { colors } from './tokens';

/**
 * A phone on its side (iPhone 15 landscape ≈ 852×393). Height-gated so a tall
 * desktop window in landscape doesn't get the compact layout.
 */
export const LANDSCAPE_PHONE = '(orientation: landscape) and (max-height: 500px)';

/** Right side of the study header: "n of m" + the "+" button. */
export const HeaderEnd = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * Text-free "+": a 28 px outlined circle (inkMuted, 5.3:1 on the page) inside a
 * 44 px hit area. Negative margins shrink its LAYOUT footprint to the 24 px title
 * line, so the header — and the card below it — keep their old height (vertical
 * space is scarce in landscape). The top 8 px of the overhang sits in AppShell's
 * top padding; the bottom 12 px overlaps the card's rounded top-right corner, so
 * `z-index: 1` makes the button win there (it must paint above the card's Scene).
 * margin-right pulls the circle's edge flush with the gutter.
 */
export const AddWordBtn = styled.button`
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin: -8px -8px -12px 0;
  padding: 0;
  background: none;
  border: 0;
  border-radius: 50%;
  color: inherit;
  font: inherit;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;

  &::before {
    content: '';
    position: absolute;
    width: 28px;
    height: 28px;
    border: 1.5px solid ${colors.inkMuted};
    border-radius: 50%;
  }

  &:focus-visible {
    outline: 3px solid ${colors.flagRed};
    outline-offset: 0;
  }
`;

/**
 * Full-screen cover for the add-word form. It sits OUTSIDE the card's Scene
 * (a sibling of the study shell, not a descendant) and covers the card, so
 * nothing tapped here can reach the card's tap-to-reveal handler.
 */
export const SheetOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  overflow-y: auto;
  background: ${colors.page};
`;

/** Top-right "Close" in the sheet header. Right-aligned flush with the gutter (BackBtn insets its right side). */
export const CloseBtn = styled.button`
  min-width: 44px;
  min-height: 44px;
  padding: 0 0 0 12px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: right;
  cursor: pointer;
  touch-action: manipulation;

  &:focus-visible {
    outline: 3px solid ${colors.flagRed};
    outline-offset: 2px;
  }
`;

/** Bottom "Done" (thumb zone). Hidden in landscape-phone: the header's Close is the way out there. */
export const SheetFooter = styled(Actions)`
  @media ${LANDSCAPE_PHONE} {
    display: none;
  }
`;

/**
 * Card entry form. Portrait: the shared single column. Landscape phone, where
 * the keyboard leaves ~190 px: two rows, so the fields fit above it —
 *   German          | English
 *   Part of speech  | Add button
 * Placement is by child order in CardDraftForm (German, forms row, English, button).
 */
export const CompactCardForm = styled(AddCardForm)`
  @media ${LANDSCAPE_PHONE} {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    gap: 8px 12px;

    & > :nth-child(1) { grid-column: 1; grid-row: 1; }
    & > :nth-child(3) { grid-column: 2; grid-row: 1; }
    & > :nth-child(2) { grid-column: 1; grid-row: 2; }
    & > :nth-child(4) { grid-column: 2; grid-row: 2; }
  }
`;
