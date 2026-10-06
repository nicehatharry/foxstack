import React, { useRef, useState } from 'react';

import { ARTICLE_OPTIONS, PART_OF_SPEECH_OPTIONS } from './decks';
import type { CardDraft } from './decks';
import type { NounArticle, PartOfSpeech } from './FlashCards.types';

import { Field, TextInput, Select, FieldRow, AddBtn } from './styles/decks';
import { CompactCardForm } from './styles/addWord';

export interface CardDraftFormProps {
  onSubmit: (draft: CardDraft) => void;
  submitLabel: string;
  /**
   * Focus the German field on mount via React's `autoFocus`, which focuses during
   * the commit — synchronously inside the opening tap. iOS Safari only raises the
   * keyboard for focus() inside a user gesture, which a useEffect may miss.
   */
  autoFocus?: boolean;
}

/**
 * The one-card entry form, shared by DeckCreator (builds a list) and
 * AddWordSheet (adds to an existing deck). Cards carry no `forms` (context §2).
 */
export const CardDraftForm: React.FC<CardDraftFormProps> = ({ onSubmit, submitLabel, autoFocus }) => {
  const [german, setGerman] = useState('');
  const [english, setEnglish] = useState('');
  const [pos, setPos] = useState<PartOfSpeech>('noun');
  const [article, setArticle] = useState<NounArticle>('der');
  const germanRef = useRef<HTMLInputElement>(null);

  const canAdd = german.trim() !== '' && english.trim() !== '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) return;
    onSubmit(
      pos === 'noun'
        ? { german, english, partOfSpeech: 'noun', article }
        : { german, english, partOfSpeech: pos },
    );
    // Keep part of speech / article so a run of similar words is quick to enter.
    setGerman('');
    setEnglish('');
    germanRef.current?.focus();
  };

  return (
    <CompactCardForm onSubmit={submit}>
      <Field>
        German
        <TextInput
          ref={germanRef}
          autoFocus={autoFocus}
          value={german}
          onChange={(e) => setGerman(e.target.value)}
          lang="de"
          autoComplete="off"
          autoCapitalize="off"
          placeholder="Without the article"
        />
      </Field>
      <FieldRow>
        <Field>
          Part of speech
          <Select value={pos} onChange={(e) => setPos(e.target.value as PartOfSpeech)}>
            {PART_OF_SPEECH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        {pos === 'noun' && (
          <Field>
            Article
            <Select value={article} onChange={(e) => setArticle(e.target.value as NounArticle)}>
              {ARTICLE_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </Field>
        )}
      </FieldRow>
      <Field>
        English
        <TextInput
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          lang="en"
          autoComplete="off"
        />
      </Field>
      <AddBtn type="submit" disabled={!canAdd}>{submitLabel}</AddBtn>
    </CompactCardForm>
  );
};
