/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Hapi = require('hapi');
var config = require('./config');
var log = require('./logger')('server.index');
var routes = require('./routes');
var visits = require('./visits');
var serverConfig = {};

// log extra error info if we're in ultra-chatty log mode
if (config.get('server.log.level') === 'trace') {
  serverConfig = {debug: {request: ['error']}};
}

var server = new Hapi.Server(serverConfig);
server.connection({
  host: config.get('server.host'),
  port: config.get('server.port')
});

server.register([require('hapi-auth-cookie'), require('bell')], function (err) {
  if (err) {
    log.warn('failed to load plugin: ' + err);
    throw err; // TODO should we use AppError instead?
  }

  // hapi-auth-cookie init
  server.auth.strategy('session', 'cookie', {
    password: config.get('server.session.password'),
    cookie: config.get('server.session.id'),
    // TODO temporarily allowing unauthenticated access for visits testing
    // redirectTo: '/',
    isSecure: config.get('server.session.isSecure'),
    ttl: config.get('server.session.duration')
  });

  // bell init
  server.auth.strategy('oauth', 'bell', {
    provider: {
      protocol: config.get('server.oauth.protocol'),
      auth: config.get('server.oauth.authEndpoint'),
      token: config.get('server.oauth.tokenEndpoint'),
      version: config.get('server.oauth.version'),
      scope: config.get('server.oauth.scope'),
      profile: function (credentials, params, get, profileCb) {
        log.info('inside the oauth-bell profile callback!');
        // TODO here's a guess at what to do in here, bell provides no example:
        // 1. grab params.token, send it to the profile endpoint
        // 2. put the profile response into the credentials object, then send it to DB
      }
    },
    password: config.get('server.session.password'),
    clientId: config.get('server.oauth.clientId'),
    clientSecret: config.get('server.oauth.clientSecret'),
    isSecure: config.get('server.session.isSecure')
  });
});

// register routes
server.route(routes);
server.route(visits);

module.exports = server;
