import {
	Subject,
	Subscription,
	merge,
	Observable,
	Observer,
	PartialObserver,
	SubscriptionLike,
	Subscribable,
	of,
	throwError,
} from 'rxjs';
import {
	IActionSubscription,
	IActionEmit,
	IAjaxSubsription,
	IAjaxEmit,
	IActionMapper,
	IAjaxMapper,
	IGlobalActionSubscription,
	IGlobalAjaxSubsription,
} from './type';
import { filter, map, startWith, catchError } from 'rxjs/operators';

class ReObserve<T = void> implements Subscribable<T>, SubscriptionLike, Observer<T> {

	/**
	 * Global Action Stream
	 * @static
	 */
	static globalActionStream$ = new Subject<IGlobalActionSubscription<any>>();

	/**
	 * Global Dispatcher
	 * @param {IActionEmit<P>} action action that will be emit to action stream, payload in generic type
	 */
	static dispatch<P = any>(action: IActionEmit<P>) {
		const { type, payload } = action;
		ReObserve.globalActionStream$.next({ type, payload, source: 'GLOBAL' });
	}

	/**
	 * Global Ajax Strema
	 */
	static globalAjaxStream$ = new Subject<IGlobalAjaxSubsription<any>>();

	/**
	 * Global Fetch
	 * @param {IAjaxEmit<R>} ajax ajax that will be emit to ajax stream, response in generic type
	 */
	static fetch<R = any>(ajax: IAjaxEmit<R>) {
		const { type, ajax$ } = ajax
		ajax$.subscribe(
			payload => {
				ReObserve.globalAjaxStream$.next({ type, payload, source: 'GLOBAL' });
			},
			err => {
				ReObserve.globalAjaxStream$.error({ type, err });
			}
		);
	}

	/**
	 * Return action observable in type
	 * @param {string} type type of action in string format
	 */
	static fromAction(type: string) {
		return ReObserve.globalActionStream$.pipe(filter(action => action.type === type));
	}

	/**
	 * Return ajax observable in type
	 * @param {string} type type of ajax in string format
	 */
	static fromAjax(type: string) {
		return ReObserve.globalAjaxStream$.pipe(
			filter(ajax => ajax.type === type),
			catchError(err => {
				if (err.type === type) {
					return throwError(err);
				} else return of();
			})
		);
	}

	/**
	 * ReObserve factory mode create function
	 * @param {C} initialState initialState
	 * @returns {ReObserve<C>} new instance
	 */
	static create<C = {}>(initialState?: C) {
		return new ReObserve<C>(initialState);
	}

	private _current!: T;
	private _historyArray: T[] = [];
	private _enableHistory = false;
	private _watcher?: (prev: T, curr: T) => void;
	private _actionStream$ = new Subject<IActionSubscription<T, any>>();
	private _ajaxStream$ = new Subject<IAjaxSubsription<any>>();
	private _actionMapper?: IActionMapper<any, any>;
	private _ajaxMapper?: IAjaxMapper<any, any>;

	private _histryStream$ = new Subject<T>();
	private _joinStream$!: Observable<T>;
	private _source$ = new Subject<T>();

	private _globalAjaxSubscription!: Subscription;
	private _globalActionSubscription!: Subscription;

	private _subscriptions: Subscription[] = [];
	private _context: any | ReObserve<T> = this;

	public closed = false;

	/**
	 * Create a new ReObserve
	 * @constructor
	 * @param initialState initialState
	 */
	constructor(initialState?: T) {
		initialState && this.startWith(initialState);
		this._globalAjaxSubscription = ReObserve.globalAjaxStream$.subscribe(ajax => {
			const { type, source, payload } = ajax;
			this._ajaxStream$.next({ type, source, payload, state: this._current });
		});
		this._globalActionSubscription = ReObserve.globalActionStream$.subscribe(action => {
			const { type, source, payload } = action;
			this._actionStream$.next({ type, source, payload, state: this._current });
		});
		return this;
	}

	get current() {
		return this._current;
	}

	get histories() {
		return this._historyArray;
	}

	/**
	 * Bind context for mapper function
	 * @returns {ReObserve<T>} this
	 * @param {any|ReObserve<T>} context defualt context will be 'this'
	 */
	bind(context: any | ReObserve<T> = this) {
		this._context = context;
		return this;
	}

	/**
	 * Undo function (Yet not ready)
	 * @deprecated
	 * @returns {ReObserve<T>} this
	 */
	_undo() {
		if (this._enableHistory) {
			const previous = this._historyArray.pop();
			const current = this._current;
			if (previous) {
				this._histryStream$.next(previous);
				this._current = previous;
				this._watcher && this._watcher(current, previous);
			}
		}
		return this;
	}

	/**
	 * Start with initial state
	 * @param {T} initialState will set current
	 */
	startWith(initialState: T) {
		this._current = initialState;
		return this;
	}

	withRecord(flag: boolean) {
		this._enableHistory = flag;
		return this;
	}

	watch(watcher: (prev: T, curr: T) => void) {
		this._watcher = watcher;
		return this;
	}

	dispatch<P = any>(action: IActionEmit<P>) {
		const { type, payload } = action;
		!this.closed && this._actionStream$.next({ type, payload, source: 'SELF', state: this._current });
	}

	fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>) {
		!this.closed &&
			ajax$.subscribe(
				payload => {
					this._ajaxStream$.next({ type, payload, source: 'SELF', state: this._current });
				},
				err => {
					this._ajaxStream$.error(err);
				}
			);
		return this;
	}

	mapAjax<R = T>(mapper: IAjaxMapper<T, R>) {
		this._ajaxMapper = mapper;
		return this;
	}

	mapAction<R = T>(mapper: IActionMapper<T, R>) {
		this._actionMapper = mapper;
		return this;
	}

	merge(stream$: Observable<T>) {
		this._subscriptions.push(stream$.subscribe(value => this.next(value), error => this.error(error)));
		return this;
	}

	mergeReduce<N>(stream$: Observable<N>, reducer: (curr: T, next: N) => T) {
		this._subscriptions.push(
			stream$.subscribe(
				value => {
					const nextValue = reducer(this.current, value);
					//console.log('nextValue', nextValue)
					this.next(nextValue);
				},
				error => this.error(error)
			)
		);
		return this;
	}

	fromAction(type: string) {
		return this._actionStream$.pipe(filter(action => action.type === type));
	}

	fromAjax(type: string) {
		return this._ajaxStream$.pipe(filter(ajax => ajax.type === type));
	}

	private join() {
		if (!this._joinStream$) {
			this._actionMapper &&
				this._actionMapper(this._actionStream$, this._context).subscribe(
					value => this.next(value),
					error => this.error(error)
				);
			this._ajaxMapper &&
				this._ajaxMapper(this._ajaxStream$, this._context).subscribe(
					value => this.next(value),
					error => this.error(error)
				);
			this._source$.subscribe(next => {
				if (next !== this._current) {
					const previous = this._current;
					this._enableHistory && this._historyArray.push(previous);
					this._current = next;
					this._watcher && this._watcher(previous, next);
				}
			});
			this._joinStream$ = merge<T>(this._histryStream$, this._source$).pipe(startWith(this._current));
			this.closed = false;
		}
	}

	/**
	 * Call next function, implements Observer.next
	 * @param {T} value next value
	 */
	next(value: T) {
		return this._source$.next(value);
	}

	/**
	 * Call complete, implements Observer.complete
	 */
	complete() {
		return this._source$.complete();
	}

	/**
	 * Call error, implements Observer.error
	 * @param {any} err error
	 */
	error(err: any) {
		return this._source$.error(err);
	}

	/**
	 * Create Subscription, implements Subscribable
	 * @param {PartialObserver<T> | ((value: T) => void)} observerOrNext 
	 * @param {(error: any) => void} error 
	 * @param {() => void} complete 
	 * @returns {Subscription}
	 */
	subscribe(
		observerOrNext?: PartialObserver<T> | ((value: T) => void),
		error?: (error: any) => void,
		complete?: () => void
	): Subscription {
		this.join();
		this.closed = false;
		return this._joinStream$.subscribe(observerOrNext as ((value: T) => void), error, complete);
	}

	unsubscribe() {
		this._globalActionSubscription.unsubscribe();
		this._globalAjaxSubscription.unsubscribe();
		this._subscriptions.forEach(subscription => subscription.unsubscribe());

		this._ajaxStream$.unsubscribe();
		this._actionStream$.unsubscribe();
		this._source$.unsubscribe();
		this._histryStream$.unsubscribe();
		this.closed = true;
	}

	asObservable() {
		this.join();
		this.closed = false;
		return this._joinStream$;
	}
}

export default ReObserve;
export const dispatch = ReObserve.dispatch;
export const fetch = ReObserve.fetch;
export const fromAction = ReObserve.fromAction;
export const fromAjax = ReObserve.fromAjax;
