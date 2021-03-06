var debug = require('debug')('loopback:ibmresearch:mixins:modelcache');
var utils = require('loopback-datasource-juggler/lib/utils');
var _ = require('lodash');

var backendCache;
var CACHE_TTL = 30;
var defaultOptions = {
  ttl: CACHE_TTL,
  reloadAfterReturn: true,
  invalidateCacheAfterSave: true,
  invalidateCacheAfterDelete: true,
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
module.exports = function (ModelToCache, opts) {
  const Model = ModelToCache;
  var app;
  var cacheOptions = {};
  var cache;

  _.merge(cacheOptions, defaultOptions, opts);

  if (!Model.app) {
    Model.on('attached', (a) => {
      app = a;

      configure();
    });
  } else {
    app = Model.app;
    configure();
  }

  function initialize() {
    debug('Initialize %s', cacheOptions.type);
    backendCache = require(`../backend/${cacheOptions.type}`);
    cache = new backendCache(cacheOptions.configuration).getClient();
  }

  function configure() {
    var modelName = Model.modelName;
    var overrideFind = Model.find;

    // Initialize
    debug('Cache Queries configure model %s: %j', modelName, cacheOptions);
    initialize();

    function getKey(filter, options) {
      var key = `${modelName}:`;
      if (filter) {
        key += JSON.stringify(filter);
      } else {
        key += 'nofilter';
      }

      if (options && !_.isEmpty(options)) {
        key += `:${JSON.stringify(options)}`;
      }

      return key;
    }

    function invalidateCache() {
      debug('Invalidate cache: %s', modelName);
      if (modelName.length < 1) {
        throw new Error('Modelname not exists');
      }
      debug('Cache: %j', cache);
      cache.keys(`${modelName}:*`, (err, values) => {
        for (var key in values) {
          debug('Remove key: %s', values[key]);
          cache.del(values[key]);
        }
      });
    }

    function getFromDBAndSaveInCache(key, filter, options, callback) {
      debug('getFromDBAndSaveInCache %j ', arguments);
      if (typeof filter === 'function') {
        callback = filter;
        filter = undefined;
      }
      if (typeof options === 'function') {
        callback = options;
        options = undefined;
      }

      callback = callback || utils.createPromiseCallback();

      overrideFind.call(Model, filter, options, (err, results) => {
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
        if (typeof c === 'function') {
          return Model.findNew(a, b, c);
        }
        return overrideFind.call(Model, a, b, c);
      }

      Model.findNew = function (filter, options, callback) {
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

        var key = getKey(filter, options);

        cache.get(key, (err, cachedResults) => {
          debug('Get (%s): %j', key, cachedResults);

          if (cachedResults) {
            debug('%s serving from cache', modelName);
            process.nextTick(() => {
              callback(null, JSON.parse(cachedResults));
            });
            // If reload is defined
            if (cacheOptions.reloadAfterReturn) {
              getFromDBAndSaveInCache(key, filter, options);
            }
          } else {
            debug('%s serving from db', modelName);
            getFromDBAndSaveInCache(key, filter, options, callback);
          }
        });

        return callback.promise;
      };
    }

    if (cacheOptions.invalidateCacheAfterSave) {
      // Invalidate cache after update database
      Model.observe('after save', (ctx, next) => {
        invalidateCache();
        next();
      });
    }

    if (cacheOptions.invalidateCacheAfterDelete) {
      // Invalidate cache after delete
      Model.observe('after delete', (ctx, next) => {
        invalidateCache();
        next();
      });
    }

    const oldMethods = {};

    cacheOptions.methods.forEach((element) => {
      debug('Configuring method %s for cache', element);
      oldMethods[element] = Model[element];
      Model[element] = (...args) => {
        var methodArguments = args;
        const callback = methodArguments[methodArguments.length - 1];
        var servedFromCache = false;
        debug('This is the new method');
        const key = getKey(element, methodArguments);
        debug('Key %s', key);
        cache.get(key, (err, cachedResults) => {
          debug('Get (%s): %j', key, cachedResults);

          if (cachedResults) {
            servedFromCache = true;
            debug('%s:%s serving from cache', modelName, element);
            process.nextTick(() => {
              callback(null, JSON.parse(cachedResults));
            });
          } else {
            debug('%s:%s NOT serving from cache', modelName, element);
          }

          if (!servedFromCache || cacheOptions.reloadAfterReturn) {
            debug('Server from cache %s', servedFromCache);
            const lArguments = Array.prototype.slice.call(methodArguments, 0, methodArguments.length - 1);
            lArguments.push((errDefinedCallback, result) => {
              if (result) {
                debug('%s:%s setted new value in cache', modelName, element);
                cache.setex(key, cacheOptions.ttl, JSON.stringify(result));
              }
              if (!servedFromCache) {
                callback(errDefinedCallback, result);
              }
            });
            oldMethods[element].apply(Model, lArguments);
          }
        });
        return callback.promise;
      };
    });
  }
};
