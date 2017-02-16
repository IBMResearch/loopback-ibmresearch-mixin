var debug = require('debug')('loopback:ibmresearch:mixins:modelcache');
var utils = require('loopback-datasource-juggler/lib/utils');
var _ = require('lodash');

var backendCache;
var CACHE_TTL = 30;
var defaultOptions = {
  ttl: CACHE_TTL,
  reloadAfterReturn: true,
  invalidateCacheAfterSave: true,
  methods: [],
  disableDefault: false,
  type: 'memory',
  configuration: {}
};

/**
 * Options:
 *    - ttl: Time to live
 *    - reloadAfterReturn: After return from cache (the DB method will be fired and reload cache)
 *    - invalidateCacheAfterSave: If the cache must be invalidated after save any instance
 *    - methods: Methods with parameters (only with 2) that will be cached
 */
module.exports = function (Model, opts) {
  var app;
  var cacheOptions = {};
  var cache;

  _.merge(cacheOptions, defaultOptions, opts);

  if (!Model.app) {
    Model.on('attached', function (a) {
      app = a;

      configure();
    });
  } else {
    app = Model.app;
    configure();
  }

  function _initialize() {
    debug('Initialize %s', cacheOptions.type);
    backendCache = require(`../backend/${cacheOptions.type}`);
    cache = new backendCache(cacheOptions.configuration).getClient();
  }

  function configure() {
    var modelName = Model.modelName;
    var CachedModel = app.models.CachedModel;
    var overrideFind = Model.find;

    // Initialize
    debug('Cache Queries configure model %s: %j', modelName, cacheOptions);
    _initialize();

    function _getKey(filter, options) {
      var key = modelName + ':';
      if (filter) {
        key += JSON.stringify(filter);
      } else {
        key += 'nofilter';
      }

      if (options && !_.isEmpty(options)) {
        key += ':' + JSON.stringify(options);
      }

      return key;
    }

    function _invalidateCache() {
      debug('Invalidate cache: %s', modelName);
      if (modelName.length < 1) {
        throw new Error('Modelname not exists');
      }
      debug('Cache: %j', cache);
      cache.keys(modelName + ':*', function(err, values) {
        for (var key in values) {
          debug('Remove key: %s', values[key]);
          cache.del(values[key]);
        }
      });
    }

    function _getFromDBAndSaveInCache(key, filter, options, callback) {
      debug('_getFromDBAndSaveInCache %j ', arguments);

      if (typeof filter === 'function') {
        callback = filter;
        filter = undefined;
      }
      if (typeof options === 'function') {
        callback = options;
        options = undefined;
      }

      callback = callback || utils.createPromiseCallback();

      overrideFind.call(Model, filter, options, function(err, results) {
        if (!err) {
          cache.setex(key, cacheOptions.ttl, JSON.stringify(results));
          debug('Set cache (%s): %j', key, results);
        }
        debug('Callback with results: %j', results);
        callback(err, results);
      });

      return callback.promise;
    }

    if (!cacheOptions.disableDefault) {
      // Override find operation
      Model.find = function (a, b, c, d) {
        if (typeof b === 'function' && b.name === 'callback') {
          return Model.findNew(a, {}, b);
        }
        return overrideFind.call(Model, a, b, c);
      }

      Model.findNew = function(filter, options, callback) {
        debug('%s Find %j %j %j', modelName, filter, options, callback);

        if (typeof filter === 'function') {
          callback = filter;
          filter = undefined;
        }

        if (typeof options === 'function') {
          callback = options;
          options = undefined;
        }

        callback = callback || utils.createPromiseCallback();

        var key = _getKey(filter, options);

        debug(cache);
        cache.get(key, function (err, cachedResults) {
          debug('Get (%s): %j', key, cachedResults);

          if (cachedResults) {
            debug('%s serving from cache', modelName);
            process.nextTick(function() {
              callback(null, JSON.parse(cachedResults));
            });
            // If reload is defined
            if (cacheOptions.reloadAfterReturn) {
              _getFromDBAndSaveInCache(key, filter, options);
            }
          } else {
            debug('%s serving from db', modelName);
            _getFromDBAndSaveInCache(key, filter, options, callback);
          }
        });

        return callback.promise;
      }
    }

    if (cacheOptions.invalidateCacheAfterSave) {
      // Invalidate cache after update database
      Model.observe('after save', function(ctx, next) {
        _invalidateCache();
        next();
      });
    }

    var oldMethods = {};

    cacheOptions.methods.forEach(function(element) {
      debug('Configuring method %s for cache', element);
      oldMethods[element] = Model[element];
      Model[element] = function (filter, callback) {
        var methodArguments = arguments;
        if (!callback) {
          callback = filter;
          filter = undefined;
        }
        var servedFromCache = false;
        debug('This is the new method');
        var key = _getKey(element, arguments);
        debug('Key %s', key);
        cache.get(key, function (err, cachedResults) {
          debug('Get (%s): %j', key, cachedResults);

          if (cachedResults) {
            servedFromCache = true;
            debug('%s:%s serving from cache', modelName, element);
            process.nextTick(function () {
              callback(null, JSON.parse(cachedResults));
            });
          } else {
            debug('%s:%s NOT serving from cache', modelName, element);
          }

          if (!servedFromCache || cacheOptions.reloadAfterReturn) {
            debug('Server from cache %s', servedFromCache);
            var lArguments = [methodArguments[0]];
            if (!filter) {
              lArguments = [];
            }
            lArguments.push(function (err, result) {
              if (result) {
                debug('%s:%s setted new value in cache', modelName, element);
                cache.setex(key, cacheOptions.ttl, JSON.stringify(result));
              }
              if (!servedFromCache) {
                callback(err, result);
              }
            });
            oldMethods[element].apply(this, lArguments);
          }
        });
      };
    });
  }
};
