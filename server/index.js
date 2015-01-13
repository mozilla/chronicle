/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Hapi = require('hapi');
var HapiAuthCookie = require('hapi-auth-cookie');
var Bell = require('bell');
var pg = require('pg');

var config = require('./config');
var log = require('./logger')('server.index');
var authProfileCb = require('./bell_oauth_profile');
var routes = require('./routes');
var user = require('./db/db').user;

var serverConfig = {};

// log extra error info if we're in ultra-chatty log mode
if (config.get('server.log.level') === 'trace') {
  serverConfig = {
    debug: {
      request: ['error']
    }
  };
}

var server = new Hapi.Server(serverConfig);
server.connection({
  host: config.get('server.host'),
  port: config.get('server.port'),
  router: {
    stripTrailingSlash: true
  }
});

server.register([
  HapiAuthCookie,
  Bell
], function (err) {
  if (err) {
    log.warn('failed to load plugin: ' + err);
    throw err;
  }

  // hapi-auth-cookie init
  server.auth.strategy('session', 'cookie', {
    password: config.get('server.session.password'),
    cookie: config.get('server.session.cookieName'),
    redirectTo: '/',
    isSecure: config.get('server.session.isSecure'),
    ttl: config.get('server.session.duration'),
    clearInvalid: config.get('server.session.clearInvalid'),
    // this function validates that the user exists + session is valid
    validateFunc: function(session, cb) {
      log.verbose('inside hapi-auth-cookie validateFunc.');
      log.verbose('session is ' + JSON.stringify(session));

      var ttl = config.get('server.session.duration');
      if (ttl > 0 && new Date() > new Date(session.expiresAt)) {
        log.verbose('cookie is expired.');
        return cb(null, false);
      }
      log.verbose('cookie is not expired.');

      var fxaId = session.fxaId;
      user.get(fxaId, function(err, result) {
        if (err) {
          log.warn('unable to get user to validate user session: ' + err);
          return cb(err, false);
        }
        cb(null, !!result, fxaId);
      });
    }
  });

  // bell init
  server.auth.strategy('oauth', 'bell', {
    provider: {
      protocol: config.get('server.oauth.protocol'),
      auth: config.get('server.oauth.authEndpoint'),
      token: config.get('server.oauth.tokenEndpoint'),
      version: config.get('server.oauth.version'),
      scope: config.get('server.oauth.scope'),
      profile: authProfileCb
    },
    password: config.get('server.session.password'),
    clientId: config.get('server.oauth.clientId'),
    clientSecret: config.get('server.oauth.clientSecret'),
    isSecure: config.get('server.session.isSecure')
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
