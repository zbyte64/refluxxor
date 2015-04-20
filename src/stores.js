import _ from 'lodash';
import Kefir from 'kefir';

function stream() {
  //an emitter that ensures messages are processed in order
  var emitter = Kefir.emitter();
  var emit = emitter.emit.bind(emitter);
  var emitting = false;
  var pending = [];
  emitter.emit = function(message) {
    if (emitting) {
      pending.push(message);
    } else {
      emitting = true;
      emit(message);
      var processPending = pending;
      pending = [];
      _.each(processPending, x => {
        emit(x);
      });
      emitting = false;
    }
  }
  return emitter;
}

export class Store {
  //support react like life-cycle methods
  getInitialState() {
    return null;
  }
  getReferences(flux) {
    return {};
  }
  storeDidMount() {

  }
  shouldStoreUpdate(prevState, nextState) {
    return prevState !== nextState;
  }
  storeWillUpdate(nextState) {
    return nextState;
  }
  storeDidUpdate(prevState) {

  }
  storeWillUnmount() {

  }
  getState() {
    return this.state;
  }
  //the nitty gritty event notifications, aka don't override these
  replaceState(nextState) {
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
  trigger(message) {
    //CONSIDER: don't emit until our previous emission is complete, prevents out of order messages
    this.emitter.emit(message);
  }
  subscribe(callback) {
    this.emitter.onValue(callback);
    //_.partial doesn't work cuz Javascript
    return _.bind(this.emitter.offValue, this.emitter, callback);
  }
  bindTo(bindable, callback) {
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
  }
  mount(flux) {
    //mount the store to flux
    this.emitter = stream();
    this._ourSubscriptions = [];
    this.flux = flux;
    this.state = this.getInitialState();
    this.refs = this.getReferences(flux);
    return this;
  }
  unmount() { //aka close
    this.storeWillUnmount();
    this.emitter.end();
    _.each(this._ourSubscriptions, x => x());
    this._ourSubscriptions = [];
    this.emitter = null;
    this.flux = null;
  }
}

//CONSIDER: package as a mixin, supply a mixin base class, or just use super
export class AutoBindStore extends Store {
  storeDidMount() {
    super.storeDidMount();
    this.doAutoBind();
  }
  doAutoBind() {
    var actions = this.flux.actions;
    if (this.actionNamespace) {
      actions = actions[this.actionNamespace];
    }
    //note: _.keys does not work on es6 classes, so we iterate through actions instead
    var actionNames = _.pull(_.keys(actions), 'mount', 'unmount', 'flux');
    //console.log("autobinding for acions:", actionNames, this)
    _.each(actionNames, actionName => {
      var listenerName = 'on' + actionName.slice(0, 1).toUpperCase() + actionName.slice(1);
      if (_.isFunction(this[listenerName])) {
        this.bindTo(actions[actionName], this[listenerName]);
        return;
      }
      listenerName = 'on' + actionName.slice(0, 1).toLowerCase() + actionName.slice(1);
      if (_.isFunction(this[listenerName])) {
        this.bindTo(actions[actionName], this[listenerName]);
        return;
      }
    });
  }
}
