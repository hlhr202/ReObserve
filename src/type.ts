import { Observable } from "rxjs";
import { AjaxResponse } from 'rxjs/ajax';
import ReObserve from "./index";

export interface IAjaxResponse<T> extends AjaxResponse {
    response: T;
}
export interface IActionEmit<T> {
    type: string;
    payload?: T;
}
export interface IActionSubscription<C, T> extends IActionEmit<T>{
    state: C
    source: 'GLOBAL' | 'SELF'
}
export interface IAjaxSubsription<T> {
    type: string;
    source: 'GLOBAL' | 'SELF'
    payload: IAjaxResponse<T>;
}
export interface IAjaxEmit<T> {
    type: string;
    ajax$: Observable<IAjaxResponse<T>>;
}
export type IActionMapper<C, A = any> = (action$: Observable<IActionSubscription<C, A>>) => Observable<C | void>;
export type IAjaxMapper<C, A = any> = (currentState: C, ajax$: Observable<IAjaxSubsription<A>>, context: ReObserve<C>) => Observable<C | void>;