var deprecate = require('depd')('loopback-post-mixin');
var postmethod = require('./postMethod');
var modelcache = require('./modelCache');

module.exports = function mixin(app) {
  'use strict';
  app.loopback.modelBuilder.mixins.define = deprecate.function(app.loopback.modelBuilder.mixins.define,
    'app.modelBuilder.mixins.define: Use mixinSources instead');
  app.loopback.modelBuilder.mixins.define('PostMethod', postmethod);
  app.loopback.modelBuilder.mixins.define('ModelCache', modelcache);
};
