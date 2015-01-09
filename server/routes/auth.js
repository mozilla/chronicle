/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('../logger')('server.routes.auth');
var config = require('../config');

module.exports = [{
  method: 'GET',
  path: '/auth/login',
  config: {
    auth: {
      strategy: 'session',
      mode: 'try'
    },
    plugins: {
      'hapi-auth-cookie': {
        redirectTo: false // don't redirect users who don't have a session
      }
    },
    handler: function(request, reply) {
      // If we are in testUser mode, just set the cookie and skip the oauth part
      if (config.get('testUser.enabled')) {
        request.auth.session.set({fxaId: config.get('testUser.id')});
        return reply.redirect('/');
      }

      // Bell uses the same endpoint for both the start and redirect
      // steps in the flow. Let's keep this as the initial endpoint,
      // so the API is easy to read, and just redirect the user.
      log.verbose('request.auth.isAuthenticated is ' + request.auth.isAuthenticated);
      var endpoint = request.auth.isAuthenticated ? '/' : '/auth/complete';
      reply.redirect(endpoint);
    }
  }
}, {
  method: 'GET',
  path: '/auth/logout',
  config: {
    auth: {
      strategy: 'session',
      mode: 'try'
    },
    handler: function (request, reply) {
      if (request.auth.isAuthenticated) {
        request.auth.session.clear();
      }
      return reply.redirect('/');
    }
  }
}, {
  // Bell uses the same endpoint for both the start and redirect
  // steps in the flow. The front end starts the user here, and
  // Bell redirects here after we're done.
  method: ['GET', 'POST'],
  path: '/auth/complete',
  config: {
    auth: {
      strategy: 'oauth',
      mode: 'try'
    },
    handler: function (request, reply) {
      // Bell has obtained the oauth token, used it to get the profile, and
      // that profile is available as request.auth.credentials.profile.
      // Now, use it to set a cookie.
      log.verbose('inside auth/complete');
      log.verbose('request.auth.credentials is ' + JSON.stringify(request.auth.credentials));

      var session = {
        fxaId: request.auth.credentials.profile.fxaId
      };
      var duration = config.get('server.session.duration');
      if (duration > 0) {
        session.expiresAt = new Date(new Date().getTime() + duration);
      }
      request.auth.session.set(session);
      reply.redirect('/');
    }
  }
}];
