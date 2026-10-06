# FlashCards — working context

Read this before touching code; check claims against the code before large changes. Last reviewed 2026-09-25 (six passes: full read + executed tests; decisions applied and a test suite added; test suite hardened against the host's actual toolchain; word-forms feature added; verb table changed to a two-column layout; common-gender "der/die" nouns given a split answer background). **[verified]** = confirmed by running code, either the test suite (§9) or a one-off check; untagged claims come from reading.

## 1. Snapshot

Single-page German→English vocabulary flashcards (Anki-style), mobile-first (iPhone 15, 393×852 CSS px). Shares conventions with sibling sites: styled-components with `$transient` props, co-located `styles/`, pure utils, `animations.ts`, barrel `index.ts`, and a `tests/` subfolder. **Sibling sites' source is not in this folder** — mentions of `s3Storage.ts` / `historyStore.ts` point at files the user would need to re-upload.

**Done:** prompt → tap-to-flip → in-card Got it / Missed it; Leitner scheduling with calendar-day due dates; session composition (cap, new-word throttling, interleaving); in-session requeue of misses; an answer-side forms panel (noun plural/genitive, verb conjugation, adjective comparison — tap the German word to open it); gender-informed styling for nouns vs other word forms; 132-test suite.
**Not done:** any persistence. No S3 read/write, no auth wrapper. `progressDraft` lives in hook state and is lost on reload. Data comes from `sampleDeck.ts` and `sampleProgress.ts`.

**Folder name is `flashCards`** Match camel casing. The parent path (`src/…`) isn't in the upload.

**Tests live in `flashCards/tests/`** one level below the source they test (e.g. `import { srs } from '../srs'`). 

**Stack** — from the host's `package.json` (project name `foxstack`; the host app itself is not in this folder): React **19.2**, styled-components 6.5, wouter (routing), TypeScript **6.0**, Vite **8.1** with `@vitejs/plugin-react` 6 and `@vanilla-extract/vite-plugin` (vanilla-extract is not used by this folder), `@fontsource/barlow-semi-condensed`. For the future S3 loader the host already has `@aws-sdk/client-s3`, `@aws-sdk/credential-provider-cognito-identity` and `aws-amplify`. Lint: ESLint 10 with `eslint-plugin-react-hooks` 7 (React-Compiler-era rules: no ref access or impure calls like `Date.now()` during render) and `react-refresh`, run with `--max-warnings 0`. Tests: vitest **4.1**, jsdom **29**, `@testing-library/react` **16** (+ `dom` 10, `jest-dom` 6). This folder typechecks under strict TS 6 with Vite-template flags (`verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnused*`) and lints clean **[verified on the declared minimum versions and on latest-in-range]**. The host must supply a viewport meta with `viewport-fit=cover` (else `env(safe-area-inset-*)` is 0) and `vite/client` types for the `*.css` font imports in `GlobalStyle.ts`. The host's own `vite.config.ts` / vitest setup was **not seen** — see the mocking pitfall in §9.

## 2. Working agreements

- `srs.ts` stays **pure**: no React, no `Date.now()`. Callers pass `now` and `sessionId`. Same for anything time- or randomness-dependent you add.
- Session state lives only in `useStudySession`; components are presentational.
- Tunables go in `FlashCards.constants.ts` with a comment stating the trade-off.
- Scheduling semantics (intervals, box rules, what counts as a review) are product decisions. Raise them; don't change them silently.
- **Run the tests before returning code (the host's `npm test` is `vitest`, i.e. watch mode; one-shot is `npm test -- --run`), and add/adjust tests in the same change.** A behaviour change without a test change is a red flag. Don't `vi.mock` this folder's own modules in tests (§9) — pass data through props. Bug fixes get a regression test that fails without the fix.
- Update this file in the same change as the code it describes.
- **Word forms (plural, genitive, conjugation, comparative/superlative) are authored, reviewed strings, never generated at runtime**
- **This folder stays free of any Amplify/S3 import.** The auth paradigm elsewhere in the host is a top-line side-effect import (`import './config/amplify'`) in whatever module does the authenticated fetch; `FlashCards` and everything under this folder take plain data as props (§4) and have no reason to know Cognito or S3 exist. The future loader (§7, §8 item 1) does that import and the fetch, then renders `<FlashCards wordBank={...} progress={...} />` — confirmed with the user this needs no deviation from the existing pattern.

## 3. Task → file lookup

| Task | File |
|---|---|
| Add a field to a card | `FlashCards.types.ts` — `Flashcard` is a discriminated union on `partOfSpeech` (`NounCard` \| `VerbCard` \| `AdjectiveCard` \| `AdverbCard` \| `PhraseCard`); add the field to the right variant, then `sampleDeck.ts` → `CardPrompt.tsx` / `CardAnswer.tsx` if shown |
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
| Gender → answer background | `FlashCards.utils.ts` → `getAnswerTone`; colours in `styles/tokens.ts` → `answerTones` (incl. the `commonGender` split); applied in `styles/card.ts` → `CardBack` |
| A noun whose gender depends on the person it refers to (der/die Angestellte) | `article: 'der/die'` on a `NounCard` (`NounArticle` in `FlashCards.types.ts`); tone → `getAnswerTone`; genitive → `getDisplayGenitive`. See §6 |
| Whether/what to show when the German word is tapped | `FlashCards.utils.ts` → `hasForms` (gate), `getDisplayPlural`/`getDisplayGenitive` (noun); `WordForms.tsx` (the panel itself, all three parts of speech); `CardAnswer.tsx` (the toggle button + `useState`/`useId` wiring); `styles/forms.ts` |
| A noun's plural/genitive article ("die", "des"/"der") | `FlashCards.utils.ts` — `PLURAL_ARTICLE`/`GENITIVE_ARTICLE`; mechanical, not stored per word |
| A card's article, narrowed safely off the union | `FlashCards.utils.ts` → `getArticle` — never access `.article` on a bare `Flashcard` directly |
| Font sizing for prompt/translation | `WORD_SIZE_TIERS` (constants) + `getWordFontSize` (utils) |
| Colours, font, radius, max width | `styles/tokens.ts` |
| Show answer button | `FlashCards.tsx` + `styles/actions.ts` → `RevealBtn` |
| End-of-session / empty screens | `FlashCards.tsx` → `renderBody`; `styles/summary.ts`, `EmptyState` |
| Card entrance animation | `animations.ts` → `cardIn`, applied on `Scene` |
| Page shell / safe areas | `styles/layout.ts`; global reset + font imports in `GlobalStyle.ts` |
| Placeholder data | `sampleDeck.ts`, `sampleProgress.ts` — used only as the *default* props of `FlashCards`; replace with S3 loaders |
| What deck/progress/title the page shows | `FlashCards.tsx` props: `wordBank`, `progress`, `deckName` (all optional) |
| Progress data shapes | `FlashCards.types.ts` (`WordProgress`, `ProgressMap`, `SessionMeta`, `ProgressDocument`) |
| Tests (all under `tests/`, importing source via `../`) | `srs.test.ts` (scheduling) · `useStudySession.test.tsx` (hook) · `FlashCards.utils.test.ts` (pure helpers) · `WordForms.test.tsx` (forms panel, all parts of speech) · `CardAnswer.test.tsx` (toggle wiring) · `FlashCards.test.tsx` (page, real sample data) · `FlashCards.states.test.tsx` (page, data via props) |

## 4. Architecture

```
flashCards/
├── index.ts                barrel
├── FlashCards.tsx          page + props { wordBank?, progress?, deckName? }: header, FlipCard, RevealBtn, summary, empty states
├── FlipCard.tsx            Scene > Flipper > CardFront/CardBack; tap = reveal
├── CardPrompt.tsx          front: part-of-speech pill + bare German lemma
├── CardAnswer.tsx          back: pill, German (+article, tappable if hasForms), translation ⇄ WordForms, Missed it / Got it
├── WordForms.tsx           answer-side forms panel: noun plural/genitive, verb Präsens/Präteritum/Perfekt, adjective comparison
├── useStudySession.ts      session state: queue, index, isFlipped, counters, progressDraft
├── srs.ts                  pure: dueDateFor, scheduleNext, updateSuccessRate, applyGrade, isDue,
│                           computeNewCardBudget, interleaveEvenly, buildSessionQueue
├── FlashCards.types.ts     Flashcard = NounCard | VerbCard | AdjectiveCard | AdverbCard | PhraseCard
│                           (discriminated union on partOfSpeech), NounForms, VerbForms,
│                           VerbPersonForms, AdjectiveForms, Article, NounArticle (= Article | 'der/die'),
│                           Grade, AnswerTone, LeitnerBox,
│                           WordProgress, ProgressMap, SessionMeta, ProgressDocument
├── FlashCards.constants.ts WORD_SIZE_TIERS, FLIP_DURATION_MS, ACTION_LOCKOUT_MS,
│                           LEITNER_INTERVALS_DAYS, MAX_LEITNER_BOX, SESSION_CARD_CAP,
│                           MISSED_REQUEUE_GAP, SUCCESS_RATE_SMOOTHING,
│                           NEW_CARD_SUCCESS_RATE_HIGH/MED, NEW_CARDS_WHEN_STRUGGLING,
│                           DEFAULT_SESSION_META (currently unused — reserved for the loader)
├── FlashCards.utils.ts     getWordFontSize, getAnswerTone, getArticle, hasForms,
│                           getDisplayPlural, getDisplayGenitive (all pure)
├── animations.ts           cardIn
├── sampleDeck.ts / sampleProgress.ts   placeholders (most cards' `forms` are filled in — see §10)
├── GlobalStyle.ts          reset + @fontsource imports
├── styles/                 tokens, layout, header, card, actions, summary, forms
└── tests/                  srs, useStudySession, FlashCards, FlashCards.states, FlashCards.utils,
                            WordForms, CardAnswer, FlipCard — import source via `../`
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

**A second, unrelated piece of local state:** `CardAnswer` holds its own `showForms` boolean (via `useState`) for the forms-panel toggle. This is presentation-only — it never touches `useStudySession`, `progressDraft`, or scheduling — and needs no reset logic of its own, because `FlipCard`'s per-card key (§6) remounts `CardAnswer` fresh on every advance.

## 5. Scheduling & session behaviour (as implemented)

**Leitner boxes** (`LEITNER_INTERVALS_DAYS`, in calendar days): 1 → 1 · 2 → 3 · 3 → 7 · 4 → 16 · 5 → 30. No box 0: a word with no `progress.words[id]` entry is "new".

**Grade → box** (`scheduleNext`): Missed → always box 1 (`lapses`+1). Got → box+1, capped at 5. A word's first-ever grade (got or missed) → box 1. **[verified]**

**`dueAt` = local midnight, N calendar days after the grading day** (`dueDateFor`). Time of day at grading is irrelevant **[verified]**
**First grade per session wins** (`applyGrade`): once `progress.words[id].lastSessionId === sessionId`, further grades of that card in the same session leave `progressDraft` untouched, including `meta`. So `successRate`/`totalReviews` measure first-exposure recall only (**user-confirmed design**), and "Study again" is pure practice. **[verified]**

**`successRate`**: exponential moving average, α = `SUCCESS_RATE_SMOOTHING` (0.2). The first-ever review sets it outright to 0 or 1 rather than blending. Used only to size the new-word budget. From 0 it takes six consecutive first-try Gots to reach ≥ 0.7 **[verified]**.

**Session queue** (`buildSessionQueue`, built once, ≤ `SESSION_CARD_CAP` = 25):
1. Due reviews: a progress record exists, `dueAt ≤ session start`, `lastSessionId ≠ sessionId`; most-overdue first; up to the cap. Reviews always beat new words.
2. Remaining slots × new budget (`computeNewCardBudget`): rate ≥ 0.9 → all slots; ≥ 0.7 → `floor(half)`; below → at most 2 (never more than the slots left). New words = no progress record, in **word-bank order** (not random).
3. `interleaveEvenly`: new words spread through reviews at even spacing, first insert half a gap in. With any reviews present the first card is always a review; with more new than reviews the new ones arrive in runs. Sample data yields `c02, c05, c06, c01, c07, c08, c04, c09, c10` **[verified]**.

Note on `isDue`'s `lastSessionId` clause: with a fresh session id at build time it cannot fire. It only matters if a queue is ever *rebuilt* within the same session (e.g. a future "Study again" that rebuilds from `progressDraft`).

**In-session requeue vs. persisted schedule are different mechanisms.** A missed card is spliced `MISSED_REQUEUE_GAP` (4) cards later in `liveQueue` — ephemeral, never touches `progressDraft` (its schedule was fixed by its first grade). Clamped to the queue end: with < 4 cards left it goes last; if it *was* last (or the only card) it is the very next card **[verified]**. There is no retry cap: the session ends only when every requeued instance is finally graded Got **[verified]**.

**Opening the forms panel (WordForms) never affects scheduling.** **[verified]**.

## 6. Invariants — break these and things visibly fail

**FlipCard key must change on every advance:** `key={`${card.id}-${position}`}`, not `card.id`. A remount is what makes the next card appear un-flipped and slide in (`cardIn`) rather than animating a flip-back that could flash the next answer. A bare `card.id` fails when the same card comes up twice in a row (last/only card missed): no remount. Guarded by the regression test in `FlashCards.states.test.tsx` **[verified: fails when the key is reverted]**.

**Flip is one-way.** Tap on the card or "Show answer" reveals; there is no flip-back. Advancing happens only through the in-card Got it / Missed it buttons.

**Double-tap lockout.** `reveal` and `grade` are both ignored within `ACTION_LOCKOUT_MS` (350 ms) of the previous action **[verified]**; `restart` also arms it. Without it, a double-tap on the card lands on Got/Missed (they appear under the finger) and a double-tap on Got it reveals the next card. Corollary for tests: advance fake timers > 350 ms between actions.

**Grade buttons live on the back face.** `CardBack` is `visibility: hidden` until `$flipped`, so it has no tab stop and no hit-testing through the front. Grade clicks call `stopPropagation` so they don't bubble to `Scene`'s reveal handler.

**Show answer button.** Visually hidden on touch (`@media (hover: none) and (pointer: coarse)`) — the card tap is the control there — but kept in the accessibility tree for VoiceOver. Visible on desktop. Uses `visibility: hidden` (not unmount) once flipped so the card doesn't resize.

**Colour is never the only cue for gender.** `getAnswerTone`: noun + article → masculine blue / feminine red / neuter green; a `der/die` noun → the split blue/red tone (below); anything else → orange. The answer-side German word is also prefixed with its article ("der/die Angestellte" for a common-gender noun). Got it / Missed it are deliberately neutral ink (filled vs outlined), not green/red, to avoid clashing with the gender colours.

**3D flip.** `Scene` has `perspective`; `Flipper` rotates with `preserve-3d`; both faces are `position: absolute; inset: 0; backface-visibility: hidden`; the back is pre-rotated 180°. No `backdrop-filter` inside faces (Safari breaks it under preserve-3d) — `WordPanel` relies on its 88 % ivory opacity alone. Front face is `aria-hidden` when flipped **[verified]**; back face is hidden via `visibility`. `prefers-reduced-motion` disables the flip transition (instant swap) and the entrance animation.

**Prompt shows the bare lemma only.** `Flashcard.german` has no article; `article` is separate and shown on the answer side only. Don't put the article on the prompt **[verified: a test fails if it leaks]**.

**Word sizing.** `getWordFontSize` picks px from `WORD_SIZE_TIERS` by `max(longest token, ceil(total length / 2))`, for both the German prompt and the English translation. `lang` (`de`/`en`) + `hyphens: auto` are the fallback for anything still too wide. Tiers are tuned for Barlow Semi Condensed 700 in a ~313 px inner width (393 − 2×16 gutter − 2×24 `cardPadding`) — retune if the font, gutter or `cardPadding` change. Not visually verified (§9).

**Mobile.** `AppShell` uses `100dvh` (with `100vh` fallback) and `max(env(safe-area-*), gutter)` padding. Tap targets ≥ 44 px (buttons are 56 px). Primary actions sit at the bottom (thumb zone). `touch-action: manipulation` on buttons and the card; card text is `user-select: none`.

**Contrast claims in `tokens.ts` hold [verified, computed]:** `inkMuted` on page 5.3:1; ink on answer tones 12.7–14.2:1; ink on the ivory panel over any band 13.6–15.6:1; red focus ring on the feminine tone 4.7:1.

**Common-gender nouns (`article: 'der/die'`) — a split blue/red answer background** 

- **No `WordPanel`-style backing**

- **Not covered, on purpose:** meaning-changing pairs (der See "lake" / die See "sea"), regional variation (der/das Joghurt), and words whose grammatical gender contradicts the referent (das Mädchen). Extending `NounArticle` to other combinations is a type change plus a new tone decision each, not a config tweak.

**Never access `.article` or `.forms` on a bare `Flashcard`.** It's a discriminated union (`NounCard | VerbCard | AdjectiveCard | AdverbCard | PhraseCard`)

**The forms toggle must `stopPropagation`, same as the grade buttons.**  **[verified: test fails if stopPropagation is removed]**.

**Perfekt is 3rd-person-singular only, not a 6-person table.** Präsens and Präteritum are full tables; Perfekt (`VerbForms.perfect`) deliberately isn't, matching how German is conventionally taught and memorized.

**Reflexive verbs have no boolean flag.** A verb is reflexive if and only if its `german` lemma starts with "sich" (e.g. `sich erinnern`, matching German dictionary convention)

**Plural and genitive articles are computed, never stored.** `getDisplayPlural`/`getDisplayGenitive` prefix "die" (always, for any plural) or "des"/"der" (from the noun's own gender) onto the stored bare form. This is a fixed, universal mapping, so don't add an `article` field to `NounForms`.

**A long forms panel scrolls inside the card; it must not get clipped.** `AnswerBody` has `min-height: 0` and `WordForms`' `FormsScroll` has `overflow-y: auto; max-height: 100%` specifically so a full verb table (13+ rows) scrolls internally rather than being cut off by `Face`'s `overflow: hidden`. This chain is reasoned from CSS flexbox rules, not seen on a device — jsdom can't lay anything out. If a verb's table looks clipped or unscrollable on a real phone, look here first (§9).

**The Präsens/Präteritum tables are two columns, paired singular-with-plural (ich/wir, du/ihr, er,sie,es/sie,Sie), not one column of six rows**

## 7. Persistence design (planned, not built)

Two S3 documents, mirroring GroceryList's content/state split:

**`vocabulary/words.json`** — word bank; rarely changes. Keys are synthetic ids (`c01`, …). `article` may also be `"der/die"` for a common-gender noun (§6). `forms` is optional per FlashCards.types.ts and per-word — omit it entirely for a card whose forms haven't been authored yet (see §6: that reads identically to "this word genuinely has none", a known gap).
```json
{
  "c01": {
    "german": "Handschuh", "english": "glove", "partOfSpeech": "noun", "article": "der",
    "forms": { "plural": "Handschuhe", "genitiveSingular": "Handschuhs" }
  },
  "c05": {
    "german": "sich erinnern", "english": "to remember", "partOfSpeech": "verb",
    "forms": {
      "present": { "ich": "erinnere mich", "du": "erinnerst dich", "erSieEs": "erinnert sich", "wir": "erinnern uns", "ihr": "erinnert euch", "sieSie": "erinnern sich" },
      "preterite": { "ich": "erinnerte mich", "du": "erinnertest dich", "erSieEs": "erinnerte sich", "wir": "erinnerten uns", "ihr": "erinnertet euch", "sieSie": "erinnerten sich" },
      "perfect": { "auxiliary": "hat", "participle": "sich erinnert" },
      "government": "an + Akk."
    }
  }
}
```
(The in-app `Flashcard` also carries `id` inside the object; the loader must inject it from the key.)

**`vocabulary/progress.json`** — SRS state; rewritten per session.
```json
{ "meta": { "successRate": 0.82, "totalReviews": 143 },
  "words": { "c01": { "box": 3, "lapses": 1, "dueAt": "2026-10-02T05:00:00.000Z", "lastSessionId": "s_1790000000000" } } }
```
`dueAt` is local midnight rendered as UTC. `meta` is one EMA + a count, so it stays small at any deck size. `lapses` is all-time misses, unused for scheduling (reserved for leech detection).

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
- Plural nouns (all "die") aren't modelled as their own cards; they'd be coloured feminine by `getAnswerTone` if one existed. (Unrelated to the new plural-*form* shown inside a singular noun's forms panel, which is unaffected.)
- New-word order is word-bank order; revisit once the bank has hundreds of entries.
- `ProgressMap` is typed as if every key exists; `Partial<Record<…>>` (or `noUncheckedIndexedAccess`) would force the undefined checks.
- No tests for `styles/*`, `GlobalStyle.ts` (any of them) — CSS/layout can't be exercised in jsdom (§9).
- A card with no `forms` authored yet and a card that genuinely has no forms (e.g. `Rücksichtnahme`, an abstract noun) look identical: neither gets a tappable word. There's no "forms pending" marker to distinguish "not written yet" from "nothing to write." Worth a flag if the deck grows and this starts mattering for authoring workflow.
- Adverbs and phrases have no forms modelled (2026-09-24 scope decision — nouns/verbs/adjectives only for now). Candidates for later, not yet designed: adverb comparison for the handful that inflect (gern → lieber → am liebsten; most adverbs like `trotzdem` don't change at all); an example-sentence field for every part of speech, which would help adverbs and phrases most since they have no forms to show.
- **The common-gender sample card (`c11`, der/die Angestellte) is deliberately not due** in `sampleProgress.ts`, so it never appears in the running demo's session — the split background can only be seen by making it due. Done that way because adding a due/new card changes the pinned queue-order and "n of 9" assertions in `FlashCards.test.tsx` (a legitimate but invasive re-derivation, per §9). To see it live: drop `c11` from `sampleProgress.ts` (it then counts as new: queue becomes 10) and re-derive those assertions by hand.
- Adjectival nouns have one more quirk the forms panel doesn't show: without a definite article the masculine changes form — *ein Angestellter* / *eine Angestellte*, *Angestellter* / *Angestellte*. The card shows the definite-article form ("der/die Angestellte"), which is correct as far as it goes. A follow-up if it matters to the learner; not modelled.
- `VerbForms.government` is free text ("an + Akk.", "jdn. an etw. (Akk.)") shown as a note — not structured data. Fine for display; would need restructuring (e.g. `{ preposition: string; case: 'Akk' | 'Dat' | 'Gen' }`) if a future feature ever wanted to filter or drill on case government specifically.
- No `preposition`/`conjunction` part-of-speech types yet, floated when this feature was proposed (a preposition's case, a conjunction's word-order effect) — not built, not decided on.

**Refactor candidates, in rough priority:**
1. **Async loader.** `FlashCards` already takes `wordBank`/`progress`/`deckName` as props. Remaining: a `useDeckData()` returning `{ status, wordBank, progress }`, rendering `<FlashCards>` only when `status === 'ready'` (inputs are read once at mount, §4). The loader is also where the `import './config/amplify'` side-effect import belongs — see §2. *Needs the GroceryList S3 files (`s3Storage.ts`/`historyStore.ts`), which the user has parked; the AWS deps are already in the host.*
2. **Persist hook.** `useProgressPersistence(progressDraft, isComplete)` implementing §7's write strategy.
3. **Loader-boundary validation** (§7), turning the `it.todo` into real tests. Now also needs to validate `forms` shapes per part of speech, since a malformed `words.json` entry (e.g. a verb missing `preterite`) would currently just throw when `WordForms` tries to render it — no graceful fallback for authoring mistakes exists yet.
4. **Extract `requeueMissed(queue, index, card, gap)`** from the hook into `srs.ts` so the requeue is unit-testable without React (it's covered through the hook today).
5. Split `renderBody` in `FlashCards.tsx` into `SummaryView` / `EmptyView` components once S3 states (loading, error) arrive.
6. On a real device, confirm the forms panel actually scrolls inside the card for a full verb table rather than clipping (§6, §9) — currently reasoned from CSS rules, not seen. Now also worth checking specifically: whether the narrower two-column value cells actually wrap/hyphenate acceptably for a long form like "erinnertest dich", or whether font-size needs reducing for that table specifically (§6).

## 9. Testing & verification

**Setup:** the host already has vitest 4.1, jsdom 29, `@testing-library/react` 16 (React 19) and jest-dom, and `"test": "vitest"` (watch mode). Nothing to install. One-shot run: `npm test -- --run` (or `npx vitest run`). No config is required by design: each DOM test file starts with `// @vitest-environment jsdom`, imports `describe/it/expect/vi` explicitly (no reliance on globals), and calls RTL's `cleanup` itself. `srs.test.ts` runs in plain Node. The suite does not use jest-dom matchers. If the host's vitest config differs from the defaults, the suite still passes — see the matrix below.

**Mocking pitfall (learned the hard way).** `FlashCards.states.test.tsx` originally `vi.mock`ed `./sampleDeck` and `./sampleProgress`; the user reported every test in that file failing on the host. The host's vitest config wasn't visible, so the cause was reproduced rather than observed: on the host's major versions the suite passes with default config, and gives "all 3 mocking tests fail, the other 73 pass" under either of two ordinary configs. Cause: `vi.mock` only takes effect if the mocked module hasn't already been loaded in that worker. Two ordinary configs break that — `test.isolate: false`, or a `setupFiles` entry that imports app code — and both give exactly this symptom (every test in the mocking file fails, nothing else does). The versions were not the cause. **Fix and rule:** `FlashCards` takes its data as props, tests pass data directly, and no test mocks this folder's modules. Keep it that way; if you ever need a mock, `vi.resetModules()` inside `vi.hoisted()` is the documented escape hatch, but props are sturdier.

**Suite (131 tests + 1 `todo`, 132 total, ~6 s, 8 files under `tests/`):** `srs.test.ts` (43 + the `todo`: `dueDateFor` incl. DST/month/year rollover, `scheduleNext`, `updateSuccessRate`, `applyGrade`, `isDue`, `computeNewCardBudget` boundaries, `interleaveEvenly` incl. no-loss/order/immutability, `buildSessionQueue` ordering/cap/budget/orphans) · `useStudySession.test.tsx` (25: initial state, reveal one-way, grade, lockout both ways, requeue gap/clamp/last-card/no-cap, first-grade rule, restart, read-once inputs, progress from earlier sessions) · `FlashCards.utils.test.ts` (22: `getWordFontSize` tier boundaries, `getAnswerTone` per article + non-nouns, `getArticle` incl. the bad-data/discriminant case and the `"der/die"` literal, `hasForms` per part of speech incl. a common-gender noun, `getDisplayPlural`/`getDisplayGenitive` incl. gender-derived article and the `des/der` common-gender case) · `WordForms.test.tsx` (18: noun/verb/adjective rendering, missing-field fallback text, reflexive pronouns rendered as plain data, government note shown only when present, defensive no-op for adverb/missing-forms, two-column pairing, headers/id association per WCAG H43, unique header ids across Präsens/Präteritum, the overflow-wrap/hyphens guard present in the generated stylesheet, a common-gender noun's `des/der` genitive) · `CardAnswer.test.tsx` (8: button vs. plain text, toggle + `aria-expanded`/`aria-controls`, stopPropagation for both the toggle and the grade buttons, `onGrade` wiring, the combined "der/die" label) · `FlipCard.test.tsx` (3: the answer-side background per tone — the exact common-gender split, a plain solid masculine tone, an unaffected non-noun tone; reads the generated stylesheet, since jsdom can't paint) · `FlashCards.test.tsx` (7: real sample data, full session, replay, tap-to-reveal, no article on prompt, forms toggle end-to-end, no-forms card stays plain text) · `FlashCards.states.test.tsx` (5: empty bank, nothing due, same-card remount, `deckName` prop, read-once props).

**How trustworthy is it — proven, not assumed [verified]:**
- Ran green on the host's declared **minimum** versions (react 19.2.8, RTL 16.3.2, vitest 4.1.9, jsdom 29.1.1, vite 8.1.0, TS 6.0.3) and on latest-in-range, and under a config matrix: default; `@vitejs/plugin-react` + vanilla-extract plugin + `globals` + jest-dom setup; all mock-reset flags on; `isolate: false` (threads, and forks/single-worker); a setup file importing app code; and those combined with `sequence.shuffle`.
- Ran green in six timezones (UTC, America/Chicago, America/Los_Angeles, Europe/Berlin, Asia/Kolkata, Pacific/Auckland). Dates in tests use the local-time constructor and local getters, so they're zone-independent; still run `TZ=America/Chicago npm test` after touching `dueDateFor`, because the DST case only bites in DST zones.
- **Mutation-checked:** 30 deliberately re-introduced bugs across every review, every one caught on the *final* pass — but not all on the first: two mutations to the forms feature (`getArticle` bypassing the discriminant; the toggle's `stopPropagation` removed) slipped through the first mutation run undetected, exactly because the existing test fixtures never happened to exercise those specific edge cases. Both got a purpose-built regression test afterward (the "bad data" case in `FlashCards.utils.test.ts`, described in §6; the wrapped-`onClick`-spy test in `CardAnswer.test.tsx`), then were re-confirmed caught. Lesson for next time: after writing tests for the "big" behavioural rules, also mutate each smaller line of new logic individually — don't assume a passing suite caught everything just because the obvious cases are covered. The two-column verb table got this discipline applied from the start — all 4 of its mutations were caught on the first pass. The common-gender split then showed the same lesson again from the other side: 2 of its 4 mutations (gradient changed from a hard 50/50 stop to a 0%/100% blend; blue and red swapped) slipped through because the first version of the `FlipCard` test only asserted "a gradient exists and both colours appear". Both are deliberate design decisions, so the assertion was tightened to the exact `linear-gradient(to right, #CFE0F5 50%, #F3CFCB 50%)` string and both were re-confirmed caught. Rule of thumb: when a design choice lives in a CSS value, assert the value, not just its presence. Earlier rounds, still caught (plus, this round: `getAnswerTone` skipping the `der/die` branch, `getDisplayGenitive` dropping the second article): exact-24 h due dates, removed first-grade guard, bare `card.id` key, requeue gap off by one, lockout removed, interleave from the front, miss not dropping to box 1, `<` vs `<=` in `isDue`, `ceil` vs `floor` budget, article leaking onto the prompt, `deckName`/`wordBank`/`progress` props ignored, `hasForms` hardcoded true, genitive article hardcoded to "des", plural article prefix dropped, government note rendering unconditionally, `canExpand` hardcoded false, `aria-expanded` hardcoded false, a grade button also toggling forms, wrong singular/plural pairing, a value's `headers` pointed at the wrong label, Präsens/Präteritum header ids collided, the overflow-wrap/hyphens guard removed.

**Conventions when adding tests:**
- Live in `flashCards/tests/`; import source via `../` (e.g. `from '../srs'`) — the user fixed a batch of these once; don't reintroduce root-level co-located test files.
- Wait out the lockout between UI actions (`ACTION_LOCKOUT_MS + 50` of fake time) or the call is swallowed. The forms toggle has no such lockout (§6) — it's not part of the study-session flow.
- `sampleProgress` stamps `Date.now()` at import: in tests using it, keep the fake clock on that timeline (`LOADED_AT + 1000`), otherwise its "due" words aren't due. Tests that supply their own data use a fixed local date instead.
- `FlashCards.test.tsx` pins the hand-derived sample queue order. If you change `sampleDeck`/`sampleProgress`, that assertion is *meant* to fail: re-derive the order by hand, don't just paste the new output. (Adding `forms` to existing cards, or reclassifying a card's `partOfSpeech`/`german`/`english` without changing its `id` or due date, does *not* change queue order — only ids and dates do.)
- For page states that need different data, pass `wordBank` / `progress` props (see `FlashCards.states.test.tsx`). Don't `vi.mock` the sample modules (pitfall above).
- To check a styled-components style in jsdom (which has no layout/paint), find the element's class, then read its declaration block out of the injected `<style>` tags — see `styleRulesFor` in `FlipCard.test.tsx`. Use a regex, not `CSS.escape`: some jsdom versions don't expose `CSS` as a global (found the hard way). This verifies the *rule* is generated, not how it *looks* — the visual result still needs a device.
- This suite doesn't use jest-dom matchers (e.g. `toBeEmptyDOMElement`), even though the host has it installed — asserting directly (`container.innerHTML`, `element.tagName`, `getAttribute(...)`) keeps every test file independent of whether some *other* file happened to import a jest-dom setup first (see the mocking pitfall above for why cross-file ordering assumptions bite here).
- Keep fixes' regression tests failing-without-the-fix; check by reverting the fix once — this is exactly how the two missed forms-feature mutations were caught (see above).

**Not verified — needs a device/browser** (jsdom has no layout): 3D flip, `visibility` timing, word-fit for the size tiers (esp. `Geschwindigkeitsbegrenzung` at 28 px), safe-area behaviour, `hyphens: auto` on iOS Safari, RevealBtn's touch-only hiding, whether the forms panel actually scrolls inside the card for a full verb table rather than clipping (§6). Also: how the split common-gender background looks with the seam running behind the centred German word (§6) — legibility is argued from verified contrast, aesthetics are not seen. `styles/*` and `GlobalStyle.ts` were read, not executed.

## 10. Decisions log and change log

**Decided by the user (2026-09-23):**
1. Success rate counts **first-try grades only**; retries don't count. ✔ implemented (`applyGrade`).
2. **Due dates snap to the start of the local day.** ✔ implemented (`dueDateFor`).
3. **`WordPanel` is the contained panel in the code**; the old bleed description was stale. ✔ comment/doc corrected.
4. Folder casing is `flashCards`. ✔ documented.
5. Tests: start coverage from the review's tests. ✔ 4 suites added. (At the time no runner was visible; the host's `package.json` turned out to already include vitest, which is what the suite targets.)

**Parked by the user — don't act on these unasked:** "Study again" rebuilding the queue vs. pure replay; the growing "n of m" / uncapped retries; uploading GroceryList's `s3Storage.ts`/`historyStore.ts` (needed for the S3 loader) and the host `index.html`/tsconfig.

**Decided by the user (2026-09-24, word-forms feature):**
1. Forms (plural/genitive, conjugation, comparative/superlative) are **authored at authoring time**, never generated at runtime. ✔ implemented — `NounForms`/`VerbForms`/`AdjectiveForms` hold complete display strings, and `WordForms.tsx` does no grammar logic beyond the mechanical plural/genitive article (§6).
2. First-cut scope is **nouns, verbs and adjectives**; adverbs and phrases get no forms for now. ✔ implemented; the deferred adverb-comparison and example-sentence ideas are recorded in §8, not built.
3. **Fix `c05`**, which was mistagged `phrase` as "sich erinnern an". ✔ reclassified to a reflexive `verb`, lemma "sich erinnern" ("an" moved to `government`) — see `sampleDeck.ts` and §6's reflexive-verb convention.
4. **Include the noun genitive** alongside the plural. ✔ implemented (`getDisplayGenitive`, gender-derived article).
5. **In-place swap** presentation (tap the German word; it replaces the translation, tap again to return). ✔ implemented in `CardAnswer.tsx`.

Also confirmed with the user: adding props to `FlashCards` doesn't require any deviation from the host's `amplify.ts` side-effect-import auth paradigm. `FlashCards` and this whole folder take plain data as props and have no reason to import Amplify/S3 themselves; the future loader does the `import './config/amplify'` top-line import and the fetch, then passes the results as props. See §2 and §8 item 1.

**Decided by the user (2026-09-25):** the Präsens/Präteritum verb tables display as two columns, singular paired with its plural counterpart (ich/wir, du/ihr, er,sie,es/sie,Sie), instead of one column of six rows — "to better use space." ✔ implemented (`PersonTable` in `WordForms.tsx`); see §6 for the readability guards this required and §9 for how they were verified.

**Decided by the user (2026-09-25, later):** words that take the gender of the person they refer to get a split blue/red background on the answer side. ✔ implemented as `article: 'der/die'` → `'commonGender'` tone (§6). The user specified only the *what* (split blue/red); the *how* — hard 50/50 stop, blue on the left, no backing panel, genitive shown as "des/der", sample card `c11` — was decided in implementation and is recorded in §6 for easy reversal.

**Change log:**
- *Review 1:* added pure `applyGrade` (first-grade-per-session); `useStudySession` routes grades through it inside the state updater (no stale closure), stable `isLockedOut`, lazy `useState` for `sessionId`/`startedAt`; `FlashCards.tsx` uses a composite FlipCard key, `isComplete`, and the same `wordBank` it passes to the hook; corrected the `FlipCard` key comment. Doc drift fixed: stale "missed cards aren't re-queued" gap removed; wrong `isDue`/`lastSessionId` rationale corrected; read-once inputs documented; example `dueAt` corrected.
- *Review 2:* `srs.ts`: added `dueDateFor`, removed `DAY_MS`/`addDays`, `scheduleNext` uses it. Comments updated in `FlashCards.constants.ts` (intervals are calendar days), `FlashCards.types.ts` (`dueAt` is local midnight; real role of `lastSessionId`), `styles/card.ts` (`WordPanel`). Added `srs.test.ts`, `useStudySession.test.tsx`, `FlashCards.test.tsx`, `FlashCards.states.test.tsx`. This doc restructured around decisions and testing.
- *Review 3 (test hardening):* uploaded `package.json` showed React 19 / RTL 16 / vitest 4 / jsdom 29 / TS 6 (earlier passes had been run on React 18 / RTL 14). `FlashCards.states.test.tsx` failed entirely on the host: `vi.mock` of the sample modules is defeated by a shared module cache (`isolate: false`, or a setup file importing app code) — reproduced, not version-related. `FlashCards.tsx` now takes optional `wordBank` / `progress` / `deckName` props (defaults = sample data, so `<FlashCards />` is unchanged, exported `FlashCardsProps`); the states test passes data via props with no mocking and gained two tests (`deckName`, read-once props). Verified across the config/version matrix in §9; typecheck and ESLint (react-hooks 7) clean. Doc: stack section rewritten from the real `package.json`; runner facts corrected.
- *Review 4 (word-forms feature):* `FlashCards.types.ts`: `Flashcard` is now a discriminated union (`NounCard | VerbCard | AdjectiveCard | AdverbCard | PhraseCard`) with `NounForms`/`VerbForms`/`VerbPersonForms`/`AdjectiveForms` — this also closes the old "`article` is nouns-only by convention" gap, since it's now enforced by the type. `FlashCards.utils.ts`: new pure helpers `getArticle`, `hasForms`, `getDisplayPlural`, `getDisplayGenitive`. New `WordForms.tsx` (the panel, switching on part of speech) and `styles/forms.ts`. `CardAnswer.tsx`: the German word becomes a toggle button (`useState` + `useId`) when `hasForms` is true, swapping the translation for `WordForms` in place; `stopPropagation` on the toggle, same as the grade buttons. `styles/card.ts`: added `AnswerGermanButton`; `AnswerBody` gained `min-height: 0` so a long forms panel scrolls instead of being clipped (§6 — not device-verified). `sampleDeck.ts`: most nouns/verbs/the adjective now carry `forms`; `c05` reclassified from `phrase` ("sich erinnern an") to a reflexive `verb` ("sich erinnern", with "an" moved into `government`) per the user's decision 3 above; `c02` and `c07` deliberately left with partial/no forms to exercise those display paths. Three new test files (`FlashCards.utils.test.ts`, `WordForms.test.tsx`, `CardAnswer.test.tsx`) plus two new tests in `FlashCards.test.tsx`; this closes the old "direct unit tests for getWordFontSize/getAnswerTone" backlog item as a side effect. Mutation-tested (§9): 2 of the new mutations weren't caught by the first pass and got purpose-built regression tests before being reconfirmed. Confirmed with the user that this required no change to the existing `amplify.ts` auth paradigm (§2, §8). Tests now live in `flashCards/tests/`, per the user's standing instruction — this doc, and all new test files, follow that.
- *Review 5 (two-column verb table):* `WordForms.tsx`'s `PersonTable` restructured from a 6-row, 2-column table to a 3-row, 4-column one, pairing singular with plural per row (§10 decision above). Added the WCAG H43 `headers`/`id` technique to disambiguate the two row headers now sharing each `<tr>` — without it, a screen reader's default table algorithm can attribute a value to every preceding row header in its row, not just its own. `styles/forms.ts`: new `FormsLabelSecond` (extra left padding, visually separating the two pairs); `FormsValue` gained `overflow-wrap: break-word; hyphens: auto;` and dropped its `width: 100%` (which doesn't make sense once a row has two value cells) — both changes needed once the layout gives each conjugated form roughly half its previous width. `WordForms.test.tsx` gained 4 tests: correct pairing, the `headers`/`id` wiring (caught a mutation the same day it was written), unique ids across Präsens/Präteritum, and a check that the wrap/hyphenation CSS actually made it into the generated stylesheet (jsdom can't verify real wrapping, so this checks the rule exists rather than its visual effect). All 4 of this review's mutations were caught on the first pass.
- *Review 6 (common-gender nouns):* `FlashCards.types.ts`: new `NounArticle = Article | 'der/die'`; `NounCard.article` widened to it; `AnswerTone` gained `'commonGender'`. `FlashCards.utils.ts`: `getAnswerTone` returns `'commonGender'` for `'der/die'`; `getArticle` return type widened; `getDisplayGenitive` shows `des/der <stem>` for common-gender nouns. `styles/tokens.ts`: `answerTones` now spreads a private `answerToneColors` and adds the hard-stop blue-left/red-right gradient built from it — `CardBack` needed no change. `sampleDeck.ts`/`sampleProgress.ts`: added `c11` (der/die Angestellte), deliberately not due so the pinned queue assertions are untouched. Tests: additions to `FlashCards.utils.test.ts`, `WordForms.test.tsx`, `CardAnswer.test.tsx`, and a new `FlipCard.test.tsx` (there was no direct test of the tone→background wiring before). 4 mutations; 2 initially missed and fixed by tightening one assertion (§9).
