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
  ivoryOverlay:  'rgba(251, 247, 234, 0.55)',
} as const;

export const fontFamily =
  "'Barlow Semi Condensed', 'DIN Alternate', 'Arial Narrow', system-ui, sans-serif";

export const layout = {
  maxWidth: 480, // keeps desktop viewing sane; phones are narrower anyway
  gutter: 16,
  cardRadius: 28,
  cardPadding: 24,
} as const;
