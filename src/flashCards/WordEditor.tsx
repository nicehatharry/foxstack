import React, { useEffect, useMemo, useState } from 'react';

import { ARTICLE_OPTIONS, PART_OF_SPEECH_OPTIONS } from './decks';
import type { DeckRecord } from './decks';
import {
  PERSON_FIELDS, cardToFormState, emptyFormState, formStateToCard, normalizeFormState, validateFormState,
} from './cardForm';
import type { CardFormState, Tense } from './cardForm';
import type { Flashcard, NounArticle, PartOfSpeech, VerbPersonForms } from './FlashCards.types';

import { BackBtn, Field, FieldRow, FormHint, Select, SubmitBtn, TextInput, AddBtn } from './styles/decks';
import {
  ButtonRow, DangerBtn, Divider, EditorForm, EditorHeader, EditorTitle, ErrorText, MobileOnly,
  PersonGrid, Section, SectionLegend,
} from './styles/manage';

export interface WordEditorProps {
  /** Id the card is saved under: the card's own, or a pre-allocated one for a new word. */
  cardId: string;
  /** null = new word. */
  card: Flashcard | null;
  decks: DeckRecord[];
  currentDeckId: string;
  onSave: (card: Flashcard) => void;
  onDelete: (card: Flashcard) => void;
  onCopy: (card: Flashcard, toDeckId: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  /** Phone only: back to the word list. */
  onClose: () => void;
}

const textProps = { lang: 'de', autoComplete: 'off', autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false } as const;

const PersonFields: React.FC<{
  legend: string;
  value: VerbPersonForms;
  onChange: (key: keyof VerbPersonForms, v: string) => void;
}> = ({ legend, value, onChange }) => (
  <Section>
    <SectionLegend>{legend}</SectionLegend>
    <PersonGrid>
      {PERSON_FIELDS.map((f) => (
        <Field key={f.key}>
          {f.label}
          <TextInput {...textProps} value={value[f.key]} onChange={(e) => onChange(f.key, e.target.value)} />
        </Field>
      ))}
    </PersonGrid>
  </Section>
);

/**
 * Edit one word (or create one). Local state only; nothing reaches the library
 * until Save is pressed — then `onSave` is called once with the complete card.
 * Only the fields relevant to the part of speech are shown. Mount with a `key`
 * per word so state resets on selection change.
 */
export const WordEditor: React.FC<WordEditorProps> = ({
  cardId, card, decks, currentDeckId, onSave, onDelete, onCopy, onDirtyChange, onClose,
}) => {
  const [state, setState] = useState<CardFormState>(() => (card ? cardToFormState(card) : emptyFormState()));
  const [error, setError] = useState<string | null>(null);
  const [copyTo, setCopyTo] = useState('');

  const baseline = useMemo(
    () => JSON.stringify(normalizeFormState(cardId, card ? cardToFormState(card) : emptyFormState())),
    [cardId, card],
  );
  const dirty = JSON.stringify(normalizeFormState(cardId, state)) !== baseline;

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const set = <K extends keyof CardFormState>(key: K, value: CardFormState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  };
  const setPerson = (tense: Tense) => (key: keyof VerbPersonForms, value: string) => {
    setState((s) => ({ ...s, [tense]: { ...s[tense], [key]: value } }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateFormState(state);
    if (problem) {
      setError(problem);
      return;
    }
    const saved = formStateToCard(cardId, state);
    setError(null);
    onSave(saved);
    setState(cardToFormState(saved)); // normalise (trim, drop stale fields) so the form reads clean
  };

  const revert = () => {
    setState(card ? cardToFormState(card) : emptyFormState());
    setError(null);
  };

  const targets = decks.filter((d) => d.id !== currentDeckId);
  const copyTarget = targets.find((d) => d.id === copyTo)?.id ?? targets[0]?.id;
  const pos = state.partOfSpeech;

  return (
    <>
      <EditorHeader>
        <MobileOnly>
          <BackBtn type="button" onClick={onClose} aria-label="Back to word list">‹ Words</BackBtn>
        </MobileOnly>
        <EditorTitle>{card ? 'Edit word' : 'New word'}</EditorTitle>
      </EditorHeader>

      <EditorForm onSubmit={submit} noValidate>
        <Field>
          German
          <TextInput {...textProps} value={state.german} onChange={(e) => set('german', e.target.value)} placeholder="Without the article" />
        </Field>
        <Field>
          English
          <TextInput lang="en" autoComplete="off" value={state.english} onChange={(e) => set('english', e.target.value)} />
        </Field>
        <FieldRow>
          <Field>
            Part of speech
            <Select value={pos} onChange={(e) => set('partOfSpeech', e.target.value as PartOfSpeech)}>
              {PART_OF_SPEECH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          {pos === 'noun' && (
            <Field>
              Article
              <Select value={state.article} onChange={(e) => set('article', e.target.value as NounArticle)}>
                {ARTICLE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            </Field>
          )}
        </FieldRow>

        {pos === 'noun' && (
          <Section>
            <SectionLegend>Noun forms</SectionLegend>
            <Field>
              Plural (without “die”)
              <TextInput {...textProps} value={state.plural} onChange={(e) => set('plural', e.target.value)} placeholder="Handschuhe" />
            </Field>
            <Field>
              Genitive singular (without article)
              <TextInput {...textProps} value={state.genitiveSingular} onChange={(e) => set('genitiveSingular', e.target.value)} placeholder="Handschuhs" />
            </Field>
          </Section>
        )}

        {pos === 'verb' && (
          <>
            <FormHint>Reflexive verb: start the lemma with “sich” and include the pronoun in each form (erinnere mich) and the participle (sich erinnert).</FormHint>
            <PersonFields legend="Präsens" value={state.present} onChange={setPerson('present')} />
            <PersonFields legend="Präteritum" value={state.preterite} onChange={setPerson('preterite')} />
            <Section>
              <SectionLegend>Perfekt (er/sie/es)</SectionLegend>
              <FieldRow>
                <Field>
                  Auxiliary
                  <Select value={state.auxiliary} onChange={(e) => set('auxiliary', e.target.value as 'hat' | 'ist')}>
                    <option value="hat">hat</option>
                    <option value="ist">ist</option>
                  </Select>
                </Field>
                <Field>
                  Participle
                  <TextInput {...textProps} value={state.participle} onChange={(e) => set('participle', e.target.value)} placeholder="gegangen" />
                </Field>
              </FieldRow>
              <Field>
                Governs (optional)
                <TextInput {...textProps} value={state.government} onChange={(e) => set('government', e.target.value)} placeholder="an + Akk." />
              </Field>
            </Section>
          </>
        )}

        {pos === 'adjective' && (
          <Section>
            <SectionLegend>Adjective forms</SectionLegend>
            <Field>
              Comparative
              <TextInput {...textProps} value={state.comparative} onChange={(e) => set('comparative', e.target.value)} placeholder="schöner" />
            </Field>
            <Field>
              Superlative (full, with “am”)
              <TextInput {...textProps} value={state.superlative} onChange={(e) => set('superlative', e.target.value)} placeholder="am schönsten" />
            </Field>
          </Section>
        )}

        {error && <ErrorText role="alert">{error}</ErrorText>}

        <ButtonRow>
          <SubmitBtn type="submit" disabled={!dirty}>{card ? 'Save word' : 'Add word'}</SubmitBtn>
          <AddBtn type="button" disabled={!dirty} onClick={revert}>Revert</AddBtn>
        </ButtonRow>
        {dirty && <FormHint>Unsaved changes.</FormHint>}
      </EditorForm>

      {card && (
        <EditorForm as="div" aria-label="Copy or delete">
          <Divider />
          {targets.length > 0 && (
            <Section>
              <SectionLegend>Copy to another deck</SectionLegend>
              <FieldRow>
                <Field>
                  Deck
                  <Select value={copyTarget} onChange={(e) => setCopyTo(e.target.value)}>
                    {targets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </Field>
                <AddBtn
                  type="button"
                  disabled={dirty || !copyTarget}
                  onClick={() => copyTarget && onCopy(card, copyTarget)}
                >
                  Copy
                </AddBtn>
              </FieldRow>
              {dirty && <FormHint>Save changes before copying. The copy starts as a new word, without progress.</FormHint>}
            </Section>
          )}
          <DangerBtn type="button" onClick={() => onDelete(card)}>Delete word</DangerBtn>
        </EditorForm>
      )}
    </>
  );
};
