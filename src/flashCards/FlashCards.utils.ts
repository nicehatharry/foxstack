import { WORD_SIZE_TIERS } from './FlashCards.constants';
import type { AnswerTone, Article, Flashcard, NounCard, NounForms } from './FlashCards.types';

/**
 * Picks a font size (px) for the prompt word so it fits without mid-word
 * overflow. Pure.
 *
 * Effective length is the longer of (a) the longest single token — a compound
 * can't wrap between words, so it sets the width floor — and (b) half the
 * total length, so multi-word entries (a reflexive verb's "sich erinnern")
 * that wrap onto several lines don't stay at display size.
 */
export function getWordFontSize(word: string): number {
  const text = word.normalize('NFC').trim();
  const longestToken = Math.max(0, ...text.split(/\s+/).map(t => t.length));
  const effectiveLength = Math.max(longestToken, Math.ceil(text.length / 2));
  const tier = WORD_SIZE_TIERS.find(t => effectiveLength <= t.maxLength);
  return (tier ?? WORD_SIZE_TIERS[WORD_SIZE_TIERS.length - 1]).fontSize;
}

const ARTICLE_TONE: Record<Article, AnswerTone> = {
  der: 'masculine',
  die: 'feminine',
  das: 'neuter',
};

/** Answer-side background: noun gender if known, otherwise 'other'. Pure. */
export function getAnswerTone(card: Flashcard): AnswerTone {
  if (card.partOfSpeech !== 'noun') return 'other';
  return ARTICLE_TONE[card.article];
}

/**
 * The card's article if it's a noun, otherwise undefined. Centralises the
 * discriminated-union narrowing so callers (CardAnswer, CardPrompt) never
 * touch `.article` on a bare `Flashcard`. Pure.
 */
export function getArticle(card: Flashcard): Article | undefined {
  return card.partOfSpeech === 'noun' ? card.article : undefined;
}

/**
 * Whether the answer side should offer a forms panel for this card at all —
 * i.e. whether tapping the German word does anything. False for a noun/verb/
 * adjective whose author hasn't filled in `forms` yet, and always false for
 * adverbs and phrases (no forms modelled for them — see FlashCards.types.ts).
 * Pure.
 */
export function hasForms(card: Flashcard): boolean {
  switch (card.partOfSpeech) {
    case 'noun': return Boolean(card.forms?.plural || card.forms?.genitiveSingular);
    case 'verb': return Boolean(card.forms);
    case 'adjective': return Boolean(card.forms?.comparative || card.forms?.superlative);
    default: return false;
  }
}

/** All German plurals take "die", regardless of the singular's gender. */
const PLURAL_ARTICLE = 'die';

/** Genitive singular takes "des" for der/das nouns, "der" for die nouns — mechanical, not stored per-word. */
const GENITIVE_ARTICLE: Record<Article, 'des' | 'der'> = { der: 'des', das: 'des', die: 'der' };

/** "die Handschuhe", or undefined if no plural is recorded. Pure. */
export function getDisplayPlural(forms: NounForms | undefined): string | undefined {
  return forms?.plural ? `${PLURAL_ARTICLE} ${forms.plural}` : undefined;
}

/** "des Handschuhs" / "der Rücksichtnahme", or undefined if no genitive is recorded. Pure. */
export function getDisplayGenitive(card: NounCard): string | undefined {
  return card.forms?.genitiveSingular ? `${GENITIVE_ARTICLE[card.article]} ${card.forms.genitiveSingular}` : undefined;
}
