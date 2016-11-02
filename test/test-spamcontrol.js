var chai = require('chai');

var path = require('path');
var SIMPLE_APP = path.join(__dirname, 'test-app');
var app = require(path.join(SIMPLE_APP, 'server/server.js'));


describe('SpamControl tests', function () {

  var SpamcontrolItem = app.models.SpamcontrolItem;

  it('Simple find', function (done) {
    SpamcontrolItem.destroyAll(function() {
       SpamcontrolItem.create({name: 'item 1'}, function(err, item) {
         chai.assert.isString('1');
         done();
       });
     });
  });

});
