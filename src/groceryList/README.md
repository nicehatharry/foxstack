# GroceryList

A single-page grocery list app (Amplify auth + S3-backed storage) 

## Where to look for a given task

| If you're asked to...                                      | Open this file                          |
|--------------------------------------------------------------|------------------------------------------|
| Add/remove a form field, change validation                  | `useItemForm.ts`                          |
| Change item shape (new field on a grocery item)              | `GroceryList.types.ts` (then likely `useItemForm.ts`, `GroceryListItem.tsx`, `styles/sheet.ts`) |
| Fix saving/sync/conflict/polling behavior                    | `useGrocerySync.ts`                       |
| Change sort or filter logic                                  | `GroceryList.utils.ts`                    |
| Add a department, change debounce/poll timing                | `GroceryList.constants.ts`                |
| Fix swipe-to-edit/delete gesture behavior                    | `SwipeableItem.tsx` (fully self-contained) |
| Change how a single list row looks/behaves                   | `GroceryListItem.tsx` + `styles/itemList.ts` |
| Restyle the header, filter pills, sheet, or FAB               | the matching file under `styles/`         |
| Change overall page layout / wire something new into the JSX | `GroceryList.tsx`                         |
| Change "Clear acquired" button behavior (what gets deleted, confirm step) | `GroceryList.tsx` (`handleClearAcquired`, `clearArmed` state) + `styles/itemList.ts` (`ClearAcquiredBtn`) |

## File map

```
src/
├── assets/
    ├── trash-icon.svg            icon for removing checked-off items button
    └── sign-out.svg              icon for sign out button
├── config/
    ├── amplify.ts                configures the Amplify library with the Cognito User Pool and Identity Pool
    └── aws.ts                    all other AWS configuration
├── groceryList/
    ├── index.ts                  barrel re-export, keeps external imports unchanged
    ├── GroceryList.tsx           main component: hook orchestration + JSX layout; selector to render department headers AND the "tap again to confirm" Clear Acquired handler both live here
    ├── GroceryList.types.ts      canonical types (GroceryItem, SyncStatus, ItemData)
    ├── GroceryList.constants.ts  departments, store options, poll/debounce timing
    ├── GroceryList.utils.ts      pure filterAndSortItems()
    ├── useGrocerySync.ts         S3 load/save/poll/conflict — owns `items` state
    ├── useItemForm.ts            add/edit bottom sheet state + handlers
    ├── SwipeableItem.tsx         swipe gesture wrapper, own styles co-located
    ├── GroceryListItem.tsx       one list row (pending vs. acquired variants)
    ├── GlobalStyle.ts            body/box-sizing reset
    ├── animations.ts             shared keyframes (slideUp, fadeIn, strikeThrough)
    └── styles/
        ├── layout.ts              AppShell
        ├── header.ts              TopBar, title, stats, sync indicator
        ├── alert.ts               conflict/error banner
        ├── filters.ts             department pills + status/sort bar
        ├── itemList.ts            list container + item card pieces + empty state + SectionLabelRow/ClearAcquiredBtn (the "In Cart" boundary)
        ├── sheet.ts               bottom sheet + form fields
        └── fab.ts                 floating "+" button
└── services/
    └── s3storage.ts               S3 I/O lives here; the component never touches the AWS SDK directly
```

## Data flow

`useGrocerySync` owns `items` and is the *only* thing allowed to call
`setItems` — every mutation goes through its `updateItems(updater)`,
which both applies the update and schedules a debounced S3 save.
`GroceryList.tsx` and `useItemForm.ts` only ever call `updateItems`,
never a raw setter.

```
useGrocerySync ──items, updateItems──▶ GroceryList.tsx ──▶ GroceryListItem.tsx (rows)
                                              │
                                              └──▶ useItemForm (uses updateItems too)
```

## Pending/acquired boundary ("In Cart" section)

Only rendered when `doShowAll` is on and there's at least one acquired
item. Lives inline in `GroceryList.tsx` (not split into its own
component file — it's one row of JSX plus a handler, and splitting it
out would just add an indirection layer for no real reuse benefit).

- `SectionLabelRow` (in `styles/itemList.ts`) is the flex row holding
  the "In Cart" label and the Clear button side by side.
- **Clear Acquired** deletes via `updateItems`, going through the same
  debounced S3 save as every other mutation — no special-casing.
- It only deletes what's **currently visible** under the active store
  filter (i.e. `acquired`, the already-filtered array), not every
  acquired item in the underlying `items` list. If "Costco" is
  selected, clearing only removes acquired Costco items.
- **Confirm pattern**: first tap arms the button (`clearArmed = true`,
  button turns red, label flips to "Tap again"); second tap actually
  deletes. `clearArmed` resets on blur, on changing the store filter,
  and on toggling "Show All" off — so an armed confirm never silently
  carries over to a different set of items than the one the user was
  looking at when they armed it.
- This inline-arm/confirm approach (vs. a modal or `window.confirm`)
  is the established pattern for destructive actions in this app —
  reuse it if another one gets added later.
