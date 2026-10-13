import type { Flashcard, NounArticle, PartOfSpeech, VerbPersonForms } from './FlashCards.types';

/**
 * Flat, all-strings editing model for the Manage words form. Holds the fields
 * of EVERY part of speech at once so toggling the part of speech doesn't lose
 * typing; `formStateToCard` reads only the fields relevant to `partOfSpeech`.
 * Pure — no React, no I/O.
 */
export interface CardFormState {
  german: string;
  english: string;
  partOfSpeech: PartOfSpeech;
  article: NounArticle;
  plural: string;
  genitiveSingular: string;
  present: VerbPersonForms;
  preterite: VerbPersonForms;
  auxiliary: 'hat' | 'ist';
  participle: string;
  government: string;
  comparative: string;
  superlative: string;
}

export type Tense = 'present' | 'preterite';

/** Input order for a person grid rendered two-up: ich|wir, du|ihr, er/sie/es|sie/Sie (matches WordForms.tsx). */
export const PERSON_FIELDS: ReadonlyArray<{ key: keyof VerbPersonForms; label: string }> = [
  { key: 'ich', label: 'ich' },
  { key: 'wir', label: 'wir' },
  { key: 'du', label: 'du' },
  { key: 'ihr', label: 'ihr' },
  { key: 'erSieEs', label: 'er/sie/es' },
  { key: 'sieSie', label: 'sie/Sie' },
];

const emptyPerson = (): VerbPersonForms => ({ ich: '', du: '', erSieEs: '', wir: '', ihr: '', sieSie: '' });

const trimPerson = (p: VerbPersonForms): VerbPersonForms => ({
  ich: p.ich.trim(),
  du: p.du.trim(),
  erSieEs: p.erSieEs.trim(),
  wir: p.wir.trim(),
  ihr: p.ihr.trim(),
  sieSie: p.sieSie.trim(),
});

const personFilled = (p: VerbPersonForms): boolean => Object.values(p).some((v) => v.trim() !== '');

export const emptyFormState = (): CardFormState => ({
  german: '',
  english: '',
  partOfSpeech: 'noun',
  article: 'der',
  plural: '',
  genitiveSingular: '',
  present: emptyPerson(),
  preterite: emptyPerson(),
  auxiliary: 'hat',
  participle: '',
  government: '',
  comparative: '',
  superlative: '',
});

export function cardToFormState(card: Flashcard): CardFormState {
  const s: CardFormState = { ...emptyFormState(), german: card.german, english: card.english, partOfSpeech: card.partOfSpeech };
  switch (card.partOfSpeech) {
    case 'noun':
      s.article = card.article;
      s.plural = card.forms?.plural ?? '';
      s.genitiveSingular = card.forms?.genitiveSingular ?? '';
      break;
    case 'verb':
      if (card.forms) {
        s.present = { ...card.forms.present };
        s.preterite = { ...card.forms.preterite };
        s.auxiliary = card.forms.perfect.auxiliary;
        s.participle = card.forms.perfect.participle;
        s.government = card.forms.government ?? '';
      }
      break;
    case 'adjective':
      s.comparative = card.forms?.comparative ?? '';
      s.superlative = card.forms?.superlative ?? '';
      break;
    default:
      break;
  }
  return s;
}

/**
 * State → card. Trims everything; omits `forms` entirely when none of the
 * part-of-speech's form fields are filled. Tolerates an incomplete verb (blank
 * strings) so dirty-checking works mid-edit — gate saving with `validateFormState`.
 */
export function formStateToCard(id: string, s: CardFormState): Flashcard {
  const base = { id, german: s.german.trim(), english: s.english.trim() };
  switch (s.partOfSpeech) {
    case 'noun': {
      const plural = s.plural.trim();
      const genitiveSingular = s.genitiveSingular.trim();
      return {
        ...base,
        partOfSpeech: 'noun',
        article: s.article,
        ...(plural || genitiveSingular
          ? { forms: { ...(plural ? { plural } : {}), ...(genitiveSingular ? { genitiveSingular } : {}) } }
          : {}),
      };
    }
    case 'verb': {
      const present = trimPerson(s.present);
      const preterite = trimPerson(s.preterite);
      const participle = s.participle.trim();
      const government = s.government.trim();
      if (!personFilled(present) && !personFilled(preterite) && !participle && !government) {
        return { ...base, partOfSpeech: 'verb' };
      }
      return {
        ...base,
        partOfSpeech: 'verb',
        forms: {
          present,
          preterite,
          perfect: { auxiliary: s.auxiliary, participle },
          ...(government ? { government } : {}),
        },
      };
    }
    case 'adjective': {
      const comparative = s.comparative.trim();
      const superlative = s.superlative.trim();
      return {
        ...base,
        partOfSpeech: 'adjective',
        ...(comparative || superlative
          ? { forms: { ...(comparative ? { comparative } : {}), ...(superlative ? { superlative } : {}) } }
          : {}),
      };
    }
    case 'adverb':
      return { ...base, partOfSpeech: 'adverb' };
    case 'phrase':
      return { ...base, partOfSpeech: 'phrase' };
  }
}

/** Canonical form for dirty comparison: drops fields irrelevant to the part of speech and trims. */
export const normalizeFormState = (id: string, s: CardFormState): CardFormState =>
  cardToFormState(formStateToCard(id, s));

/** First blocking problem, or null. Verb forms are all-or-nothing (VerbForms has no optional tenses); government stays optional. */
export function validateFormState(s: CardFormState): string | null {
  if (!s.german.trim()) return 'German is required.';
  if (!s.english.trim()) return 'English is required.';
  if (s.partOfSpeech === 'verb') {
    const required = [
      ...PERSON_FIELDS.map((f) => s.present[f.key]),
      ...PERSON_FIELDS.map((f) => s.preterite[f.key]),
      s.participle,
    ];
    const filled = required.filter((v) => v.trim() !== '').length;
    if ((filled > 0 || s.government.trim() !== '') && filled < required.length) {
      return 'Fill in every conjugation form and the participle, or clear them all.';
    }
  }
  return null;
}
