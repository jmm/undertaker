'use strict';

var composed = require('./composed');

function series(){
  return composed.call(this, {type: 'series'}, [].slice.call(arguments));
}

module.exports = series;
