# FlashCards

Single-page German vocabulary flashcards (Anki-style). Mobile-first (iPhone 15, 393×852 CSS px). Parallel site to GroceryList; same conventions (styled-components with `$transient` props, co-located `styles/`, pure utils, `animations.ts`, barrel `index.ts`).

**Status:** prompt view, tap-to-flip, answer side with in-card Got it / Missed it, end-of-deck summary. In-memory only — no persistence, no scheduling/spaced repetition, no auth wrapper yet.

## Task → file lookup

| Task | File |
|---|---|
| Change card shape (new field on Flashcard) | `FlashCards.types.ts` → `sampleDeck.ts` → `CardPrompt.tsx` / `CardAnswer.tsx` if shown |
| Study flow (reveal, grade, advance, restart, counts) | `useStudySession.ts` |
| Double-tap lockout / flip duration | `FlashCards.constants.ts` (`ACTION_LOCKOUT_MS`, `FLIP_DURATION_MS`) |
| Flip animation / 3D / tap target | `styles/card.ts` (`Scene`, `Flipper`) + `FlipCard.tsx` |
| Prompt-face look (flag bands, pill, ivory panel) | `styles/card.ts` (`CardFront`, `PosTag`, `WordPanel`, `Word`) |
| Answer-face content/look (incl. Got it / Missed it) | `CardAnswer.tsx` + `styles/card.ts` (`CardBack`, `AnswerBody`, `AnswerGerman`, `Translation`) |
| Gender → answer background mapping | `FlashCards.utils.ts` (`getAnswerTone`) + colours in `styles/tokens.ts` (`answerTones`) |
| Prompt/translation font sizing | `FlashCards.constants.ts` (`WORD_SIZE_TIERS`) + `FlashCards.utils.ts` (`getWordFontSize`) |
| Colours, font, radius, max width | `styles/tokens.ts` |
| Show answer button (desktop/keyboard/VoiceOver only) | `FlashCards.tsx` + `styles/actions.ts` (`RevealBtn`) |
| Got it / Missed it buttons (inside the card) | `CardAnswer.tsx` + `styles/actions.ts` (`PrimaryBtn`, `SecondaryBtn`, `GradeRow`) |
| End-of-deck screen | `FlashCards.tsx` (`renderBody`) + `styles/summary.ts` |
| New-card entrance animation | `animations.ts` (`cardIn`), applied on `Scene` |
| Page shell / safe areas | `styles/layout.ts` |
| Global reset, font imports | `GlobalStyle.ts` |
| Placeholder deck data | `sampleDeck.ts` (replace with S3 loader) |

## File map

```
src/flashcards/
├── index.ts               barrel
├── FlashCards.tsx         page: header, FlipCard, RevealBtn, summary, empty state
├── FlipCard.tsx           two-sided card: Scene > Flipper > CardFront/CardBack; tap = reveal
├── CardPrompt.tsx         front-face content: part-of-speech pill + German word
├── CardAnswer.tsx         back-face content: pill, small German (+article), translation, Missed it / Got it
├── useStudySession.ts     session state: results[], isFlipped, reveal/grade/restart
├── FlashCards.types.ts    Flashcard, PartOfSpeech, Article, Grade, AnswerTone
├── FlashCards.constants.ts  WORD_SIZE_TIERS, FLIP_DURATION_MS, ACTION_LOCKOUT_MS
├── FlashCards.utils.ts    getWordFontSize(), getAnswerTone() (pure)
├── animations.ts          cardIn keyframes
├── sampleDeck.ts          placeholder deck (long compounds, a phrase, all genders)
├── GlobalStyle.ts         reset + @fontsource imports
└── styles/
    ├── tokens.ts          colors, answerTones, answerText, fontFamily, layout
    ├── layout.ts          AppShell (100dvh, safe-area padding)
    ├── header.ts          TopBar, AppTitle, Progress
    ├── card.ts            CardStack, Scene, Flipper, CardFront/Back, pills, WordPanel, Word, answer text
    ├── actions.ts         Actions, PrimaryBtn, SecondaryBtn, RevealBtn, GradeRow, EmptyState
    └── summary.ts         SummaryState/Title/Text (end of deck)
```

## Data flow

```
useStudySession(deck) ──currentCard, isFlipped, reveal, grade──▶ FlashCards.tsx ──▶ FlipCard ──▶ CardPrompt / CardAnswer (grade buttons)
```
Rule: session state lives only in `useStudySession`. `results` (an array of `'got' | 'missed'`) is the single source of truth; the current index is `results.length`.

## Key invariants / gotchas

**Flip is one-way.** Tap on the card (or "Show answer") reveals; there is no flip-back. Advancing happens only via the in-card Got it / Missed it buttons. `FlipCard` must be rendered with `key={card.id}`: the next card then mounts already un-flipped and slides in (`cardIn`), instead of animating back — which would flash the next answer mid-flip.

**Double-tap lockout.** `reveal`/`grade` are both ignored within `ACTION_LOCKOUT_MS` of the previous one. Without it, a double-tap on the card lands on Got/Missed (which appear where the tap was), and a double-tap on "Got it" reveals the next card.

**Grade buttons live in the card.** They're on the back face, so they're only reachable when flipped: `CardBack` is `visibility: hidden` until `$flipped` (no tab stop, no hit-testing through the front). Their clicks call `stopPropagation` so they don't bubble to `Scene`'s reveal handler.

**Show answer button.** Visually hidden on touch devices (`@media (hover: none) and (pointer: coarse)`) — the card tap is the control there — but kept in the accessibility tree so VoiceOver can flip. Visible on desktop. Hidden with `visibility` (not unmounted) once flipped so the card doesn't resize.

**Answer background.** `getAnswerTone`: noun + article → masculine (blue) / feminine (red) / neuter (green); everything else (or a noun with no `article`) → orange. Tones are soft pastels in `answerTones`. Gender is *also* shown in text — the small German word is prefixed with its article — so colour is never the only cue. "Got it/Missed it" are deliberately neutral ink (filled vs outlined), not green/red, to avoid clashing with the gender colours.

**3D flip specifics.** `Scene` has `perspective`; `Flipper` rotates (`preserve-3d`); both faces are `position: absolute; inset: 0; backface-visibility: hidden`, back face pre-rotated 180°. No `backdrop-filter` anywhere inside the faces (Safari breaks it under preserve-3d) — `WordPanel` relies on its 88% ivory opacity alone. Hidden face is `aria-hidden`. `prefers-reduced-motion` disables both flip and entrance animation (flip becomes an instant swap).

**Prompt shows the bare lemma only.** `Flashcard.german` has no article; `article` is separate so the answer side can show it. Don't put the article on the prompt.

**Word sizing.** `getWordFontSize` picks px from `WORD_SIZE_TIERS` using `max(longest token, ceil(total length / 2))`; used for both the German prompt word and the English translation. `lang` attributes (`de` / `en`) + `hyphens: auto` are the fallback for anything still too wide. Tiers are tuned for Barlow Semi Condensed 700 in a ~313px inner width — retune if font or `layout.cardPadding` changes. `WordPanel` bleeds edge-to-edge with a negative margin equal to `cardPadding`, then re-pads itself, so text width is unchanged.

**Mobile requirements.** `index.html` needs `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` or `env(safe-area-inset-*)` resolves to 0. `AppShell` uses `100dvh` (with `100vh` fallback). Tap targets ≥ 44px; primary actions sit at the bottom (thumb zone); `touch-action: manipulation` on buttons and the card; card text is `user-select: none`.

**Font dependency.** `npm i @fontsource/barlow-semi-condensed` (weights 500, 700 imported in `GlobalStyle.ts`).

**Known gaps.** Focus isn't moved after reveal (keyboard users flip with Show answer, then must Tab into the card's grade buttons). The front has no "tap to flip" hint on touch devices. Missed cards aren't re-queued and results aren't persisted. Plural nouns (all "die") aren't modelled — they'd be coloured feminine.
