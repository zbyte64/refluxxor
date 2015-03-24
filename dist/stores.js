"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = _interopRequire(require("lodash"));

var Kefir = _interopRequire(require("kefir"));

var Store = exports.Store = (function () {
  function Store() {
    _classCallCheck(this, Store);
  }

  _prototypeProperties(Store, null, {
    getInitialState: {
      //support react like life-cycle methods

      value: function getInitialState() {
        return null;
      },
      writable: true,
      configurable: true
    },
    getReferences: {
      value: function getReferences(flux) {
        return {};
      },
      writable: true,
      configurable: true
    },
    storeDidMount: {
      value: function storeDidMount() {},
      writable: true,
      configurable: true
    },
    shouldStoreUpdate: {
      value: function shouldStoreUpdate(prevState, nextState) {
        return prevState !== nextState;
      },
      writable: true,
      configurable: true
    },
    storeWillUpdate: {
      value: function storeWillUpdate(nextState) {
        return nextState;
      },
      writable: true,
      configurable: true
    },
    storeDidUpdate: {
      value: function storeDidUpdate(prevState) {},
      writable: true,
      configurable: true
    },
    storeWillUnmount: {
      value: function storeWillUnmount() {},
      writable: true,
      configurable: true
    },
    getState: {
      value: function getState() {
        return this.state;
      },
      writable: true,
      configurable: true
    },
    replaceState: {
      //the nitty gritty event notifications, aka don't override these

      value: function replaceState(nextState) {
        var prevState = this.state;
        if (this.shouldStoreUpdate(prevState, nextState)) {
          nextState = this.storeWillUpdate(nextState) || nextState;
          this.state = nextState;
          this.trigger(nextState);
          this.storeDidUpdate(prevState);
        } else {
          this.state = nextState;
        }
      },
      writable: true,
      configurable: true
    },
    trigger: {
      value: function trigger(message) {
        this.emitter.emit(message);
      },
      writable: true,
      configurable: true
    },
    subscribe: {
      value: function subscribe(callback) {
        this.emitter.onValue(callback);
        //_.partial doesn't work cuz Javascript
        return _.bind(this.emitter.offValue, this.emitter, callback);
      },
      writable: true,
      configurable: true
    },
    bindTo: {
      value: function bindTo(bindable, callback) {
        //bind to an action, store, or stream
        if (!bindable) {
          throw new Error("Store cannot bind to null object");
        }
        callback = callback.bind(this);
        if (bindable.subscribe) {
          var unsubscribe = bindable.subscribe(callback);
          this._ourSubscriptions.push(unsubscribe);
          return unsubscribe;
        }
        if (bindable.onValue) {
          bindable.onValue(callback);
          var unsubscribe = _.bind(bindable.offValue, bindable, callback);
          this._ourSubscriptions.push(unsubscribe);
          return unsubscribe;
        }
        throw new Error("Store cannot bind to unbindable object, object must provide subscribe method or be a stream");
      },
      writable: true,
      configurable: true
    },
    mount: {
      value: function mount(flux) {
        //mount the store to flux
        //CONSIDER: are we a clone?
        this.emitter = Kefir.emitter();
        this._ourSubscriptions = [];
        this.flux = flux;
        this.state = this.getInitialState();
        this.refs = this.getReferences(flux);
        this.storeDidMount();
        return this;
      },
      writable: true,
      configurable: true
    },
    unmount: {
      value: function unmount() {
        //aka close
        this.storeWillUnmount();
        this.emitter.end();
        _.each(this._ourSubscriptions, function (x) {
          return x();
        });
        this._ourSubscriptions = [];
        this.emitter = null;
        this.flux = null;
      },
      writable: true,
      configurable: true
    }
  });

  return Store;
})();

//CONSIDER: package as a mixin, supply a mixin base class, or just use super

var AutoBindStore = exports.AutoBindStore = (function (Store) {
  function AutoBindStore() {
    _classCallCheck(this, AutoBindStore);

    if (Store != null) {
      Store.apply(this, arguments);
    }
  }

  _inherits(AutoBindStore, Store);

  _prototypeProperties(AutoBindStore, null, {
    storeDidMount: {
      value: function storeDidMount() {
        _get(Object.getPrototypeOf(AutoBindStore.prototype), "storeDidMount", this).call(this);
        this.doAutoBind();
      },
      writable: true,
      configurable: true
    },
    doAutoBind: {
      value: function doAutoBind() {
        var _this = this;

        var actions = this.flux.actions;
        if (this.actionNamespace) {
          actions = actions[this.actionNamespace];
        }
        //note: _.keys does not work on es6 classes, so we iterate through actions instead
        var actionNames = _.pull(_.keys(actions), "mount", "unmount", "flux");
        //console.log("autobinding for acions:", actionNames, this)
        _.each(actionNames, function (actionName) {
          var listenerName = "on" + actionName.slice(0, 1).toUpperCase() + actionName.slice(1);
          if (_.isFunction(_this[listenerName])) {
            _this.bindTo(actions[actionName], _this[listenerName]);
            return;
          }
          listenerName = "on" + actionName.slice(0, 1).toLowerCase() + actionName.slice(1);
          if (_.isFunction(_this[listenerName])) {
            _this.bindTo(actions[actionName], _this[listenerName]);
            return;
          }
        });
      },
      writable: true,
      configurable: true
    }
  });

  return AutoBindStore;
})(Store);

Object.defineProperty(exports, "__esModule", {
  value: true
});