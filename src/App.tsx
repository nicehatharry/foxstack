import { Homepage } from './homepage'
import './baseStyles.css'
import { Route, Switch } from "wouter"
import GroceryList from './groceryList/GroceryList'

const App = () => (
  <>
    {/* 
      Routes below are matched exclusively -
      the first matched route gets rendered
    */}
    <Switch>
      <Route path="/grocery-list" component={GroceryList} />

      <Route path="/" component={Homepage} />

      {/* Default route in a switch */}
      <Route>404: No such page!</Route>
    </Switch>
  </>
)

export default App