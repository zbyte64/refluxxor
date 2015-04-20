'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

//CONSIDER: actions are functions that happen to emit an event when called

exports.createAction = createAction;
exports.createActionSpace = createActionSpace;

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var _Kefir = require('kefir');

var _Kefir2 = _interopRequireWildcard(_Kefir);

function createAction(f) {
  //converts a function to an action
  if (!_import2['default'].isFunction(f)) f = _import2['default'].constant(f);
  var eventer = (function (_eventer) {
    function eventer() {
      return _eventer.apply(this, arguments);
    }

    eventer.toString = function () {
      return _eventer.toString();
    };

    return eventer;
  })(function () {
    return eventer.trigger.apply(eventer.__proto__, _import2['default'].toArray(arguments));
  });
  //This scares me...
  eventer.__proto__ = _import2['default'].clone(eventer.__proto__);
  var methods = _import2['default'].reduce(ActionMethods, function (col, func, key) {
    col[key] = func.bind(eventer.__proto__);
    return col;
  }, {});
  _import2['default'].extend(eventer.__proto__, methods, {
    fire: f,
    //how did we loose apply? need to wrap these functions properly
    apply: function apply(self, args) {
      return this.trigger.apply(self, args);
    }
  });
  return eventer;
}

var ActionMethods = {
  //support react like life-cycle methods
  actionDidMount: function actionDidMount() {},
  shouldActionFire: function shouldActionFire(val) {
    return true;
  },
  fire: function fire(val) {
    return null;
  },
  actionWillUnmount: function actionWillUnmount() {},
  trigger: function trigger(val) {
    if (this.shouldActionFire(val)) {
      var result = this.fire(val);
      this.emitter.emit(val);
      return result;
    }
  },
  subscribe: function subscribe(callback) {
    this.emitter.onValue(callback);
    return _import2['default'].bind(this.emitter.offValue, this.emitter, callback);
  },
  mount: function mount(flux) {
    //mount the action to flux
    //CONSIDER: are we a clone?
    this.emitter = _Kefir2['default'].emitter();
    this.flux = flux;
    this.actionDidMount();
    return this;
  },
  unmount: function unmount() {
    //aka close
    this.actionWillUnmount();
    this.emitter.end();
    this.emitter = null;
    this.flux = null;
  }
};

function createActionSpace(methods) {
  var self = {
    mount: function mount(flux) {
      self.flux = flux;
      _import2['default'].each(actionables, function (x) {
        return x.mount(flux);
      });
      return self;
    },
    unmount: function unmount() {
      self.flux = null;
      _import2['default'].each(actionables, function (x) {
        return x.unmount();
      });
    }
  };
  //console.log("make actionables from:", methods);
  var actionables = _import2['default'].reduce(methods, function (col, f, name) {
    if (_import2['default'].isFunction(f)) {
      var bf = f.bind(self);
      //console.log("function actionable", name, bf);
      col[name] = createAction(bf);
      if (col[name].fire !== bf) {
        console.log('fooobar, fire was not set properly!', bf, col[name].fire);
      }
    } else if (f === null) {
      //console.log("null actionable", name)
      col[name] = createAction();
    } else if (_import2['default'].isObject(f)) {
      //console.log("namspace actionable", name)
      col[name] = createActionSpace(f);
    } else if (_import2['default'].isArray(f)) {
      //console.log("list of actionables", name)
      col[name] = _import2['default'].reduce(f, function (col, name) {
        col[name] = createAction();
        return col;
      }, {});
    } else if (_import2['default'].isString(f) && _import2['default'].isArray(methods)) {
      //console.log("list of actionables(2)", f)
      col[f] = createAction();
    } else {
      throw new Error('Unrecognized action type (must be function or plain object or array):', f);
    }
    return col;
  }, {});
  _import2['default'].assign(self, actionables);
  return self;
}