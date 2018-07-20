import { Observable } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import ReObserve from './index';

export interface IAjaxResponse<T> extends AjaxResponse {
	response: T;
}
export interface IActionEmit<T> {
	type: string;
	payload?: T;
}
export interface IGlobalActionSubscription<T> extends IActionEmit<T> {
	source: 'GLOBAL';
}
export interface IActionSubscription<C, T = C> extends IActionEmit<T> {
	state: C;
	source: 'GLOBAL' | 'SELF';
}

export interface IGlobalAjaxSubsription<T> {
	type: string;
	source: 'GLOBAL';
	payload: IAjaxResponse<T>;
}

export interface IAjaxSubsription<C, T = C> {
	state: C;
	type: string;
	source: 'GLOBAL' | 'SELF';
	payload: IAjaxResponse<T>;
}
export interface IAjaxEmit<T> {
	type: string;
	ajax$: Observable<IAjaxResponse<T>>;
}
export type IActionMapper<C, A = any> = (
	action$: Observable<IActionSubscription<C, A>>,
	context$?: any | ReObserve<C>
) => Observable<C | void>;
export type IAjaxMapper<C, A = any> = (
	ajax$: Observable<IAjaxSubsription<C, A>>,
	context$?: any | ReObserve<C>
) => Observable<C | void>;
