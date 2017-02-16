var chai = require('chai');
var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'test-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));


describe('Timestamp tests', function () {

  var TimestampItem = app.models.TimestampItem;

  it('CreatedAt property exists', function (done) {
    TimestampItem.destroyAll(function () {
      TimestampItem.create({ name: 'item 1' }, function (err, item) {
        if (err) return done(err);
        chai.assert.isNotNull(item.createdAt);
        chai.expect(item.createdAt).be.instanceOf(Date);
        done();
      });
    });
  });

  it('CreatedAt property not change on save', function (done) {
    TimestampItem.destroyAll(function () {
      TimestampItem.create({ name: 'item 1' }, function (err, createdItem) {
        var item = createdItem;
        if (err) return done(err);
        chai.assert.isNotNull(item.createdAt);
        chai.expect(item.createdAt).be.instanceOf(Date);
        item.name = 'item 1 modified';
        return item.save(function (errSave, i) {
          chai.expect(i.createdAt).equal(item.createdAt);
          done();
        });
      });
    });
  });

  it('CreatedAt property not change on updateAttributes', function (done) {
    TimestampItem.destroyAll(function () {
      TimestampItem.create({ name: 'item 1' }, function (err, item) {
        var attributes = {
          name: 'item 1 modified'
        };
        if (err) return done(err);
        chai.assert.isNotNull(item.createdAt);
        chai.expect(item.createdAt).be.instanceOf(Date);
        return item.updateAttributes(attributes, function (errUpdate, i) {
          chai.expect(i.createdAt).equal(item.createdAt);
          done();
        });
      });
    });
  });

  it('ModifiedAt property exists', function (done) {
    TimestampItem.destroyAll(function () {
      TimestampItem.create({ name: 'item 1' }, function (err, item) {
        if (err) return done(err);
        chai.assert.isNotNull(item.modifiedAt);
        chai.expect(item.modifiedAt).be.instanceOf(Date);
        done();
      });
    });
  });

  it('ModifiedAt property change on save', function (done) {
    TimestampItem.destroyAll(function () {
      TimestampItem.create({ name: 'item 1' }, function (err, createdItem) {
        var item = createdItem;
        var previousTime = item.modifiedAt;
        if (err) return done(err);
        chai.assert.isNotNull(item.modifiedAt);
        chai.expect(item.modifiedAt).be.instanceOf(Date);
        item.name = 'item 1 modified';
        return setTimeout(function wait1() {
          item.save(function (errSave, i) {
            chai.assert.isNotNull(i.modifiedAt);
            chai.expect(i.modifiedAt).be.instanceOf(Date);
            chai.expect(i.modifiedAt).not.equal(previousTime);
            chai.expect(i.modifiedAt.getTime()).to.be.above(previousTime.getTime());
            done();
          });
        }, 1);
      });
    });
  });

  it('ModifiedAt property change on updateattributes', function (done) {
    TimestampItem.destroyAll(function () {
      TimestampItem.create({ name: 'item 1' }, function (err, item) {
        var previousTime;
        var attributes = {
          name: 'item 1 modified'
        };
        if (err) return done(err);
        chai.assert.isNotNull(item.modifiedAt);
        chai.expect(item.modifiedAt).be.instanceOf(Date);
        previousTime = item.modifiedAt;
        return setTimeout(function wait1() {
          item.updateAttributes(attributes, function (errUpdating, i) {
            chai.assert.isNotNull(i.modifiedAt);
            chai.expect(i.modifiedAt).be.instanceOf(Date);
            chai.expect(i.modifiedAt).not.equal(previousTime);
            chai.expect(i.modifiedAt.getTime()).to.be.above(previousTime.getTime());
            done();
          });
        }, 1);
      });
    });
  });
});
