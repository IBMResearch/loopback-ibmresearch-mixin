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

  it('Cache after update', function (done) {
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        chai.assert.isNumber(item.id);
        ModelcacheItem.getAllItems(function (err, itemsFirst) {
          var id = itemsFirst[0].id;
          chai.assert.strictEqual(itemsFirst.length, 1);
          chai.assert.strictEqual(itemsFirst[0].name, 'item 1');
          ModelcacheItem.upsertWithWhere({ id }, { name: 'item 1 modified' }, function (err, itemModified) {
            ModelcacheItem.getAllItems(function (err, itemsSecond) {
              chai.assert.strictEqual(1, itemsSecond.length);
              chai.assert.strictEqual('item 1 modified', itemsSecond[0].name);
              done();
            });
          });
        });
      });
    });
  });

  it('Cache after delete', function (done) {
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        chai.assert.isNumber(item.id);
        ModelcacheItem.getAllItems(function (err, itemsFirst) {
          var id = itemsFirst[0].id;
          chai.assert.strictEqual(itemsFirst.length, 1);
          chai.assert.strictEqual(itemsFirst[0].name, 'item 1');
          ModelcacheItem.destroyById(id, function (err, itemDeleted) {
            ModelcacheItem.getAllItems(function (err, itemsSecond) {
              chai.assert.strictEqual(0, itemsSecond.length);
              done();
            });
          });
        });
      });
    });
  });

  it('Simple cache time', function (done) {
    var start;
    var firstFind;
    var secondFind;
    var thirdFind;
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        var id = item.id;
        chai.assert.isNumber(item.id);
        start = new Date();
        ModelcacheItem.getAllItems(function () {
          firstFind = new Date();
          ModelcacheItem.getAllItems(function () {
            secondFind = new Date();
            chai.assert.isAbove(firstFind - start, secondFind - firstFind, 'Cache time is faster');
            ModelcacheItem.upsertWithWhere({ id: id }, { name: 'item 1 modified' }, function () {
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
        var id = item.id;
        chai.assert.isNumber(item.id);
        start = new Date();
        ModelcacheItem.methodWithParam(param, function () {
          firstFind = new Date();
          ModelcacheItem.methodWithParam(param, function () {
            secondFind = new Date();
            chai.assert.isAbove(firstFind - start, secondFind - firstFind, 'Cache time is faster');
            ModelcacheItem.upsertWithWhere({ id: id }, { name: 'item 1 modified' }, function () {
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

  it('Simple cache - Method with 2 param', function (done) {
    var param1 = 'pepe';
    var param2 = 'juan';
    var start;
    var firstFind;
    var secondFind;
    var thirdFind;
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        var id = item.id;
        chai.assert.isNumber(item.id);
        start = new Date();
        ModelcacheItem.methodWith2Param(param1, param2, function () {
          firstFind = new Date();
          ModelcacheItem.methodWith2Param(param1, param2, function () {
            secondFind = new Date();
            chai.assert.isAbove(firstFind - start, secondFind - firstFind, 'Cache time is faster');
            ModelcacheItem.upsertWithWhere({ id }, { name: 'item 1 modified' }, function () {
              ModelcacheItem.methodWith2Param(param1, param2, function () {
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
