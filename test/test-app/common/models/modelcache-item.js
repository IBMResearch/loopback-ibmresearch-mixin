module.exports = function (Model) {
  var ModelcacheItem = Model;

  ModelcacheItem.getAllItems = function (cb) {
    setTimeout(function () {
      ModelcacheItem.find(function (err, models) {
        return cb(err, models);
      });
    }, 100);
  };

  ModelcacheItem.remoteMethod(
    'getAllItems', {
      http: { path: '/allitems', verb: 'get', errorStatus: 400 },
      returns: [{ arg: 'items', root: true, type: ['object'] }]
    }
  );

  ModelcacheItem.methodWithParam = function (parameter, cb) {
    setTimeout(function () {
      ModelcacheItem.find(function (err, models) {
        return cb(err, models);
      });
    }, 100);
  };

  ModelcacheItem.remoteMethod(
    'methodWithParam', {
      accepts: [
        { arg: 'parameter', type: 'string' },
      ],
      http: { path: '/allitems', verb: 'get', errorStatus: 400 },
      returns: [{ arg: 'items', root: true, type: ['object'] }]
    }
  );

  ModelcacheItem.methodWith2Param = function (parameter1, parameter2, cb) {
    setTimeout(function () {
      ModelcacheItem.find(function (err, models) {
        return cb(err, models);
      });
    }, 100);
  };

  ModelcacheItem.remoteMethod(
    'methodWith2Param', {
      accepts: [
        { arg: 'parameter1', type: 'string' },
        { arg: 'parameter2', type: 'string' },
      ],
      http: { path: '/methodWith2Param', verb: 'get', errorStatus: 400 },
      returns: [{ arg: 'items', root: true, type: ['object'] }]
    }
  );
};
