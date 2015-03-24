"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _ = _interopRequire(require("lodash"));

var Kefir = _interopRequire(require("kefir"));

var createActionSpace = require("./actions").createActionSpace;

//CONSIDER Object.create and __proto__ may not be universally supported.

var Flux = exports.Flux = (function () {
  function Flux(stores, actions) {
    _classCallCheck(this, Flux);

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

  _prototypeProperties(Flux, null, {
    mount: {
      value: function mount() {
        var _this = this;

        this.actions.mount(this);
        _.each(this.stores, function (x) {
          return x.mount(_this);
        });
      },
      writable: true,
      configurable: true
    },
    unmount: {
      value: function unmount() {
        this.actions.unmount();
        _.each(this.stores, function (x) {
          return x.unmount();
        });
      },
      writable: true,
      configurable: true
    }
  });

  return Flux;
})();

Object.defineProperty(exports, "__esModule", {
  value: true
});