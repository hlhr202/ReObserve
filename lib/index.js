"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ReactiveState = /** @class */ (function () {
    function ReactiveState() {
        this._previousArray = [];
        this._enableHistory = false;
        this._actionStream$ = new rxjs_1.Subject();
        this._actionMapper = function (state, action$) { return action$.pipe(operators_1.map(function (action) { return action.payload; })); };
        this._ajaxStream$ = new rxjs_1.Subject();
        this._ajaxMapper = function (state, ajax$) { return ajax$.pipe(operators_1.map(function (ajax) { return ajax.payload.response; })); };
        this._histryStream$ = new rxjs_1.Subject();
    }
    ReactiveState.dispatch = function (action) {
        ReactiveState.globalActionStream$.next(action);
    };
    ReactiveState.fetch = function (_a) {
        var type = _a.type, ajax$ = _a.ajax$;
        ajax$.subscribe(function (payload) {
            ReactiveState.globalAjaxStream$.next({ type: type, payload: payload });
        }, function (err) {
            ReactiveState.globalAjaxStream$.error(err);
        }, function () {
            ReactiveState.globalAjaxStream$.complete();
        });
    };
    Object.defineProperty(ReactiveState.prototype, "current", {
        get: function () {
            return this._current;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactiveState.prototype, "previous", {
        get: function () {
            return this._previousArray;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReactiveState.prototype, "observable", {
        get: function () {
            return this.join();
        },
        enumerable: true,
        configurable: true
    });
    ReactiveState.prototype.undo = function () {
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
    ReactiveState.prototype.withRecord = function (flag) {
        this._enableHistory = flag;
        return this;
    };
    ReactiveState.prototype.watch = function (watcher) {
        this._watcher = watcher;
        return this;
    };
    ReactiveState.prototype.dispatch = function (action) {
        this._actionStream$.next(action);
    };
    ReactiveState.prototype.fetch = function (_a) {
        var _this = this;
        var type = _a.type, ajax$ = _a.ajax$;
        ajax$.subscribe(function (payload) {
            _this._ajaxStream$.next({ type: type, payload: payload });
        }, function (err) {
            _this._ajaxStream$.error(err);
        }, function () {
            _this._ajaxStream$.complete();
        });
        return this;
    };
    ReactiveState.prototype.mapAjax = function (mapper) {
        this._ajaxMapper = mapper;
        return this;
    };
    ReactiveState.prototype.startWith = function (initialState) {
        if (initialState)
            this._current = initialState;
        return this;
    };
    ReactiveState.prototype.mapAction = function (mapper) {
        this._actionMapper = mapper;
        return this;
    };
    ReactiveState.prototype.join = function () {
        var _this = this;
        var actionStream$ = this._actionMapper(this._current, rxjs_1.merge(this._actionStream$, ReactiveState.globalActionStream$), this);
        var ajaxStream$ = this._ajaxMapper(this._current, rxjs_1.merge(this._ajaxStream$, ReactiveState.globalAjaxStream$), this);
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
    ReactiveState.globalActionStream$ = new rxjs_1.Subject();
    ReactiveState.globalAjaxStream$ = new rxjs_1.Subject();
    ReactiveState.create = function (initialState) {
        var instance = new ReactiveState().startWith(initialState);
        return instance;
    };
    return ReactiveState;
}());
exports.default = ReactiveState;
exports.dispatch = ReactiveState.dispatch;
exports.fetch = ReactiveState.fetch;
//# sourceMappingURL=index.js.map