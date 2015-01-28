/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Boom = require('boom');

var log = require('../logger')('server.controllers.visit');
var visit = require('../models/visit');

var visitController = {
  get: function (request, reply) {
    var fxaId = request.auth.credentials;
    visit.get(fxaId, request.params.visitId, function(err, result) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500));
      }
      if (!result) {
        return reply(Boom.create(404, 'Visit not found'));
      } else {
        reply(result);
      }
    });
  },
  put: function(request, reply) {
    var fxaId = request.auth.credentials;
    var visitId = request.params.visitId;
    var p = request.payload;
    visit.update(fxaId, visitId, p.visitedAt, p.url, p.title, function(err, result) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500));
      }
      // return the visit so backbone can update the model
      reply(result);
    });
  },
  delete: function (request, reply) {
    var fxaId = request.auth.credentials;
    visit.delete(fxaId, request.params.visitId, function(err) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500));
      }
      reply();
    });
  }
};

module.exports = visitController;
