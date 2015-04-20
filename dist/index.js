'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _actions = require('./actions');

var _actions2 = _interopRequireWildcard(_actions);

var _stores = require('./stores');

var _stores2 = _interopRequireWildcard(_stores);

var _flux = require('./flux');

var _flux2 = _interopRequireWildcard(_flux);

var _import = require('lodash');

var _import2 = _interopRequireWildcard(_import);

exports['default'] = _import2['default'].merge({}, _flux2['default'], store, action);
module.exports = exports['default'];