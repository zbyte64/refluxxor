"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.ConnectTo = ConnectTo;

var _ = _interopRequire(require("lodash"));

var React = _interopRequire(require("react"));

var Immutable = _interopRequire(require("immutable"));

var BinderMixin = exports.BinderMixin = {
  bindTo: function bindTo(bindable, callback) {
    if (!bindable) {
      throw new Error("Binder cannot bind to null object");
    }
    callback = callback.bind(this);
    if (bindable.subscribe) {
      var unsubscribe = bindable.subscribe(callback);
      this.registerBind(unsubscribe);
      return unsubscribe;
    }
    if (bindable.onValue) {
      bindable.onValue(callback);
      var unsubscribe = _.bind(bindable.offValue, bindable, callback);
      this.registerBind(unsubscribe);
      return unsubscribe;
    }
    throw new Error("Binder cannot bind to unbindable object, object must provide subscribe method or be a stream");
  },
  registerBind: function registerBind(sub) {
    if (!this._binds) this._binds = [];
    this._binds.push(sub);
  },
  endBinds: function endBinds() {
    _.each(this._binds, function (sub) {
      sub();
    });
    this._binds = [];
  },
  componentWillUnmount: function componentWillUnmount() {
    this.endBinds();
  }
};

var FluxMixin = exports.FluxMixin = _.merge({
  contextTypes: {
    flux: React.PropTypes.object.isRequired
  },
  getFlux: function getFlux() {
    return this.context.flux;
  },
  getActions: function getActions() {
    return this.getFlux().actions;
  } }, BinderMixin);

function ConnectTo(storeName) {
  /*
  //put flux in your context
   mixins: [ConnectTo('pages')]
  //or
  mixins: [ConnectTo({'pages': 'pages'})]
   */
  //CONSIDER: different mixin? support streams?
  if (_.isObject(storeName)) {
    return _.merge({
      getBindables: function getBindables(flux) {
        return _.reduce(storeName, function (col, stateName, name) {
          col[stateName] = flux.stores[name];
          return col;
        }, {});
      },
      getInitialState: function getInitialState() {
        var bindables = this.getBindables(this.getFlux());
        var state = Immutable.Map();
        _.each(bindables, function (bindable, stateName) {
          if (bindable.getState) {
            state = state.set(stateName, bindable.getState());
          }
        });
        return state;
      },
      componentDidMount: function componentDidMount() {
        var _this = this;

        var bindables = this.getBindables(this.getFlux());
        _.each(bindables, function (bindable, stateName) {
          _this.bindTo(bindable, function (state) {
            var new_state = _this.state.set(stateName, state);
            _this._replaceState(new_state);
          });
        });
      },
      _replaceState: function _replaceState(state) {
        //if (this.replaceState) return this.replaceState(state);
        this.state = state;
        if (this.isMounted()) this.forceUpdate();
      }
    }, FluxMixin);
  }

  return _.merge({
    _getBindable: function _getBindable(flux) {
      if (_.isString(storeName)) {
        return flux.stores[storeName];
      }return this.getBindable(flux);
    },
    getInitialState: function getInitialState() {
      var bindable = this._getBindable(this.getFlux());
      if (bindable.getState) {
        return bindable.getState();
      }return null; //aka loading
    },
    componentDidMount: function componentDidMount() {
      this.bindTo(this._getBindable(this.getFlux()), this._replaceState);
    },
    _replaceState: function _replaceState(state) {
      //if (this.replaceState) return this.replaceState(state);
      this.state = state;
      if (this.isMounted()) this.forceUpdate();
    }
  }, FluxMixin);
}

Object.defineProperty(exports, "__esModule", {
  value: true
});