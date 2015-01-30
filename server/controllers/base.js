/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var path = require('path');
var config = require('../config');
var STATIC_PATH = path.join(__dirname, '..', '..', config.get('server.staticPath'));

var baseController = {
  get: function (request, reply) {
    var page = request.auth.isAuthenticated ? 'app.html' : 'index.html';
    reply.file(path.join(STATIC_PATH, page));
  }
};

module.exports = baseController;
