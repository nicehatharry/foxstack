import React from 'react';
import type { Flashcard, VerbPersonForms } from './FlashCards.types';
import { getDisplayGenitive, getDisplayPlural } from './FlashCards.utils';
import {
  FormsEmpty, FormsLabel, FormsLabelSecond, FormsNote, FormsScroll, FormsSectionTitle, FormsTable, FormsValue,
} from './styles/forms';

interface WordFormsProps {
  /** Links this panel to its toggle button via aria-controls; see CardAnswer.tsx. */
  id: string;
  card: Flashcard;
}

type PersonCell = { label: string; key: keyof VerbPersonForms };

/**
 * Row pairing for the two-column Präsens/Präteritum layout: each singular
 * person paired with its plural counterpart (ich/wir, du/ihr, er,sie,es/
 * sie,Sie) — the standard arrangement in German textbooks, and a better use
 * of the card's width than one column of six rows (2026-09-25 decision).
 * Fixed — only the values are data.
 */
const PERSON_ROW_PAIRS: ReadonlyArray<readonly [PersonCell, PersonCell]> = [
  [{ label: 'ich', key: 'ich' }, { label: 'wir', key: 'wir' }],
  [{ label: 'du', key: 'du' }, { label: 'ihr', key: 'ihr' }],
  [{ label: 'er/sie/es', key: 'erSieEs' }, { label: 'sie/Sie', key: 'sieSie' }],
];

/**
 * Renders one tense as a 3-row, 4-column table (label, value, label, value).
 *
 * A `<tr>` with two `<th scope="row">` cells is ambiguous for assistive tech:
 * the browser's default header-association algorithm can attribute a data
 * cell to every preceding row-header in its row, not just the nearest one —
 * so the "wir" value could get announced as belonging to both "ich" and
 * "wir". Explicit `id`/`headers` (the WCAG technique for exactly this case)
 * removes the ambiguity: each value is wired to its own label only.
 *
 * `idPrefix` must be unique per rendered table (Präsens and Präteritum share
 * the same person keys, so they'd collide without it) — see the `${id}-...`
 * prefixes where this is called below.
 */
const PersonTable: React.FC<{ forms: VerbPersonForms; idPrefix: string }> = ({ forms, idPrefix }) => (
  <FormsTable>
    <tbody>
      {PERSON_ROW_PAIRS.map(([left, right]) => {
        const leftId = `${idPrefix}-${left.key}`;
        const rightId = `${idPrefix}-${right.key}`;
        return (
          <tr key={left.key}>
            <FormsLabel scope="row" id={leftId}>{left.label}</FormsLabel>
            <FormsValue headers={leftId}>{forms[left.key]}</FormsValue>
            <FormsLabelSecond scope="row" id={rightId}>{right.label}</FormsLabelSecond>
            <FormsValue headers={rightId}>{forms[right.key]}</FormsValue>
          </tr>
        );
      })}
    </tbody>
  </FormsTable>
);

/**
 * Answer-side forms panel: plural/genitive for a noun, Präsens/Präteritum/
 * Perfekt (+ government, if recorded) for a verb, comparative/superlative for
 * an adjective. Renders in place of Translation inside AnswerBody when the
 * learner taps the German word (see CardAnswer.tsx); tapping again returns to
 * the translation. Peeking here never affects scheduling — it's pure UI state
 * that resets for free when FlipCard remounts on the next card (see the key
 * discipline documented there).
 *
 * Only ever rendered when hasForms(card) is true (CardAnswer's gate) — the
 * `default: return null` below is defensive, not an expected path, since
 * adverbs and phrases have no forms modelled yet (FlashCards.types.ts).
 */
export const WordForms: React.FC<WordFormsProps> = ({ id, card }) => {
  switch (card.partOfSpeech) {
    case 'noun': {
      const plural = getDisplayPlural(card.forms);
      const genitive = getDisplayGenitive(card);
      return (
        <FormsScroll id={id} lang="de">
          <FormsTable>
            <tbody>
              <tr>
                <FormsLabel scope="row">Plural</FormsLabel>
                <FormsValue>{plural ?? <FormsEmpty>No plural form</FormsEmpty>}</FormsValue>
              </tr>
              <tr>
                <FormsLabel scope="row">Genitive</FormsLabel>
                <FormsValue>{genitive ?? <FormsEmpty>No genitive form recorded</FormsEmpty>}</FormsValue>
              </tr>
            </tbody>
          </FormsTable>
        </FormsScroll>
      );
    }

    case 'verb': {
      const { forms } = card;
      if (!forms) return null;
      return (
        <FormsScroll id={id} lang="de">
          <FormsSectionTitle>Präsens</FormsSectionTitle>
          <PersonTable forms={forms.present} idPrefix={`${id}-present`} />
          <FormsSectionTitle>Präteritum</FormsSectionTitle>
          <PersonTable forms={forms.preterite} idPrefix={`${id}-preterite`} />
          <FormsNote>
            Perfekt: <strong>{forms.perfect.auxiliary} {forms.perfect.participle}</strong>
          </FormsNote>
          {forms.government && <FormsNote>Governs: {forms.government}</FormsNote>}
        </FormsScroll>
      );
    }

    case 'adjective': {
      const { forms } = card;
      return (
        <FormsScroll id={id} lang="de">
          <FormsTable>
            <tbody>
              <tr>
                <FormsLabel scope="row">Comparative</FormsLabel>
                <FormsValue>{forms?.comparative ?? <FormsEmpty>No comparative form</FormsEmpty>}</FormsValue>
              </tr>
              <tr>
                <FormsLabel scope="row">Superlative</FormsLabel>
                <FormsValue>{forms?.superlative ?? <FormsEmpty>No superlative form</FormsEmpty>}</FormsValue>
              </tr>
            </tbody>
          </FormsTable>
        </FormsScroll>
      );
    }

    default:
      return null;
  }
};
