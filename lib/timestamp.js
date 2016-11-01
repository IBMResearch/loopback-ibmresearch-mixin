var debug = require('debug')('loopback:ibmresearch:mixins:timestamp');
var _ = require('lodash');
var LoopBackContext = require('loopback-context');

var defaultOptions = {
  createdAt: 'createdAt',
  modifiedAt: 'modifiedAt',
  required: false,
  history: false
};

module.exports = function(Model, opts) {
  var app;
  var timestampOptions = {};

  _.merge(timestampOptions, defaultOptions, opts);

  function _getAccessToken(defaultUserId) {
    var loopbackCtx = LoopBackContext.getCurrentContext();
    // Get the current access token
    var accessToken = loopbackCtx && loopbackCtx.get('accessToken');
    if (!accessToken) {
      debug('%s AccessToken not found in context', Model.modelName);
      accessToken = {
        userId: defaultUserId || 'anonymous'
      };
    }
    return accessToken;
  }

  /*************************************************
   * Properties definition
   *************************************************/
  Model.defineProperty(timestampOptions.createdAt, {
    type: Date,
    required: timestampOptions.required,
    defaultFn: 'now',
  });

  if (timestampOptions.history) {
    Model.defineProperty(timestampOptions.modifiedAt, {
      type: Object,
      required: timestampOptions.required,
    });
  } else {
    Model.defineProperty(timestampOptions.modifiedAt, {
      type: Date,
      required: timestampOptions.required,
    });
  }

  function _getModifiedAttribute(data, previousInstance, accessToken) {
    if (timestampOptions.history) {
      accessToken = accessToken || _getAccessToken();
      var newChange = {};
      newChange[new Date().getTime()] = accessToken.userId;
      data[timestampOptions.modifiedAt] = {};
      _.merge(data[timestampOptions.modifiedAt], previousInstance[timestampOptions.modifiedAt], newChange);
      debug('%s before save data: %o', ctx.Model.modelName, data);
    } else {
      data[timestampOptions.modifiedAt] = new Date();
    }
    return data;
  }

  /***************************************************
   * Operation hooks
   ***************************************************/
  Model.observe('before save', function(ctx, next) {
    if ((ctx.instance && !_.isEmpty(ctx.instance[timestampOptions.modifiedAt])) || (ctx.data && !_.isEmpty(ctx.data[timestampOptions.modifiedAt]))) {
      debug('%s Not update instance', ctx.Model.modelName);
      next();
    } else {
      debug('%s Calculate history before save.', ctx.Model.modelName);
      if (!ctx.hookState[timestampOptions.modifiedAt]) {
        ctx.hookState[timestampOptions.modifiedAt] = {};
      }

      var accessToken;
      if (ctx.currentInstance) {
        ctx.data = _getModifiedAttribute(ctx.data, ctx.currentInstance);
        debug('%s.%s before save ctx.data: %o', ctx.Model.modelName, timestampOptions.modifiedAt, ctx.data);
      } else if (ctx.instance) {
        debug('%s.%s before save: %s', ctx.Model.modelName, timestampOptions.modifiedAt, ctx.instance.id);
        if (timestampOptions.history) {
          accessToken = _getAccessToken();
          ctx.hookState[timestampOptions.modifiedAt][new Date().getTime()] = accessToken.userId;
        } else {
          ctx.instance[timestampOptions.modifiedAt] = new Date();
        }
      } else {
        debug('%s.%s before update matching %j', ctx.Model.pluralModelName, timestampOptions.modifiedAt, ctx.where);
        if (timestampOptions.history) {
          accessToken = _getAccessToken();
          ctx.hookState[timestampOptions.modifiedAt][new Date().getTime()] = accessToken.userId;
        } else {
          ctx.data[timestampOptions.modifiedAt] = new Date();
        }
      }
      next();
    }

  });

  function _updateInstanceHistory(ctx, instance) {
    var historyObject = {};
    _.defaults(historyObject, ctx.hookState[timestampOptions.modifiedAt], instance[timestampOptions.modifiedAt]);
    debug('%s History %o', ctx.Model.modelName, historyObject);
    var modifiedObject = {};
    modifiedObject[timestampOptions.modifiedAt] = historyObject;
    instance.updateAttributes(modifiedObject, function (err, updatedIntance) {
      if (err) console.error('%s Error updating instance history: ', ctx.Model.modelName, err);
    });
  }

  Model.observe('after save', function(ctx, next) {
    if (timestampOptions.history && !_.isEmpty(ctx.hookState[timestampOptions.modifiedAt])) {
      debug('%s ctx.hookState: %o', ctx.Model.modelName, ctx.hookState);
      if (!ctx.instance) {
        var accessToken = _getAccessToken();
        Model.find({ where: ctx.where }, function (err, models) {
          debug('%s To update %s instances with %j', ctx.Model.modelName, models ? models.length : 0, ctx.hookState[timestampOptions.modifiedAt]);
          for (var i = 0; i < models.length; i++) {
            Model.findById(models[i].id, function(err, instance) {
              debug('%s Update instance %o', ctx.Model.modelName, instance);
              _updateInstanceHistory(ctx, instance);
            });
          }
        });
      } else {
        _updateInstanceHistory(ctx, ctx.instance);
      }
    }
    next();
  });
}
