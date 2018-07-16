"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ReObserve = /** @class */ (function (_super) {
    __extends(ReObserve, _super);
    function ReObserve(initialState) {
        var _this = _super.call(this) || this;
        _this._historyArray = [];
        _this._enableHistory = false;
        _this._actionStream$ = new rxjs_1.Subject();
        _this._ajaxStream$ = new rxjs_1.Subject();
        _this._histryStream$ = new rxjs_1.Subject();
        _this._otherStream$ = new rxjs_1.Subject();
        initialState && _this.startWith(initialState);
        //this.mapAction(ReObserve.defaultActionMapper).mapAjax(ReObserve.defaultAjaxMapper)
        return _this;
    }
    ReObserve.fetch = function (_a) {
        var type = _a.type, ajax$ = _a.ajax$;
        ajax$.subscribe(function (payload) {
            ReObserve.globalAjaxStream$.next({ type: type, payload: payload, source: 'GLOBAL' });
        }, function (err) {
            ReObserve.globalAjaxStream$.error(err);
        }, function () {
            ReObserve.globalAjaxStream$.complete();
        });
    };
    Object.defineProperty(ReObserve.prototype, "current", {
        get: function () {
            return this._current;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReObserve.prototype, "histories", {
        get: function () {
            return this._historyArray;
        },
        enumerable: true,
        configurable: true
    });
    ReObserve.prototype.undo = function () {
        if (this._enableHistory) {
            var previous = this._historyArray.pop();
            var current = this._current;
            if (previous) {
                this._histryStream$.next(previous);
                this._current = previous;
                this._watcher && this._watcher(current, previous);
            }
        }
        return this;
    };
    ReObserve.prototype.startWith = function (initialState) {
        if (initialState)
            this._current = initialState;
        this.source = rxjs_1.empty().pipe(operators_1.startWith(this._current));
        return this;
    };
    ReObserve.prototype.withRecord = function (flag) {
        this._enableHistory = flag;
        return this;
    };
    ReObserve.prototype.watch = function (watcher) {
        this._watcher = watcher;
        return this;
    };
    ReObserve.prototype.dispatch = function (action) {
        var type = action.type, payload = action.payload;
        this._actionStream$.next({ type: type, payload: payload, source: 'SELF', state: this._current });
    };
    ReObserve.prototype.fetch = function (_a) {
        var _this = this;
        var type = _a.type, ajax$ = _a.ajax$;
        ajax$.subscribe(function (payload) {
            _this._ajaxStream$.next({ type: type, payload: payload, source: 'SELF' });
        }, function (err) {
            _this._ajaxStream$.error(err);
        }, function () {
            _this._ajaxStream$.complete();
        });
        return this;
    };
    ReObserve.prototype.mapAjax = function (mapper) {
        var _this = this;
        var ajaxStream$ = mapper(this._current, rxjs_1.merge(this._ajaxStream$, ReObserve.globalAjaxStream$), this);
        ajaxStream$.subscribe(function (next) { return _this.next(next); });
        return this;
    };
    ReObserve.prototype.mapAction = function (mapper) {
        var _this = this;
        //const actionStream$ = mapper(() => this._current, merge(this._actionStream$/*, ReObserve.globalActionStream$*/), this)
        //actionStream$.subscribe(next => this.next(next))
        mapper(this._actionStream$).subscribe(function (value) {
            _this.next(value);
        });
        return this;
    };
    ReObserve.prototype.merge = function () {
        var stream$ = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            stream$[_i] = arguments[_i];
        }
        this.source = rxjs_1.merge.apply(void 0, [this.source].concat(stream$));
        return this;
    };
    ReObserve.prototype.join = function () {
        var _this = this;
        if (!this._joinStream$) {
            this._otherStream$.subscribe(function (next) {
                if (next && next !== _this._current) {
                    var previous = _this._current;
                    _this._enableHistory && _this._historyArray.push(previous);
                    _this._current = next;
                    _this._watcher && previous !== next && _this._watcher(previous, next);
                }
            });
            this._joinStream$ = rxjs_1.merge(this._histryStream$, this._otherStream$, this.source);
        }
    };
    ReObserve.prototype.next = function (value) {
        this.join();
        return value ? this._otherStream$.next(value) : this._otherStream$.next();
    };
    ReObserve.prototype.complete = function () {
        this.join();
        return this._otherStream$.complete();
    };
    ReObserve.prototype.error = function (err) {
        this.join();
        return this._otherStream$.error(err);
    };
    ReObserve.prototype.subscribe = function (observerOrNext, error, complete) {
        this.join();
        return this._joinStream$.subscribe(observerOrNext, error, complete);
    };
    // static globalActionStream$ = new Subject<IActionSubscription<any>>()
    // static dispatch<P = any>(action: IActionEmit<P>) {
    //     const { type, payload } = action
    //     ReObserve.globalActionStream$.next({ type, payload, source: 'GLOBAL' })
    // }
    ReObserve.globalAjaxStream$ = new rxjs_1.Subject();
    // static defaultActionMapper: IActionMapper<any> = (state, action$) => action$.pipe(
    //     filter(action => action.source === 'SELF'),
    //     map(action => action.payload)
    // )
    ReObserve.defaultAjaxMapper = function (state, ajax$) { return ajax$.pipe(operators_1.filter(function (ajax) { return ajax.source === 'SELF'; }), operators_1.map(function (ajax) { return ajax.payload.response; })); };
    ReObserve.create = function (initialState) {
        return new ReObserve(initialState);
    };
    return ReObserve;
}(rxjs_1.Subject));
exports.default = ReObserve;
//export const dispatch = ReObserve.dispatch
exports.fetch = ReObserve.fetch;
//# sourceMappingURL=index.js.map