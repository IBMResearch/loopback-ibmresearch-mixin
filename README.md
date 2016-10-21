# IBM research mixin for Loopback Models

[![npm info](https://nodei.co/npm/loopback-ibmresearch-mixin.png?downloads=true&downloadRank=true&stars=true)](https://npmjs.org/package/loopback-ibmresearch-mixin)

Some mixins used in IBM research apps that use Loopback. This module is designed for the [Strongloop Loopback](https://github.com/strongloop/loopback) framework.

## Mixins

* _PostMethod_: It automatically adds a remote method for update an instance of any model through a `POST /MyModel/<id>`.
* _ModelCache_: Create a cache for find methods in model (memory or redis).
* _SpamControl_: Create a basic spam control for intances creation.

## Installation

You can put me in your package.json dependencies. The `npm` tool can do this for you, from the command line:

    $ npm install --save loopback-ibmresearch-mixin

## Configuration

#### _Postmethod_ mixin

It automatically adds a remote method for update an instance of any model through a `POST /MyModel/<id>`.

* `assignProperties` If true, it will assign instance properties instead of merging.

#### _ModelCache_ mixin

Create a cache for find methods in model (memory or redis).

* `ttl`: Time to live of the cache in miliseconds (default 30000).
* `reloadAfterReturn`: After return from cache (the DB method will be fired and reload cache. default: `true`).
* `invalidateCacheAfterSave`: If true, the cache will be invalidated after save any instance of the model.
* `methods`: Array of remote methods that will be cached too.
* `type`: Backend type ('memory' or 'redis'). Default value is 'memory'.
* `configuration`: Configuration of the backend.

#### _SpamControl_ mixin

Add a simple spam control for multiple creations of instances. This mixin disable instance creation of a model (and user) for a specified time after create one.

* `ttl`: Time to wait to create a new instance in miliseconds (default 30000).
* `unique`: Only access to this model will be checked (default `true`).
* `errorCode`: ErrorCode to generate if spam detected (`next({code: errorCode})`).
* `type`: Backend type ('memory' or 'redis'). Default value is 'memory'.
* `configuration`: Configuration of the backend.

### model-config.json

Add the `mixins` property to your `server/model-config.json`:

```json
{
  "_meta": {
    "sources": [
      "loopback/common/models",
      "loopback/server/models",
      "../common/models",
      "./models"
    ],
    "mixins": [
      "loopback/common/mixins",
      "../node_modules/loopback-ibmresearch-mixin/lib",
      "../common/mixins"
    ]
  }
}
```

### Model config

To use with your Models add the `mixins` attribute to the definition object of your model config.

```json
  {
    "name": "MyModel",
    "properties": {
      "name": {
        "type": "string",
      }
    },
    "mixins": {
      "PostMethod": {
        "assignProperties": false
      },
      "ModelCache": {
        "ttl": 4000,
        "reloadAfterReturn": true,
        "methods": [ "myRemoteMethod" ]
      },
      "SpamControl": {
        "ttl": 5000,
        "type": "redis",
        "configuration": {
          "host": "xxx",
          "password": "xxx",
          "port": "xxx",
          "dbNumber": "x"
        }
      }
    }
  }
```

### Configure programatically

In `server/boot` folder of the loopback app.

```javascript
var postMethod = require('loopback-ibmresearch-mixin/lib/postMethod');
var modelCache = require('loopback-ibmresearch-mixin/lib/modelCache');
var spamControl = require('loopback-ibmresearch-mixin/lib/spamControl');

module.exports = function(app) {

  var options = {
    ttl: 5000,
    methods: [ 'myRemoteMethod' ]
  };

  modelCache(app.models.MyModel, options);
  postMethod(app.models.MyModel);
  spamControl(app.models.MyModel);

};
```


### Debug

For debug use:

    DEBUG=loopback:ibmresearch:mixins:* npm start

# LICENSE

MIT License

Copyright (c) 2016 IBM Research Emergent Solutions

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[MIT](LICENSE.txt)
