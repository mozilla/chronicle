/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var path = require('path');
var config = require('../config');
var baseController = require('../controllers/base');
var STATIC_PATH = path.join(__dirname, '..', '..', config.get('server_staticPath'));

var baseRoutes = [{
  method: 'GET',
  path: '/',
  config: {
    handler: baseController.get,
    auth: {
      strategy: 'session',
      // 'try': allow users to visit the route with good, bad, or no session
      mode: 'try'
    },
    plugins: {
      'hapi-auth-cookie': {
        redirectTo: false // don't redirect users who don't have a session
      }
    },
  }
}, {
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: STATIC_PATH,
      listing: config.get('server_staticDirListing')
    }
  }
}];

module.exports = baseRoutes;
