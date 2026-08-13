# GroceryList

Single-page grocery list app. Amplify auth + S3-backed storage (no DB).

## Task → file lookup

| Task | File |
|---|---|
| Add/remove form field, change validation | `useItemForm.ts` |
| Change item shape (new field on GroceryItem) | `s3Storage.ts` (`GroceryItem`) → `GroceryList.types.ts` (`ItemData`) → `useItemForm.ts` (`EMPTY_FORM`, `handleEdit`, `handleSubmit`, `persistToHistory`) → form JSX in `GroceryList.tsx` → `GroceryListItem.tsx` if it needs a row visual |
| Fix sync/save/conflict/polling | `useGrocerySync.ts` |
| Sort/filter logic | `GroceryList.utils.ts` |
| Add department, change debounce/poll timing | `GroceryList.constants.ts` |
| Swipe-to-edit/delete gesture | `SwipeableItem.tsx` (self-contained) |
| Single list row look/behavior | `GroceryListItem.tsx` + `styles/itemList.ts` |
| Restyle header/pills/sheet/FAB | matching file under `styles/` |
| Page layout / new JSX wiring | `GroceryList.tsx` |
| Clear Acquired behavior | `GroceryList.tsx` (`handleClearAcquired`, `clearArmed`) + `styles/itemList.ts` (`ClearAcquiredBtn`) |
| Autocomplete matching/sorting | `useItemForm.ts` (`suggestions` useEffect) |
| Autocomplete dropdown style | `styles/sheet.ts` (`SuggestionDropdown`, `SuggestionItem`, `AutocompleteWrapper`) |
| What history stores/restores | `useItemForm.ts` (`persistToHistory`, `selectSuggestion`) + `s3Storage.ts` (`HistoryEntry`) |
| History S3 key/format | `s3Storage.ts` (`historyKey`, `loadHistory`, `saveHistory`) |
| Header gear menu contents | `GroceryList.tsx` (`SettingsMenu`, `handleManageItems`, `handleSignOutClick`) + `styles/header.ts` |
| "Save to history" checkbox | `useItemForm.ts` (`saveToHistory`, `handleSaveToHistoryToggle`) + `styles/sheet.ts` (`SaveHistoryRow`, `SaveHistoryCheckbox`) |
| Edit/delete history entries directly | `ManageItems.tsx` + `useHistoryManager.ts` |
| Shared history cache (sheet ⟷ Manage Items) | `historyStore.ts` |
| Manage Items route/back destination | `App.tsx` (route) + `ManageItems.tsx` (`handleBack`) |
| Manage Items palette | `styles/manageItemsLayout.ts`, `styles/manageItemsHeader.ts` |
| History row look/behavior | `HistoryListItem.tsx` (reuses `styles/itemList.ts`) |

## File map

```
src/
├── assets/            trash-icon.svg, settings.svg, return.png
├── config/
│   ├── amplify.ts     Cognito User Pool / Identity Pool config
│   └── aws.ts         other AWS config
├── groceryList/
│   ├── index.ts               barrel re-export
│   ├── GroceryList.tsx        main page: hooks + JSX; dropdown positioning;
│   │                          dept headers; Clear Acquired; settings menu (open state,
│   │                          outside-tap close, nav to Manage Items)
│   ├── ManageItems.tsx        history editor page — same shape as GroceryList.tsx
│   │                          minus store filter/dept-sort/show-all/dept headers/FAB;
│   │                          distinct palette
│   ├── historyStore.ts        session cache for history doc, shared by useItemForm +
│   │                          useHistoryManager
│   ├── useHistoryManager.ts   Manage Items' state: loads history, editEntry/deleteEntry
│   │                          (rename = delete old key + insert new — key IS identity)
│   ├── GroceryList.types.ts   ItemData; re-exports GroceryItem/SyncStatus
│   ├── GroceryList.constants.ts  departments, storeOptions, poll/debounce timing
│   ├── GroceryList.utils.ts   filterAndSortItems() (pure)
│   ├── useGrocerySync.ts      owns `items`; only thing that calls setItems
│   ├── useItemForm.ts         add/edit sheet state, autocomplete, saveToHistory checkbox
│   ├── SwipeableItem.tsx      swipe gesture wrapper, styles co-located
│   ├── GroceryListItem.tsx    list row (pending/acquired variants, has checkbox)
│   ├── HistoryListItem.tsx    history row (no checkbox — no acquired concept)
│   ├── GlobalStyle.ts         body/box-sizing reset
│   ├── animations.ts          slideUp, fadeIn, strikeThrough keyframes
│   └── styles/
│       ├── layout.ts              AppShell
│       ├── manageItemsLayout.ts   ManageAppShell/ManageGlobalStyle (bg only differs)
│       ├── header.ts              TopBar, SettingsBtn/Icon/Menu — shared by both pages
│       ├── manageItemsHeader.ts   ManageTopBar (bg/text color only)
│       ├── alert.ts               conflict/error banner
│       ├── filters.ts             dept pills, status/sort bar
│       ├── itemList.ts            card/row pieces — shared by both row types
│       ├── modal.ts               notes modal — shared by both pages
│       ├── sheet.ts               bottom sheet, form fields, autocomplete, SaveHistoryRow
│       └── fab.ts                 "+" button (grocery list only)
└── services/
    └── s3Storage.ts        all S3 I/O; loadHistory/saveHistory for history.json
```

## Data flow

```
useGrocerySync ──items, updateItems──▶ GroceryList.tsx ──▶ GroceryListItem.tsx
                                              └──▶ useItemForm (also uses updateItems)

historyStore.ts (module-level cache) ──▶ useItemForm.ts (autocomplete, GroceryList.tsx)
                                     └──▶ useHistoryManager.ts (ManageItems.tsx)
```
Rule: only `useGrocerySync` calls `setItems`; everything else goes through `updateItems(updater)`.

## Key invariants / gotchas

**History storage** (`grocery-lists/history.json`): flat map, lowercased name → `HistoryEntry {store, department, quantity, notes}`. **Key is the only identity — no `name` field.** Rename = delete old key + insert new key. No ETag locking; best-effort, last-write-wins. Acquired status never stored.

**History cache** (`historyStore.ts`): fetched once per session, module-level. Shared by autocomplete and Manage Items — edits on either side are visible to the other without reload. Writes are optimistic (local update first) + fire-and-forget S3 save, `console.warn` on failure.

**Save-to-history checkbox**: `saveToHistory` lives in `useItemForm.ts` only, not on `ItemData`/`GroceryItem` (never persisted). Defaults `true`, reset `true` on every sheet open. Gates the `persistToHistory` call only — never affects `updateItems`/the grocery list itself.

**Autocomplete dropdown**: `position: fixed`, coords from input's `getBoundingClientRect()` (escapes Sheet's `overflow-y: auto`), remeasured on resize/scroll. Prefix matches sort before substring matches. Uses `onPointerDown` + `preventDefault()` (not `onClick`) so selection registers before input blur.

**Clear Acquired**: tap-to-arm / tap-again-to-confirm (`clearArmed`), no modal/`window.confirm`. Only deletes currently-*filtered* acquired items, not all acquired items. Disarms on blur, store-filter change, or Show All toggle off. This is the established destructive-action pattern in this app — reuse it for new ones.

**Header settings menu**: gear icon → `SettingsMenu` (Manage Items nav via wouter, Sign Out via `signOut` prop). Closes on outside `pointerdown` (same pattern as autocomplete dropdown / Clear Acquired arm). Manage Items' back button reuses `SettingsBtn`/`SettingsIcon` with icon+handler swapped.

**Notes field**: `notes?: string`, optional for backward compat (pre-feature items have no key, treated as `''`). Circle-ⓘ icon opens a **read-only** modal; editing a note requires swipe-left → edit sheet. Manage Items has an identical parallel (`notesEntry` + same `styles/modal.ts` components).

**Manage Items page** (`/grocery-list/manage-items`): only ever touches the history doc, never `items` — deleting/editing an entry does not affect items already on the list. No FAB (edit/delete only, no create). Palette differs via sibling styled-components (`manageItemsLayout.ts`/`manageItemsHeader.ts`), not variant props on shared components — only backgrounds are overridden, everything else (cards, swipe, form fields) is reused as-is. **Known gap**: renaming to a name that collides with an existing entry silently overwrites it, no warning.