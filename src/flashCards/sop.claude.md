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
├── App.tsx                 base wouter routing switch
config/
├── amplify.ts              configures the Amplify library with the Cognito User Pool and Identity Pool
├── aws.ts                  single source of truth for all AWS configuration
flashCards/
├── index.ts                barrel
├── FlashCardsApp.tsx       container: DeckPicker ⇄ DeckCreator ⇄ <FlashCards key={deckId}>; props { initialDecks?, onLibraryChange? }
├── DeckPicker.tsx          deck list + "New deck"
├── DeckCreator.tsx         name + add cards (no `forms`); needs ≥ 1 card
├── useDeckLibrary.ts       decks state (read once at mount), addDeck, saveProgress, onChange seam
├── decks.ts                pure: DeckRecord, CardDraft, createDeck, withProgress, formatDeckMeta, emptyProgress
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
├── services/               s3Storage (not yet created)
├── styles/                 actions, addWord, card, decks, forms, header, layout, summary, tokens
└── tests/                  AddWord, CardAnswer, decks, FlashCards.states, FlashCards, FlashCards.utils, FlashCardsApp
                            FlipCard, srs, useStudySession, WordForms — import source via `../`

### Props
props (default: sampleDeck / sampleProgress / sampleDeckName)
   │ wordBank + progress
   ▼
useStudySession ─▶ buildSessionQueue (ONCE, at mount)
                      │
                      ├─ currentCard, position, total, isFlipped, isComplete, counters
                      │      └─▶ FlashCards.tsx ─▶ FlipCard ─▶ CardPrompt / CardAnswer
                      └─ progressDraft  (srs.applyGrade on each card's FIRST grade per session)
