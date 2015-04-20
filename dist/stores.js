'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var _Kefir = require('kefir');

var _Kefir2 = _interopRequireWildcard(_Kefir);

function stream() {
  //an emitter that ensures messages are processed in order
  var emitter = _Kefir2['default'].emitter();
  var emit = emitter.emit.bind(emitter);
  var emitting = false;
  var pending = [];
  emitter.emit = function (message) {
    if (emitting) {
      pending.push(message);
    } else {
      emitting = true;
      emit(message);
      var processPending = pending;
      pending = [];
      _import2['default'].each(processPending, function (x) {
        emit(x);
      });
      emitting = false;
    }
  };
  return emitter;
}

var Store = (function () {
  function Store() {
    _classCallCheck(this, Store);
  }

  _createClass(Store, [{
    key: 'getInitialState',

    //support react like life-cycle methods
    value: function getInitialState() {
      return null;
    }
  }, {
    key: 'getReferences',
    value: function getReferences(flux) {
      return {};
    }
  }, {
    key: 'storeDidMount',
    value: function storeDidMount() {}
  }, {
    key: 'shouldStoreUpdate',
    value: function shouldStoreUpdate(prevState, nextState) {
      return prevState !== nextState;
    }
  }, {
    key: 'storeWillUpdate',
    value: function storeWillUpdate(nextState) {
      return nextState;
    }
  }, {
    key: 'storeDidUpdate',
    value: function storeDidUpdate(prevState) {}
  }, {
    key: 'storeWillUnmount',
    value: function storeWillUnmount() {}
  }, {
    key: 'getState',
    value: function getState() {
      return this.state;
    }
  }, {
    key: 'replaceState',

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
    }
  }, {
    key: 'trigger',
    value: function trigger(message) {
      //CONSIDER: don't emit until our previous emission is complete, prevents out of order messages
      this.emitter.emit(message);
    }
  }, {
    key: 'subscribe',
    value: function subscribe(callback) {
      this.emitter.onValue(callback);
      //_.partial doesn't work cuz Javascript
      return _import2['default'].bind(this.emitter.offValue, this.emitter, callback);
    }
  }, {
    key: 'bindTo',
    value: function bindTo(bindable, callback) {
      //bind to an action, store, or stream
      if (!bindable) {
        throw new Error('Store cannot bind to null object');
      }
      callback = callback.bind(this);
      if (bindable.subscribe) {
        var unsubscribe = bindable.subscribe(callback);
        this._ourSubscriptions.push(unsubscribe);
        return unsubscribe;
      }
      if (bindable.onValue) {
        bindable.onValue(callback);
        var unsubscribe = _import2['default'].bind(bindable.offValue, bindable, callback);
        this._ourSubscriptions.push(unsubscribe);
        return unsubscribe;
      }
      throw new Error('Store cannot bind to unbindable object, object must provide subscribe method or be a stream');
    }
  }, {
    key: 'mount',
    value: function mount(flux) {
      //mount the store to flux
      this.emitter = stream();
      this._ourSubscriptions = [];
      this.flux = flux;
      this.state = this.getInitialState();
      this.refs = this.getReferences(flux);
      return this;
    }
  }, {
    key: 'unmount',
    value: function unmount() {
      //aka close
      this.storeWillUnmount();
      this.emitter.end();
      _import2['default'].each(this._ourSubscriptions, function (x) {
        return x();
      });
      this._ourSubscriptions = [];
      this.emitter = null;
      this.flux = null;
    }
  }]);

  return Store;
})();

exports.Store = Store;

//CONSIDER: package as a mixin, supply a mixin base class, or just use super

var AutoBindStore = (function (_Store) {
  function AutoBindStore() {
    _classCallCheck(this, AutoBindStore);

    if (_Store != null) {
      _Store.apply(this, arguments);
    }
  }

  _inherits(AutoBindStore, _Store);

  _createClass(AutoBindStore, [{
    key: 'storeDidMount',
    value: function storeDidMount() {
      _get(Object.getPrototypeOf(AutoBindStore.prototype), 'storeDidMount', this).call(this);
      this.doAutoBind();
    }
  }, {
    key: 'doAutoBind',
    value: function doAutoBind() {
      var _this = this;

      var actions = this.flux.actions;
      if (this.actionNamespace) {
        actions = actions[this.actionNamespace];
      }
      //note: _.keys does not work on es6 classes, so we iterate through actions instead
      var actionNames = _import2['default'].pull(_import2['default'].keys(actions), 'mount', 'unmount', 'flux');
      //console.log("autobinding for acions:", actionNames, this)
      _import2['default'].each(actionNames, function (actionName) {
        var listenerName = 'on' + actionName.slice(0, 1).toUpperCase() + actionName.slice(1);
        if (_import2['default'].isFunction(_this[listenerName])) {
          _this.bindTo(actions[actionName], _this[listenerName]);
          return;
        }
        listenerName = 'on' + actionName.slice(0, 1).toLowerCase() + actionName.slice(1);
        if (_import2['default'].isFunction(_this[listenerName])) {
          _this.bindTo(actions[actionName], _this[listenerName]);
          return;
        }
      });
    }
  }]);

  return AutoBindStore;
})(Store);

exports.AutoBindStore = AutoBindStore;