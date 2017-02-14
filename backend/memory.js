var cache = require('memory-cache');
var debug = require('debug')('loopback:ibmresearch:mixins:backend:memory');

// Wrapper for memory-cache
function MemoryWrapper() {
  return {
    setex(key, ttl, value) {
      cache.put(key, JSON.stringify(value), ttl);
    },
    ttl(key, cb) {
      var cachedResults = cache.get(key);
      cb(null, cachedResults ? 1 : undefined);
    },
    del(key) {
      cache.del(key);
    },
    keys(keyExpression, cb) {
      var re = new RegExp(keyExpression);
      var allKeys = cache.keys();
      var filteredKeys = allKeys.filter(function isModelKey(value) {
        return value && re.test(value);
      });
      cb(null, filteredKeys);
    },
    get(key, cb) {
      var cachedResults = cache.get(key);
      cb(null, JSON.parse(cachedResults));
    }
  };
}


function Client(config) {
  debug('Configure memory cache: ', config);
  this.client = MemoryWrapper();
}

Client.prototype.getClient = function () {
  return this.client;
};

module.exports = Client;
