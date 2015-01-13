/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var path = require('path');
var log = require('../logger')('server.routes.base');
var config = require('../config');
var STATIC_PATH = path.join(__dirname, '../..', config.get('server.staticPath'));

module.exports = [{
  method: 'GET',
  path: '/',
  config: {
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
    handler: function (request, reply) {
      var page = request.auth.isAuthenticated ? 'app.html' : 'index.html';
      reply.file(path.join(STATIC_PATH, page));
    }
  }
}, {
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: STATIC_PATH,
      listing: config.get('server.staticDirListing')
    }
  }
}];
