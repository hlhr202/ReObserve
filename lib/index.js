"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ReObserve = /** @class */ (function () {
    function ReObserve() {
        this._previousArray = [];
        this._enableHistory = false;
        this._actionStream$ = new rxjs_1.Subject();
        this._actionMapper = function (state, action$) {
            return action$.pipe(operators_1.filter(function (action) { return action.source === 'SELF'; }), operators_1.map(function (action) { return action.payload; }));
        };
        this._ajaxStream$ = new rxjs_1.Subject();
        this._ajaxMapper = function (state, ajax$) {
            return ajax$.pipe(operators_1.filter(function (ajax) { return ajax.source === 'SELF'; }), operators_1.map(function (ajax) { return ajax.payload.response; }));
        };
        this._histryStream$ = new rxjs_1.Subject();
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
    Object.defineProperty(ReObserve.prototype, "current", {
        get: function () {
            return this._current;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReObserve.prototype, "previous", {
        get: function () {
            return this._previousArray;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReObserve.prototype, "observable", {
        get: function () {
            return this.join();
        },
        enumerable: true,
        configurable: true
    });
    ReObserve.prototype.undo = function () {
        if (this._enableHistory) {
            var previous = this._previousArray.pop();
            var current = this._current;
            if (previous) {
                this._histryStream$.next(previous);
                this._current = previous;
                this._watcher && this._watcher(current, previous);
            }
        }
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
        this._actionStream$.next({ type: type, payload: payload, source: 'SELF' });
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
        this._ajaxMapper = mapper;
        return this;
    };
    ReObserve.prototype.startWith = function (initialState) {
        if (initialState)
            this._current = initialState;
        return this;
    };
    ReObserve.prototype.mapAction = function (mapper) {
        this._actionMapper = mapper;
        return this;
    };
    ReObserve.prototype.join = function () {
        var _this = this;
        var actionStream$ = this._actionMapper(this._current, rxjs_1.merge(this._actionStream$, ReObserve.globalActionStream$), this);
        var ajaxStream$ = this._ajaxMapper(this._current, rxjs_1.merge(this._ajaxStream$, ReObserve.globalAjaxStream$), this);
        var watchStream$ = rxjs_1.merge(actionStream$, ajaxStream$);
        watchStream$.subscribe(function (next) {
            if (next && next !== _this._current) {
                var previous = _this._current;
                _this._enableHistory && _this._previousArray.push(previous);
                _this._current = next;
                _this._watcher && previous !== next && _this._watcher(previous, next);
            }
        });
        var resultStream$ = rxjs_1.merge(this._histryStream$, watchStream$).pipe(operators_1.startWith(this._current));
        return resultStream$;
    };
    ReObserve.globalActionStream$ = new rxjs_1.Subject();
    ReObserve.globalAjaxStream$ = new rxjs_1.Subject();
    ReObserve.create = function (initialState) {
        var instance = new ReObserve().startWith(initialState);
        return instance;
    };
    return ReObserve;
}());
exports.default = ReObserve;
exports.dispatch = ReObserve.dispatch;
exports.fetch = ReObserve.fetch;
//# sourceMappingURL=index.js.map