"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ReObserve = /** @class */ (function () {
    /**
     * Create a new ReObserve
     * @constructor
     * @param initialState initialState
     */
    function ReObserve(initialState) {
        var _this = this;
        this._historyArray = [];
        this._enableHistory = false;
        this._actionStream$ = new rxjs_1.Subject();
        this._ajaxStream$ = new rxjs_1.Subject();
        this._histryStream$ = new rxjs_1.Subject();
        this._source$ = new rxjs_1.Subject();
        this._subscriptions = [];
        this._context = this;
        this.closed = false;
        initialState && this.startWith(initialState);
        this._globalAjaxSubscription = ReObserve.globalAjaxStream$.subscribe(function (ajax) {
            var type = ajax.type, source = ajax.source, payload = ajax.payload;
            _this._ajaxStream$.next({ type: type, source: source, payload: payload, state: _this._current });
        });
        this._globalActionSubscription = ReObserve.globalActionStream$.subscribe(function (action) {
            var type = action.type, source = action.source, payload = action.payload;
            _this._actionStream$.next({ type: type, source: source, payload: payload, state: _this._current });
        });
        return this;
    }
    /**
     * Global Dispatcher
     * @param {IActionEmit<P>} action action that will be emit to action stream, payload in generic type
     */
    ReObserve.dispatch = function (action) {
        var type = action.type, payload = action.payload;
        ReObserve.globalActionStream$.next({ type: type, payload: payload, source: 'GLOBAL' });
    };
    /**
     * Global Fetch
     * @param {IAjaxEmit<R>} ajax ajax that will be emit to ajax stream, response in generic type
     */
    ReObserve.fetch = function (ajax) {
        var type = ajax.type, ajax$ = ajax.ajax$;
        ajax$.subscribe(function (payload) {
            ReObserve.globalAjaxStream$.next({ type: type, payload: payload, source: 'GLOBAL' });
        }, function (err) {
            ReObserve.globalAjaxStream$.error({ type: type, err: err });
        });
    };
    /**
     * Return action observable in type
     * @param {string} type type of action in string format
     */
    ReObserve.fromAction = function (type) {
        return ReObserve.globalActionStream$.pipe(operators_1.filter(function (action) { return action.type === type; }));
    };
    /**
     * Return ajax observable in type
     * @param {string} type type of ajax in string format
     */
    ReObserve.fromAjax = function (type) {
        return ReObserve.globalAjaxStream$.pipe(operators_1.filter(function (ajax) { return ajax.type === type; }), operators_1.catchError(function (err) {
            if (err.type === type) {
                return rxjs_1.throwError(err);
            }
            else
                return rxjs_1.of();
        }));
    };
    /**
     * ReObserve factory mode create function
     * @param {C} initialState initialState
     * @returns {ReObserve<C>} new instance
     */
    ReObserve.create = function (initialState) {
        return new ReObserve(initialState);
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
    /**
     * Bind context for mapper function
     * @returns {ReObserve<T>} this
     * @param {any|ReObserve<T>} context defualt context will be 'this'
     */
    ReObserve.prototype.bind = function (context) {
        if (context === void 0) { context = this; }
        this._context = context;
        return this;
    };
    /**
     * Undo function (Yet not ready)
     * @deprecated
     * @returns {ReObserve<T>} this
     */
    ReObserve.prototype._undo = function () {
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
    /**
     * Start with initial state
     * @param {T} initialState will set current
     */
    ReObserve.prototype.startWith = function (initialState) {
        this._current = initialState;
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
        !this.closed && this._actionStream$.next({ type: type, payload: payload, source: 'SELF', state: this._current });
    };
    ReObserve.prototype.fetch = function (_a) {
        var _this = this;
        var type = _a.type, ajax$ = _a.ajax$;
        !this.closed &&
            ajax$.subscribe(function (payload) {
                _this._ajaxStream$.next({ type: type, payload: payload, source: 'SELF', state: _this._current });
            }, function (err) {
                _this._ajaxStream$.error(err);
            });
        return this;
    };
    ReObserve.prototype.mapAjax = function (mapper) {
        this._ajaxMapper = mapper;
        return this;
    };
    ReObserve.prototype.mapAction = function (mapper) {
        this._actionMapper = mapper;
        return this;
    };
    ReObserve.prototype.merge = function (stream$) {
        var _this = this;
        this._subscriptions.push(stream$.subscribe(function (value) { return _this.next(value); }, function (error) { return _this.error(error); }));
        return this;
    };
    ReObserve.prototype.mergeReduce = function (stream$, reducer) {
        var _this = this;
        this._subscriptions.push(stream$.subscribe(function (value) {
            var nextValue = reducer(_this.current, value);
            //console.log('nextValue', nextValue)
            _this.next(nextValue);
        }, function (error) { return _this.error(error); }));
        return this;
    };
    ReObserve.prototype.fromAction = function (type) {
        return this._actionStream$.pipe(operators_1.filter(function (action) { return action.type === type; }));
    };
    ReObserve.prototype.fromAjax = function (type) {
        return this._ajaxStream$.pipe(operators_1.filter(function (ajax) { return ajax.type === type; }));
    };
    ReObserve.prototype.join = function () {
        var _this = this;
        if (!this._joinStream$) {
            this._actionMapper &&
                this._actionMapper(this._actionStream$, this._context).subscribe(function (value) { return _this.next(value); }, function (error) { return _this.error(error); });
            this._ajaxMapper &&
                this._ajaxMapper(this._ajaxStream$, this._context).subscribe(function (value) { return _this.next(value); }, function (error) { return _this.error(error); });
            this._source$.subscribe(function (next) {
                if (next !== _this._current) {
                    var previous = _this._current;
                    _this._enableHistory && _this._historyArray.push(previous);
                    _this._current = next;
                    _this._watcher && _this._watcher(previous, next);
                }
            });
            this._joinStream$ = rxjs_1.merge(this._histryStream$, this._source$).pipe(operators_1.startWith(this._current));
            this.closed = false;
        }
    };
    /**
     * Call next function, implements Observer.next
     * @param {T} value next value
     */
    ReObserve.prototype.next = function (value) {
        return this._source$.next(value);
    };
    /**
     * Call complete, implements Observer.complete
     */
    ReObserve.prototype.complete = function () {
        return this._source$.complete();
    };
    /**
     * Call error, implements Observer.error
     * @param {any} err error
     */
    ReObserve.prototype.error = function (err) {
        return this._source$.error(err);
    };
    /**
     * Create Subscription, implements Subscribable
     * @param {PartialObserver<T> | ((value: T) => void)} observerOrNext
     * @param {(error: any) => void} error
     * @param {() => void} complete
     * @returns {Subscription}
     */
    ReObserve.prototype.subscribe = function (observerOrNext, error, complete) {
        this.join();
        this.closed = false;
        return this._joinStream$.subscribe(observerOrNext, error, complete);
    };
    ReObserve.prototype.unsubscribe = function () {
        this._globalActionSubscription.unsubscribe();
        this._globalAjaxSubscription.unsubscribe();
        this._subscriptions.forEach(function (subscription) { return subscription.unsubscribe(); });
        this._ajaxStream$.unsubscribe();
        this._actionStream$.unsubscribe();
        this._source$.unsubscribe();
        this._histryStream$.unsubscribe();
        this.closed = true;
    };
    ReObserve.prototype.asObservable = function () {
        this.join();
        this.closed = false;
        return this._joinStream$;
    };
    /**
     * Global Action Stream
     * @static
     */
    ReObserve.globalActionStream$ = new rxjs_1.Subject();
    /**
     * Global Ajax Strema
     */
    ReObserve.globalAjaxStream$ = new rxjs_1.Subject();
    return ReObserve;
}());
exports.default = ReObserve;
exports.dispatch = ReObserve.dispatch;
exports.fetch = ReObserve.fetch;
exports.fromAction = ReObserve.fromAction;
exports.fromAjax = ReObserve.fromAjax;
//# sourceMappingURL=index.js.map