import { Observable } from "rxjs";
import { AjaxResponse } from 'rxjs/ajax';
import ReObserve from "./index";

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
export type IActionMapper<C, A = any> = (currentState: C, action$: Observable<IAction<A>>, context: ReObserve<C>) => Observable<C | void>;
export type IAjaxMapper<C, A = any> = (currentState: C, ajax$: Observable<IAjaxSubsription<A>>, context: ReObserve<C>) => Observable<C | void>;