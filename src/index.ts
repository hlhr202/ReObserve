import { Subject, Subscription, merge, Observable, empty, PartialObserver, SubscriptionLike, Subscribable, pipe } from "rxjs";
import { IActionSubscription, IActionEmit, IAjaxSubsription, IAjaxEmit, IActionMapper, IAjaxMapper, IGlobalActionSubscription, IGlobalAjaxSubsription } from "./type";
import { filter, map, startWith } from "rxjs/operators";

class ReObserve<T = void> implements Subscribable<T>, SubscriptionLike {
    static globalActionStream$ = new Subject<IGlobalActionSubscription<any>>()
    static dispatch<P = any>(action: IActionEmit<P>) {
        const { type, payload } = action
        ReObserve.globalActionStream$.next({ type, payload, source: 'GLOBAL' })
    }

    static globalAjaxStream$ = new Subject<IGlobalAjaxSubsription<any>>()
    static fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>) {
        ajax$.subscribe(payload => {
            ReObserve.globalAjaxStream$.next({ type, payload, source: 'GLOBAL' })
        }, err => {
            ReObserve.globalAjaxStream$.error(err)
        })
    }

    static defaultActionMapper: IActionMapper<any> = action$ => action$.pipe(
        filter(action => action.source === 'SELF'),
        map(action => action.payload)
    )

    static defaultAjaxMapper: IAjaxMapper<any> = ajax$ => ajax$.pipe(
        filter(ajax => ajax.source === 'SELF'),
        map(ajax => ajax.payload.response)
    )

    //source!: Observable<T | void>
    private _current!: T
    private _historyArray: T[] = []
    private _enableHistory = false
    private _watcher?: (prev: T, curr: T) => void
    private _actionStream$ = new Subject<IActionSubscription<T, any>>()
    private _ajaxStream$ = new Subject<IAjaxSubsription<any>>()
    private _actionMapper = ReObserve.defaultActionMapper
    private _ajaxMapper = ReObserve.defaultAjaxMapper

    private _histryStream$ = new Subject<T | void>()
    private _joinStream$!: Observable<T>
    private _joinSubscription!: Subscription
    private _source$ = new Subject<T>()

    private _globalAjaxSubscription!: Subscription
    private _globalActionSubscription!: Subscription

    public closed = false

    constructor(initialState?: T) {
        initialState && this.startWith(initialState)
        this._globalAjaxSubscription = ReObserve.globalAjaxStream$.subscribe(ajax => {
            const { type, source, payload } = ajax
            this._ajaxStream$.next({ type, source, payload, state: this._current })
        })
        this._globalActionSubscription = ReObserve.globalActionStream$.subscribe(action => {
            const { type, source, payload } = action
            this._actionStream$.next({ type, source, payload, state: this._current })
        })
        this.mapAction(ReObserve.defaultActionMapper).mapAjax(ReObserve.defaultAjaxMapper)
        return this
    }

    static create = <C = {}>(initialState?: C) => {
        return new ReObserve<C>(initialState)
    }
    get current() {
        return this._current
    }
    get histories() {
        return this._historyArray
    }

    undo() {
        if (this._enableHistory) {
            const previous = this._historyArray.pop()
            const current = this._current
            if (previous) {
                this._histryStream$.next(previous)
                this._current = previous
                this._watcher && this._watcher(current, previous)
            }
        }
        return this
    }

    startWith(initialState?: T) {
        if (initialState) this._current = initialState
        return this
    }

    withRecord(flag: boolean) {
        this._enableHistory = flag
        return this
    }

    watch(watcher: (prev: T, curr: T) => void) {
        this._watcher = watcher
        return this
    }

    dispatch<P = any>(action: IActionEmit<P>) {
        const { type, payload } = action
        !this.closed && this._actionStream$.next({ type, payload, source: 'SELF', state: this._current })
    }

    fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>) {
        !this.closed && ajax$.subscribe(payload => {
            this._ajaxStream$.next({ type, payload, source: 'SELF', state: this._current })
        }, err => {
            this._ajaxStream$.error(err)
        })
        return this
    }

    mapAjax<R = T>(mapper: IAjaxMapper<T, R>) {
        // mapper(this._ajaxStream$).subscribe(value => {
        //     this.next(value)
        // })
        this._ajaxMapper = mapper
        return this
    }

    mapAction<R = T>(mapper: IActionMapper<T, R>) {
        // mapper(this._actionStream$).subscribe(value => {
        //     this.next(value)
        // })
        this._actionMapper = mapper
        return this
    }

    // merge(...stream$: (Observable<T | void>[])) {
    //     this.source = merge(this.source, ...stream$)
    //     return this
    // }

    private join() {
        if (!this._joinStream$) {
            this._actionMapper(this._actionStream$).subscribe(value => this.next(value))
            this._ajaxMapper(this._ajaxStream$).subscribe(value => this.next(value))
            this._source$.subscribe(next => {
                if (next && next !== this._current) {
                    const previous = this._current
                    this._enableHistory && this._historyArray.push(previous)
                    this._current = next
                    this._watcher && previous !== next && this._watcher(previous, next)
                }
            })
            this._joinStream$ = merge<T>(this._histryStream$, this._source$).pipe(startWith(this._current))
            this.closed = false
        }
    }

    next(value: T | void) {
        return value && this._source$ ? this._source$.next(value) : undefined
    }

    complete() {
        return this._source$ ? this._source$.complete() : undefined
    }

    error(err: any) {
        return this._source$ ? this._source$.error(err) : undefined
    }

    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription {
        this.join()
        this.closed = false
        this._joinSubscription = this._joinStream$.subscribe(observerOrNext as ((value: T) => void), error, complete)
        return this._joinSubscription
    }

    unsubscribe() {

        this._globalActionSubscription.unsubscribe()
        this._globalAjaxSubscription.unsubscribe()

        this._ajaxStream$.unsubscribe()
        this._actionStream$.unsubscribe()
        this._source$.unsubscribe()
        this._histryStream$.unsubscribe()
        this._joinSubscription.unsubscribe()
        this.closed = true
    }

    asObservable() {
        this.join()
        this.closed = false
        return this._joinStream$
    }
}

export default ReObserve
export const dispatch = ReObserve.dispatch
export const fetch = ReObserve.fetch