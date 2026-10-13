import { describe, expect, it } from 'vitest';

import { cardToFormState, emptyFormState, formStateToCard, normalizeFormState, validateFormState } from '../cardForm';
import type { Flashcard } from '../FlashCards.types';

const person = (s: string) => ({ ich: `${s}1`, du: `${s}2`, erSieEs: `${s}3`, wir: `${s}4`, ihr: `${s}5`, sieSie: `${s}6` });

const verb: Flashcard = {
  id: 'c01', german: 'gehen', english: 'to go', partOfSpeech: 'verb',
  forms: { present: person('p'), preterite: person('t'), perfect: { auxiliary: 'ist', participle: 'gegangen' }, government: 'zu + Dat.' },
};

describe('cardForm', () => {
  it('round-trips a verb with forms', () => {
    expect(formStateToCard('c01', cardToFormState(verb))).toEqual(verb);
  });

  it('round-trips a noun with forms, and a bare noun stays bare', () => {
    const noun: Flashcard = { id: 'c02', german: 'Hund', english: 'dog', partOfSpeech: 'noun', article: 'der', forms: { plural: 'Hunde' } };
    expect(formStateToCard('c02', cardToFormState(noun))).toEqual(noun);
    const bare: Flashcard = { id: 'c02', german: 'Hund', english: 'dog', partOfSpeech: 'noun', article: 'der' };
    expect(formStateToCard('c02', cardToFormState(bare))).toEqual(bare);
  });

  it('omits adjective forms when blank, keeps a lone comparative', () => {
    const s = { ...emptyFormState(), german: 'schön', english: 'beautiful', partOfSpeech: 'adjective' as const };
    expect(formStateToCard('c03', s)).toEqual({ id: 'c03', german: 'schön', english: 'beautiful', partOfSpeech: 'adjective' });
    expect(formStateToCard('c03', { ...s, comparative: ' schöner ' })).toMatchObject({ forms: { comparative: 'schöner' } });
  });

  it('drops fields of other parts of speech on save', () => {
    const s = { ...cardToFormState(verb), partOfSpeech: 'adverb' as const };
    expect(formStateToCard('c01', s)).toEqual({ id: 'c01', german: 'gehen', english: 'to go', partOfSpeech: 'adverb' });
  });

  it('validates required words and all-or-nothing verb forms', () => {
    const s = { ...emptyFormState(), german: 'gehen', english: 'to go', partOfSpeech: 'verb' as const };
    expect(validateFormState({ ...s, german: ' ' })).toMatch(/German/);
    expect(validateFormState(s)).toBeNull();
    expect(validateFormState({ ...s, participle: 'gegangen' })).toMatch(/every conjugation/);
    expect(validateFormState({ ...s, government: 'an + Akk.' })).toMatch(/every conjugation/);
    expect(validateFormState(cardToFormState(verb))).toBeNull();
  });

  it('normalize ignores stale and untrimmed fields', () => {
    const s = { ...emptyFormState(), german: ' Hund ', english: 'dog', plural: '  ', auxiliary: 'ist' as const };
    expect(normalizeFormState('c01', s)).toEqual(normalizeFormState('c01', { ...s, german: 'Hund', auxiliary: 'hat' }));
  });
});
