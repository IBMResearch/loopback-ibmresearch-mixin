var _ = require('lodash');

module.exports = function (PostModel, options) {
  const Model = PostModel;
  var defaultOptions = {
    assignProperties: false
  };

  _.merge(defaultOptions, options);

  Model.updateDataWithPost = function (id, instance, cb) {
    Model.findById(id, (err, previousInstance) => {
      if (err) {
        return cb(err);
      }
      if (!previousInstance) {
        return cb({ code: 'INSTANCE_NOT_FOUND' });
      }

      if (defaultOptions.assignProperties) {
        _.assign(previousInstance, instance);

        previousInstance.save((errSaving, updatedInstance) => {
          cb(errSaving, updatedInstance);
        });
      } else {
        previousInstance.updateAttributes(instance, (errUpdating, updatedInstance) => {
          cb(errUpdating, updatedInstance);
        });
      }
    });
  };

  Model.remoteMethod(
    'updateDataWithPost', {
      description: 'Update attributes for a model instance and persist it into data source (loopback-post-mixin)',
      accepts: [
        { arg: 'id', type: 'string' },
        { arg: 'instance', type: 'object', http: { source: 'body' } }
      ],
      http: { path: '/:id', verb: 'post', errorStatus: 400 },
      returns: [{ arg: 'instance', root: true, type: 'object' }]
    }
  );
};
