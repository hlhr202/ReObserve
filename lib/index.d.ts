import { Subject, Subscription, Observable, PartialObserver } from "rxjs";
import { IActionEmit, IAjaxSubsription, IAjaxEmit, IActionMapper, IAjaxMapper } from "./type";
declare class ReObserve<T = void> extends Subject<T> {
    static globalAjaxStream$: Subject<IAjaxSubsription<any>>;
    static fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>): void;
    static defaultAjaxMapper: IAjaxMapper<any>;
    source: Observable<T | void>;
    private _current;
    private _historyArray;
    private _enableHistory;
    private _watcher?;
    private _actionStream$;
    private _ajaxStream$;
    private _histryStream$;
    private _joinStream$;
    private _otherStream$;
    constructor(initialState?: T);
    static create: <C = {}>(initialState?: C | undefined) => ReObserve<C>;
    readonly current: T;
    readonly histories: T[];
    undo(): this;
    startWith(initialState?: T): this;
    withRecord(flag: boolean): this;
    watch(watcher: (prev: T, curr: T) => void): this;
    dispatch<P = any>(action: IActionEmit<P>): void;
    fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>): this;
    mapAjax(mapper: IAjaxMapper<T>): this;
    mapAction(mapper: IActionMapper<T>): this;
    merge(...stream$: (Observable<T | void>[])): this;
    private join;
    next(value: T | void): void;
    complete(): void;
    error(err: any): void;
    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription;
}
export default ReObserve;
export declare const fetch: typeof ReObserve.fetch;
//# sourceMappingURL=index.d.ts.map