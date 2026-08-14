import styled from 'styled-components';
import { colors, fonts, layout } from './tokens';

export const SidebarAside = styled.aside<{ $hidden: boolean }>`
  width: ${layout.sidebarWidth};
  flex-shrink: 0;
  background: ${colors.stack};
  color: ${colors.paperOnStack};
  display: flex;
  flex-direction: column;
  padding-top: calc(env(safe-area-inset-top, 0px) + 20px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-right: 1px solid ${colors.stackLine};

  @media (max-width: ${layout.breakpointMobile}) {
    width: 100%;
    border-right: none;
    display: ${p => (p.$hidden ? 'none' : 'flex')};
  }
`;

export const SidebarHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 20px 16px;
`;

export const Wordmark = styled.span`
  font-family: ${fonts.label};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${colors.mutedOnStack};
`;

export const NewNoteBtn = styled.button`
  margin: 0 16px 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${fonts.label};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${colors.paperOnStack};
  background: ${colors.stackRaised};
  border: 1px solid ${colors.stackLine};
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    background: #343a2c;
    border-color: ${colors.accent};
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const PlusGlyph = styled.span`
  font-family: ${fonts.label};
  font-size: 14px;
  line-height: 1;
`;

export const NoteList = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px 20px;
  -webkit-overflow-scrolling: touch;
`;

export const NoteListEmpty = styled.p`
  margin: 40px 20px 0;
  font-family: ${fonts.label};
  font-size: 12px;
  color: ${colors.mutedOnStack};
  line-height: 1.6;
`;

export const NoteCard = styled.button<{ $active: boolean }>`
  position: relative;
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 14px 10px 16px;
  margin-bottom: 4px;
  border-radius: 3px;
  background: ${p => (p.$active ? colors.stackRaised : 'transparent')};
  border: none;
  border-left: 3px solid ${p => (p.$active ? colors.accent : 'transparent')};
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    background: ${colors.stackRaised};
  }

  &:hover [data-role='delete'],
  &:focus-within [data-role='delete'] {
    opacity: 1;
  }
`;

export const NoteCardTitle = styled.div<{ $untitled: boolean }>`
  font-family: ${fonts.label};
  font-size: 13px;
  font-weight: ${p => (p.$untitled ? 400 : 500)};
  font-style: ${p => (p.$untitled ? 'italic' : 'normal')};
  color: ${p => (p.$untitled ? colors.mutedOnStack : colors.paperOnStack)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const NoteCardMeta = styled.div`
  margin-top: 3px;
  font-family: ${fonts.label};
  font-size: 11px;
  color: ${colors.mutedOnStack};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const NoteCardDelete = styled.span`
  position: absolute;
  right: 8px;
  top: 8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-family: ${fonts.label};
  font-size: 13px;
  color: ${colors.mutedOnStack};
  opacity: 0;
  cursor: pointer;
  transition: opacity 120ms ease, background 120ms ease, color 120ms ease;

  &:hover {
    background: ${colors.danger};
    color: ${colors.paperOnStack};
  }
`;
