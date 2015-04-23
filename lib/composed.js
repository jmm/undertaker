'use strict';

module.exports = composed;

var
  _ = require('lodash'),
  assert = require('assert'),
  bach = require('bach'),
  metadata = require('./helpers/metadata'),
  buildTree = require('./helpers/buildTree'),
  normalizeArgs = require('./helpers/normalizeArgs'),
  createExtensions = require('./helpers/createExtensions');

function composed (opts, args) {
  /* jshint validthis: true */

  var
    self = this,
    create =
      self._settle ?
      bach[_.camelCase('settle ' + opts.type)] :
      bach[opts.type],
    extensions = createExtensions(self),
    // Unregistered (pending) dependency tasks.
    deps = [],
    fn;

  args.forEach(function (task) {
    var dep;

    if (typeof task === 'string') {
      if (!self._registry.get(task)) {
        dep = task;
      }
    }
    // If task is a function with pending deps propagate them.
    else if (task._gulp && task._gulp.deps.length) {
      dep = task._gulp.deps;
    }

    if (dep) {
      deps = deps.concat(dep);
    }
  });

  // Placeholder
  function holder () {
    assert(fn, 'Tasks never defined: ' + deps.join(', '));
    return fn.apply(this, arguments);
  }
  // holder

  function registered (task) {
    // Have to keep the _gulp.deps prop in the loop here or else if the dep is
    // registered before the placeholder is used as a dep of another func, the
    // placeholder will show a phantom dep.
    holder._gulp.deps = deps = deps.filter(function (dep) {
      return dep !== task;
    });

    if (!deps.length) {
      self.removeListener('task-registered', registered);
      resolve();
    }
  }
  // registered

  function resolve () {
    args = normalizeArgs(self._registry, args);
    fn = create(args, extensions);

    metadata.set(holder, {
      name: opts.type,
      tree: {
        label: '<' + opts.type + '>',
        type: 'function',
        nodes: buildTree(args)
      }
    });

    if (holder._gulp && holder._gulp.done) {
      holder._gulp.done();
    }
  }
  // resolve

  if (deps.length) {
    self.on('task-registered', registered);
    holder._gulp = {
      done: function(cb) {
        this.done = cb;
      },
      deps: deps,
    };
  }
  else {
    resolve();
  }

  return holder;
}
