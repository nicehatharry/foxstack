import type { Flashcard } from './FlashCards.types';

/**
 * Placeholder data until the S3-backed deck loader exists. Deliberately
 * includes long compounds and a multi-word entry to exercise word sizing.
 *
 * `forms` are filled in for most nouns/verbs/adjectives (2026-09-24 decision:
 * forms are authored, reviewed strings — never generated at runtime — see
 * WordForms.tsx and context-FlashCards.md §5). c07 and c09 deliberately have
 * none, to exercise the "no forms panel at all" path; c02 deliberately omits
 * `plural` (Fernweh has none) to exercise the "some fields missing" path.
 */
export const sampleDeckName = 'Everyday German';

export const sampleDeck: Flashcard[] = [
  {
    id: 'c01', german: 'Handschuh', english: 'glove', partOfSpeech: 'noun', article: 'der',
    forms: { plural: 'Handschuhe', genitiveSingular: 'Handschuhs' },
  },
  {
    id: 'c02', german: 'Fernweh', english: 'longing for faraway places', partOfSpeech: 'noun', article: 'das',
    forms: { genitiveSingular: 'Fernwehs' }, // no plural — it's a mass/abstract noun
  },
  {
    id: 'c03', german: 'schön', english: 'beautiful', partOfSpeech: 'adjective',
    forms: { comparative: 'schöner', superlative: 'am schönsten' },
  },
  {
    id: 'c04', german: 'erinnern', english: 'to remind', partOfSpeech: 'verb',
    forms: {
      present: { ich: 'erinnere', du: 'erinnerst', erSieEs: 'erinnert', wir: 'erinnern', ihr: 'erinnert', sieSie: 'erinnern' },
      preterite: { ich: 'erinnerte', du: 'erinnertest', erSieEs: 'erinnerte', wir: 'erinnerten', ihr: 'erinnertet', sieSie: 'erinnerten' },
      perfect: { auxiliary: 'hat', participle: 'erinnert' },
      government: 'jdn. an etw. (Akk.)', // "to remind someone of something"
    },
  },
  {
    // Reflexive: lemma carries "sich" (see FlashcardBase.german); each person form below
    // includes its own reflexive pronoun directly (see VerbPersonForms), and the Perfekt
    // participle includes "sich" too, since that form isn't conjugated by person.
    // Was mistagged 'phrase' as "sich erinnern an" — corrected 2026-09-24 (context-FlashCards.md §10).
    id: 'c05', german: 'sich erinnern', english: 'to remember', partOfSpeech: 'verb',
    forms: {
      present: {
        ich: 'erinnere mich', du: 'erinnerst dich', erSieEs: 'erinnert sich',
        wir: 'erinnern uns', ihr: 'erinnert euch', sieSie: 'erinnern sich',
      },
      preterite: {
        ich: 'erinnerte mich', du: 'erinnertest dich', erSieEs: 'erinnerte sich',
        wir: 'erinnerten uns', ihr: 'erinnertet euch', sieSie: 'erinnerten sich',
      },
      perfect: { auxiliary: 'hat', participle: 'sich erinnert' },
      government: 'an + Akk.', // "sich erinnern an" — remember (something)
    },
  },
  {
    id: 'c06', german: 'Eichhörnchen', english: 'squirrel', partOfSpeech: 'noun', article: 'das',
    forms: { plural: 'Eichhörnchen', genitiveSingular: 'Eichhörnchens' }, // -chen diminutives: plural = singular
  },
  {
    id: 'c07', german: 'Rücksichtnahme', english: 'consideration', partOfSpeech: 'noun', article: 'die',
    // No forms recorded: an abstract noun with no conventional plural and an
    // unremarkable genitive (feminine nouns don't inflect in the genitive singular).
  },
  {
    id: 'c08', german: 'Geschwindigkeitsbegrenzung', english: 'speed limit', partOfSpeech: 'noun', article: 'die',
    forms: { plural: 'Geschwindigkeitsbegrenzungen' }, // genitive singular = nominative for feminine nouns; not worth calling out
  },
  { id: 'c09', german: 'trotzdem', english: 'nevertheless', partOfSpeech: 'adverb' },
  {
    id: 'c10', german: 'Feierabend', english: 'end of the workday', partOfSpeech: 'noun', article: 'der',
    forms: { plural: 'Feierabende', genitiveSingular: 'Feierabends' },
  },
];
