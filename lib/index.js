"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ReObserve = /** @class */ (function () {
    function ReObserve(initialState) {
        var _this = this;
        this._historyArray = [];
        this._enableHistory = false;
        this._actionStream$ = new rxjs_1.Subject();
        this._ajaxStream$ = new rxjs_1.Subject();
        this._actionMapper = ReObserve.defaultActionMapper;
        this._ajaxMapper = ReObserve.defaultAjaxMapper;
        this._histryStream$ = new rxjs_1.Subject();
        this._source$ = new rxjs_1.Subject();
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
        this.mapAction(ReObserve.defaultActionMapper).mapAjax(ReObserve.defaultAjaxMapper);
        return this;
    }
    ReObserve.dispatch = function (action) {
        var type = action.type, payload = action.payload;
        ReObserve.globalActionStream$.next({ type: type, payload: payload, source: 'GLOBAL' });
    };
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
    ReObserve.fromAction = function (type) {
        return ReObserve.globalActionStream$.pipe(operators_1.filter(function (action) { return action.type === type; }));
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
        !this.closed && ajax$.subscribe(function (payload) {
            _this._ajaxStream$.next({ type: type, payload: payload, source: 'SELF', state: _this._current });
        }, function (err) {
            _this._ajaxStream$.error(err);
        }, function () {
            _this._ajaxStream$.complete();
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
        stream$.subscribe(function (value) { return _this.next(value); }, function (error) { return _this.error(error); });
        return this;
    };
    ReObserve.prototype.fromAction = function (type) {
        return this._actionStream$.pipe(operators_1.filter(function (action) { return action.type === type; }));
    };
    ReObserve.prototype.join = function () {
        var _this = this;
        if (!this._joinStream$) {
            this._actionMapper(this._actionStream$).subscribe(function (value) { return _this.next(value); }, function (error) { return _this.error(error); });
            this._ajaxMapper(this._ajaxStream$).subscribe(function (value) { return _this.next(value); }, function (error) { return _this.error(error); });
            this._source$.subscribe(function (next) {
                if (next && next !== _this._current) {
                    var previous = _this._current;
                    _this._enableHistory && _this._historyArray.push(previous);
                    _this._current = next;
                    _this._watcher && previous !== next && _this._watcher(previous, next);
                }
            });
            this._joinStream$ = rxjs_1.merge(this._histryStream$, this._source$).pipe(operators_1.startWith(this._current));
            this.closed = false;
        }
    };
    ReObserve.prototype.next = function (value) {
        return value && this._source$ ? this._source$.next(value) : undefined;
    };
    ReObserve.prototype.complete = function () {
        return this._source$ ? this._source$.complete() : undefined;
    };
    ReObserve.prototype.error = function (err) {
        return this._source$ ? this._source$.error(err) : undefined;
    };
    ReObserve.prototype.subscribe = function (observerOrNext, error, complete) {
        this.join();
        this.closed = false;
        return this._joinStream$.subscribe(observerOrNext, error, complete);
    };
    ReObserve.prototype.unsubscribe = function () {
        this._globalActionSubscription.unsubscribe();
        this._globalAjaxSubscription.unsubscribe();
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
    ReObserve.globalActionStream$ = new rxjs_1.Subject();
    ReObserve.globalAjaxStream$ = new rxjs_1.Subject();
    ReObserve.defaultActionMapper = function (action$) { return action$.pipe(operators_1.filter(function (action) { return action.source === 'SELF'; }), operators_1.map(function (action) { return action.payload; })); };
    ReObserve.defaultAjaxMapper = function (ajax$) { return ajax$.pipe(operators_1.filter(function (ajax) { return ajax.source === 'SELF'; }), operators_1.map(function (ajax) { return ajax.payload.response; })); };
    ReObserve.create = function (initialState) {
        return new ReObserve(initialState);
    };
    return ReObserve;
}());
exports.default = ReObserve;
exports.dispatch = ReObserve.dispatch;
exports.fetch = ReObserve.fetch;
//# sourceMappingURL=index.js.map