"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

//CONSIDER: actions are functions that happen to emit an event when called

exports.createAction = createAction;
exports.createActionSpace = createActionSpace;

var _ = _interopRequire(require("lodash"));

var Kefir = _interopRequire(require("kefir"));

function createAction(f) {
  //converts a function to an action
  if (!_.isFunction(f)) f = _.constant(f);
  var eventer = (function (_eventer) {
    var _eventerWrapper = function eventer() {
      return _eventer.apply(this, arguments);
    };

    _eventerWrapper.toString = function () {
      return _eventer.toString();
    };

    return _eventerWrapper;
  })(function () {
    return eventer.trigger.apply(eventer.__proto__, _.toArray(arguments));
  });
  //This scares me...
  eventer.__proto__ = _.clone(eventer.__proto__);
  var methods = _.reduce(ActionMethods, function (col, func, key) {
    col[key] = func.bind(eventer.__proto__);
    return col;
  }, {});
  _.extend(eventer.__proto__, methods, {
    fire: f,
    //how did we loose apply? need to wrap these functions properly
    apply: function (self, args) {
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
    return _.bind(this.emitter.offValue, this.emitter, callback);
  },
  mount: function mount(flux) {
    //mount the action to flux
    //CONSIDER: are we a clone?
    this.emitter = Kefir.emitter();
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
      _.each(actionables, function (x) {
        return x.mount(flux);
      });
      return self;
    },
    unmount: function unmount() {
      self.flux = null;
      _.each(actionables, function (x) {
        return x.unmount();
      });
    }
  };
  //console.log("make actionables from:", methods);
  var actionables = _.reduce(methods, function (col, f, name) {
    if (_.isFunction(f)) {
      var bf = f.bind(self);
      //console.log("function actionable", name, bf);
      col[name] = createAction(bf);
      if (col[name].fire !== bf) {
        console.log("fooobar, fire was not set properly!", bf, col[name].fire);
      }
    } else if (f === null) {
      //console.log("null actionable", name)
      col[name] = createAction();
    } else if (_.isObject(f)) {
      //console.log("namspace actionable", name)
      col[name] = createActionSpace(f);
    } else if (_.isArray(f)) {
      //console.log("list of actionables", name)
      col[name] = _.reduce(f, function (col, name) {
        col[name] = createAction();
        return col;
      }, {});
    } else if (_.isString(f) && _.isArray(methods)) {
      //console.log("list of actionables(2)", f)
      col[f] = createAction();
    } else {
      throw new Error("Unrecognized action type (must be function or plain object or array):", f);
    }
    return col;
  }, {});
  _.assign(self, actionables);
  return self;
}

Object.defineProperty(exports, "__esModule", {
  value: true
});