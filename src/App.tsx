import { lazy, Suspense } from 'react'
import { Homepage } from './homepage'
import { Route, Switch } from "wouter"

// GroceryList's module graph pulls in config/amplify → config/aws
const GroceryList = lazy(() => import('./groceryList/GroceryList'))

const App = () => (
  <>
    {/* 
      Routes below are matched exclusively -
      the first matched route gets rendered
    */}
    <Switch>
      <Route path="/grocery-list">
        <Suspense fallback={null}>
          <GroceryList />
        </Suspense>
      </Route>

      <Route path="/" component={Homepage} />

      {/* Default route in a switch */}
      <Route>404: No such page!</Route>
    </Switch>
  </>
)

export default App