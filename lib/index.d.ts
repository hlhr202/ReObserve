import { Subject, Subscription, Observable, Observer, PartialObserver, SubscriptionLike, Subscribable } from 'rxjs';
import { IActionSubscription, IActionEmit, IAjaxSubsription, IAjaxEmit, IActionMapper, IAjaxMapper, IGlobalActionSubscription, IGlobalAjaxSubsription } from './type';
declare class ReObserve<T = void> implements Subscribable<T>, SubscriptionLike, Observer<T> {
    /**
     * Global Action Stream
     * @static
     */
    static globalActionStream$: Subject<IGlobalActionSubscription<any>>;
    /**
     * Global Dispatcher
     * @param {IActionEmit<P>} action action that will be emit to action stream, payload in generic type
     */
    static dispatch<P = any>(action: IActionEmit<P>): void;
    /**
     * Global Ajax Strema
     */
    static globalAjaxStream$: Subject<IGlobalAjaxSubsription<any>>;
    /**
     * Global Fetch
     * @param {IAjaxEmit<R>} ajax ajax that will be emit to ajax stream, response in generic type
     */
    static fetch<R = any>(ajax: IAjaxEmit<R>): void;
    /**
     * Return action observable in type
     * @param {string} type type of action in string format
     */
    static fromAction(type: string): Observable<IGlobalActionSubscription<any>>;
    /**
     * Return ajax observable in type
     * @param {string} type type of ajax in string format
     */
    static fromAjax(type: string): Observable<{} | IGlobalAjaxSubsription<any>>;
    /**
     * ReObserve factory mode create function
     * @param {C} initialState initialState
     * @returns {ReObserve<C>} new instance
     */
    static create<C = {}>(initialState?: C): ReObserve<C>;
    private _current;
    private _historyArray;
    private _enableHistory;
    private _watcher?;
    private _actionStream$;
    private _ajaxStream$;
    private _actionMapper?;
    private _ajaxMapper?;
    private _histryStream$;
    private _joinStream$;
    private _source$;
    private _globalAjaxSubscription;
    private _globalActionSubscription;
    private _subscriptions;
    private _context;
    closed: boolean;
    /**
     * Create a new ReObserve
     * @constructor
     * @param initialState initialState
     */
    constructor(initialState?: T);
    readonly current: T;
    readonly histories: T[];
    /**
     * Bind context for mapper function
     * @returns {ReObserve<T>} this
     * @param {any|ReObserve<T>} context defualt context will be 'this'
     */
    bind(context?: any | ReObserve<T>): this;
    /**
     * Undo function (Yet not ready)
     * @deprecated
     * @returns {ReObserve<T>} this
     */
    _undo(): this;
    /**
     * Start with initial state
     * @param {T} initialState will set current
     */
    startWith(initialState: T): this;
    withRecord(flag: boolean): this;
    watch(watcher: (prev: T, curr: T) => void): this;
    dispatch<P = any>(action: IActionEmit<P>): void;
    fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>): this;
    mapAjax<R = T>(mapper: IAjaxMapper<T, R>): this;
    mapAction<R = T>(mapper: IActionMapper<T, R>): this;
    merge(stream$: Observable<T>): this;
    mergeReduce<N>(stream$: Observable<N>, reducer: (curr: T, next: N) => T): this;
    fromAction(type: string): Observable<IActionSubscription<T, any>>;
    fromAjax(type: string): Observable<IAjaxSubsription<any, any>>;
    private join;
    /**
     * Call next function, implements Observer.next
     * @param {T} value next value
     */
    next(value: T): void;
    /**
     * Call complete, implements Observer.complete
     */
    complete(): void;
    /**
     * Call error, implements Observer.error
     * @param {any} err error
     */
    error(err: any): void;
    /**
     * Create Subscription, implements Subscribable
     * @param {PartialObserver<T> | ((value: T) => void)} observerOrNext
     * @param {(error: any) => void} error
     * @param {() => void} complete
     * @returns {Subscription}
     */
    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription;
    unsubscribe(): void;
    asObservable(): Observable<T>;
}
export default ReObserve;
export declare const dispatch: typeof ReObserve.dispatch;
export declare const fetch: typeof ReObserve.fetch;
export declare const fromAction: typeof ReObserve.fromAction;
export declare const fromAjax: typeof ReObserve.fromAjax;
//# sourceMappingURL=index.d.ts.map