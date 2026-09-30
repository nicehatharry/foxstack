import { describe, it, expect } from 'vitest';
import {
  getAnswerTone, getArticle, getDisplayGenitive, getDisplayPlural, getWordFontSize, hasForms,
} from '../FlashCards.utils';
import { WORD_SIZE_TIERS } from '../FlashCards.constants';
import type { AdjectiveCard, NounCard, VerbCard } from '../FlashCards.types';

const noun = (over: Partial<NounCard> = {}): NounCard =>
  ({ id: 'n', german: 'Baum', english: 'tree', partOfSpeech: 'noun', article: 'der', ...over });
const verb = (over: Partial<VerbCard> = {}): VerbCard =>
  ({ id: 'v', german: 'gehen', english: 'to go', partOfSpeech: 'verb', ...over });
const adjective = (over: Partial<AdjectiveCard> = {}): AdjectiveCard =>
  ({ id: 'a', german: 'gut', english: 'good', partOfSpeech: 'adjective', ...over });

const personForms = {
  ich: 'x', du: 'x', erSieEs: 'x', wir: 'x', ihr: 'x', sieSie: 'x',
};

describe('getWordFontSize', () => {
  it('one boundary case per tier: maxLength chars fits, maxLength+1 drops a size', () => {
    for (let i = 0; i < WORD_SIZE_TIERS.length - 1; i++) {
      const { maxLength, fontSize } = WORD_SIZE_TIERS[i];
      expect(getWordFontSize('a'.repeat(maxLength))).toBe(fontSize);
      expect(getWordFontSize('a'.repeat(maxLength + 1))).toBe(WORD_SIZE_TIERS[i + 1].fontSize);
    }
  });
  it('a multi-word entry is sized by the longer of its longest token and half its total length', () => {
    // "sich erinnern": longest token "erinnern" = 8 chars -> tier 3 (52px).
    // Total length incl. the space = 13 -> half = 7 (rounded up), which is under 8, so the token wins here.
    expect(getWordFontSize('sich erinnern')).toBe(52);
  });
  it('total length (not just the longest token) can drive the size down, for many short tokens', () => {
    // 20 single-letter tokens: longest token is 1, but total length incl. spaces (39) -> half = 20,
    // which lands past every tier boundary -> the smallest size, not the largest.
    const manyShortTokens = Array(20).fill('a').join(' ');
    expect(getWordFontSize(manyShortTokens)).toBe(WORD_SIZE_TIERS[WORD_SIZE_TIERS.length - 1].fontSize);
  });
  it('trims surrounding whitespace and is insensitive to it otherwise', () => {
    expect(getWordFontSize('  Baum  ')).toBe(getWordFontSize('Baum'));
  });
  it('the longest tier is the floor for anything longer, not an error', () => {
    expect(getWordFontSize('a'.repeat(500))).toBe(WORD_SIZE_TIERS[WORD_SIZE_TIERS.length - 1].fontSize);
  });
  it('empty string does not throw and returns the largest size', () => {
    expect(getWordFontSize('')).toBe(WORD_SIZE_TIERS[0].fontSize);
  });
});

describe('getAnswerTone', () => {
  it('maps each fixed article to its tone', () => {
    expect(getAnswerTone(noun({ article: 'der' }))).toBe('masculine');
    expect(getAnswerTone(noun({ article: 'die' }))).toBe('feminine');
    expect(getAnswerTone(noun({ article: 'das' }))).toBe('neuter');
  });
  it("a common-gender ('der/die') noun is 'commonGender', never masculine/feminine/neuter", () => {
    expect(getAnswerTone(noun({ article: 'der/die' }))).toBe('commonGender');
  });
  it("is 'other' for every non-noun part of speech", () => {
    expect(getAnswerTone(verb())).toBe('other');
    expect(getAnswerTone(adjective())).toBe('other');
    expect(getAnswerTone({ id: 'x', german: 'x', english: 'x', partOfSpeech: 'adverb' })).toBe('other');
    expect(getAnswerTone({ id: 'x', german: 'x', english: 'x', partOfSpeech: 'phrase' })).toBe('other');
  });
});

describe('getArticle', () => {
  it('returns the article for a noun, undefined for anything else', () => {
    expect(getArticle(noun({ article: 'die' }))).toBe('die');
    expect(getArticle(verb())).toBeUndefined();
    expect(getArticle(adjective())).toBeUndefined();
  });
  it('returns the literal "der/die" for a common-gender noun, unmodified', () => {
    expect(getArticle(noun({ article: 'der/die' }))).toBe('der/die');
  });
  it('goes by partOfSpeech, not by whether an `article` field happens to be present', () => {
    // A verb/adjective can never legitimately carry `article` (see FlashCards.types.ts),
    // but bad data (a bug upstream, a hand-edited words.json) could still smuggle one in.
    // getArticle must not just check `.article` — it decides by the discriminant.
    const badVerb = { ...verb(), article: 'der' } as unknown as VerbCard;
    expect(getArticle(badVerb)).toBeUndefined();
  });
});

describe('hasForms', () => {
  it('noun: true if plural OR genitive is recorded, false if neither or forms is absent', () => {
    expect(hasForms(noun({ forms: { plural: 'Bäume' } }))).toBe(true);
    expect(hasForms(noun({ forms: { genitiveSingular: 'Baums' } }))).toBe(true);
    expect(hasForms(noun({ forms: {} }))).toBe(false);
    expect(hasForms(noun({ forms: undefined }))).toBe(false);
  });
  it('is unaffected by article value — a common-gender noun follows the same rule as any other noun', () => {
    expect(hasForms(noun({ article: 'der/die', forms: { plural: 'Angestellten' } }))).toBe(true);
    expect(hasForms(noun({ article: 'der/die', forms: {} }))).toBe(false);
  });
  it('verb: true iff forms is present at all', () => {
    expect(hasForms(verb({ forms: { present: personForms, preterite: personForms, perfect: { auxiliary: 'ist', participle: 'gegangen' } } }))).toBe(true);
    expect(hasForms(verb({ forms: undefined }))).toBe(false);
  });
  it('adjective: true if comparative OR superlative is recorded', () => {
    expect(hasForms(adjective({ forms: { comparative: 'besser' } }))).toBe(true);
    expect(hasForms(adjective({ forms: { superlative: 'am besten' } }))).toBe(true);
    expect(hasForms(adjective({ forms: {} }))).toBe(false);
  });
  it('adverb and phrase are always false, even if a forms-shaped object were smuggled onto them', () => {
    expect(hasForms({ id: 'x', german: 'x', english: 'x', partOfSpeech: 'adverb' })).toBe(false);
    expect(hasForms({ id: 'x', german: 'x', english: 'x', partOfSpeech: 'phrase' })).toBe(false);
  });
});

describe('getDisplayPlural', () => {
  it('prefixes "die" — the plural article regardless of the singular gender', () => {
    expect(getDisplayPlural({ plural: 'Handschuhe' })).toBe('die Handschuhe');
  });
  it('undefined when no plural is recorded, including forms itself being undefined', () => {
    expect(getDisplayPlural({})).toBeUndefined();
    expect(getDisplayPlural(undefined)).toBeUndefined();
  });
});

describe('getDisplayGenitive', () => {
  it('"des" for der/das nouns, "der" for die nouns', () => {
    expect(getDisplayGenitive(noun({ article: 'der', forms: { genitiveSingular: 'Baums' } }))).toBe('des Baums');
    expect(getDisplayGenitive(noun({ article: 'das', forms: { genitiveSingular: 'Fernwehs' } }))).toBe('des Fernwehs');
    expect(getDisplayGenitive(noun({ article: 'die', forms: { genitiveSingular: 'Katze' } }))).toBe('der Katze');
  });
  it('shows both articles for a common-gender noun ("des/der"), from a single stored stem', () => {
    expect(getDisplayGenitive(noun({ article: 'der/die', forms: { genitiveSingular: 'Angestellten' } })))
      .toBe('des/der Angestellten');
  });
  it('undefined when no genitive is recorded', () => {
    expect(getDisplayGenitive(noun({ forms: {} }))).toBeUndefined();
    expect(getDisplayGenitive(noun({ forms: undefined }))).toBeUndefined();
    expect(getDisplayGenitive(noun({ article: 'der/die', forms: {} }))).toBeUndefined();
  });
});
