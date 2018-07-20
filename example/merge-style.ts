import ReObserve from '../lib';
import { mapTo } from '../node_modules/rxjs/operators';

interface ICounter {
	counter: number;
}

const initialCounter: ICounter = {
	counter: 0,
};

const watcher = (prev: ICounter, next: ICounter) => {
	console.log('prev', prev);
	console.log('next', next);
};

// mergeReduce will merge from stream and put its value into reducer to produce next state
const counter$ = new ReObserve(initialCounter)
	.mergeReduce(ReObserve.fromAction('INCREMENT').pipe(mapTo(1)), (curr, next) => ({ counter: curr.counter + next }))
	.mergeReduce(ReObserve.fromAction('DECREMENT').pipe(mapTo(1)), (curr, next) => ({ counter: curr.counter - next }))
	.watch(watcher);

counter$.subscribe(counter => console.log(counter));

ReObserve.dispatch({ type: 'INCREMENT' });

setTimeout(() => ReObserve.dispatch({ type: 'DECREMENT' }), 1000);

setTimeout(() => {
	counter$.unsubscribe();
}, 2000);

setTimeout(() => ReObserve.dispatch({ type: 'DECREMENT' }), 3000);
