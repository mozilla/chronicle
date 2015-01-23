/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var log = require('../logger')('server.controllers.auth');
var config = require('../config');

var authController = {
  login: function(request, reply) {
    // If we are in testUser mode, just set the cookie and skip the oauth part
    if (config.get('testUser.enabled')) {
      log.verbose('testUser enabled; creating session');
      request.auth.session.set({userId: config.get('testUser.id')});
      return reply.redirect('/');
    }

    // Bell uses the same endpoint for both the start and redirect
    // steps in the flow. Let's keep this as the initial endpoint,
    // so the API is easy to read, and just redirect the user.
    log.verbose('request.auth.isAuthenticated is ' + request.auth.isAuthenticated);
    var endpoint = request.auth.isAuthenticated ? '/' : '/auth/complete';
    reply.redirect(endpoint);
  },
  logout: function (request, reply) {
    if (request.auth.isAuthenticated) {
      request.auth.session.clear();
    }
    return reply.redirect('/');
  },
  complete: function (request, reply) {
    // Bell has obtained the oauth token, used it to get the profile, and
    // that profile is available as request.auth.credentials.profile.
    // Now, use it to set a cookie.
    log.verbose('inside auth/complete');
    log.verbose('request.auth.credentials is ' + JSON.stringify(request.auth.credentials));

    var session = {
      userId: request.auth.credentials.profile.userId
    };
    var duration = config.get('server.session.duration');
    if (duration > 0) {
      session.expiresAt = new Date(new Date().getTime() + duration);
    }
    request.auth.session.set(session);
    reply.redirect('/');
  }
};

module.exports = authController;
