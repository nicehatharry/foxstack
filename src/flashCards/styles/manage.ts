import styled from 'styled-components';

import { PrimaryBtn } from './actions';
import { answerText, colors, layout } from './tokens';

const hairline = answerText.outline;

const focusRing = `
  &:focus-visible {
    outline: 3px solid ${colors.flagRed};
    outline-offset: 2px;
  }
`;

/** Wider than AppShell (480): split pane on PC. Same safe-area padding. */
export const ManageShell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1100px;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0 auto;
  padding:
    max(env(safe-area-inset-top), 8px)
    max(env(safe-area-inset-right), ${layout.gutter}px)
    max(env(safe-area-inset-bottom), ${layout.gutter}px)
    max(env(safe-area-inset-left), ${layout.gutter}px);
`;

export const DeckBar = styled.div`
  padding-top: 12px;
  max-width: 480px;
`;

/** One column (list → editor push) on phones; list | editor from 900px. */
export const SplitPane = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  padding: 16px 0;

  @media (min-width: 900px) {
    grid-template-columns: 340px minmax(0, 1fr);
    align-items: start;
  }
`;

export const ListPane = styled.section<{ $editing: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;

  @media (max-width: 899px) {
    display: ${(p) => (p.$editing ? 'none' : 'flex')};
  }
`;

export const EditorPane = styled.section<{ $editing: boolean }>`
  min-width: 0;

  @media (max-width: 899px) {
    display: ${(p) => (p.$editing ? 'block' : 'none')};
  }
`;

export const WordList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (min-width: 900px) {
    max-height: calc(100dvh - 260px);
    overflow-y: auto;
  }
`;

export const WordRow = styled.button<{ $active: boolean }>`
  width: 100%;
  min-height: 56px;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: ${(p) => (p.$active ? 'rgba(18, 21, 28, 0.08)' : 'none')};
  border: 1px solid ${hairline};
  border-radius: 18px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  ${focusRing}
`;

export const WordRowTitle = styled.span`
  font-size: 18px;
  font-weight: 700;
  overflow-wrap: anywhere;
`;

export const WordRowMeta = styled.span`
  font-size: 14px;
  color: ${colors.inkMuted};
  overflow-wrap: anywhere;
`;

export const EditorPlaceholder = styled.p`
  margin: 0;
  padding: 24px 0;
  color: ${colors.inkMuted};
`;

export const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
`;

/** Back-to-list button: only on phones, where the editor replaces the list. */
export const MobileOnly = styled.span`
  @media (min-width: 900px) {
    display: none;
  }
`;

export const EditorTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
`;

export const EditorForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 560px;
`;

export const Section = styled.fieldset`
  margin: 0;
  padding: 0;
  min-width: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const SectionLegend = styled.legend`
  padding: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${answerText.muted};
`;

export const PersonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`;

export const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  & > * {
    flex: 1 1 140px;
  }
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${colors.flagRed};
`;

export const DangerBtn = styled(PrimaryBtn)`
  background: ${colors.flagRed};
  color: ${colors.cardText};
`;

export const Divider = styled.hr`
  width: 100%;
  margin: 4px 0;
  border: 0;
  border-top: 1px solid ${hairline};
`;
