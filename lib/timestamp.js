var debug = require('debug')('loopback:ibmresearch:mixins:timestamp');
var _ = require('lodash');

var defaultOptions = {
  createdAt: 'createdAt',
  modifiedAt: 'modifiedAt',
  required: false
};

module.exports = function(Model, opts) {
  var app;
  var timestampOptions = {};

  _.merge(timestampOptions, defaultOptions, opts);

  Model.defineProperty(timestampOptions.createdAt, {
    type: Date,
    required: timestampOptions.required,
    defaultFn: 'now',
  });

  Model.defineProperty(timestampOptions.modifiedAt, {
    type: Date,
    required: timestampOptions.required,
  });

  Model.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      debug('%s.%s before save: %s', ctx.Model.modelName, timestampOptions.modifiedAt, ctx.instance.id);
      ctx.instance[timestampOptions.modifiedAt] = new Date();
    } else {
      debug('%s.%s before update matching %j', ctx.Model.pluralModelName, timestampOptions.modifiedAt, ctx.where);
      ctx.data[timestampOptions.modifiedAt] = new Date();
    }
    return next();
  });
}