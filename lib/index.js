'use strict';

var deprecate = require('depd')('loopback-ibmresearch-mixin');
var postmethod = require('./postMethod');
var modelcache = require('./modelCache');
var spamcontrol = require('./spamControl');
var timestamp = require('./timestamp');

module.exports = function mixin(application) {
  const app = application;
  app.loopback.modelBuilder.mixins.define = deprecate.function(app.loopback.modelBuilder.mixins.define,
    'app.modelBuilder.mixins.define: Use mixinSources instead');
  app.loopback.modelBuilder.mixins.define('PostMethod', postmethod);
  app.loopback.modelBuilder.mixins.define('ModelCache', modelcache);
  app.loopback.modelBuilder.mixins.define('SpamControl', spamcontrol);
  app.loopback.modelBuilder.mixins.define('Timestamp', timestamp);
};
