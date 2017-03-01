/**
 * Created by johan on 2/21/2017.
 */
import { createStore } from 'redux'
import objApp from './reducers_viz'
import { addObject, removeObject } from './actions_viz'

let store = createStore(objApp);

// Log the initial state
console.log(store.getState());

// Every time the state changes, log it
// Note that subscribe() returns a function for unregistering the listener
let unsubscribe = store.subscribe(() =>
    console.log(store.getState())
);

// Dispatch some actions
store.dispatch(addObject('geopoint','gp1',['UTM5','12','13']));
store.dispatch(addObject('geopoint','gp2',['LATLONG','155','41']));
store.dispatch(removeObject('gp2'));

// Stop listening to state updates
unsubscribe();/**
 * Created by johan on 2/22/2017.
 */
