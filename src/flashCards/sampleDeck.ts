import type { Flashcard } from './FlashCards.types';

/**
 * Placeholder data until the S3-backed deck loader exists. Deliberately
 * includes long compounds and a multi-word phrase to exercise word sizing.
 */
export const sampleDeckName = 'Everyday German';

export const sampleDeck: Flashcard[] = [
  { id: 'c01', german: 'Handschuh',                 english: 'glove',                  partOfSpeech: 'noun',      article: 'der' },
  { id: 'c02', german: 'Fernweh',                   english: 'longing for faraway places', partOfSpeech: 'noun',  article: 'das' },
  { id: 'c03', german: 'schön',                     english: 'beautiful',              partOfSpeech: 'adjective' },
  { id: 'c04', german: 'erinnern',                  english: 'to remind',              partOfSpeech: 'verb' },
  { id: 'c05', german: 'sich erinnern an',          english: 'to remember',            partOfSpeech: 'phrase' },
  { id: 'c06', german: 'Eichhörnchen',              english: 'squirrel',               partOfSpeech: 'noun',      article: 'das' },
  { id: 'c07', german: 'Rücksichtnahme',            english: 'consideration',          partOfSpeech: 'noun',      article: 'die' },
  { id: 'c08', german: 'Geschwindigkeitsbegrenzung', english: 'speed limit',           partOfSpeech: 'noun',      article: 'die' },
  { id: 'c09', german: 'trotzdem',                  english: 'nevertheless',           partOfSpeech: 'adverb' },
  { id: 'c10', german: 'Feierabend',                english: 'end of the workday',     partOfSpeech: 'noun',      article: 'der' },
];
