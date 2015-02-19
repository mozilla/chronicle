/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Hapi = require('hapi');
var HapiAuthCookie = require('hapi-auth-cookie');
var Bell = require('bell');
var Lout = require('lout');
var pg = require('pg');

var config = require('./config');
var log = require('./logger')('server.index');
var authProfileCb = require('./bell-oauth-profile');
var routes = require('./routes');
var user = require('./models/user');

var serverConfig = {};

// log extra error info if we're in ultra-chatty log mode
if (config.get('server_log_level') === 'trace') {
  serverConfig = {
    debug: {
      request: ['error']
    }
  };
}

var server = new Hapi.Server(serverConfig);
server.connection({
  host: config.get('server_host'),
  port: config.get('server_port'),
  router: {
    stripTrailingSlash: true
  }
});

server.register([
  HapiAuthCookie,
  Bell,
  Lout
], function (err) {
  if (err) {
    log.warn('failed to load plugin: ' + err);
    throw err;
  }

  // hapi-auth-cookie init
  server.auth.strategy('session', 'cookie', {
    password: config.get('server_session_password'),
    cookie: config.get('server_session_cookieName'),
    isSecure: config.get('server_session_isSecure'),
    keepAlive: config.get('server_session_keepAlive'),
    ttl: config.get('server_session_duration'),
    clearInvalid: config.get('server_session_clearInvalid'),
    // this function validates that the user exists + session is valid
    validateFunc: function(session, cb) {
      log.verbose('inside hapi-auth-cookie validateFunc.');
      log.verbose('session is ' + JSON.stringify(session));

      var ttl = config.get('server_session_duration');
      if (ttl > 0 && new Date() > new Date(session.expiresAt)) {
        log.verbose('cookie is expired.');
        return cb(null, false);
      }
      log.verbose('cookie is not expired.');

      var userId = session.userId;
      user.get(userId, function(err, result) {
        if (err) {
          log.warn('unable to get user to validate user session: ' + err);
          return cb(err, false);
        }
        cb(null, !!result, userId);
      });
    }
  });

  // bell init
  server.auth.strategy('oauth', 'bell', {
    provider: {
      protocol: config.get('server_oauth_protocol'),
      auth: config.get('server_oauth_authEndpoint'),
      token: config.get('server_oauth_tokenEndpoint'),
      version: config.get('server_oauth_version'),
      scope: config.get('server_oauth_scope'),
      profile: authProfileCb
    },
    password: config.get('server_session_password'),
    clientId: config.get('server_oauth_clientId'),
    clientSecret: config.get('server_oauth_clientSecret'),
    isSecure: config.get('server_session_isSecure')
  });
});

// shutdown the pg pool on process.exit, so that we don't have to
// call pg.end anywhere else in the app
process.on('exit', function onExit() {
  log.verbose('received exit signal, closing pool');
  pg.end();
});


// register routes
server.route(routes);

module.exports = server;
