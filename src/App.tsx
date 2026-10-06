import { lazy, Suspense } from 'react'
import { Homepage } from './homepage'
import { Route, Switch } from "wouter"
import { FlashCards } from './flashCards'
import { a1Deck } from './flashCards/a1Deck'

// GroceryList's module graph pulls in config/amplify → config/aws
const GroceryList = lazy(() => import('./groceryList/GroceryList'))
const ManageItems = lazy(() => import('./groceryList/ManageItems'))
const Notetaker = lazy(() => import('./notetaker/Notetaker'))

const App = () => (
  <>
    {/* 
      Routes below are matched exclusively -
      the first matched route gets rendered
    */}
    <Switch>
      <Route path="/grocery-list/manage-items">
        <Suspense fallback={null}>
          <ManageItems />
        </Suspense>
      </Route>

      <Route path="/grocery-list">
        <Suspense fallback={null}>
          <GroceryList />
        </Suspense>
      </Route>

      <Route path="/notetaker">
        <Suspense fallback={null}>
          <Notetaker />
        </Suspense>
      </Route>

      <Route path="/flashcards">
        <Suspense fallback={null}>
          <FlashCards wordBank={a1Deck} />
        </Suspense>
      </Route>

      <Route path="/" component={Homepage} />

      {/* Default route in a switch */}
      <Route>404: No such page!</Route>
    </Switch>
  </>
)

export default App
