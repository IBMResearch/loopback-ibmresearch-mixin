var chai = require('chai');
var path = require('path');

var SIMPLE_APP = path.join(__dirname, 'test-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));

var PostmethodItem = app.models.PostmethodItem;

function findAndCheckName(id, name, cb) {
  PostmethodItem.findById(id, function (err, itemFound) {
    chai.expect(itemFound.name).to.equal(name);
    cb(err, itemFound);
  });
}

describe('Post method tests', function () {

  it('Simple post', function (done) {
    PostmethodItem.destroyAll(function () {
      PostmethodItem.create({ name: 'item 1' }, function (err, item) {
        chai.assert.isNumber(item.id);

        const newName = 'item 1 - changed';

        PostmethodItem.updateDataWithPost(item.id, { name: newName }, function (errUpdate, itemModified) {
          chai.expect(itemModified.name).to.equal(newName);
          findAndCheckName(item.id, newName, function () {
            done();
          });
        });
      });
    });
  });
});
