"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var actions = _interopRequire(require("./actions"));

var stores = _interopRequire(require("./stores"));

var flux = _interopRequire(require("./flux"));

var _ = _interopRequire(require("lodash"));

module.exports = _.merge({}, flux, store, action);