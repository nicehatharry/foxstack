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
    ├── GroceryList.tsx           main component: hook orchestration + JSX layout; selector to render department headers lives here
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
        ├── itemList.ts            list container + item card pieces + empty state
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
