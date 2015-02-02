/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var authController = require('../controllers/auth');

var authRoutes = [{
  method: 'GET',
  path: '/auth/login',
  config: {
    handler: authController.login,
    auth: {
      strategy: 'session',
      mode: 'try'
    },
    plugins: {
      'hapi-auth-cookie': {
        redirectTo: false // don't redirect users who don't have a session
      }
    }
  }
}, {
  method: 'GET',
  path: '/auth/logout',
  config: {
    handler: authController.logout,
    auth: {
      strategy: 'session',
      mode: 'try'
    }
  }
}, {
  // Bell uses the same endpoint for both the start and redirect
  // steps in the flow. The front end starts the user here, and
  // Bell redirects here after we're done.
  method: ['GET', 'POST'],
  path: '/auth/complete',
  config: {
    handler: authController.complete,
    auth: {
      strategy: 'oauth',
      mode: 'try'
    },
  }
}];

module.exports = authRoutes;
