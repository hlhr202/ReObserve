import { Observable } from "rxjs";
import { AjaxResponse } from 'rxjs/ajax';
import ReactiveState from "./index";
export interface IAjaxResponse<T> extends AjaxResponse {
    response: T;
}
export interface IAction<T> {
    type: string;
    payload?: T;
}
export interface IAjaxSubsription<T> {
    type: string;
    payload: IAjaxResponse<T>;
}
export interface IAjaxEmit<T> {
    type: string;
    ajax$: Observable<IAjaxResponse<T>>;
}
export declare type IActionMapper<C, A = any> = (currentState: C, action$: Observable<IAction<A>>, context: ReactiveState<C>) => Observable<C | void>;
export declare type IAjaxMapper<C, A = any> = (currentState: C, ajax$: Observable<IAjaxSubsription<A>>, context: ReactiveState<C>) => Observable<C | void>;
//# sourceMappingURL=type.d.ts.map