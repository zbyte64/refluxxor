'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.ConnectTo = ConnectTo;

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var _React = require('react');

var _React2 = _interopRequireWildcard(_React);

var _Immutable = require('immutable');

var _Immutable2 = _interopRequireWildcard(_Immutable);

var BinderMixin = {
  bindTo: function bindTo(bindable, callback) {
    if (!bindable) {
      throw new Error('Binder cannot bind to null object');
    }
    callback = callback.bind(this);
    if (bindable.subscribe) {
      var unsubscribe = bindable.subscribe(callback);
      this.registerBind(unsubscribe);
      return unsubscribe;
    }
    if (bindable.onValue) {
      bindable.onValue(callback);
      var unsubscribe = _import2['default'].bind(bindable.offValue, bindable, callback);
      this.registerBind(unsubscribe);
      return unsubscribe;
    }
    throw new Error('Binder cannot bind to unbindable object, object must provide subscribe method or be a stream');
  },
  registerBind: function registerBind(sub) {
    if (!this._binds) this._binds = [];
    this._binds.push(sub);
  },
  endBinds: function endBinds() {
    _import2['default'].each(this._binds, function (sub) {
      sub();
    });
    this._binds = [];
  },
  componentWillUnmount: function componentWillUnmount() {
    this.endBinds();
  }
};

exports.BinderMixin = BinderMixin;
var FluxMixin = _import2['default'].merge({
  contextTypes: {
    flux: _React2['default'].PropTypes.object.isRequired
  },
  getFlux: function getFlux() {
    return this.context.flux;
  },
  getActions: function getActions() {
    return this.getFlux().actions;
  } }, BinderMixin);

exports.FluxMixin = FluxMixin;

function ConnectTo(storeName) {
  /*
  //put flux in your context
   mixins: [ConnectTo('pages')]
  //or
  mixins: [ConnectTo({'pages': 'pages'})]
   */
  //CONSIDER: different mixin? support streams?
  if (_import2['default'].isObject(storeName)) {
    return _import2['default'].merge({
      getBindables: function getBindables(flux) {
        return _import2['default'].reduce(storeName, function (col, stateName, name) {
          col[stateName] = flux.stores[name];
          return col;
        }, {});
      },
      getInitialState: function getInitialState() {
        var bindables = this.getBindables(this.getFlux());
        var state = _Immutable2['default'].Map();
        _import2['default'].each(bindables, function (bindable, stateName) {
          if (bindable.getState) {
            state = state.set(stateName, bindable.getState());
          }
        });
        return state;
      },
      componentDidMount: function componentDidMount() {
        var _this = this;

        var bindables = this.getBindables(this.getFlux());
        _import2['default'].each(bindables, function (bindable, stateName) {
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

  return _import2['default'].merge({
    _getBindable: function _getBindable(flux) {
      if (_import2['default'].isString(storeName)) {
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

/*
 <FluxComponent sites="sites" loggedIn="user.loggedIn">
  <SiteList/>
 </FluxComponent>
*/
var FluxComponent = _React2['default'].createClass({
  displayName: 'FluxComponent',

  mixins: [FluxMixin],
  getInitialState: function getInitialState() {
    var _this2 = this;

    var state = {};
    _import2['default'].each(this.props, function (val, name) {
      if (name === 'children') return;
      var storeState = _this2.getFlux().stores[val].getState();
      if (storeState && _import2['default'].isFunction(storeState.toJS)) {
        storeState = storeState.toJS();
      }
      state[name] = storeState;
    });
    return state;
  },
  componentDidMount: function componentDidMount() {
    var _this3 = this;

    _import2['default'].each(this.props, function (val, name) {
      if (name === 'children') return;
      _this3.bindTo(_this3.getFlux().stores[val], function (storeState) {
        if (storeState && _import2['default'].isFunction(storeState.toJS)) {
          storeState = storeState.toJS();
        }
        var state = {};
        state[name] = storeState;
        _this3.setState(state);
      });
    });
  },
  render: function render() {
    var _this4 = this;

    //clone children with our state as props
    if (_import2['default'].isArray(this.props.children)) {
      return _React2['default'].DOM.span({}, _import2['default'].map(this.props.children, function (element) {
        if (!element) return null;
        return _React2['default'].cloneElement(element, _this4.state);
      }));
    }
    return _React2['default'].cloneElement(this.props.children, this.state);
  }
});
exports.FluxComponent = FluxComponent;