import styled, { css } from 'styled-components';
import { slideUp } from '../animations';

export const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  opacity: ${p => p.$visible ? 1 : 0};
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
  transition: opacity 0.25s ease;
`;

export const Sheet = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(${p => p.$visible ? '0' : '100%'});
  width: 100%;
  max-width: 430px;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px 20px 0 0;
  z-index: 300;
  padding: 0 20px 32px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
  animation: ${p => p.$visible ? css`${slideUp} 0.3s cubic-bezier(0.32, 0.72, 0, 1)` : 'none'};
`;

export const SheetHandle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  margin: 12px auto 18px;
`;

export const SheetTitle = styled.h3`
  margin: 0 0 18px;
  font-size: 18px;
  font-weight: 400;
  font-family: 'Georgia', serif;
  font-style: italic;
  color: #1a1a1a;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
`;

export const FieldFull = styled.div`
  grid-column: 1 / -1;
`;

export const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 5px;
  font-family: 'Georgia', serif;
`;

export const FieldInput = styled.input`
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #1a1a1a;
    background: #fff;
  }
`;

export const FieldTextarea = styled.textarea`
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  resize: none;
  min-height: 76px;
  transition: border-color 0.15s;
  box-sizing: border-box;

  &:focus {
    border-color: #1a1a1a;
    background: #fff;
  }

  &::placeholder {
    color: #bbb;
  }
`;

export const FieldSelect = styled.select`
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  background: #fafafa;
  color: #1a1a1a;
  outline: none;
  -webkit-appearance: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #1a1a1a;
    background: #fff;
  }
`;

export const StoreChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const StoreChip = styled.button<{ $selected: boolean }>`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid ${p => p.$selected ? '#1a1a1a' : '#e8e8e8'};
  background: ${p => p.$selected ? '#1a1a1a' : '#fafafa'};
  color: ${p => p.$selected ? '#c8f59e' : '#555'};
  font-size: 13px;
  font-family: 'Georgia', serif;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;

  &:active {
    transform: scale(0.97);
  }
`;

export const SubmitBtn = styled.button`
  width: 100%;
  padding: 15px;
  background: #1a1a1a;
  color: #c8f59e;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  letter-spacing: 0.06em;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;

  &:active {
    background: #333;
  }
`;

// ---------------------------------------------------------------------------
// Autocomplete dropdown
// ---------------------------------------------------------------------------

/**
 * Wraps the item name FieldFull to establish a positioning context for the
 * dropdown. overflow: visible is critical — the dropdown must escape the
 * Sheet's overflow-y: auto scroll container. This is achieved by rendering
 * the dropdown as position: fixed (see SuggestionDropdown below) so it
 * escapes all ancestor overflow clipping entirely.
 */
export const AutocompleteWrapper = styled.div`
  position: relative;
  grid-column: 1 / -1;
`;

/**
 * The suggestion list. Rendered as position: fixed so it escapes the Sheet's
 * overflow-y: auto and always appears above the keyboard on mobile. Top/left/
 * width are set via inline style from the input's bounding rect — see
 * GroceryList.tsx for the measurement logic.
 *
 * Max-height is capped so the list never obscures the entire screen, and
 * -webkit-overflow-scrolling: touch ensures momentum scrolling on iOS.
 */
export const SuggestionDropdown = styled.ul<{ $visible: boolean }>`
  display: ${p => p.$visible ? 'block' : 'none'};
  position: fixed;
  z-index: 400;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
  max-height: 220px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* Clip child border-radii correctly */
  overflow-x: hidden;
`;

export const SuggestionItem = styled.li<{ $active: boolean }>`
  padding: 12px 14px;
  font-size: 15px;
  font-family: 'Georgia', serif;
  color: #1a1a1a;
  background: ${p => p.$active ? '#f5f5f5' : 'transparent'};
  cursor: pointer;
  /* Generous touch target for phones */
  min-height: 44px;
  display: flex;
  align-items: center;
  /* Smooth background transition for arrow-key navigation */
  transition: background 0.1s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: #efefef;
  }

  /* Hairline divider between items, skipping the first */
  & + & {
    border-top: 1px solid #f0f0f0;
  }
`;
