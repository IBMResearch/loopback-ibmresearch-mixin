var debug = require('debug')('loopback:ibmresearch:mixins:modelcache');
var utils = require('loopback-datasource-juggler/lib/utils');
var cache = require('memory-cache');
var _ = require('lodash');

var CACHE_TTL = 30000;

var defaultOptions = {
  ttl: CACHE_TTL,
  reloadAfterReturn: true,
  methods: []
}

/**
 * Options:
 *    - ttl: Time to live
 *    - reloadAfterReturn: After return from cache (the DB method will be fired and reload cache)
 *    - methods: Methods with parameters (only with 2) that will be cached
 */
module.exports = function(Model, opts) {
  var app;
  var cacheOptions = {};

  Model.on('attached', function(a) {
    console.log('Attached');
    app = a;

    configure();
  });

  _.merge(cacheOptions, defaultOptions, opts);

  function configure() {

    var modelName = Model.modelName;
    var CachedModel = app.models.CachedModel;
    var overrideFind = Model.find;

    // Initialize
    debug('Cache Queries configure model %s: %j', modelName, cacheOptions);

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
          cache.put(key, JSON.stringify(results), cacheOptions.ttl);
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

        var cachedResults = cache.get(key);
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

        return callback.promise;
      }
    }

    var oldMethods = {};

    cacheOptions.methods.forEach(function(element) {
      debug('Configuring method %s for cache', element);
      oldMethods[element] = Model[element];
      Model[element] = function (filter, callback) {
        var methodArguments = arguments;
        debug('This is the new method');
        var key = _getKey(element, arguments);
        debug('Key %s', key);
        var cachedResults = cache.get(key);
        debug('Get (%s): %j', key, cachedResults);

        if (cachedResults) {
          debug('%s:%s serving from cache', modelName, element);
          process.nextTick(function() {
            callback(null, JSON.parse(cachedResults));
          });
        } else {
          debug('%s:%s NOT serving from cache', modelName, element);
          var oldCallback = methodArguments[1];
          var lArguments = [methodArguments[0]];
          lArguments.push(function (err, result) {
            if (result) {
              cache.put(key, JSON.stringify(result), cacheOptions.ttl);
            }
            oldCallback(err, result);
          });
          oldMethods[element].apply(this, lArguments);
        }
      }
    });
  }

};
