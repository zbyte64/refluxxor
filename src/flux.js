import _ from 'lodash';
import Kefir from 'kefir';

import {createActionSpace} from './actions';

//CONSIDER Object.create and __proto__ may not be universally supported.

export class Flux {
  constructor(stores, actions) {
    this.actions = createActionSpace(actions);
    this.stores = stores;
    /*
    this.stores = _.reduce(stores, (col, store, key) => {
      //aka clone which doesn't work with es6 very well...
      col[key] = Object.create(store.__proto__, store);
      return col;
    }, {});
    */
    this.mount();
  }
  mount() {
    this.actions.mount(this);
    _.each(this.stores, x => x.mount(this));
    _.each(this.stores, x => x.storeDidMount ? x.storeDidMount() : null );
  }
  unmount() {
    this.actions.unmount();
    _.each(this.stores, x => x.unmount());
  }
}
