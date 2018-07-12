import { IActionEmit, IAjaxSubsription, IAjaxEmit, IActionMapper, IAjaxMapper, IActionSubscription } from "./type";
import { Subject } from "rxjs";
declare class ReObserve<T = {}> {
    static globalActionStream$: Subject<IActionSubscription<any>>;
    static dispatch<P = any>(action: IActionEmit<P>): void;
    static globalAjaxStream$: Subject<IAjaxSubsription<any>>;
    static fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>): void;
    private _current;
    private _previousArray;
    private _enableHistory;
    private _watcher?;
    private _actionStream$;
    private _actionMapper;
    private _ajaxStream$;
    private _ajaxMapper;
    private _histryStream$;
    static create: <C = {}>(initialState?: C | undefined) => ReObserve<C>;
    readonly current: T;
    readonly previous: T[];
    readonly observable: import("../../../../../../Users/wensihao1/Desktop/hlhr/testrxjs/node_modules/rxjs/internal/Observable").Observable<{}>;
    undo(): this;
    withRecord(flag: boolean): this;
    watch(watcher: (prev: T, curr: T) => void): this;
    dispatch<P = any>(action: IActionEmit<P>): void;
    fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>): this;
    mapAjax(mapper: IAjaxMapper<T>): this;
    startWith(initialState?: T): this;
    mapAction(mapper: IActionMapper<T>): this;
    join(): import("../../../../../../Users/wensihao1/Desktop/hlhr/testrxjs/node_modules/rxjs/internal/Observable").Observable<{}>;
}
export default ReObserve;
export declare const dispatch: typeof ReObserve.dispatch;
export declare const fetch: typeof ReObserve.fetch;
//# sourceMappingURL=index.d.ts.map