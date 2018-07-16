import ReObserve from '../lib'
import { IActionMapper, IActionSubscription } from '../lib/type';
import { merge } from '../node_modules/rxjs'
import { filter, map } from '../node_modules/rxjs/operators';
//import { dispatch } from '../lib';

interface ICounter {
    counter: number
}

type ICounterAction = IActionSubscription<ICounter, number>

const initialCounter: ICounter = {
    counter: 0
}

const actionMapper: IActionMapper<ICounter, ICounter> = action$ => {
    //console.log('current', context.current)
    return merge<ICounter>(
        action$.pipe(
            filter((action: ICounterAction) => action.type === 'INCREMENT'),
            map((action: ICounterAction) => ({counter: action.state.counter + (action.payload || 0)}))
        ),
        action$.pipe(
            filter((action: ICounterAction) => action.type === 'DECREMENT'),
            map((action: ICounterAction) => ({counter: action.state.counter - (action.payload || 0)}))
        )
    )
}

const counter$ = new ReObserve(initialCounter).mapAction(actionMapper)

counter$.subscribe(counter => console.log(counter))

counter$.dispatch<number>({ type: 'INCREMENT', payload: 1 })

setTimeout(() => counter$.dispatch<number>({ type: 'DECREMENT', payload: 1 }), 1000)
//dispatch<number>({ type: 'DECREMENT', payload: 1 })