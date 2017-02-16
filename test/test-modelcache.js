var chai = require('chai');
var path = require('path');

var SIMPLE_APP = path.join(__dirname, 'test-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));

var ModelcacheItem = app.models.ModelcacheItem;

function findAndCheckName(id, name, cb) {
  ModelcacheItem.findById(id, function (err, itemFound) {
    chai.expect(itemFound.name).to.equal(name);
    cb(err, itemFound);
  });
}

describe('Model cache tests', function () {
  it('Simple create', function (done) {
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        chai.assert.isNumber(item.id);
        done();
      });
    });
  });

  it('Simple cache', function (done) {
    var start;
    var firstFind;
    var secondFind;
    var thirdFind;
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        chai.assert.isNumber(item.id);
        start = new Date();
        ModelcacheItem.getAllItems(function () {
          firstFind = new Date();
          ModelcacheItem.getAllItems(function () {
            secondFind = new Date();
            chai.assert.isAbove(firstFind - start, secondFind - firstFind, 'Cache time is faster');
            ModelcacheItem.upsert({ name: 'item 1 modified' }, function () {
              ModelcacheItem.getAllItems(function () {
                thirdFind = new Date();
                chai.assert.isAbove(thirdFind - secondFind, secondFind - firstFind, 'Cache time after upsert is slower');
                done();
              });
            });
          });
        });
      });
    });
  });

  it('Simple cache - Method with param', function (done) {
    var param = 'pepe';
    var start;
    var firstFind;
    var secondFind;
    var thirdFind;
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        chai.assert.isNumber(item.id);
        start = new Date();
        ModelcacheItem.methodWithParam(param, function () {
          firstFind = new Date();
          ModelcacheItem.methodWithParam(param, function () {
            secondFind = new Date();
            chai.assert.isAbove(firstFind - start, secondFind - firstFind, 'Cache time is faster');
            ModelcacheItem.upsert({ name: 'item 1 modified' }, function () {
              ModelcacheItem.methodWithParam(param, function () {
                thirdFind = new Date();
                chai.assert.isAbove(thirdFind - secondFind, secondFind - firstFind, 'Cache time after upsert is slower');
                done();
              });
            });
          });
        });
      });
    });
  });
});
