/**
 * Prompt-word font sizing, in px.
 *
 * German compounds are long (Geschwindigkeitsbegrenzung = 26 chars), so a
 * single fixed size either wastes the card on short words or overflows on
 * long ones. Tiers are tuned for Barlow Semi Condensed 700 inside the card's
 * inner width on a 393px-wide iPhone 15 (~313px). First tier whose maxLength
 * >= the word's effective length wins — see getWordFontSize().
 */
export const WORD_SIZE_TIERS: ReadonlyArray<{ maxLength: number; fontSize: number }> = [
  { maxLength: 7,        fontSize: 64 },
  { maxLength: 10,       fontSize: 52 },
  { maxLength: 13,       fontSize: 42 },
  { maxLength: 17,       fontSize: 34 },
  { maxLength: Infinity, fontSize: 28 },
];

/** Card flip duration (ms). styles/card.ts reads this so CSS and JS can't drift. */
export const FLIP_DURATION_MS = 500;

/**
 * After any reveal/grade, further reveal/grade taps are ignored for this long.
 * Stops a double-tap on "Show answer" from landing on "Got it"/"Missed it",
 * and a double-tap on "Got it" from revealing the next card.
 */
export const ACTION_LOCKOUT_MS = 350;
