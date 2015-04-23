'use strict';

var composed = require('./composed');

function parallel(){
  return composed.call(this, {type: 'parallel'}, [].slice.call(arguments));
}

module.exports = parallel;
