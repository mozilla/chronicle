/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var crypto = require('crypto');
var Boom = require('boom');
var config = require('../config');
var log = require('../logger')('server.controllers.visit');
var user = require('../models/user');

var profileController = {
  get: function (request, reply) {
    var userId = request.auth.credentials;
    user.get(userId, function(err, data) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500));
      }
      // TODO tell a view to transform, then reply, with the data
      var emailHash = crypto.createHash('md5').update(data.email).digest('hex');
      var out = {
        email: data.email,
        avatarUrl: config.get('avatarUrl') + emailHash + '?s=64'
      };
      reply(out);
    });
  }
};

module.exports = profileController;
