import ReObserve from '../lib'
import { IActionMapper, IActionSubscription } from '../lib/type';
import { merge } from '../node_modules/rxjs'
import { filter, map } from '../node_modules/rxjs/operators';

interface ICounter {
    counter: number
}

type ICounterAction = IActionSubscription<ICounter, number>

const initialCounter: ICounter = {
    counter: 0
}

const actionMapper: IActionMapper<ICounter> = action$ => {
    return merge<ICounter>(
        action$.pipe(
            filter((action: ICounterAction) => action.type === 'INCREMENT'),
            map((action: ICounterAction) => ({ counter: action.state.counter + (action.payload || 0) }))
        ),
        action$.pipe(
            filter((action: ICounterAction) => action.type === 'DECREMENT'),
            map((action: ICounterAction) => ({ counter: action.state.counter - (action.payload || 0) }))
        )
    )
}

const watcher = (prev: ICounter, next: ICounter) => {
    console.log('prev', prev)
    console.log('next', next)
}

const counter$ = new ReObserve(initialCounter).mapAction(actionMapper).watch(watcher)

counter$.subscribe(counter => console.log(counter))

counter$.dispatch<number>({ type: 'INCREMENT', payload: 1 })

setTimeout(() => counter$.dispatch<number>({ type: 'DECREMENT', payload: 1 }), 1000)

setTimeout(() => { counter$.unsubscribe() }, 2000)

setTimeout(() => counter$.dispatch<number>({ type: 'DECREMENT', payload: 1 }), 3000)