import styled from 'styled-components';
import { answerText, colors } from './tokens';

/**
 * Scrollable container for a card's forms panel (WordForms.tsx), replacing
 * Translation in AnswerBody once expanded. `max-height: 100%` bounds it to
 * whatever space AnswerBody has left (see the min-height: 0 note on
 * AnswerBody in styles/card.ts) so a long verb table scrolls internally
 * instead of being clipped by Face's `overflow: hidden`.
 *
 * Not verified on a device — jsdom has no layout, so the actual fit of a full
 * verb table inside the card hasn't been seen. See context-FlashCards.md §9.
 */
export const FormsScroll = styled.div`
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-right: 4px; /* keeps a desktop scrollbar off the text */
`;

/** "Präsens" / "Präteritum" — small caps label above each conjugation table. First one has no top margin. */
export const FormsSectionTitle = styled.h3`
  margin: 12px 0 4px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${answerText.muted};

  &:first-child {
    margin-top: 0;
  }
`;

/** A real <table> for AT — pronoun/label as a row header, form as the value. */
export const FormsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const FormsLabel = styled.th`
  padding: 3px 10px 3px 0;
  text-align: left;
  font-weight: 500;
  font-size: 15px;
  color: ${answerText.muted};
  white-space: nowrap;
`;

/**
 * Same as FormsLabel, with extra left padding — used for the second person
 * label in a two-column person table (e.g. "wir", sitting to the right of
 * "ich"'s value) so the two pairs read as separate groups rather than four
 * undifferentiated columns. See PersonTable in WordForms.tsx.
 */
export const FormsLabelSecond = styled(FormsLabel)`
  padding-left: 20px;
`;

/**
 * No `width` set deliberately: a single-pair table (noun/adjective, one
 * FormsValue per row) relies on table auto-layout giving its one flexible
 * column the leftover space after the nowrap label column; a two-pair verb
 * table (two FormsValue per row) needs that same leftover space split
 * between both of them. An explicit width here would fight the second case.
 *
 * `overflow-wrap`/`hyphens` guard against the narrower two-column verb
 * layout: a reflexive preterite like "erinnertest dich" (17 chars) gets
 * roughly half the width a single-column value did (see
 * context-FlashCards.md §6). Two words wrap at the space by default either
 * way; this only matters for a single long token with nowhere to break —
 * none exist in the sample deck today, but nothing stops a future compound
 * verb from producing one, and the cost of guarding against it now is zero.
 */
export const FormsValue = styled.td`
  padding: 3px 0;
  text-align: left;
  font-weight: 700;
  font-size: 16px;
  color: ${colors.ink};
  overflow-wrap: break-word;
  hyphens: auto;
`;

/** Shown in place of a form that hasn't been recorded (e.g. a noun with no plural). Never a blank cell. */
export const FormsEmpty = styled.span`
  font-weight: 500;
  font-style: italic;
  color: ${answerText.muted};
`;

/** Perfekt tense (single 3rd-person-singular form, not a table) and the government note. */
export const FormsNote = styled.p`
  margin: 10px 0 0;
  font-size: 15px;
  color: ${answerText.muted};

  strong {
    font-weight: 700;
    color: ${colors.ink};
  }
`;
