import { Subject, Subscription, merge, Observable, empty, PartialObserver } from "rxjs";
import { IActionSubscription, IActionEmit, IAjaxSubsription, IAjaxEmit, IActionMapper, IAjaxMapper } from "./type";
import { filter, map, startWith } from "rxjs/operators";

class ReObserve<T = void> extends Subject<T> {
    static globalActionStream$ = new Subject<IActionSubscription<any>>()
    static dispatch<P = any>(action: IActionEmit<P>) {
        const { type, payload } = action
        ReObserve.globalActionStream$.next({ type, payload, source: 'GLOBAL' })
    }

    static globalAjaxStream$ = new Subject<IAjaxSubsription<any>>()
    static fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>) {
        ajax$.subscribe(payload => {
            ReObserve.globalAjaxStream$.next({ type, payload, source: 'GLOBAL' })
        }, err => {
            ReObserve.globalAjaxStream$.error(err)
        }, () => {
            ReObserve.globalAjaxStream$.complete()
        })
    }

    static defaultActionMapper: IActionMapper<any> = (state, action$) => action$.pipe(
        filter(action => action.source === 'SELF'),
        map(action => action.payload)
    )

    static defaultAjaxMapper: IAjaxMapper<any> = (state, ajax$) => ajax$.pipe(
        filter(ajax => ajax.source === 'SELF'),
        map(ajax => ajax.payload.response)
    )

    source!: Observable<T | void>
    private _current!: T
    private _historyArray: T[] = []
    private _enableHistory = false
    private _watcher?: (prev: T, curr: T) => void
    private _actionStream$ = new Subject<IActionSubscription<any>>()
    private _ajaxStream$ = new Subject<IAjaxSubsription<any>>()
    private _histryStream$ = new Subject<T | void>()
    private _joinStream$!: Observable<T>
    private _otherStream$ = new Subject<T>()

    constructor(initialState?: T) {
        super()
        initialState && this.startWith(initialState)
        this.mapAction(ReObserve.defaultActionMapper).mapAjax(ReObserve.defaultAjaxMapper).merge(this._otherStream$)
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
        this.source = empty().pipe(startWith(this._current))
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
        this._actionStream$.next({ type, payload, source: 'SELF' })
    }

    fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>) {
        ajax$.subscribe(payload => {
            this._ajaxStream$.next({ type, payload, source: 'SELF' })
        }, err => {
            this._ajaxStream$.error(err)
        }, () => {
            this._ajaxStream$.complete()
        })
        return this
    }

    mapAjax(mapper: IAjaxMapper<T>) {
        const ajaxStream$ = mapper(this._current, merge(this._ajaxStream$, ReObserve.globalAjaxStream$), this)
        return this.merge(ajaxStream$)
    }

    mapAction(mapper: IActionMapper<T>) {
        const actionStream$ = mapper(this._current, merge(this._actionStream$, ReObserve.globalActionStream$), this)
        return this.merge(actionStream$)
    }

    merge(...stream$: (Observable<T | void>[])) {
        this.source = merge(this.source, ...stream$)
        return this
    }

    private join() {
        if (!this._joinStream$) {
            this.source.subscribe(next => {
                if (next && next !== this._current) {
                    const previous = this._current
                    this._enableHistory && this._historyArray.push(previous)
                    this._current = next
                    this._watcher && previous !== next && this._watcher(previous, next)
                }
            })
            this._joinStream$ = merge<T>(this._histryStream$, this.source)
        }
    }

    next(value?: T) {
        return this._otherStream$.next(value)
    }

    complete() {
        return this._otherStream$.complete()
    }

    error(err: any) {
        return this._otherStream$.error(err)
    }

    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription {
        this.join()
        return this._joinStream$.subscribe(observerOrNext as ((value: T) => void), error, complete)
    }
}

export default ReObserve
export const dispatch = ReObserve.dispatch
export const fetch = ReObserve.fetch