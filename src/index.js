import actions from './actions';
import stores from './stores';
import flux from './flux';
import _ from 'lodash';

export default _.merge({}, flux, stores, actions);
