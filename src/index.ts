import { IAction, IAjaxSubsription, IAjaxEmit, IActionMapper, IAjaxMapper } from "./type";
import { Subject, merge } from "rxjs";
import { startWith, map } from "rxjs/operators";

class ReObserve<T = {}> {
    
    static globalActionStream$ = new Subject<IAction<any>>()
    static dispatch<P = any>(action: IAction<P>) {
        ReObserve.globalActionStream$.next(action)
    }

    static globalAjaxStream$ = new Subject<IAjaxSubsription<any>>()
    static fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>) {
        ajax$.subscribe(payload => {
            ReObserve.globalAjaxStream$.next({ type, payload })
        }, err => {
            ReObserve.globalAjaxStream$.error(err)
        }, () => {
            ReObserve.globalAjaxStream$.complete()
        })
    }

    private _current!: T
    private _previousArray: T[] = []
    private _enableHistory = false

    private _watcher?: (prev: T, curr: T) => void

    private _actionStream$ = new Subject<IAction<any>>()
    private _actionMapper: IActionMapper<T> = (state, action$) => action$.pipe(map(action => action.payload))

    private _ajaxStream$ = new Subject<IAjaxSubsription<any>>()
    private _ajaxMapper: IAjaxMapper<T> = (state, ajax$) => ajax$.pipe(map(ajax => ajax.payload.response))

    private _histryStream$ = new Subject<T>()

    static create = <C = {}>(initialState?: C) => {
        const instance = new ReObserve<C>().startWith(initialState)
        return instance
    }
    get current() {
        return this._current
    }
    get previous() {
        return this._previousArray
    }
    get observable() {
        return this.join()
    }
    undo() {
        if (this._enableHistory) {
            const previous = this._previousArray.pop()
            const current = this._current
            if (previous) {
                this._histryStream$.next(previous)
                this._current = previous
                this._watcher && this._watcher(current, previous)
            }
        }
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
    dispatch<P = any>(action: IAction<P>) {
        this._actionStream$.next(action)
    }
    fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>) {
        ajax$.subscribe(payload => {
            this._ajaxStream$.next({ type, payload })
        }, err => {
            this._ajaxStream$.error(err)
        }, () => {
            this._ajaxStream$.complete()
        })
        return this
    }
    mapAjax(mapper: IAjaxMapper<T>) {
        this._ajaxMapper = mapper
        return this
    }
    startWith(initialState?: T) {
        if (initialState) this._current = initialState
        return this
    }
    mapAction(mapper: IActionMapper<T>) {
        this._actionMapper = mapper
        return this
    }
    join() {
        const actionStream$ = this._actionMapper(this._current, merge(this._actionStream$, ReObserve.globalActionStream$), this)
        const ajaxStream$ = this._ajaxMapper(this._current, merge(this._ajaxStream$, ReObserve.globalAjaxStream$), this)
        const watchStream$ = merge(actionStream$, ajaxStream$)

        watchStream$.subscribe(next => {
            if (next && next !== this._current) {
                const previous = this._current
                this._enableHistory && this._previousArray.push(previous)
                this._current = next
                this._watcher && previous !== next && this._watcher(previous, next)
            }
        })
        const resultStream$ = merge(this._histryStream$, watchStream$).pipe(startWith(this._current))
        return resultStream$
    }
}

export default ReObserve
export const dispatch = ReObserve.dispatch
export const fetch = ReObserve.fetch