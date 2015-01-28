/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var crypto = require('crypto');
var Joi = require('joi');
var Boom = require('boom');
var uuid = require('uuid');

var log = require('../logger')('server.routes.visits');
var queue = require('../work-queue/queue');
var visits = require('../models/visits');

// TODO: add additional metadata fields to the visit datatype
// TODO: normalize URLs

var visitsController = {
  get: function (request, reply) {
    var fxaId = request.auth.credentials;
    var visitId = request.query.visitId;

    function onResults(err, results) {
      if (err) {
        log.warn(err);
        return reply(Boom.create(500)); // TODO distinguish between 4xx and 5xx?
      }
      reply(results);
    }

    // if there's a visitId provided, then we want a specific page
    if (visitId) {
      visits.getPaginated(fxaId, visitId, request.query.count, onResults);
    } else {
      visits.get(fxaId, request.query.count, onResults);
    }
  },
  // moving this into visits (plural) because we're going to support multiple 
  // uploads from this same endpoint
  // TODO handle multiple uploads :-)
  post: function(request, reply) {
    var p = request.payload;
    var fxaId = request.auth.credentials;
    var visitId = p.visitId || uuid.v4();
    var urlHash = crypto.createHash('sha1').update(p.url).digest('hex').toString();
    var o = {
      fxaId: fxaId,
      visitId: visitId,
      url: p.url,
      urlHash: urlHash,
      title: p.title,
      visitedAt: p.visitedAt
    };
    queue.createVisit(o);
    queue.extractPage({fxaId: fxaId, url: p.url, urlHash: urlHash});
    reply({
      id: visitId,
      url: p.url,
      urlHash: urlHash,
      title: p.title,
      visitedAt: p.visitedAt
    });
  }
};

var visitsRoutes = [{
  method: 'GET',
  path: '/v1/visits',
  config: {
    handler: visitsController.get,
    auth: 'session',
    validate: {
      query: {
        count: Joi.number().integer().min(1).max(100).default(25),
        visitId: Joi.string().guid()
      }
    }
  }
}, {
  method: 'POST',
  path: '/v1/visits',
  config: {
    handler: visitsController.post,
    auth: 'session',
    validate: {
      payload: {
        url: Joi.string().required(),
        title: Joi.string().max(128).required(),
        visitedAt: Joi.date().iso().required(),
        // client can optionally provide uuid
        visitId: Joi.string().guid()
      }
    }
  }
}];

module.exports = visitsRoutes;
