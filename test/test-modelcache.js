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

  it('Simple post', function (done) {
    ModelcacheItem.destroyAll(function () {
      ModelcacheItem.create({ name: 'item 1' }, function (err, item) {
        chai.assert.isNumber(item.id);

        const newName = 'item 1 - changed';

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
        ModelcacheItem.getAllItems(function (errFirst, itemsFirstTime) {
          firstFind = new Date();
          ModelcacheItem.getAllItems(function (errSecond, itemsSecondTime) {
            secondFind = new Date();
            chai.assert.isAbove(firstFind - start, secondFind - firstFind, 'Cache time is faster');
            ModelcacheItem.upsert({ name: 'item 1 modified' }, function (errModified, itemModified) {
              ModelcacheItem.getAllItems(function (errThird, itemsThirdTime) {
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
        ModelcacheItem.methodWithParam(param, function (errFirst, itemsFirstTime) {
          firstFind = new Date();
          ModelcacheItem.methodWithParam(param, function (errSecond, itemsSecondTime) {
            secondFind = new Date();
            chai.assert.isAbove(firstFind - start, secondFind - firstFind, 'Cache time is faster');
            ModelcacheItem.upsert({ name: 'item 1 modified' }, function (errModified, itemModified) {
              ModelcacheItem.methodWithParam(param, function (errThird, itemsThirdTime) {
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
