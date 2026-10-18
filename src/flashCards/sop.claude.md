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
├── FlashCardsApp.tsx       container: DeckPicker ⇄ DeckCreator ⇄ <FlashCards key={deckId}>; props { initialDecks?, onLibraryChange?, onCheckpoint? }; AWS-free; keeps last CompletedSession per deck in a ref (memory only) → FlashCards `lastSession`
├── DeckPicker.tsx          deck list + "New deck"
├── DeckCreator.tsx         name + add cards (no `forms`); needs ≥ 1 card
├── AddWordSheet.tsx        add-word bottom sheet, opened from the FlashCards header "+"; props { onAdd, onClose }
├── useDeckLibrary.ts       decks state (read once at mount), addDeck, addCard, saveProgress, onChange seam
├── useLibrarySync.ts       persistence policy: onLibraryChange (record + mark dirty, never writes), flush(unloading?), status 'idle'|'unsaved'|'saving'|'error'; takes a stable save fn
├── decks.ts                pure: DeckRecord, CardDraft, createDeck, withProgress, withCard, draftToCard, describeDraft, formatDeckMeta, emptyProgress
├── FlashCards.tsx          page + props { wordBank?, progress?, deckName?, onProgressChange?, onSessionComplete?(CompletedSession), lastSession?, onBack?, onAddCard? }: header, FlipCard, RevealBtn, summary, empty states. "Session complete" and "Nothing due" states ("Nothing due" also says "More cards due <weekday, month day-ordinal>." via nextDueAt/formatDueDay, from progressDraft): [Study again (only if replayable)] + New Session
├── FlipCard.tsx            Scene > Flipper > CardFront/CardBack; tap = reveal
├── CardPrompt.tsx          front: part-of-speech pill + bare German lemma
├── CardAnswer.tsx          back: pill, German (+article, tappable if hasForms), translation ⇄ WordForms, Missed it / Got it
├── WordForms.tsx           answer-side forms panel: noun plural/genitive, verb Präsens/Präteritum/Perfekt, adjective comparison
├── useStudySession.ts      (wordBank, progress, lastSession?) session state: session {id, queue}, index, isFlipped, missedCards (unique, first-miss order), progressDraft; replaySession, newSession, canReplay, currentSession
├── srs.ts                  pure: dueDateFor, scheduleNext, updateSuccessRate, applyGrade, isDue,
│                           computeNewCardBudget, interleaveEvenly, buildSessionQueue,
│                           shuffle, buildStudyAheadQueue, nextDueAt, formatDueDay
├── FlashCards.types.ts     Flashcard = NounCard | VerbCard | AdjectiveCard | AdverbCard | PhraseCard
│                           (discriminated union on partOfSpeech), NounForms, VerbForms,
│                           VerbPersonForms, AdjectiveForms, Article, NounArticle (= Article | 'der/die'),
│                           Grade, AnswerTone, LeitnerBox,
│                           WordProgress, ProgressMap, SessionMeta, CompletedSession (in-memory, not persisted), ProgressDocument
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
└── tests/                  AddWord, CardAnswer, decks, FlashCards.states, FlashCards.replay, FlashCards, FlashCards.utils, FlashCardsApp,
                            FlashCardsApp.checkpoint, FlipCard, srs, srs.session, s3Storage, useLibrarySync, useStudySession, WordForms — import source via `../`

### Props
props (default: sampleDeck / sampleProgress / sampleDeckName)
   │ wordBank + progress
   ▼
useStudySession ─▶ buildSessionQueue (ONCE, at mount)
                      │
                      ├─ currentCard, position, total, isFlipped, isComplete, missedCards
                      │      └─▶ FlashCards.tsx ─▶ FlipCard ─▶ CardPrompt / CardAnswer
                      └─ progressDraft  (srs.applyGrade on each card's FIRST grade per session)

### Sessions
- Initial session: buildSessionQueue at mount. Queue/id live in one `session` state, so a new session swaps both.
- `replaySession` ("Study again"): shuffled cards under the OLD sessionId → pure practice (applyGrade ignores). Source: the just-finished session (replays its initial queue), else `lastSession.cardIds` ∩ wordBank (read once at mount; supplied by FlashCardsApp from memory, so absent after reload → button hidden).
- Summary: "Session complete" + `missed:` list (`missedCards`; nouns shown with article, others bare lemma) or "No words missed."; reset on any new run.
- Options UI (`renderSessionOptions`): [Study again] + New Session, shown in both the "Session complete" and "Nothing due" states.
- `newSession` ("New Session"): buildStudyAheadQueue (ignores due dates: never-graded first, then soonest `dueAt`, ≤ SESSION_CARD_CAP, shuffled) under a NEW sessionId → graded normally (boxes advance).
- `onSessionComplete(currentSession)` fires per completion of any session type.

### Persistence (S3)
Single user. One object: s3://foxstack/flashcards/library.json = whole `DeckRecord[]`.
- Read: FlashCardsRoot loads once at mount → `initialDecks`
- Conflicts: last-write-wins. Plain PUT, no ETag/IfMatch/HEAD/polling. A stale device overwrites a newer one.
- Seams: `FlashCardsApp.onLibraryChange(decks)` fires after EVERY change incl. each graded card → useLibrarySync records it and marks dirty, never writes. `FlashCardsApp.onCheckpoint()` fires on: deck created, card added, session complete (`FlashCards.onSessionComplete`, again after "Study again"), leaving a deck (`onBack`) → FlashCardsRoot wires it to `flush`.
- useLibrarySync: writes serialized (one in flight; a flush mid-write queues one follow-up with the newest snapshot). Failed write → stays dirty, status 'error' (SyncBanner + Retry), retried on the next flush trigger. Own triggers: `pagehide`, `visibilitychange`→hidden (both `flush(true)`), `online`, unmount.
Write on unload (`unloading: true`)
