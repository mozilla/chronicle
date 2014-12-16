/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var Hapi = require('hapi');
var server = new Hapi.Server();
var config = require('./config').root();
server.connection({
  host: config.server.host,
  port: config.server.port
});
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: config.server.staticPath,
      listing: true
    }
  }
});
server.start(function(request, reply) {
  console.log('chronicle server running on port ' + config.server.port);
});
