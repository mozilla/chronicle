/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var Hapi = require('hapi');
var server = new Hapi.Server();
server.connection({port: 8080});
server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply('hello chronicle world');
  }
});
server.start(function(request, reply) {
  console.log('chronicle server running on port 8080');
});
