import { WORD_SIZE_TIERS } from './FlashCards.constants';

/**
 * Picks a font size (px) for the prompt word so it fits without mid-word
 * overflow. Pure.
 *
 * Effective length is the longer of (a) the longest single token — a compound
 * can't wrap between words, so it sets the width floor — and (b) half the
 * total length, so multi-word phrases ("sich erinnern an") that wrap onto
 * several lines don't stay at display size.
 */
export function getWordFontSize(word: string): number {
  const text = word.normalize('NFC').trim();
  const longestToken = Math.max(0, ...text.split(/\s+/).map(t => t.length));
  const effectiveLength = Math.max(longestToken, Math.ceil(text.length / 2));
  const tier = WORD_SIZE_TIERS.find(t => effectiveLength <= t.maxLength);
  return (tier ?? WORD_SIZE_TIERS[WORD_SIZE_TIERS.length - 1]).fontSize;
}
