/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var Joi = require('joi');
var Boom = require('boom');

var log = require('../logger')('server.routes.visit');
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

var visitRoutes = [{
  method: 'GET',
  path: '/v1/visits/{visitId}',
  config: {
    handler: visitController.get,
    auth: 'session',
    validate: {
      params: {
        visitId: Joi.string().guid().required()
      }
    }
  }
}, {
  method: 'PUT',
  path: '/v1/visits/{visitId}',
  config: {
    handler: visitController.put,
    auth: 'session',
    validate: {
      // all fields are required, keep life simple for the DB
      payload: {
        url: Joi.string().required(),
        title: Joi.string().max(128).required(),
        visitedAt: Joi.date().iso().required()
      },
      params: {
        visitId: Joi.string().guid().required()
      }
    }
  }
}, {
  method: 'DELETE',
  path: '/v1/visits/{visitId}',
  config: {
    handler: visitController.delete,
    auth: 'session',
    validate: {
      params: {
        visitId: Joi.string().guid().required()
      }
    }
  }
}];

module.exports = visitRoutes;
