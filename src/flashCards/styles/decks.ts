import styled from 'styled-components';

import { PrimaryBtn, SecondaryBtn } from './actions';
import { colors, answerText } from './tokens';

/*
 * Sizes follow the existing rules (>= 44 px targets). Inputs are 16 px so iOS
 * Safari doesn't zoom the page on focus. Radius (18 px) and focus ring match PrimaryBtn.
 */

const hairline = answerText.outline;

const focusRing = `
  &:focus-visible {
    outline: 3px solid ${colors.flagRed};
    outline-offset: 2px;
  }
`;

/** Keeps back button + title together on the left of TopBarRow (which is space-between). */
export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
`;

export const BackBtn = styled.button`
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px 0 0;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  ${focusRing}
`;

export const DeckList = styled.ul`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  margin: 0;
  padding: 16px 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const DeckRow = styled.button`
  width: 100%;
  min-height: 64px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  background: none;
  border: 1px solid ${hairline};
  border-radius: 18px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  ${focusRing}
`;

export const DeckName = styled.span`
  font-size: 20px;
  font-weight: 700;
`;

export const DeckMeta = styled.span`
  font-size: 15px;
  color: ${colors.inkMuted};
`;

export const FormBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const AddCardForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 15px;
`;

const control = `
  min-height: 48px;
  padding: 0 12px;
  background: transparent;
  border: 1px solid ${hairline};
  border-radius: 18px;
  color: inherit;
  font: inherit;
  font-size: 16px;
  ${focusRing}
`;

export const TextInput = styled.input`
  ${control}
`;

export const Select = styled.select`
  ${control}
`;

export const FieldRow = styled.div`
  display: flex;
  gap: 12px;
  & > * {
    flex: 1 1 0;
    min-width: 0;
  }
`;

/** SecondaryBtn with a visible disabled state (add-card is gated on both words). */
export const AddBtn = styled(SecondaryBtn)`
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
`;

export const DraftList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DraftItem = styled.li`
  min-height: 48px;
  padding: 4px 4px 4px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid ${hairline};
  border-radius: 18px;
`;

export const DraftText = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const RemoveBtn = styled.button`
  min-width: 44px;
  min-height: 44px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  ${focusRing}
`;

export const FormHint = styled.p`
  margin: 0;
  font-size: 15px;
  color: ${colors.inkMuted};
`;

/** PrimaryBtn with a visible disabled state (create-deck is gated on name + 1 card). */
export const SubmitBtn = styled(PrimaryBtn)`
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
`;
