# ReObserve

_Rx.js based Observable State Management Tool_

This is a preview version of ReObserve, a fully functional reactive programming library that helps manage complex UI streams in js/ts

The documentation is in WIP

## Installation
```
npm install @hlhr202/reobserve rxjs
```

## Basic Usage
```js
const ReObserve = require('@hlhr202/reobserve')
const { merge } = require('rxjs')
const { filter, map } = require('rxjs/operators')

// Define a initial state
const initialCounter = {
    count: 0
}

// Define an action mapper that maps Observable actions to next state
const actionMapper = action$ => merge(
    action$.pipe(
        filter(action => action.type === 'INCREMENT'),
        map(action => ({ counter: action.state.counter + 1 }))
    ),
    action$.pipe(
        filter(action => action.type === 'DECREMENT'),
        map(action => ({ counter: action.state.counter - 1 }))
    )
)

// Create a stream that merge all actions
const counter$ = ReObserve.create(initialCounter).mapAction(actionMapper)

// Subscribe next counter value
counter$.subscribe(nextValue => console.log(nextValue))

// Dispatch action in global scope
ReObserve.dispatch({ type: 'INCREMENT' })
ReObserve.dispatch({ type: 'DECREMENT' })
```