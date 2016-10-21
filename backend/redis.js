var redisModule = require('redis');
var debug = require('debug')('loopback:ibmresearch:mixins:backend:redis');

function getUrl(config) {
  if (!config.host) {
    console.error('No host defined');
    return undefined;
  }
  if (!config.port) {
    console.error('No port defined');
    return undefined;
  }
  if (!config.password) {
    console.error('No password defined');
    return undefined;
  }
  if (!config.dbNumber) {
    console.error('No dbNumber defined');
    return undefined;
  }

  var url = 'redis://x:'+config.password+'@'+config.host+':'+config.port+"/"+config.dbNumber;
  debug('Url redis backend: %s', url);
  return url;
}

function Client(redisConfig) {
  var url = getUrl(redisConfig);
  if (!url) {
    return undefined;
  }

  this.client = redisModule.createClient({ url: url });

  this.client.on("ready", function (val) {
    debug("Ready " + val);
  });

  this.client.on("error", function (err) {
      debug("Error " + err);
      console.error(err);
  });

  this.client.on("reconnecting", function (err) {
      debug("Reconnecting " + err);
  });
}

Client.prototype.getClient = function() {
  return this.client;
};

module.exports = Client;
