# FlashCards

Single-page German vocabulary flashcards (Anki-style). Mobile-first (iPhone 15, 393×852 CSS px). Parallel site to GroceryList; same conventions (styled-components with `$transient` props, co-located `styles/`, pure utils, barrel `index.ts`).

**Status:** prompt view only. No persistence, no answer side, no grading/scheduling, no auth wrapper yet.

## Task → file lookup

| Task | File |
|---|---|
| Change card shape (new field on Flashcard) | `FlashCards.types.ts` → `sampleDeck.ts` → `CardPrompt.tsx` if shown on the prompt |
| Prompt card look (flag bands, pill, ivory word panel, stack hint) | `styles/card.ts` (+ colours in `styles/tokens.ts`) |
| Prompt word sizing / long compounds | `FlashCards.constants.ts` (`WORD_SIZE_TIERS`) + `FlashCards.utils.ts` (`getWordFontSize`) |
| Colours, font, radius, max width | `styles/tokens.ts` |
| Header (deck title, "1 of 10") | `FlashCards.tsx` + `styles/header.ts` |
| Bottom action button | `FlashCards.tsx` (`handleShowAnswer`) + `styles/actions.ts` |
| Page shell / safe areas | `styles/layout.ts` |
| Global reset, font imports | `GlobalStyle.ts` |
| Placeholder deck data | `sampleDeck.ts` (replace with S3 loader) |

## File map

```
src/flashcards/
├── index.ts               barrel
├── FlashCards.tsx         page: header, CardPrompt, Show answer button, empty state
├── CardPrompt.tsx         prompt side only: part-of-speech pill + German word
├── FlashCards.types.ts    Flashcard, PartOfSpeech, Article
├── FlashCards.constants.ts  WORD_SIZE_TIERS
├── FlashCards.utils.ts    getWordFontSize() (pure)
├── sampleDeck.ts          placeholder deck (includes long compounds + a phrase)
├── GlobalStyle.ts         reset + @fontsource imports
└── styles/
    ├── tokens.ts          colors, fontFamily, layout constants
    ├── layout.ts          AppShell (100dvh, safe-area padding)
    ├── header.ts          TopBar, AppTitle, Progress
    ├── card.ts            CardStack, Card, PosTag, WordPanel, Word
    └── actions.ts         Actions, ShowAnswerBtn, EmptyState
```

## Key invariants / gotchas

**Prompt shows the bare lemma only.** `Flashcard.german` has no article; `article` (der/die/das) is a separate field so the answer side can reveal it as part of what's being tested. Don't put the article on the prompt.

**Word sizing.** German compounds are long. `getWordFontSize` picks a px size from `WORD_SIZE_TIERS` using `max(longest token, ceil(total length / 2))` so single compounds and wrapped phrases both fit. `<Word lang="de">` + `hyphens: auto` is the fallback for anything still too wide (e.g. Geschwindigkeitsbegrenzung hyphenates onto two lines at 28px). Tiers are tuned for Barlow Semi Condensed 700 in a ~313px inner width — retune if the font or card padding changes.

**Mobile requirements.** `index.html` needs `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` or `env(safe-area-inset-*)` resolves to 0. `AppShell` uses `100dvh` (with `100vh` fallback) so the bottom button isn't hidden by Safari's toolbar. Tap targets ≥ 44px; primary action sits at the bottom (thumb zone); `touch-action: manipulation` on buttons.

**Card colour and legibility.** The card is a muted black/red/gold tricolour (three equal bands, hard-stop `linear-gradient` in `styles/card.ts`; colours are `flag*` tokens). The word sits on `WordPanel`, a ~88%-opaque ivory band (`ivoryOverlay`) with a light backdrop blur, and is set in ink — so word contrast doesn't depend on which band it lands on. The panel bleeds edge-to-edge via a negative margin equal to `layout.cardPadding`, then re-pads itself, so the text width (and therefore `WORD_SIZE_TIERS`) is unchanged. If you change `cardPadding`, both sides update from the token.

**Centering.** The word is centred horizontally (`text-align: center`) and vertically on the whole card: `Card` is a column with `justify-content: center`, and `PosTag` is `position: absolute` (top-left, on the black band) so it doesn't shift the centre.

**Stack hint.** `CardStack::before` (darker charcoal, smaller layer) renders only when `position < total`, signalling more cards remain.

**Font dependency.** `npm i @fontsource/barlow-semi-condensed` (weights 500, 700 are imported in `GlobalStyle.ts`). Self-hosted, no external request.

**Placeholder wiring.** `FlashCards.tsx` reads `sampleDeck` directly and hardcodes `position = 1`. The intended seam is a `useStudySession()` hook (owns deck, current index, and later S3 load/save) — analogous to `useGrocerySync`.
