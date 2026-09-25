# FlashCards — working context

For a future Claude session picking this up cold. Read this before touching code; check claims against the code before large changes. Last reviewed 2026-09-24 (three passes: full read + executed tests; decisions applied and a test suite added; test suite hardened against the host's actual toolchain). **[verified]** = confirmed by running code, either the test suite (§9) or a one-off check; untagged claims come from reading.

## 1. Snapshot

Single-page German→English vocabulary flashcards (Anki-style), mobile-first (iPhone 15, 393×852 CSS px). Sibling of the GroceryList site and shares its conventions: styled-components with `$transient` props, co-located `styles/`, pure utils, `animations.ts`, barrel `index.ts`, and now co-located `*.test.ts(x)`. **GroceryList's source is not in this folder** — mentions of `s3Storage.ts` / `historyStore.ts` point at files the user would need to re-upload.

**Done:** prompt → tap-to-flip → in-card Got it / Missed it; Leitner scheduling with calendar-day due dates; session composition (cap, new-word throttling, interleaving); in-session requeue of misses; 78-test suite.
**Not done:** any persistence. No S3 read/write, no auth wrapper. `progressDraft` lives in hook state and is lost on reload. Data comes from `sampleDeck.ts` and `sampleProgress.ts`.

**Folder name is `flashCards`** (camelCase — confirmed by the user). Match this casing in imports; case-sensitive CI/Linux breaks on a mismatch. The parent path (`src/…`) isn't in the upload.

**Stack** — from the host's `package.json` (project name `foxstack`; the host app itself is not in this folder): React **19.2**, styled-components 6.5, wouter (routing), TypeScript **6.0**, Vite **8.1** with `@vitejs/plugin-react` 6 and `@vanilla-extract/vite-plugin` (vanilla-extract is not used by this folder), `@fontsource/barlow-semi-condensed`. For the future S3 loader the host already has `@aws-sdk/client-s3`, `@aws-sdk/credential-provider-cognito-identity` and `aws-amplify`. Lint: ESLint 10 with `eslint-plugin-react-hooks` 7 (React-Compiler-era rules: no ref access or impure calls like `Date.now()` during render) and `react-refresh`, run with `--max-warnings 0`. Tests: vitest **4.1**, jsdom **29**, `@testing-library/react` **16** (+ `dom` 10, `jest-dom` 6). This folder typechecks under strict TS 6 with Vite-template flags (`verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnused*`) and lints clean **[verified on the declared minimum versions and on latest-in-range]**. The host must supply a viewport meta with `viewport-fit=cover` (else `env(safe-area-inset-*)` is 0) and `vite/client` types for the `*.css` font imports in `GlobalStyle.ts`. The host's own `vite.config.ts` / vitest setup was **not seen** — see the mocking pitfall in §9.

## 2. Working agreements

- `srs.ts` stays **pure**: no React, no `Date.now()`. Callers pass `now` and `sessionId`. Same for anything time- or randomness-dependent you add.
- Session state lives only in `useStudySession`; components are presentational.
- Tunables go in `FlashCards.constants.ts` with a comment stating the trade-off. CSS imports `FLIP_DURATION_MS` from there — never hardcode a duplicate.
- Scheduling semantics (intervals, box rules, what counts as a review) are product decisions. Raise them; don't change them silently.
- **Run the tests before returning code (the host's `npm test` is `vitest`, i.e. watch mode; one-shot is `npm test -- --run`), and add/adjust tests in the same change.** A behaviour change without a test change is a red flag. Don't `vi.mock` this folder's own modules in tests (§9) — pass data through props. Bug fixes get a regression test that fails without the fix (§9 lists how this was proven).
- Update this file in the same change as the code it describes. It has drifted from the code before (§10); stale docs mislead the next session more than no docs.

## 3. Task → file lookup

| Task | File |
|---|---|
| Add a field to a card | `FlashCards.types.ts` → `sampleDeck.ts` → `CardPrompt.tsx` / `CardAnswer.tsx` if shown |
| Study flow (reveal, grade, advance, restart, counters, requeue) | `useStudySession.ts` |
| Fold a grade into progress (first-grade-per-session rule) | `srs.ts` → `applyGrade` |
| Box/interval rules for one word | `srs.ts` → `scheduleNext`; intervals in `FlashCards.constants.ts` → `LEITNER_INTERVALS_DAYS` |
| When a word becomes due (local-midnight snapping) | `srs.ts` → `dueDateFor` |
| Rolling success rate | `srs.ts` → `updateSuccessRate`; weight in `SUCCESS_RATE_SMOOTHING` |
| Which words are due / how many new | `srs.ts` → `buildSessionQueue`, `isDue`, `computeNewCardBudget`, `interleaveEvenly`; cap/thresholds in constants |
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
| Placeholder data | `sampleDeck.ts`, `sampleProgress.ts` — used only as the *default* props of `FlashCards`; replace with S3 loaders |
| What deck/progress/title the page shows | `FlashCards.tsx` props: `wordBank`, `progress`, `deckName` (all optional) |
| Progress data shapes | `FlashCards.types.ts` (`WordProgress`, `ProgressMap`, `SessionMeta`, `ProgressDocument`) |
| Tests | `srs.test.ts` (pure logic) · `useStudySession.test.tsx` (hook) · `FlashCards.test.tsx` (page, real sample data) · `FlashCards.states.test.tsx` (page, data passed via props: empty / nothing-due / remount / deckName / read-once) |

## 4. Architecture

```
flashCards/
├── index.ts                barrel
├── FlashCards.tsx          page + props { wordBank?, progress?, deckName? }: header, FlipCard, RevealBtn, summary, empty states
├── FlipCard.tsx            Scene > Flipper > CardFront/CardBack; tap = reveal
├── CardPrompt.tsx          front: part-of-speech pill + bare German lemma
├── CardAnswer.tsx          back: pill, German (+article), translation, Missed it / Got it
├── useStudySession.ts      session state: queue, index, isFlipped, counters, progressDraft
├── srs.ts                  pure: dueDateFor, scheduleNext, updateSuccessRate, applyGrade, isDue,
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
├── styles/                 tokens, layout, header, card, actions, summary
└── *.test.ts(x)            srs, useStudySession, FlashCards, FlashCards.states
```

```
props (default: sampleDeck / sampleProgress / sampleDeckName)
   │ wordBank + progress
   ▼
useStudySession ─▶ buildSessionQueue (ONCE, at mount)
                      │
                      ├─ currentCard, position, total, isFlipped, isComplete, counters
                      │      └─▶ FlashCards.tsx ─▶ FlipCard ─▶ CardPrompt / CardAnswer
                      └─ progressDraft  (srs.applyGrade on each card's FIRST grade per session)
```

**Read-once inputs:** `wordBank` and `initialProgress` are read only at mount (lazy `useState`). Passing different props later is silently ignored; to load a different deck, remount with a new `key` **[verified at hook and page level]**. When S3 loading arrives, render `<FlashCards>` only after data has loaded (§8).

## 5. Scheduling & session behaviour (as implemented)

**Leitner boxes** (`LEITNER_INTERVALS_DAYS`, in calendar days): 1 → 1 · 2 → 3 · 3 → 7 · 4 → 16 · 5 → 30. No box 0: a word with no `progress.words[id]` entry is "new".

**Grade → box** (`scheduleNext`): Missed → always box 1 (`lapses`+1). Got → box+1, capped at 5. A word's first-ever grade (got or missed) → box 1. **[verified]**

**`dueAt` = local midnight, N calendar days after the grading day** (`dueDateFor`). Time of day at grading is irrelevant **[verified]**: a card graded 08:05 yesterday is due at 08:00 today; a card graded at any time today is not due again today, even at 23:59:59. Consequences to know:
- Box 1 means "tomorrow morning", so a card graded at 23:59 is due one minute later. That's intended ("next calendar day", not "24 h later").
- Implemented with calendar arithmetic (`new Date(y, m, d + n)`), not `+ n×24 h`, so DST transitions can't shift it to 23:00/01:00 **[verified in America/Chicago, Los_Angeles, Berlin, Kolkata, Auckland, UTC]**. In zones where a DST jump skips local midnight, JS lands on the first valid time that day (≈01:00) — harmless.
- Stored as an absolute ISO/UTC instant. "Local" is the device's zone *at grading time*; travelling afterwards doesn't rewrite it.

**First grade per session wins** (`applyGrade`): once `progress.words[id].lastSessionId === sessionId`, further grades of that card in the same session — the requeue retry after a miss, or a "Study again" replay — leave `progressDraft` untouched, including `meta`. So `successRate`/`totalReviews` measure first-exposure recall only (**user-confirmed design**), and "Study again" is pure practice. **[verified]** *(Before this rule: miss-then-got-on-retry landed in box 2 — a longer interval than a clean first-try got — and replays advanced boxes twice in a day.)*

**`successRate`**: exponential moving average, α = `SUCCESS_RATE_SMOOTHING` (0.2). The first-ever review sets it outright to 0 or 1 rather than blending. Used only to size the new-word budget. From 0 it takes six consecutive first-try Gots to reach ≥ 0.7 **[verified]**.

**Session queue** (`buildSessionQueue`, built once, ≤ `SESSION_CARD_CAP` = 25):
1. Due reviews: a progress record exists, `dueAt ≤ session start`, `lastSessionId ≠ sessionId`; most-overdue first; up to the cap. Reviews always beat new words.
2. Remaining slots × new budget (`computeNewCardBudget`): rate ≥ 0.9 → all slots; ≥ 0.7 → `floor(half)`; below → at most 2 (never more than the slots left). New words = no progress record, in **word-bank order** (not random).
3. `interleaveEvenly`: new words spread through reviews at even spacing, first insert half a gap in. With any reviews present the first card is always a review; with more new than reviews the new ones arrive in runs. Sample data yields `c02, c05, c06, c01, c07, c08, c04, c09, c10` **[verified]**.

Note on `isDue`'s `lastSessionId` clause: with a fresh session id at build time it cannot fire. It only matters if a queue is ever *rebuilt* within the same session (e.g. a future "Study again" that rebuilds from `progressDraft`).

**In-session requeue vs. persisted schedule are different mechanisms.** A missed card is spliced `MISSED_REQUEUE_GAP` (4) cards later in `liveQueue` — ephemeral, never touches `progressDraft` (its schedule was fixed by its first grade). Clamped to the queue end: with < 4 cards left it goes last; if it *was* last (or the only card) it is the very next card **[verified]**. There is no retry cap: the session ends only when every requeued instance is finally graded Got **[verified]**.

## 6. Invariants — break these and things visibly fail

**FlipCard key must change on every advance:** `key={`${card.id}-${position}`}`, not `card.id`. A remount is what makes the next card appear un-flipped and slide in (`cardIn`) rather than animating a flip-back that could flash the next answer. A bare `card.id` fails when the same card comes up twice in a row (last/only card missed): no remount. Guarded by the regression test in `FlashCards.states.test.tsx` **[verified: fails when the key is reverted]**.

**Flip is one-way.** Tap on the card or "Show answer" reveals; there is no flip-back. Advancing happens only through the in-card Got it / Missed it buttons.

**Double-tap lockout.** `reveal` and `grade` are both ignored within `ACTION_LOCKOUT_MS` (350 ms) of the previous action **[verified]**; `restart` also arms it. Without it, a double-tap on the card lands on Got/Missed (they appear under the finger) and a double-tap on Got it reveals the next card. Corollary for tests: advance fake timers > 350 ms between actions.

**Grade buttons live on the back face.** `CardBack` is `visibility: hidden` until `$flipped`, so it has no tab stop and no hit-testing through the front. Grade clicks call `stopPropagation` so they don't bubble to `Scene`'s reveal handler.

**Show answer button.** Visually hidden on touch (`@media (hover: none) and (pointer: coarse)`) — the card tap is the control there — but kept in the accessibility tree for VoiceOver. Visible on desktop. Uses `visibility: hidden` (not unmount) once flipped so the card doesn't resize.

**Colour is never the only cue for gender.** `getAnswerTone`: noun + article → masculine blue / feminine red / neuter green; anything else (or a noun with no `article`) → orange. The answer-side German word is also prefixed with its article. Got it / Missed it are deliberately neutral ink (filled vs outlined), not green/red, to avoid clashing with the gender colours.

**3D flip.** `Scene` has `perspective`; `Flipper` rotates with `preserve-3d`; both faces are `position: absolute; inset: 0; backface-visibility: hidden`; the back is pre-rotated 180°. No `backdrop-filter` inside faces (Safari breaks it under preserve-3d) — `WordPanel` relies on its 88 % ivory opacity alone. Front face is `aria-hidden` when flipped **[verified]**; back face is hidden via `visibility`. `prefers-reduced-motion` disables the flip transition (instant swap) and the entrance animation.

**Prompt shows the bare lemma only.** `Flashcard.german` has no article; `article` is separate and shown on the answer side only. Don't put the article on the prompt **[verified: a test fails if it leaks]**.

**Word sizing.** `getWordFontSize` picks px from `WORD_SIZE_TIERS` by `max(longest token, ceil(total length / 2))`, for both the German prompt and the English translation. `lang` (`de`/`en`) + `hyphens: auto` are the fallback for anything still too wide. Tiers are tuned for Barlow Semi Condensed 700 in a ~313 px inner width (393 − 2×16 gutter − 2×24 `cardPadding`) — retune if the font, gutter or `cardPadding` change. Not visually verified (§9).

**`WordPanel` is a contained panel** (user-confirmed; code is the truth): `margin: -1px; padding: 48px 0; border-radius: 25px` — full inner width, vertical padding only, no bleed to the card edges. Its comment in `card.ts` was corrected to match; older docs describing an edge-to-edge bleed were wrong.

**Mobile.** `AppShell` uses `100dvh` (with `100vh` fallback) and `max(env(safe-area-*), gutter)` padding. Tap targets ≥ 44 px (buttons are 56 px). Primary actions sit at the bottom (thumb zone). `touch-action: manipulation` on buttons and the card; card text is `user-select: none`.

**Contrast claims in `tokens.ts` hold [verified, computed]:** `inkMuted` on page 5.3:1; ink on answer tones 12.7–14.2:1; ink on the ivory panel over any band 13.6–15.6:1; red focus ring on the feminine tone 4.7:1.

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
  "words": { "c01": { "box": 3, "lapses": 1, "dueAt": "2026-10-02T05:00:00.000Z", "lastSessionId": "s_1790000000000" } } }
```
`dueAt` is local midnight rendered as UTC — the example is a US-Central device (05:00Z = 00:00 CDT); it will differ by zone. A word absent from `words` is "new". `meta` is one EMA + a count, so it stays small at any deck size. `lapses` is all-time misses, unused for scheduling (reserved for leech detection).

**Write strategy:** optimistic local update, fire-and-forget S3 save, `console.warn` on failure, no ETag locking (single device assumed) — same as GroceryList's `historyStore.ts`. Write `progressDraft` once per session (on completion, plus `visibilitychange`/`pagehide` as a safety net), not per grade.

**Validate on load.** A malformed `dueAt` makes `isDue` false forever, and the word has a record so it is never "new" either — it silently vanishes from every session **[verified]**. Check `dueAt` parses and `box` ∈ 1..5 at the loader boundary (there is an `it.todo` for this in `srs.test.ts`). Progress ids absent from the word bank are ignored; bank ids absent from progress are new.

## 8. Known behaviours, gaps, refactor backlog

**Behaviours that may surprise (intentional or deliberately deferred — not bugs to fix unasked):**
- "n of m" `total` grows by one each time a card is requeued, and a session can't finish while a card keeps being missed (no retry cap). *User has parked this; leave as-is.*
- `gotCount + missedCount` counts every tap, including requeue retries and replays, so it can exceed the queue size; the summary screen shows these.
- A single early miss can throttle new words to 2/session until six consecutive first-try Gots recover the rate.
- "Study again" replays the initial queue as pure practice (no scheduling effect). *Rebuilding the queue from `progressDraft` instead was floated and parked.*
- `sampleProgress.ts` stamps `Date.now()` at import time; fine for a demo, stale in a long-lived tab.

**Gaps:**
- Focus is lost after reveal (Show answer becomes `visibility: hidden` while focused); no `aria-live` announcement of the answer for screen readers.
- No "tap to flip" hint on the front for touch users; no keyboard shortcuts (Space reveal, 1/2 grade).
- No leech detection (`lapses` climbs, nothing surfaces it).
- Plural nouns (all "die") aren't modelled; they'd be coloured feminine.
- New-word order is word-bank order; revisit once the bank has hundreds of entries.
- `article` on `Flashcard` is "nouns only" by convention; a discriminated union would enforce it.
- `ProgressMap` is typed as if every key exists; `Partial<Record<…>>` (or `noUncheckedIndexedAccess`) would force the undefined checks.
- No tests for `styles/*`, `GlobalStyle.ts`, `getWordFontSize`/`getAnswerTone` directly (both are exercised indirectly only).

**Refactor candidates, in rough priority:**
1. **Async loader.** `FlashCards` already takes `wordBank`/`progress`/`deckName` as props. Remaining: a `useDeckData()` returning `{ status, wordBank, progress }`, rendering `<FlashCards>` only when `status === 'ready'` (inputs are read once at mount, §4). *Needs the GroceryList S3 files (`s3Storage.ts`/`historyStore.ts`), which the user has parked; the AWS deps are already in the host.*
2. **Persist hook.** `useProgressPersistence(progressDraft, isComplete)` implementing §7's write strategy.
3. **Loader-boundary validation** (§7), turning the `it.todo` into real tests.
4. **Extract `requeueMissed(queue, index, card, gap)`** from the hook into `srs.ts` so the requeue is unit-testable without React (it's covered through the hook today).
5. Direct unit tests for `getWordFontSize` and `getAnswerTone` (cheap, pure).
6. Split `renderBody` in `FlashCards.tsx` into `SummaryView` / `EmptyView` components once S3 states (loading, error) arrive.

## 9. Testing & verification

**Setup:** the host already has vitest 4.1, jsdom 29, `@testing-library/react` 16 (React 19) and jest-dom, and `"test": "vitest"` (watch mode). Nothing to install. One-shot run: `npm test -- --run` (or `npx vitest run`). No config is required by design: each DOM test file starts with `// @vitest-environment jsdom`, imports `describe/it/expect/vi` explicitly (no reliance on globals), and calls RTL's `cleanup` itself. `srs.test.ts` runs in plain Node. The suite does not use jest-dom matchers. If the host's vitest config differs from the defaults, the suite still passes — see the matrix below.

**Mocking pitfall (learned the hard way).** `FlashCards.states.test.tsx` originally `vi.mock`ed `./sampleDeck` and `./sampleProgress`; the user reported every test in that file failing on the host. The host's vitest config wasn't visible, so the cause was reproduced rather than observed: on the host's major versions the suite passes with default config, and gives "all 3 mocking tests fail, the other 73 pass" under either of two ordinary configs. Cause: `vi.mock` only takes effect if the mocked module hasn't already been loaded in that worker. Two ordinary configs break that — `test.isolate: false`, or a `setupFiles` entry that imports app code — and both give exactly this symptom (every test in the mocking file fails, nothing else does). The versions were not the cause. **Fix and rule:** `FlashCards` takes its data as props, tests pass data directly, and no test mocks this folder's modules. Keep it that way; if you ever need a mock, `vi.resetModules()` inside `vi.hoisted()` is the documented escape hatch, but props are sturdier.

**Suite (78 tests + 1 `todo`, ~6 s):** `srs.test.ts` (43 + the `todo`: `dueDateFor` incl. DST/month/year rollover, `scheduleNext`, `updateSuccessRate`, `applyGrade`, `isDue`, `computeNewCardBudget` boundaries, `interleaveEvenly` incl. no-loss/order/immutability, `buildSessionQueue` ordering/cap/budget/orphans) · `useStudySession.test.tsx` (25: initial state, reveal one-way, grade, lockout both ways, requeue gap/clamp/last-card/no-cap, first-grade rule, restart, read-once inputs, progress from earlier sessions) · `FlashCards.test.tsx` (5: real sample data, full session, replay, tap-to-reveal, no article on prompt) · `FlashCards.states.test.tsx` (5: empty bank, nothing due, same-card remount, `deckName` prop, read-once props).

**How trustworthy is it — proven, not assumed [verified]:**
- Ran green on the host's declared **minimum** versions (react 19.2.8, RTL 16.3.2, vitest 4.1.9, jsdom 29.1.1, vite 8.1.0, TS 6.0.3) and on latest-in-range, and under a config matrix: default; `@vitejs/plugin-react` + vanilla-extract plugin + `globals` + jest-dom setup; all mock-reset flags on; `isolate: false` (threads, and forks/single-worker); a setup file importing app code; and those combined with `sequence.shuffle`.
- Ran green in six timezones (UTC, America/Chicago, America/Los_Angeles, Europe/Berlin, Asia/Kolkata, Pacific/Auckland). Dates in tests use the local-time constructor and local getters, so they're zone-independent; still run `TZ=America/Chicago npm test` after touching `dueDateFor`, because the DST case only bites in DST zones.
- **Mutation-checked:** 14 deliberately re-introduced bugs, each caught (the last four are the props: `deckName`, `wordBank` or `progress` ignored, plus the key regression against the props-based test). The original ten: exact-24 h due dates (5 tests fail in Chicago), removed first-grade guard (5), bare `card.id` key (1 — only the mocked-deck regression catches it), requeue gap off by one, lockout removed, interleave from the front, miss not dropping to box 1, `<` vs `<=` in `isDue`, `ceil` vs `floor` budget, article leaking onto the prompt.

**Conventions when adding tests:**
- Wait out the lockout between UI actions (`ACTION_LOCKOUT_MS + 50` of fake time) or the call is swallowed.
- `sampleProgress` stamps `Date.now()` at import: in tests using it, keep the fake clock on that timeline (`LOADED_AT + 1000`), otherwise its "due" words aren't due. Tests that supply their own data use a fixed local date instead.
- `FlashCards.test.tsx` pins the hand-derived sample queue order. If you change `sampleDeck`/`sampleProgress`, that assertion is *meant* to fail: re-derive the order by hand, don't just paste the new output.
- For page states that need different data, pass `wordBank` / `progress` props (see `FlashCards.states.test.tsx`). Don't `vi.mock` the sample modules (pitfall above).
- Keep fixes' regression tests failing-without-the-fix; check by reverting the fix once.

**Not verified — needs a device/browser** (jsdom has no layout): 3D flip, `visibility` timing, word-fit for the size tiers (esp. `Geschwindigkeitsbegrenzung` at 28 px), safe-area behaviour, `hyphens: auto` on iOS Safari, RevealBtn's touch-only hiding. `styles/*` and `GlobalStyle.ts` were read, not executed.

## 10. Decisions log and change log

**Decided by the user (2026-09-23):**
1. Success rate counts **first-try grades only**; retries don't count. ✔ implemented (`applyGrade`).
2. **Due dates snap to the start of the local day.** ✔ implemented (`dueDateFor`).
3. **`WordPanel` is the contained panel in the code**; the old bleed description was stale. ✔ comment/doc corrected.
4. Folder casing is `flashCards`. ✔ documented.
5. Tests: start coverage from the review's tests. ✔ 4 suites added. (At the time no runner was visible; the host's `package.json` turned out to already include vitest, which is what the suite targets.)

**Parked by the user — don't act on these unasked:** "Study again" rebuilding the queue vs. pure replay; the growing "n of m" / uncapped retries; uploading GroceryList's `s3Storage.ts`/`historyStore.ts` (needed for the S3 loader) and the host `index.html`/tsconfig.

**Change log:**
- *Review 1:* added pure `applyGrade` (first-grade-per-session); `useStudySession` routes grades through it inside the state updater (no stale closure), stable `isLockedOut`, lazy `useState` for `sessionId`/`startedAt`; `FlashCards.tsx` uses a composite FlipCard key, `isComplete`, and the same `wordBank` it passes to the hook; corrected the `FlipCard` key comment. Doc drift fixed: stale "missed cards aren't re-queued" gap removed; wrong `isDue`/`lastSessionId` rationale corrected; read-once inputs documented; example `dueAt` corrected.
- *Review 2:* `srs.ts`: added `dueDateFor`, removed `DAY_MS`/`addDays`, `scheduleNext` uses it. Comments updated in `FlashCards.constants.ts` (intervals are calendar days), `FlashCards.types.ts` (`dueAt` is local midnight; real role of `lastSessionId`), `styles/card.ts` (`WordPanel`). Added `srs.test.ts`, `useStudySession.test.tsx`, `FlashCards.test.tsx`, `FlashCards.states.test.tsx`. This doc restructured around decisions and testing.
- *Review 3 (test hardening):* uploaded `package.json` showed React 19 / RTL 16 / vitest 4 / jsdom 29 / TS 6 (earlier passes had been run on React 18 / RTL 14). `FlashCards.states.test.tsx` failed entirely on the host: `vi.mock` of the sample modules is defeated by a shared module cache (`isolate: false`, or a setup file importing app code) — reproduced, not version-related. `FlashCards.tsx` now takes optional `wordBank` / `progress` / `deckName` props (defaults = sample data, so `<FlashCards />` is unchanged, exported `FlashCardsProps`); the states test passes data via props with no mocking and gained two tests (`deckName`, read-once props). Verified across the config/version matrix in §9; typecheck and ESLint (react-hooks 7) clean. Doc: stack section rewritten from the real `package.json`; runner facts corrected.
