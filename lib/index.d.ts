import { IAction, IAjaxSubsription, IAjaxEmit, IActionMapper, IAjaxMapper } from "./type";
import { Subject } from "rxjs";
declare class ReactiveState<T = {}> {
    static globalActionStream$: Subject<IAction<any>>;
    static dispatch<P = any>(action: IAction<P>): void;
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
    static create: <C = {}>(initialState?: C | undefined) => ReactiveState<C>;
    readonly current: T;
    readonly previous: T[];
    readonly observable: import("../../../../../../Users/wensihao1/Desktop/hlhr/testrxjs/node_modules/rxjs/internal/Observable").Observable<{}>;
    undo(): this;
    withRecord(flag: boolean): this;
    watch(watcher: (prev: T, curr: T) => void): this;
    dispatch<P = any>(action: IAction<P>): void;
    fetch<R = any>({ type, ajax$ }: IAjaxEmit<R>): this;
    mapAjax(mapper: IAjaxMapper<T>): this;
    startWith(initialState?: T): this;
    mapAction(mapper: IActionMapper<T>): this;
    join(): import("../../../../../../Users/wensihao1/Desktop/hlhr/testrxjs/node_modules/rxjs/internal/Observable").Observable<{}>;
}
export default ReactiveState;
export declare const dispatch: typeof ReactiveState.dispatch;
export declare const fetch: typeof ReactiveState.fetch;
//# sourceMappingURL=index.d.ts.map