# This app: FlashCards
Single-page German→English vocabulary flashcards (Anki-style), mobile-first (iPhone 15, 393×852 CSS px).

## Ground rules
- Think like a senior software engineer unless directed otherwise.
- When completing a task, update this context md file.
- Ask for any files that would aid in task completion.
- Be laconic in commentary.

### When editing files
- return zip of new files and altered files in their entirety with proper directory structure.

### When updating the context md file
- your audience is an AI agent
- eschew surplusage; follow precedent
- if context file size exceeds your context limits, notify me

## Stack
React>19, typescript>6, vite, vitest, AWS (Amplify, S3, Cognito)

## Architecture
### base path 
foxstack/src/flashCards

### file structure
├── App.tsx                 base wouter routing switch; /flashcards → lazy FlashCardsRoot
config/
├── amplify.ts              configures the Amplify library with the Cognito User Pool and Identity Pool
├── aws.ts                  single source of truth for all AWS configuration (s3.flashCardsKey = flashcards/library.json)
flashCards/
├── index.ts                barrel
├── FlashCardsRoot.tsx      auth + persistence shell, default export withAuthenticator. Imports config/amplify FIRST. LibraryLoader (loadLibrary; loading / error+Retry; retry = remount via key) → SyncedApp (useLibrarySync + <FlashCardsApp>; save-error SyncBanner). Only UI file that touches AWS.
├── FlashCardsApp.tsx       container: DeckPicker ⇄ DeckCreator ⇄ <FlashCards key={deckId}>; props { initialDecks?, onLibraryChange?, onCheckpoint? }; AWS-free
├── DeckPicker.tsx          deck list + "New deck"
├── DeckCreator.tsx         name + add cards (no `forms`); needs ≥ 1 card
├── AddWordSheet.tsx        add-word bottom sheet, opened from the FlashCards header "+"; props { onAdd, onClose }
├── useDeckLibrary.ts       decks state (read once at mount), addDeck, addCard, saveProgress, onChange seam
├── useLibrarySync.ts       persistence policy: onLibraryChange (record + mark dirty, never writes), flush(unloading?), status 'idle'|'unsaved'|'saving'|'error'; takes a stable save fn
├── decks.ts                pure: DeckRecord, CardDraft, createDeck, withProgress, withCard, draftToCard, describeDraft, formatDeckMeta, emptyProgress
├── FlashCards.tsx          page + props { wordBank?, progress?, deckName?, onProgressChange?, onSessionComplete?, onBack?, onAddCard? }: header, FlipCard, RevealBtn, summary, empty states
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
│                           DEFAULT_SESSION_META (used by emptyProgress)
├── FlashCards.utils.ts     getWordFontSize, getAnswerTone, getArticle, hasForms,
│                           getDisplayPlural, getDisplayGenitive (all pure)
├── animations.ts           cardIn
├── sampleDeck.ts / sampleProgress.ts   first-run library (no library.json in S3) and component defaults
├── GlobalStyle.ts          reset + @fontsource imports
├── services/s3Storage.ts   loadLibrary(): DeckRecord[] | null (null = key absent); saveLibrary(decks, { unloading? }). Only SDK importer.
├── styles/                 actions, addWord, card, decks, forms, header, layout, summary, sync, tokens
└── tests/                  AddWord, CardAnswer, decks, FlashCards.states, FlashCards, FlashCards.utils, FlashCardsApp,
                            FlashCardsApp.checkpoint, FlipCard, srs, s3Storage, useLibrarySync, useStudySession, WordForms — import source via `../`

### Props
props (default: sampleDeck / sampleProgress / sampleDeckName)
   │ wordBank + progress
   ▼
useStudySession ─▶ buildSessionQueue (ONCE, at mount)
                      │
                      ├─ currentCard, position, total, isFlipped, isComplete, counters
                      │      └─▶ FlashCards.tsx ─▶ FlipCard ─▶ CardPrompt / CardAnswer
                      └─ progressDraft  (srs.applyGrade on each card's FIRST grade per session)

### Persistence (S3)
Single user. One object: s3://foxstack/flashcards/library.json = whole `DeckRecord[]`. No per-user prefix.
- Read: FlashCardsRoot loads once at mount → `initialDecks` (read-once, context §4). Key absent → `undefined` → FlashCardsApp's default (sample deck); nothing is written until the first change. Any other load failure (network, AccessDenied, malformed shape) → error screen + Retry; NEVER falls back to defaults (the next save would overwrite real data).
- Conflicts: last-write-wins. Plain PUT, no ETag/IfMatch/HEAD/polling. A stale device overwrites a newer one.
- Seams: `FlashCardsApp.onLibraryChange(decks)` fires after EVERY change incl. each graded card → useLibrarySync records it and marks dirty, never writes. `FlashCardsApp.onCheckpoint()` fires on: deck created, card added, session complete (`FlashCards.onSessionComplete`, again after "Study again"), leaving a deck (`onBack`) → FlashCardsRoot wires it to `flush`.
- Ordering invariant: a checkpoint is a tick state bumped in the same batch as its change; its effect is declared AFTER useDeckLibrary's, so `onLibraryChange` always reports first. Keep that declaration order.
- useLibrarySync: writes serialized (one in flight; a flush mid-write queues one follow-up with the newest snapshot). Failed write → stays dirty, status 'error' (SyncBanner + Retry), retried on the next flush trigger. Own triggers: `pagehide`, `visibilitychange`→hidden (both `flush(true)`), `online`, unmount.
- Unload writes (`unloading: true`): reuse the cached S3 client (skip fetchAuthSession) and a `keepAlive` client if body ≤ 60 KB (browser cap 64 KB). Best-effort only.
- Known weaknesses (accepted): grades of an abandoned session are lost (kill/crash before completion or leaving the deck); unload flush may not survive teardown (iOS app-switcher kill fires nothing; expired Cognito creds can't refresh mid-unload); whole library rewritten per save; no history/versioning; library not refreshed while open.
- AWS (done): IAM statement `FlashCardsLibraryReadWrite` (Get/Put on `flashcards/library.json`) on the Identity Pool's authenticated role; existing bucket-wide `s3:ListBucket` makes a missing key return NoSuchKey, not AccessDenied. CORS must allow GET, PUT. No new env vars. Versioning off. `iam-policy.json` mirrors the policy.
