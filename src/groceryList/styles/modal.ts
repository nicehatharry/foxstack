import styled from 'styled-components';

/**
 * Full-screen scrim behind the notes modal. Clicking it dismisses.
 * z-index sits above the list (100) but below the bottom sheet (200/300)
 * so the sheet can open on top if the user swipes to edit after reading.
 */
export const ModalOverlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
  opacity: ${p => p.$visible ? 1 : 0};
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
`;

/**
 * The card that holds the note text. Constrained width matches the
 * app's max-width so it never looks out of place on wider screens.
 */
export const ModalCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 382px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
`;

export const ModalItemName = styled.div`
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #aaa;
  font-family: 'Georgia', serif;
  margin-bottom: 10px;
`;

export const ModalNoteText = styled.div`
  font-size: 15px;
  font-family: 'Georgia', serif;
  color: #1a1a1a;
  line-height: 1.6;
  white-space: pre-wrap;
`;
