# FlashCards

Single-page German vocabulary flashcards (Anki-style). Mobile-first (iPhone 15, 393×852 CSS px). Parallel site to GroceryList; same conventions (styled-components with `$transient` props, co-located `styles/`, pure utils, `animations.ts`, barrel `index.ts`).

**Status:** prompt view, tap-to-flip, answer side with in-card Got it / Missed it, Leitner-box spaced repetition, session composition (cap + interleaving). In-memory only — no S3 read/write yet, no auth wrapper.

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
| Placeholder deck data | `sampleDeck.ts` (replace with S3 `words.json` loader) |
| Placeholder progress data | `sampleProgress.ts` (replace with S3 `progress.json` loader) |
| Scheduling a word after a grade (Leitner box, dueAt) | `srs.ts` (`scheduleNext`) + intervals in `FlashCards.constants.ts` (`LEITNER_INTERVALS_DAYS`) |
| Rolling recall-success rate | `srs.ts` (`updateSuccessRate`) |
| Which words are due / how many new words to add | `srs.ts` (`buildSessionQueue`, `computeNewCardBudget`) + tiers/cap in `FlashCards.constants.ts` |
| Missed-card in-session requeue gap | `FlashCards.constants.ts` (`MISSED_REQUEUE_GAP`), applied in `useStudySession.ts` |
| Session data model (progress shape) | `FlashCards.types.ts` (`WordProgress`, `ProgressMap`, `SessionMeta`, `ProgressDocument`) |

## File map

```
src/flashcards/
├── index.ts               barrel
├── FlashCards.tsx         page: header, FlipCard, RevealBtn, summary, empty state
├── FlipCard.tsx           two-sided card: Scene > Flipper > CardFront/CardBack; tap = reveal
├── CardPrompt.tsx         front-face content: part-of-speech pill + German word
├── CardAnswer.tsx         back-face content: pill, small German (+article), translation, Missed it / Got it
├── useStudySession.ts     session state: builds the queue via srs.ts, isFlipped,
│                          reveal/grade/restart, folds grades into progressDraft
├── srs.ts                 pure scheduling: scheduleNext, updateSuccessRate, isDue,
│                          computeNewCardBudget, interleaveEvenly, buildSessionQueue
├── FlashCards.types.ts    Flashcard, PartOfSpeech, Article, Grade, AnswerTone,
│                          LeitnerBox, WordProgress, ProgressMap, SessionMeta, ProgressDocument
├── FlashCards.constants.ts  WORD_SIZE_TIERS, FLIP_DURATION_MS, ACTION_LOCKOUT_MS,
│                          LEITNER_INTERVALS_DAYS, SESSION_CARD_CAP, MISSED_REQUEUE_GAP,
│                          SUCCESS_RATE_SMOOTHING, NEW_CARD_SUCCESS_RATE_HIGH/MED,
│                          NEW_CARDS_WHEN_STRUGGLING, DEFAULT_SESSION_META
├── FlashCards.utils.ts    getWordFontSize(), getAnswerTone() (pure)
├── animations.ts          cardIn keyframes
├── sampleDeck.ts          placeholder word bank (long compounds, a phrase, all genders)
├── sampleProgress.ts      placeholder progress: mixes overdue/not-due/new words
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
sampleDeck (word bank) ─┐
sampleProgress (state)  ├─▶ useStudySession ──▶ srs.buildSessionQueue (once, at mount)
                         │        │
                         │        ├─ currentCard, isFlipped, reveal, grade ──▶ FlashCards.tsx ──▶ FlipCard ──▶ CardPrompt / CardAnswer (grade buttons)
                         │        └─ progressDraft (updated by srs.scheduleNext + srs.updateSuccessRate on every grade)
```
Rule: session state lives only in `useStudySession`. The session's card order (`liveQueue`) and position (`index`) are its source of truth; `progressDraft` is a running copy of what would be written back to `progress.json`.


## Database design (S3)

Two documents, mirroring the content/state split GroceryList uses for `items.json` vs `history.json`:

**`vocabulary/words.json`** — the word bank; rarely changes.
```json
{ "c01": { "german": "Handschuh", "english": "glove", "partOfSpeech": "noun", "article": "der" } }
```
Keys are synthetic ids (`sampleDeck.ts` already uses this convention — `c01`, `c02`, ...), not the German text itself. This avoids two problems a text key would have: German has real homonyms distinguished only by article (*der Band* vs. *das Band*), and fixing a typo in a word later would otherwise orphan its review history.

**`vocabulary/progress.json`** — SRS state; rewritten after every session.
```json
{
  "meta": { "successRate": 0.82, "totalReviews": 143 },
  "words": {
    "c01": { "box": 3, "lapses": 1, "dueAt": "2026-10-02T00:00:00.000Z", "lastSessionId": "s_20260921a" }
  }
}
```
A word absent from `words` is "new" (never graded) — there's no explicit box 0. `meta` is a single exponential-moving-average success rate plus a count, not a full history, so it stays one small object regardless of deck size.

**Leitner boxes** (`LEITNER_INTERVALS_DAYS`):

| Box | Interval |
|---|---|
| 1 | 1 day (the "next session" minimum) |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 16 days |
| 5 | 30 days (the "one month" maximum) |

Got it moves up one box (capped at 5); missed it always drops to box 1 regardless of current box — this is what guarantees a miss comes back sooner than a hit. A word's first-ever grade (got or missed) lands it at box 1 either way, satisfying "next session" for a first-time recall too.

**Session composition** (`buildSessionQueue`, capped at `SESSION_CARD_CAP` = 25):
1. Collect due reviews — `progress.words[id]` exists, `dueAt <= now`, and `lastSessionId` isn't this session's id (the session-id check is what makes "next session" the true minimum, not "next calendar day": a card due later today must not resurface in a second session run today) — sorted most-overdue-first, and take up to the cap.
2. Whatever slots remain go to new words (no progress entry at all), but the count is scaled by the rolling `successRate` (`computeNewCardBudget`): ≥ 90% fills every remaining slot, ≥ 70% takes half, below that caps at `NEW_CARDS_WHEN_STRUGGLING` (2) — so a learner who's currently missing a lot isn't also handed a pile of unfamiliar words.
3. New words are spread through the review cards at roughly even spacing (`interleaveEvenly`) rather than front-loaded (worst first impression) or back-loaded (fatigue).

Reviews always win over new words when the cap is tight — a lapsing card decaying further costs more than a new word waiting one more day.

**Write strategy (not yet implemented):** same as `historyStore.ts` — optimistic local update, fire-and-forget save to S3, `console.warn` on failure, no ETag locking (single-device usage assumed). `progressDraft` should be written once per session (on completion, plus on tab-hide as a safety net) rather than after every grade, since `progress.json` could otherwise be rewritten hundreds of times a session.

## Key invariants / gotchas

**In-session requeue vs. cross-session scheduling are two different mechanisms.** A missed card reappears later in *this* session's `liveQueue` (`MISSED_REQUEUE_GAP` cards later, spliced in by `useStudySession`) — this is ephemeral and never touches `progressDraft`. Separately, `srs.scheduleNext` decides when it's next due *in a future session* (persisted). Don't conflate the two: the in-session gap is about not repeating a card back-to-back today; the box/dueAt is about the S3-persisted schedule.

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

**Known gaps.**
- Focus isn't moved after reveal (keyboard users flip with Show answer, then must Tab into the card's grade buttons).
- The front has no "tap to flip" hint on touch devices.
- Nothing is written to S3 yet — `progressDraft` lives only in this hook's state and is lost on reload. `words.json`/`progress.json` loading and saving is the next seam to fill (see `s3Storage.ts` in GroceryList for the pattern to follow).
- "Study again" (`restart`) replays the same session queue for extra practice, but each grade during a replay still calls `scheduleNext` — so replaying can advance a card's box more than once in a day. Fine for a demo; a real deployment should either suppress scheduling effects during a replay or hide the button once the day's queue is genuinely exhausted.
- New-card order within `newCandidates` is currently just word-bank order (not randomized) — worth revisiting once `words.json` has hundreds of entries.
- No leech detection: a word missed repeatedly just keeps cycling through box 1 with `lapses` climbing; nothing surfaces it differently. Missed cards aren't re-queued and results aren't persisted. Plural nouns (all "die") aren't modelled — they'd be coloured feminine.
