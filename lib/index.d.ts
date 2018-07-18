import { Subject, Subscription, Observable, PartialObserver, SubscriptionLike, Subscribable } from "rxjs";
import { IActionEmit, IAjaxEmit, IActionMapper, IAjaxMapper, IGlobalActionSubscription, IGlobalAjaxSubsription } from "./type";
declare class ReObserve<T = void> implements Subscribable<T>, SubscriptionLike {
    static globalActionStream$: Subject<IGlobalActionSubscription<any>>;
    static dispatch<P = any>(action: IActionEmit<P>): void;
    static globalAjaxStream$: Subject<IGlobalAjaxSubsription<any>>;
    static fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>): void;
    static defaultActionMapper: IActionMapper<any>;
    static defaultAjaxMapper: IAjaxMapper<any>;
    source: Observable<T | void>;
    private _current;
    private _historyArray;
    private _enableHistory;
    private _watcher?;
    private _actionStream$;
    private _ajaxStream$;
    private _actionMapper;
    private _ajaxMapper;
    private _histryStream$;
    private _joinStream$;
    private _joinSubscription;
    private _source$;
    private _globalAjaxSubscription;
    private _globalActionSubscription;
    closed: boolean;
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
    mapAjax<R = T>(mapper: IAjaxMapper<T, R>): this;
    mapAction<R = T>(mapper: IActionMapper<T, R>): this;
    private join;
    next(value: T | void): void;
    complete(): void;
    error(err: any): void;
    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription;
    unsubscribe(): void;
    asObservable(): Subscription;
}
export default ReObserve;
export declare const dispatch: typeof ReObserve.dispatch;
export declare const fetch: typeof ReObserve.fetch;
//# sourceMappingURL=index.d.ts.map