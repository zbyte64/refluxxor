'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

var _Kefir = require('kefir');

var _Kefir2 = _interopRequireWildcard(_Kefir);

var _createActionSpace = require('./actions');

//CONSIDER Object.create and __proto__ may not be universally supported.

var Flux = (function () {
  function Flux(stores, actions) {
    _classCallCheck(this, Flux);

    this.actions = _createActionSpace.createActionSpace(actions);
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

  _createClass(Flux, [{
    key: 'mount',
    value: function mount() {
      var _this = this;

      this.actions.mount(this);
      _import2['default'].each(this.stores, function (x) {
        return x.mount(_this);
      });
      _import2['default'].each(this.stores, function (x) {
        return x.storeDidMount ? x.storeDidMount() : null;
      });
    }
  }, {
    key: 'unmount',
    value: function unmount() {
      this.actions.unmount();
      _import2['default'].each(this.stores, function (x) {
        return x.unmount();
      });
    }
  }]);

  return Flux;
})();

exports.Flux = Flux;