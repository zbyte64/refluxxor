import _ from 'lodash';
import React from 'react';
import Immutable from 'immutable';


export var BinderMixin = {
  bindTo: function(bindable, callback) {
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
  registerBind: function(sub) {
    if (!this._binds) this._binds = [];
    this._binds.push(sub);
  },
  endBinds: function() {
    _.each(this._binds, function(sub) {
      sub();
    });
    this._binds = [];
  },
  componentWillUnmount: function() {
    this.endBinds();
  }
};

export var FluxMixin = _.merge({
  contextTypes: {
    flux: React.PropTypes.object.isRequired
  },
  getFlux: function() {
    return this.context.flux
  },
  getActions: function() {
    return this.getFlux().actions;
  },
}, BinderMixin);

export function ConnectTo(storeName) {
  /*
  //put flux in your context

  mixins: [ConnectTo('pages')]
  //or
  mixins: [ConnectTo({'pages': 'pages'})]

  */
  //CONSIDER: different mixin? support streams?
  if (_.isObject(storeName)) {
    return _.merge({
      getBindables: function(flux) {
        return _.reduce(storeName, function(col, stateName, name) {
          col[stateName] = flux.stores[name];
          return col;
        }, {});
      },
      getInitialState: function() {
        var bindables = this.getBindables(this.getFlux());
        var state = Immutable.Map();
        _.each(bindables, function(bindable, stateName) {
          if (bindable.getState) {
             state = state.set(stateName, bindable.getState());
           }
        });
        return state;
      },
      componentDidMount: function() {
        var bindables = this.getBindables(this.getFlux());
        _.each(bindables, (bindable, stateName) => {
          this.bindTo(bindable, state => {
            var new_state = this.state.set(stateName, state);
            this._replaceState(new_state);
          });
        });
      },
      _replaceState: function(state) {
        //if (this.replaceState) return this.replaceState(state);
        this.state = state;
        if (this.isMounted()) this.forceUpdate()
      }
    }, FluxMixin);
  }

  return _.merge({
    _getBindable: function(flux) {
      if (_.isString(storeName)) return flux.stores[storeName];

      return this.getBindable(flux);
    },
    getInitialState: function() {
      var bindable = this._getBindable(this.getFlux());
      if (bindable.getState) return bindable.getState();
      return null; //aka loading
    },
    componentDidMount: function() {
      this.bindTo(this._getBindable(this.getFlux()), this._replaceState)
    },
    _replaceState: function(state) {
      //if (this.replaceState) return this.replaceState(state);
      this.state = state;
      if (this.isMounted()) this.forceUpdate()
    }
  }, FluxMixin);
}

/*
 <FluxComponent sites="sites" loggedIn="user.loggedIn">
  <SiteList/>
 </FluxComponent>
*/
export var FluxComponent = React.createClass({
  mixins: [FluxMixin],
  getInitialState() {
    var state = {};
    _.each(this.props, (val, name) => {
      if(name === "children") return;
      var storeState = this.getFlux().stores[val].getState();
      if (storeState && _.isFunction(storeState.toJS)) {
        storeState = storeState.toJS();
      }
      state[name] = storeState;
    });
    return state;
  },
  componentDidMount() {
    _.each(this.props, (val, name) => {
      if(name === "children") return;
      this.bindTo(this.getFlux().stores[val], storeState => {
        if (storeState && _.isFunction(storeState.toJS)) {
          storeState = storeState.toJS();
        }
        var state = {};
        state[name] = storeState;
        this.setState(state);
      });
    });
  },
  render() {
    //clone children with our state as props
    if (_.isArray(this.props.children)) {
      return React.DOM.span({},
        _.map(this.props.children, element => {
          if (!element) return null;
          return React.cloneElement(element, this.state);
        })
      )
    }
    return React.cloneElement(this.props.children, this.state);
  }
});
