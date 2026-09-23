# FlashCards — working context

For a future Claude session picking this up cold. Read this before touching code; check claims against the code before large changes. Last reviewed 2026-09-23 by full read of every file **plus executed tests** (see §9 for what was and wasn't verified). Claims tagged **[verified]** were confirmed by running code; untagged claims come from reading.

## 1. Snapshot

Single-page German→English vocabulary flashcards (Anki-style), mobile-first (iPhone 15, 393×852 CSS px). Sibling of the GroceryList site and shares its conventions: styled-components with `$transient` props, co-located `styles/`, pure utils, `animations.ts`, barrel `index.ts`. **GroceryList's source is not in this folder** — mentions of `s3Storage.ts` / `historyStore.ts` point at files the user would need to re-upload.

**Done:** prompt → tap-to-flip → in-card Got it / Missed it; Leitner scheduling; session composition (cap, new-word throttling, interleaving); in-session requeue of misses.
**Not done:** any persistence. No S3 read/write, no auth wrapper. `progressDraft` lives in hook state and is lost on reload. Data comes from `sampleDeck.ts` and `sampleProgress.ts`.

**Stack assumptions** (host app is not in this folder): React 18 function components; styled-components ≥ 5.1 (transient props; exercised on v6); TypeScript strict (compiles clean with `strict`, `noUnusedLocals`, `noUnusedParameters` **[verified]**); `@fontsource/barlow-semi-condensed` (weights 500, 700); host `index.html` must carry `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` or `env(safe-area-inset-*)` resolves to 0; host needs a `*.css` module declaration for the font imports in `GlobalStyle.ts`.

**Path caveat:** this doc historically said `src/flashcards/`; the uploaded folder was `flashCards/`. Confirm the real casing before adding imports (case-sensitive CI/Linux will break on a mismatch).

## 2. Working agreements

- `srs.ts` stays **pure**: no React, no `Date.now()`. Callers pass `now` and `sessionId`. Same for anything randomness- or time-dependent you add.
- Session state lives only in `useStudySession`; components are presentational.
- Tunables go in `FlashCards.constants.ts` with a comment stating the trade-off. CSS imports `FLIP_DURATION_MS` from there — never hardcode a duplicate.
- Scheduling semantics (intervals, box rules, what counts as a review) are product decisions. Raise them; don't change them silently.
- Update this file in the same change as the code it describes. It drifted from the code before (§10), and stale docs mislead the next session more than no docs.

## 3. Task → file lookup

| Task | File |
|---|---|
| Add a field to a card | `FlashCards.types.ts` → `sampleDeck.ts` → `CardPrompt.tsx` / `CardAnswer.tsx` if shown |
| Study flow (reveal, grade, advance, restart, counters, requeue) | `useStudySession.ts` |
| Fold a grade into progress (first-grade-per-session rule) | `srs.ts` → `applyGrade` |
| Box/interval rules for one word | `srs.ts` → `scheduleNext`; intervals in `FlashCards.constants.ts` → `LEITNER_INTERVALS_DAYS` |
| Rolling success rate | `srs.ts` → `updateSuccessRate`; weight in `SUCCESS_RATE_SMOOTHING` |
| Which words are due / how many new | `srs.ts` → `buildSessionQueue`, `isDue`, `computeNewCardBudget`, `interleaveEvenly`; cap/tiers in constants |
| In-session miss requeue gap | `MISSED_REQUEUE_GAP` (constant), applied in `useStudySession.ts` |
| Double-tap lockout / flip duration | `ACTION_LOCKOUT_MS`, `FLIP_DURATION_MS` (constants) |
| Flip animation / 3D / tap target | `styles/card.ts` (`Scene`, `Flipper`) + `FlipCard.tsx` |
| Prompt face look | `styles/card.ts` (`CardFront`, `PosTag`, `WordPanel`, `Word`) |
| Answer face content/look (incl. grade buttons) | `CardAnswer.tsx` + `styles/card.ts` (`CardBack`, `AnswerBody`, `AnswerGerman`, `Translation`) + `styles/actions.ts` (`GradeRow`, `PrimaryBtn`, `SecondaryBtn`) |
| Gender → answer background | `FlashCards.utils.ts` → `getAnswerTone`; colours in `styles/tokens.ts` → `answerTones` |
| Font sizing for prompt/translation | `WORD_SIZE_TIERS` (constants) + `getWordFontSize` (utils) |
| Colours, font, radius, max width | `styles/tokens.ts` |
| Show answer button | `FlashCards.tsx` + `styles/actions.ts` → `RevealBtn` |
| End-of-session / empty screens | `FlashCards.tsx` → `renderBody`; `styles/summary.ts`, `EmptyState` |
| Card entrance animation | `animations.ts` → `cardIn`, applied on `Scene` |
| Page shell / safe areas | `styles/layout.ts`; global reset + font imports in `GlobalStyle.ts` |
| Placeholder data | `sampleDeck.ts`, `sampleProgress.ts` (replace with S3 loaders) |
| Progress data shapes | `FlashCards.types.ts` (`WordProgress`, `ProgressMap`, `SessionMeta`, `ProgressDocument`) |

## 4. Architecture

```
flashcards/
├── index.ts                barrel
├── FlashCards.tsx          page: header, FlipCard, RevealBtn, summary, empty states
├── FlipCard.tsx            Scene > Flipper > CardFront/CardBack; tap = reveal
├── CardPrompt.tsx          front: part-of-speech pill + bare German lemma
├── CardAnswer.tsx          back: pill, German (+article), translation, Missed it / Got it
├── useStudySession.ts      session state: queue, index, isFlipped, counters, progressDraft
├── srs.ts                  pure: scheduleNext, updateSuccessRate, applyGrade, isDue,
│                           computeNewCardBudget, interleaveEvenly, buildSessionQueue
├── FlashCards.types.ts     Flashcard, PartOfSpeech, Article, Grade, AnswerTone, LeitnerBox,
│                           WordProgress, ProgressMap, SessionMeta, ProgressDocument
├── FlashCards.constants.ts WORD_SIZE_TIERS, FLIP_DURATION_MS, ACTION_LOCKOUT_MS,
│                           LEITNER_INTERVALS_DAYS, MAX_LEITNER_BOX, SESSION_CARD_CAP,
│                           MISSED_REQUEUE_GAP, SUCCESS_RATE_SMOOTHING,
│                           NEW_CARD_SUCCESS_RATE_HIGH/MED, NEW_CARDS_WHEN_STRUGGLING,
│                           DEFAULT_SESSION_META (currently unused — reserved for the loader)
├── FlashCards.utils.ts     getWordFontSize, getAnswerTone (pure)
├── animations.ts           cardIn
├── sampleDeck.ts / sampleProgress.ts   placeholders
├── GlobalStyle.ts          reset + @fontsource imports
└── styles/  tokens, layout, header, card, actions, summary
```

```
sampleDeck ─┐
            ├─▶ useStudySession ─▶ buildSessionQueue (ONCE, at mount)
sampleProgress ┘      │
                      ├─ currentCard, position, total, isFlipped, isComplete, counters
                      │      └─▶ FlashCards.tsx ─▶ FlipCard ─▶ CardPrompt / CardAnswer
                      └─ progressDraft  (srs.applyGrade on each card's FIRST grade per session)
```

**Read-once inputs:** `wordBank` and `initialProgress` are read only at mount (lazy `useState`). Passing different data later is silently ignored. When S3 loading arrives, mount the session only after data has loaded (§8).

## 5. Scheduling & session behaviour (as implemented)

**Leitner boxes** (`LEITNER_INTERVALS_DAYS`): 1 → 1 day · 2 → 3 · 3 → 7 · 4 → 16 · 5 → 30. No box 0: a word with no `progress.words[id]` entry is "new".

**Grade → box** (`scheduleNext`): Missed → always box 1 (`lapses`+1). Got → box+1, capped at 5. A word's first-ever grade (got or missed) → box 1. **[verified]**

**`dueAt` = grade time + interval × 24 h, exactly.** It is not snapped to a calendar day. Consequence **[verified]**: a card graded at 08:05 yesterday is *not* due at 08:00 today. Habitual-time studiers lose cards for a day at the margin. (Decision pending, §10.)

**First grade per session wins** (`applyGrade`): once `progress.words[id].lastSessionId === sessionId`, further grades of that card in the same session — the requeue retry after a miss, or a "Study again" replay — leave `progressDraft` untouched, including `meta`. So `successRate`/`totalReviews` measure first-exposure recall only, and "Study again" is pure practice. **[verified]** *(Before this rule: miss-then-got-on-retry landed in box 2 — a longer interval than a clean first-try got — and replays advanced boxes twice in a day.)*

**`successRate`**: exponential moving average, α = `SUCCESS_RATE_SMOOTHING` (0.2). The first-ever review sets it outright to 0 or 1 rather than blending. Used only to size the new-word budget.

**Session queue** (`buildSessionQueue`, built once, ≤ `SESSION_CARD_CAP` = 25):
1. Due reviews: a progress record exists, `dueAt ≤ session start`, `lastSessionId ≠ sessionId`; most-overdue first; up to the cap. Reviews always beat new words.
2. Remaining slots × new budget (`computeNewCardBudget`): rate ≥ 0.9 → all slots; ≥ 0.7 → `floor(half)`; below → at most 2. New words = no progress record, in **word-bank order** (not random).
3. `interleaveEvenly`: new words spread through reviews at even spacing, first insert half a gap in. With any reviews present the first card is always a review; with more new than reviews the new ones arrive in runs. Sample data yields `c02, c05, c06, c01, c07, c08, c04, c09, c10` **[verified]**.

Note on `isDue`'s `lastSessionId` clause: with a fresh session id at build time it cannot fire. It only matters if a queue is ever *rebuilt* within the same session (e.g. a future "Study again" that rebuilds from `progressDraft`).

**In-session requeue vs. persisted schedule are different mechanisms.** A missed card is spliced `MISSED_REQUEUE_GAP` (4) cards later in `liveQueue` — ephemeral, never touches `progressDraft` (its schedule was fixed by its first grade). Clamped to the queue end: with < 4 cards left it goes last; if it *was* last (or the only card) it is the very next card **[verified]**. There is no retry cap: the session ends only when every requeued instance is finally graded Got.

## 6. Invariants — break these and things visibly fail

**FlipCard key must change on every advance:** `key={`${card.id}-${position}`}`, not `card.id`. A remount is what makes the next card appear un-flipped and slide in (`cardIn`) rather than animating a flip-back that could flash the next answer. A bare `card.id` fails when the same card comes up twice in a row (last/only card missed): no remount **[verified]**.

**Flip is one-way.** Tap on the card or "Show answer" reveals; there is no flip-back. Advancing happens only through the in-card Got it / Missed it buttons.

**Double-tap lockout.** `reveal` and `grade` are both ignored within `ACTION_LOCKOUT_MS` (350 ms) of the previous action **[verified]**; `restart` also arms it. Without it, a double-tap on the card lands on Got/Missed (they appear under the finger) and a double-tap on Got it reveals the next card. Corollary for tests: advance fake timers > 350 ms between actions.

**Grade buttons live on the back face.** `CardBack` is `visibility: hidden` until `$flipped`, so it has no tab stop and no hit-testing through the front. Grade clicks call `stopPropagation` so they don't bubble to `Scene`'s reveal handler.

**Show answer button.** Visually hidden on touch (`@media (hover: none) and (pointer: coarse)`) — the card tap is the control there — but kept in the accessibility tree for VoiceOver. Visible on desktop. Uses `visibility: hidden` (not unmount) once flipped so the card doesn't resize.

**Colour is never the only cue for gender.** `getAnswerTone`: noun + article → masculine blue / feminine red / neuter green; anything else (or a noun with no `article`) → orange. The answer-side German word is also prefixed with its article. Got it / Missed it are deliberately neutral ink (filled vs outlined), not green/red, to avoid clashing with the gender colours.

**3D flip.** `Scene` has `perspective`; `Flipper` rotates with `preserve-3d`; both faces are `position: absolute; inset: 0; backface-visibility: hidden`; the back is pre-rotated 180°. No `backdrop-filter` inside faces (Safari breaks it under preserve-3d) — `WordPanel` relies on its 88 % ivory opacity alone. Front face is `aria-hidden` when flipped; back face is hidden via `visibility`. `prefers-reduced-motion` disables the flip transition (instant swap) and the entrance animation.

**Prompt shows the bare lemma only.** `Flashcard.german` has no article; `article` is separate and shown on the answer side only. Don't put the article on the prompt.

**Word sizing.** `getWordFontSize` picks px from `WORD_SIZE_TIERS` by `max(longest token, ceil(total length / 2))`, for both the German prompt and the English translation. `lang` (`de`/`en`) + `hyphens: auto` are the fallback for anything still too wide. Tiers are tuned for Barlow Semi Condensed 700 in a ~313 px inner width (393 − 2×16 gutter − 2×24 `cardPadding`) — retune if the font, gutter or `cardPadding` change. Not visually verified (§9).

**`WordPanel` (needs confirmation):** the code is `margin: -1px; padding: 48px 0; border-radius: 25px` — a contained panel. The comment above it in `card.ts` (and older versions of this doc) describe an edge-to-edge bleed via a negative margin equal to `cardPadding`. The code is treated as truth here; the comment is probably stale. See §10.

**Mobile.** `AppShell` uses `100dvh` (with `100vh` fallback) and `max(env(safe-area-*), gutter)` padding. Tap targets ≥ 44 px (buttons are 56 px). Primary actions sit at the bottom (thumb zone). `touch-action: manipulation` on buttons and the card; card text is `user-select: none`.

**Contrast claims in `tokens.ts` hold [verified]:** `inkMuted` on page 5.3:1; ink on answer tones 12.7–14.2:1; ink on the ivory panel over any band 13.6–15.6:1; red focus ring on the feminine tone 4.7:1.

## 7. Persistence design (planned, not built)

Two S3 documents, mirroring GroceryList's content/state split:

**`vocabulary/words.json`** — word bank; rarely changes. Keys are synthetic ids (`c01`, …), never the German text: German has homonyms distinguished only by article (*der Band* / *das Band*), and fixing a typo must not orphan review history.
```json
{ "c01": { "german": "Handschuh", "english": "glove", "partOfSpeech": "noun", "article": "der" } }
```
(The in-app `Flashcard` also carries `id` inside the object; the loader must inject it from the key.)

**`vocabulary/progress.json`** — SRS state; rewritten per session.
```json
{ "meta": { "successRate": 0.82, "totalReviews": 143 },
  "words": { "c01": { "box": 3, "lapses": 1, "dueAt": "2026-10-02T09:14:00.000Z", "lastSessionId": "s_1790000000000" } } }
```
A word absent from `words` is "new". `meta` is one EMA + a count, so it stays small at any deck size. `lapses` is all-time misses, unused for scheduling (reserved for leech detection).

**Write strategy:** optimistic local update, fire-and-forget S3 save, `console.warn` on failure, no ETag locking (single device assumed) — same as GroceryList's `historyStore.ts`. Write `progressDraft` once per session (on completion, plus `visibilitychange`/`pagehide` as a safety net), not per grade.

**Validate on load.** A malformed `dueAt` makes `isDue` false forever and the word has a record so it is never "new" either — it silently vanishes from every session **[verified]**. Check `dueAt` parses and `box` ∈ 1..5 at the loader boundary. Progress ids absent from the word bank are ignored; bank ids absent from progress are new.

## 8. Known behaviours, gaps, refactor backlog

**Behaviours that may surprise (intentional or undecided — not necessarily bugs):**
- "n of m" `total` grows by one each time a card is requeued.
- `gotCount + missedCount` counts every tap, including requeue retries and replays, so it can exceed the queue size; the summary screen shows these.
- A session can't finish while any card keeps being missed (no retry cap).
- A single early miss can push `successRate` low enough to throttle new words to 2 until ~6 consecutive first-try Gots recover it (0 → 0.74 at α = 0.2).
- `sampleProgress.ts` stamps `Date.now()` at import time; fine for a demo, stale in a long-lived tab.

**Gaps:**
- Focus is lost after reveal (Show answer becomes `visibility: hidden` while focused); no `aria-live` announcement of the answer for screen readers.
- No "tap to flip" hint on the front for touch users; no keyboard shortcuts (Space reveal, 1/2 grade).
- No leech detection (`lapses` climbs, nothing surfaces it).
- Plural nouns (all "die") aren't modelled; they'd be coloured feminine.
- New-word order is word-bank order; revisit once the bank has hundreds of entries.
- `article` on `Flashcard` is "nouns only" by convention; a discriminated union would enforce it.
- `ProgressMap` is typed as if every key exists; `Partial<Record<…>>` (or `noUncheckedIndexedAccess`) would force the undefined checks.

**Refactor candidates, in rough priority:**
1. **Async loader seam.** Add a `useDeckData()` returning `{ status, wordBank, progress }` and mount the session component only when `status === 'ready'` (inputs are read once at mount, §4). Make `FlashCards` take these as props instead of importing samples.
2. **Tests.** None exist. Highest value: `srs.ts` (pure), then `useStudySession`. See §9 for the recipe and scenarios.
3. **Persist hook.** `useProgressPersistence(progressDraft, isComplete)` implementing §7's write strategy.
4. **Extract `requeueMissed(queue, index, card, gap)`** from the hook into `srs.ts` so the requeue is unit-testable.
5. **Loader-boundary validation** (§7).
6. Split `renderBody` in `FlashCards.tsx` into `SummaryView` / `EmptyView` components once S3 states (loading, error) arrive.

## 9. Verification status

**Verified by execution** (scratch project: vitest + jsdom + `@testing-library/react@14`, fake timers): typecheck under strict; `scheduleNext`, `interleaveEvenly`, `isDue`, `applyGrade`; hook behaviour for requeue gap, lockout, miss→got, replay; a full click-through of the real `FlashCards` component ending in "Session complete"; FlipCard remount with/without the composite key; WCAG contrast numbers.

**Read but not executed:** all `styles/*`, GlobalStyle.

**Not verified — needs a device/browser:** 3D flip, `visibility` timing, word-fit for the size tiers (esp. `Geschwindigkeitsbegrenzung` at 28 px), safe-area behaviour, `hyphens: auto` on iOS Safari, RevealBtn's touch-only hiding. jsdom has no layout.

**Test recipe** (for when a runner exists in the host project):
- Between every `reveal()`/`grade()` advance fake timers by > 350 ms or the lockout swallows the call.
- `sampleProgress` uses import-time `Date.now()`; in tests set the fake clock to (import-time now + a little), otherwise "due" sample words aren't due.
- Regression scenarios worth keeping: miss→got stays box 1 with 1 lapse; replay leaves `progressDraft` identical (`toBe`); missed card returns 4 cards later; one-card queue miss yields the same card again with a *different* FlipCard key; `buildSessionQueue` on sample data equals the order in §5; invalid `dueAt` case; 08:05→08:00 next-day case (documents the exact-24 h behaviour).

## 10. Open decisions (need the user) and change log

**Open decisions:**
1. **Calendar-day vs exact-24 h `dueAt`** (§5). Recommendation: snap to the local start of day (`today + interval`) so due-ness doesn't depend on time of day.
2. **`WordPanel` design:** contained (current code) or edge-to-edge bleed (old comment/doc)?
3. **"Study again":** pure-practice replay (current), rebuild from `progressDraft` (fetches the next batch of due/new; gives the `lastSessionId` clause in `isDue` a real job), or hide once nothing's left?
4. **Progress display / retries:** keep the growing "n of m" and uncapped retries, or freeze the denominator / cap retries?
5. **Retries in `successRate`:** excluded now (first-grade-only). Alternative: count them.

**Change log (2026-09-23 review):**
- `srs.ts`: added pure `applyGrade` (first-grade-per-session rule).
- `useStudySession.ts`: grades go through `applyGrade` inside the state updater (no stale closure; `progressDraft` dropped from `grade` deps); stable `isLockedOut`; `sessionId`/`startedAt` via lazy `useState` instead of per-render `useRef` allocation.
- `FlashCards.tsx`: composite FlipCard key; uses `isComplete`; empty-state check reads the same `wordBank` passed to the hook (was reading `sampleDeck` directly).
- `FlipCard.tsx`: key comment corrected.
- Doc drift fixed: removed the stale "missed cards aren't re-queued" gap (they are); corrected the `isDue`/`lastSessionId` rationale (a second session has a different id, so it never protected against same-day resurfacing — the ≥ 24 h interval does); documented that inputs are read once; flagged the `WordPanel` comment mismatch; corrected the example `dueAt` (code doesn't midnight-snap); added `MAX_LEITNER_BOX` to the constants list and noted `DEFAULT_SESSION_META` is unused.
