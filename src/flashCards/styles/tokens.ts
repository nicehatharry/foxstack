/**
 * Design tokens for the flashcards app. One deliberate colour block (the
 * muted-German-flag card: black / red / gold bands) on a quiet cool-grey page;
 * everything else is ink. Text/background pairs meet WCAG AA (>= 4.5:1).
 */
export const colors = {
  page:          '#E4E7EB',
  ink:           '#12151C',
  inkMuted:      '#565E6C',

  // Card: horizontal tricolour, desaturated so it reads as a card, not a flag.
  flagBlack:     '#25262A',
  flagRed:       '#9E3B37',
  flagGold:      '#CBA344',
  cardUnder:     '#17181B', // the "more cards below" layer
  cardText:      '#F4F5F0', // light text on the black band / on the ink button
  cardOutline:   'rgba(244, 245, 240, 0.5)',

  // Translucent ivory panel behind the word. ~88% opaque: the bands still
  // tint through it, but ink text on it stays > 12:1 over any band.
  ivoryOverlay:  'rgba(251, 247, 234, 0.88)',
} as const;

/** Soft answer-side backgrounds. Ink text on all of these is > 10:1. */
const answerToneColors = {
  masculine: '#CFE0F5', // blue
  feminine:  '#F3CFCB', // red
  neuter:    '#D2E7CF', // green
  other:     '#F8DFC0', // orange (non-nouns)
} as const;

/**
 * `commonGender` is a hard-stop split of the masculine/feminine colours above
 * (not a smooth blend — a blended midpoint would be a new, unverified colour;
 * a hard stop keeps every pixel one of the two already-verified tones), left
 * blue / right red to match the reading order of the "der/die" article shown
 * on the card. Built from `answerToneColors` rather than repeating the hex
 * values, so the split can never drift out of sync with the solid tones it's
 * made of. No separate contrast check is needed: ink-on-masculine and
 * ink-on-feminine are already independently verified (context-FlashCards.md
 * §6), and a hard stop never produces a third colour that hasn't been.
 */
export const answerTones = {
  ...answerToneColors,
  commonGender: `linear-gradient(to right, ${answerToneColors.masculine} 50%, ${answerToneColors.feminine} 50%)`,
} as const;

export const answerText = {
  muted:   '#3D4452',
  outline: 'rgba(18, 21, 28, 0.35)',
} as const;

export const fontFamily =
  "'Barlow Semi Condensed', 'DIN Alternate', 'Arial Narrow', system-ui, sans-serif";

export const layout = {
  maxWidth: 480, // keeps desktop viewing sane; phones are narrower anyway
  gutter: 16,
  cardRadius: 28,
  cardPadding: 24,
} as const;
