/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Joi = require('joi');
var Boom = require('boom');

var log = require('../logger')('server.routes.search');
var visits = require('../models/visits');

module.exports = [{
  method: 'GET',
  path: '/v1/search',
  config: {
    auth: 'session',
    validate: {
      query: {
        q: Joi.string().required(),
        count: Joi.number().integer().min(1).max(100).default(25)
      }
    },
    handler: function (request, reply) {
      var fxaId = request.auth.credentials;
      var searchTerm = request.query.q;
      var maxResults = request.query.count;
      visits.search(fxaId, searchTerm, maxResults, function (err, results) {
        if (err) {
          log.warn(err);
          return reply(Boom.create(500));
        }
        reply(results);
      });
    }
  }
}];
